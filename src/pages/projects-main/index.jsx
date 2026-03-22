import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ProjectCard from './components/ProjectCard';
import { projectsService, subscribeToProjects, unsubscribeChannel } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';
import DeleteConfirmModal from '../product-management/components/DeleteConfirmModal';

const ProjectsMain = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, projectId: null, projectName: '', loading: false, error: null });
  const [createModal, setCreateModal] = useState({ open: false, name: '', loading: false, error: null });
  const [statusModal, setStatusModal] = useState({ open: false, projectId: null, projectName: '', newStatus: null, loading: false });

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

  // Filter projects based on search query
  const filteredProjects = projects?.filter(project => {
    if (!searchQuery?.trim()) return true;
    const query = searchQuery?.toLowerCase();
    return (
      project?.name?.toLowerCase()?.includes(query) ||
      project?.description?.toLowerCase()?.includes(query) ||
      project?.client?.toLowerCase()?.includes(query) ||
      project?.project_type?.toLowerCase()?.includes(query)
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
      const newProject = await projectsService?.create({
        name: createModal.name.trim(),
        status: 'active'
      });
      if (newProject) {
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

  const handleDuplicateProject = async (projectId) => {
    try {
      const project = projects?.find(p => p?.id === projectId);
      if (project) {
        const duplicated = await projectsService?.create({
          name: `${project?.name} (Copia)`,
          description: project?.description,
          client: project?.client,
          projectType: project?.project_type,
          status: 'active',
          startDate: project?.start_date,
          endDate: project?.end_date
        });

        if (duplicated) {
          await loadProjects();
        }
      }
    } catch (err) {
      console.error('Duplicate project error:', err);
      setError('Error al duplicar el proyecto');
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              {filteredProjects?.length} {filteredProjects?.length === 1 ? 'proyecto' : 'proyectos'}
            </h2>

            {/* Search Bar */}
            <div className="w-80">
              <div className="relative">
                <Icon
                  name="Search"
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre, cliente o tipo…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
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
                    status: project?.status
                  }}
                  onOpen={handleOpenProject}
                  onEdit={handleEditProject}
                  onDuplicate={handleDuplicateProject}
                  onDelete={handleDeleteProject}
                  onStatusChange={handleStatusChange}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Icon name="FolderSearch" size={64} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                No se encontraron proyectos
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Intenta con otros términos de búsqueda
              </p>
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