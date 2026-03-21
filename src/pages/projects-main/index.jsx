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
    const query = searchQuery?.toLowerCase();
    return (
      project?.name?.toLowerCase()?.includes(query) ||
      project?.description?.toLowerCase()?.includes(query) ||
      formatDate(project?.created_at)?.toLowerCase()?.includes(query)
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
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/landing-dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 group"
          >
            <Icon name="ArrowLeft" size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Volver al inicio</span>
          </button>

          <h1 className="text-3xl font-heading font-bold text-foreground text-center mb-2">
            Selecciona un proyecto existente o crea uno nuevo para continuar
          </h1>
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

        {/* Create New Project Card - Prominent */}
        <div
          onClick={handleCreateProject}
          className="bg-gradient-to-br from-accent/5 to-accent/10 border-2 border-accent/30 rounded-xl p-8 mb-12 cursor-pointer hover:shadow-lg hover:border-accent/50 transition-all duration-250 group"
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e?.key === 'Enter' || e?.key === ' ') {
              e?.preventDefault();
              handleCreateProject();
            }
          }}
        >
          <div className="flex items-center gap-6">
            {/* Icon Circle */}
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
              <Icon name="Plus" size={32} className="text-accent" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                Crear Nuevo Proyecto
              </h2>
              <p className="text-muted-foreground text-base">
                Comienza un nuevo presupuesto desde cero
              </p>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0">
              <Icon name="ArrowRight" size={28} className="text-accent group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Existing Projects Section */}
        <div>
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-semibold text-foreground">
              Proyectos Existentes ({filteredProjects?.length})
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
                  placeholder="Buscar por nombre o fecha…"
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
                    createdAt: new Date(project?.created_at),
                    status: project?.status
                  }}
                  onOpen={handleOpenProject}
                  onEdit={handleEditProject}
                  onDuplicate={handleDuplicateProject}
                  onDelete={handleDeleteProject}
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
    </>
  );
};

export default ProjectsMain;