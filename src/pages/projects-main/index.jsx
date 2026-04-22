import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ProjectCard from './components/ProjectCard';
import { projectsService, subscribeToProjects, unsubscribeChannel } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';
import DeleteConfirmModal from '../product-management/components/DeleteConfirmModal';
import { fetchOfficialRate } from '../../utils/exchangeRateApi';
import { useCurrency } from '../../contexts/CurrencyContext';

const ProjectsMain = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setExchangeRate: setGlobalExchangeRate } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, projectId: null, projectName: '', loading: false, error: null });
  const [createModal, setCreateModal] = useState({ open: false, name: '', loading: false, error: null });
  const [statusModal, setStatusModal] = useState({ open: false, projectId: null, projectName: '', newStatus: null, loading: false });
  const [duplicateModal, setDuplicateModal] = useState({ open: false, projectId: null, newName: '', loading: false, error: null });
  // TC modal: ver y editar el tipo de cambio de un proyecto
  const [tcModal, setTcModal] = useState({ open: false, projectId: null, projectName: '', currentRate: null, newRate: '', fetchLoading: false, saveLoading: false, error: null, fetchError: null });

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToProjects(user?.id, (payload) => {
      if (payload?.eventType === 'INSERT') {
        setProjects(prev => [payload?.new, ...prev]);
      } else if (payload?.eventType === 'UPDATE') {
        setProjects(prev => prev?.map(p => p?.id === payload?.new?.id ? payload?.new : p));
      } else if (payload?.eventType === 'DELETE') {
        setProjects(prev => prev?.filter(p => p?.id !== payload?.old?.id));
      }
    });

    return () => {
      unsubscribeChannel(subscription);
    };
  }, [user?.id]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await projectsService?.getAll();
      setProjects(data || []);
    } catch (err) {
      console.error('Load projects error:', err);
      setError('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const STATUS_FILTERS = [
    { value: 'todos', label: 'Todos' },
    { value: 'presupuestado', label: 'Presupuestados' },
    { value: 'aprobado', label: 'Aprobados' },
    { value: 'en_proceso', label: 'En proceso' },
    { value: 'finalizado', label: 'Finalizados' },
    { value: 'cancelado', label: 'Cancelados' },
  ];

  const filteredProjects = projects?.filter(project => {
    const matchesStatus = statusFilter === 'todos' || project?.status === statusFilter;
    if (!matchesStatus) return false;
    if (!searchQuery?.trim()) return true;
    const query = searchQuery?.toLowerCase();
    return (
      project?.name?.toLowerCase()?.includes(query) ||
      project?.description?.toLowerCase()?.includes(query) ||
      project?.client?.toLowerCase()?.includes(query)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })?.format(date);
  };

  const handleCreateProject = () => {
    setCreateModal({ open: true, name: '', loading: false, error: null });
  };

  const confirmCreateProject = async () => {
    if (!createModal.name.trim()) {
      setCreateModal(prev => ({ ...prev, error: 'El nombre del proyecto es requerido' }));
      return;
    }
    setCreateModal(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Fetch official exchange rate — fall back to 1200 if it fails
      let exchangeRate = 1200;
      try {
        exchangeRate = await fetchOfficialRate();
      } catch {
        // Network error or API down — use default silently
      }

      const newProject = await projectsService?.create({
        name: createModal.name.trim(),
        status: 'presupuestado'
      });

      if (newProject) {
        // Persist the exchange rate in the project row
        await projectsService?.update(newProject.id, { exchangeRate });
        setGlobalExchangeRate(exchangeRate);
        setCreateModal({ open: false, name: '', loading: false, error: null });
        navigate(`/project-detail-editor/${newProject?.id}`);
      }
    } catch (err) {
      console.error('Create project error:', err);
      setCreateModal(prev => ({ ...prev, loading: false, error: err?.message || 'Error al crear el proyecto' }));
    }
  };

  const handleOpenProject = (projectId) => {
    navigate(`/budget-builder/${projectId}`);
  };

  const handleEditProject = (projectId) => {
    navigate(`/project-detail-editor/${projectId}`);
  };

  const handleDuplicateProject = (projectId) => {
    const project = projects?.find(p => p?.id === projectId);
    setDuplicateModal({ open: true, projectId, newName: `${project?.name} (Copia)`, loading: false, error: null });
  };

  const confirmDuplicateProject = async () => {
    if (!duplicateModal.newName.trim()) {
      setDuplicateModal(prev => ({ ...prev, error: 'El nombre del proyecto es requerido' }));
      return;
    }
    setDuplicateModal(prev => ({ ...prev, loading: true, error: null }));
    try {
      const newProject = await projectsService?.duplicate(duplicateModal.projectId, duplicateModal.newName.trim());
      setDuplicateModal({ open: false, projectId: null, newName: '', loading: false, error: null });
      if (newProject) navigate(`/budget-builder/${newProject.id}`);
    } catch (err) {
      console.error('Duplicate project error:', err);
      setDuplicateModal(prev => ({ ...prev, loading: false, error: 'Error al duplicar el proyecto' }));
    }
  };

  const handleStatusChange = (projectId, newStatus) => {
    const project = projects?.find(p => p?.id === projectId);
    setStatusModal({ open: true, projectId, projectName: project?.name || '', newStatus, loading: false });
  };

  const confirmStatusChange = async () => {
    setStatusModal(prev => ({ ...prev, loading: true }));
    try {
      await projectsService?.update(statusModal.projectId, { status: statusModal.newStatus });
      setProjects(prev => prev.map(p => p.id === statusModal.projectId ? { ...p, status: statusModal.newStatus } : p));
      setStatusModal({ open: false, projectId: null, projectName: '', newStatus: null, loading: false });
    } catch (err) {
      console.error('Status change error:', err);
      setStatusModal(prev => ({ ...prev, loading: false }));
      setError('Error al cambiar el estado');
    }
  };

  const handleOpenTcModal = (projectId) => {
    const project = projects?.find(p => p?.id === projectId);
    setTcModal({
      open: true,
      projectId,
      projectName: project?.name || '',
      currentRate: project?.exchange_rate ?? null,
      newRate: String(project?.exchange_rate ?? ''),
      fetchLoading: false,
      saveLoading: false,
      error: null,
      fetchError: null,
    });
  };

  const handleTcFetchCurrent = async () => {
    setTcModal(prev => ({ ...prev, fetchLoading: true, fetchError: null }));
    try {
      const rate = await fetchOfficialRate();
      setTcModal(prev => ({ ...prev, fetchLoading: false, newRate: String(rate) }));
    } catch {
      setTcModal(prev => ({ ...prev, fetchLoading: false, fetchError: 'No se pudo obtener el valor del dólar. Revisá tu conexión.' }));
    }
  };

  const handleTcSave = async () => {
    const rate = parseFloat(tcModal.newRate);
    if (!rate || rate <= 0) {
      setTcModal(prev => ({ ...prev, error: 'Ingresá un valor válido mayor a cero.' }));
      return;
    }
    setTcModal(prev => ({ ...prev, saveLoading: true, error: null }));
    try {
      await projectsService?.update(tcModal.projectId, { exchangeRate: rate });
      setProjects(prev => prev.map(p => p.id === tcModal.projectId ? { ...p, exchange_rate: rate } : p));
      setGlobalExchangeRate(rate);
      setTcModal({ open: false, projectId: null, projectName: '', currentRate: null, newRate: '', fetchLoading: false, saveLoading: false, error: null, fetchError: null });
    } catch {
      setTcModal(prev => ({ ...prev, saveLoading: false, error: 'Error al guardar. Intentá de nuevo.' }));
    }
  };

  const handleDeleteProject = (projectId) => {
    const project = projects?.find(p => p?.id === projectId);
    setDeleteModal({ open: true, projectId, projectName: project?.name || '', loading: false, error: null });
  };

  const confirmDeleteProject = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true, error: null }));
    try {
      await projectsService?.delete(deleteModal.projectId);
      setDeleteModal({ open: false, projectId: null, projectName: '', loading: false, error: null });
      await loadProjects();
    } catch (err) {
      console.error('Delete project error:', err);
      setDeleteModal(prev => ({ ...prev, loading: false, error: err?.message || 'Error al eliminar el proyecto' }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="text-accent animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/landing-dashboard')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <Icon name="ArrowLeft" size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Inicio</span>
              </button>
              <div className="h-5 w-px bg-border" />
              <h1 className="text-xl font-heading font-semibold text-foreground">Proyectos</h1>
            </div>
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
            >
              <Icon name="Plus" size={16} />
              Nuevo Proyecto
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-3">
            <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0" />
            <p className="text-error">{error}</p>
          </div>
        )}

        {/* Section Header */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-lg font-semibold text-foreground">
              {filteredProjects?.length} {filteredProjects?.length === 1 ? 'proyecto' : 'proyectos'}
            </h2>

            {/* Search Bar */}
            <div className="w-full sm:w-80">
              <div className="relative">
                <Icon
                  name="Search"
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre o cliente…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 mb-5 flex-wrap">
            {STATUS_FILTERS.map(({ value, label }) => {
              const count = value === 'todos'
                ? projects.length
                : projects.filter(p => p.status === value).length;
              return (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === value
                      ? 'bg-accent text-white'
                      : 'bg-white border border-border text-muted-foreground hover:text-foreground hover:border-accent/40'
                  }`}
                >
                  {label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    statusFilter === value ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Projects List */}
          {filteredProjects?.length > 0 ? (
            <div className="space-y-4">
              {filteredProjects?.map((project) => (
                <ProjectCard
                  key={project?.id}
                  project={{
                    id: project?.id,
                    name: project?.name,
                    description: project?.description,
                    client: project?.client,
                    project_type: project?.project_type,
                    createdAt: new Date(project?.created_at),
                    status: project?.status,
                    exchange_rate: project?.exchange_rate ?? null,
                  }}
                  onOpen={handleOpenProject}
                  onEdit={handleEditProject}
                  onDuplicate={handleDuplicateProject}
                  onDelete={handleDeleteProject}
                  onStatusChange={handleStatusChange}
                  onCobranzas={(id) => navigate(`/project-detail-editor/${id}?tab=cobranzas`)}
                  onExchangeRate={handleOpenTcModal}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                <Icon name="FolderPlus" size={40} className="text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Todavía no tenés proyectos</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                Creá tu primer proyecto para empezar a gestionar presupuestos y cobranzas.
              </p>
              <button
                onClick={handleCreateProject}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
              >
                <Icon name="Plus" size={16} />
                Crear primer proyecto
              </button>
            </div>
          ) : (
            <div className="text-center py-16">
              <Icon name="FolderSearch" size={48} className="text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-base text-muted-foreground">No se encontraron proyectos</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Probá con otros términos o cambiá el filtro de estado</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {createModal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCreateModal({ open: false, name: '', loading: false, error: null })} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-1">Nuevo Proyecto</h2>
          <p className="text-sm text-muted-foreground mb-5">Ingresá el nombre para continuar</p>

          {createModal.error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
              <Icon name="AlertCircle" size={16} className="text-error flex-shrink-0" />
              <p className="text-sm text-error">{createModal.error}</p>
            </div>
          )}

          <Input
            type="text"
            placeholder="Ej: Instalación Domótica Villa Norte"
            value={createModal.name}
            onChange={(e) => setCreateModal(prev => ({ ...prev, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && confirmCreateProject()}
            autoFocus
            disabled={createModal.loading}
          />

          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setCreateModal({ open: false, name: '', loading: false, error: null })} disabled={createModal.loading}>
              Cancelar
            </Button>
            <Button onClick={confirmCreateProject} disabled={createModal.loading} iconName={createModal.loading ? 'Loader2' : 'Plus'}>
              {createModal.loading ? 'Creando...' : 'Crear Proyecto'}
            </Button>
          </div>
        </div>
      </div>
    )}

    <DeleteConfirmModal
      isOpen={deleteModal.open}
      onClose={() => setDeleteModal({ open: false, projectId: null, projectName: '', loading: false, error: null })}
      onConfirm={confirmDeleteProject}
      title="Eliminar Proyecto"
      message="¿Estás seguro de que deseas eliminar este proyecto?"
      itemName={deleteModal.projectName}
      loading={deleteModal.loading}
      error={deleteModal.error}
    />

    {duplicateModal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !duplicateModal.loading && setDuplicateModal({ open: false, projectId: null, newName: '', loading: false, error: null })} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Icon name="Copy" size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground">Duplicar proyecto</h2>
              <p className="text-sm text-muted-foreground">Se copiarán todos los items del presupuesto</p>
            </div>
          </div>

          {duplicateModal.error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
              <Icon name="AlertCircle" size={16} className="text-error flex-shrink-0" />
              <p className="text-sm text-error">{duplicateModal.error}</p>
            </div>
          )}

          <label className="block text-sm font-medium text-foreground mb-1.5">Nombre del nuevo proyecto</label>
          <Input
            type="text"
            value={duplicateModal.newName}
            onChange={(e) => setDuplicateModal(prev => ({ ...prev, newName: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && confirmDuplicateProject()}
            autoFocus
            disabled={duplicateModal.loading}
          />

          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setDuplicateModal({ open: false, projectId: null, newName: '', loading: false, error: null })} disabled={duplicateModal.loading}>
              Cancelar
            </Button>
            <Button onClick={confirmDuplicateProject} disabled={duplicateModal.loading} iconName={duplicateModal.loading ? 'Loader2' : 'Copy'} className={duplicateModal.loading ? '[&_svg]:animate-spin' : ''}>
              {duplicateModal.loading ? 'Duplicando...' : 'Duplicar'}
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Tipo de cambio modal */}
    {tcModal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !tcModal.saveLoading && setTcModal(prev => ({ ...prev, open: false }))} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Icon name="DollarSign" size={20} className="text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-heading font-semibold text-foreground">Tipo de cambio</h2>
              <p className="text-sm text-muted-foreground truncate">{tcModal.projectName}</p>
            </div>
          </div>

          {/* Valor actual guardado */}
          {tcModal.currentRate != null && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor guardado en este proyecto</span>
              <span className="text-sm font-bold text-foreground">
                ${Number(tcModal.currentRate).toLocaleString('es-AR')}
              </span>
            </div>
          )}

          {/* Input nuevo valor */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nuevo valor (ARS por USD)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">$</span>
                <Input
                  type="number"
                  value={tcModal.newRate}
                  onChange={(e) => setTcModal(prev => ({ ...prev, newRate: e.target.value, error: null }))}
                  placeholder="1200"
                  min="1"
                  step="1"
                  className="pl-7"
                  disabled={tcModal.saveLoading || tcModal.fetchLoading}
                />
              </div>
              <button
                onClick={handleTcFetchCurrent}
                disabled={tcModal.fetchLoading || tcModal.saveLoading}
                title="Obtener valor oficial actual"
                className="flex items-center gap-1.5 px-3 h-10 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {tcModal.fetchLoading
                  ? <Icon name="Loader2" size={15} className="animate-spin" />
                  : <Icon name="RefreshCw" size={15} />}
                <span className="hidden sm:inline">Actual</span>
              </button>
            </div>
            {tcModal.fetchLoading && (
              <p className="text-xs text-muted-foreground mt-1.5">Consultando dólar oficial...</p>
            )}
            {tcModal.fetchError && (
              <p className="text-xs text-error mt-1.5">{tcModal.fetchError}</p>
            )}
            {tcModal.error && (
              <p className="text-xs text-error mt-1.5">{tcModal.error}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-5">
            Fuente: Bluelytics · dólar oficial venta
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setTcModal(prev => ({ ...prev, open: false }))}
              disabled={tcModal.saveLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleTcSave}
              disabled={tcModal.saveLoading || !tcModal.newRate}
              iconName={tcModal.saveLoading ? 'Loader2' : 'Save'}
              className={tcModal.saveLoading ? '[&_svg]:animate-spin' : ''}
            >
              {tcModal.saveLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>
    )}

    {statusModal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !statusModal.loading && setStatusModal({ open: false, projectId: null, projectName: '', newStatus: null, loading: false })} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Icon name="RefreshCw" size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground">Cambiar estado</h2>
              <p className="text-sm text-muted-foreground truncate">{statusModal.projectName}</p>
            </div>
          </div>
          <p className="text-sm text-foreground mb-6">
            ¿Confirmás cambiar el estado a{' '}
            <strong>
              {{ presupuestado: 'Presupuestado', aprobado: 'Aprobado', en_proceso: 'En proceso', finalizado: 'Finalizado', cancelado: 'Cancelado' }[statusModal.newStatus]}
            </strong>
            ?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setStatusModal({ open: false, projectId: null, projectName: '', newStatus: null, loading: false })}
              disabled={statusModal.loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={statusModal.loading}
              iconName={statusModal.loading ? 'Loader2' : 'Check'}
              className={statusModal.loading ? '[&_svg]:animate-spin' : ''}
            >
              {statusModal.loading ? 'Guardando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ProjectsMain;