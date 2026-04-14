import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { projectsService } from '../../services/supabaseService';
import { PROJECT_STATUS_OPTIONS } from '../../utils/constants';
import ProjectInfoTab from './components/ProjectInfoTab';
import TimelineTab from './components/TimelineTab';
import LineItemsTab from './components/LineItemsTab';
import BudgetTrackingTab from './components/BudgetTrackingTab';
import CobranzasTab from './components/CobranzasTab';

const TABS = [
  { id: 'info', label: 'Info', icon: 'FileText' },
  { id: 'timeline', label: 'Timeline', icon: 'CalendarDays' },
  { id: 'items', label: 'Items', icon: 'List' },
  { id: 'seguimiento', label: 'Seguimiento', icon: 'BarChart2' },
  { id: 'cobranzas', label: 'Cobranzas', icon: 'Wallet' },
];

// ─── CREATE FORM ───────────────────────────────────────────────────────────────

const CreateProjectForm = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    start_date: '',
    status: 'presupuestado'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) { setError('El nombre del proyecto es obligatorio'); return; }
    if (!formData.client?.trim()) { setError('El cliente es obligatorio'); return; }

    try {
      setLoading(true);
      setError(null);
      const newProject = await projectsService.create(formData);
      setSuccessMessage('Proyecto creado exitosamente');
      timeoutRef.current = setTimeout(() => {
        navigate(`/project-detail-editor/${newProject?.id}`);
      }, 1200);
    } catch (err) {
      console.error(err);
      setError('Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Button variant="ghost" size="sm" iconName="ArrowLeft" onClick={() => navigate('/projects-main')} className="mb-4">
            Volver a Proyectos
          </Button>
          <div className="flex items-center gap-3">
            <Icon name="FolderPlus" size={32} className="text-accent" />
            <h1 className="text-3xl font-heading font-bold text-foreground">Crear Nuevo Proyecto</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {successMessage && (
          <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-lg flex items-center gap-3">
            <Icon name="CheckCircle" size={20} className="text-success flex-shrink-0" />
            <p className="text-success font-medium">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-3">
            <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0" />
            <p className="text-error">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg border border-border shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Nombre del Proyecto <span className="text-error">*</span></label>
            <Input value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Ej: Instalación Domótica Residencial" disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Breve descripción del proyecto..."
              rows={3}
              disabled={loading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Cliente <span className="text-error">*</span></label>
              <Input value={formData.client} onChange={(e) => handleInputChange('client', e.target.value)} placeholder="Nombre del cliente" disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Fecha de Inicio</label>
              <Input type="date" value={formData.start_date} onChange={(e) => handleInputChange('start_date', e.target.value)} disabled={loading} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Estado</label>
            <Select options={PROJECT_STATUS_OPTIONS} value={formData.status} onChange={(v) => handleInputChange('status', v)} disabled={loading} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => navigate('/projects-main')} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} iconName={loading ? 'Loader2' : 'Save'} className={loading ? '[&_svg]:animate-spin' : ''}>
            {loading ? 'Creando...' : 'Crear Proyecto'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── EDIT VIEW (TABBED) ────────────────────────────────────────────────────────

const EditProjectView = ({ projectId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = TABS.some(t => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'info';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsService.getById(projectId);
      if (data) {
        setProject(data);
      } else {
        setError('Proyecto no encontrado');
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="text-accent animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-error mx-auto mb-4" />
          <p className="text-lg text-error">{error}</p>
          <Button variant="outline" onClick={() => navigate('/projects-main')} className="mt-4">Volver</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <Button variant="ghost" size="sm" iconName="ArrowLeft" onClick={() => navigate('/projects-main')} className="mb-3">
            Volver a Proyectos
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">{project?.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{project?.client}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              iconName="ExternalLink"
              onClick={() => navigate(`/budget-builder/${projectId}`)}
            >
              Presupuesto
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-5 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon name={tab.icon} size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'info' && (
          <ProjectInfoTab
            projectData={project}
            setProjectData={setProject}
            projectId={projectId}
            onUpdate={loadProject}
          />
        )}
        {activeTab === 'timeline' && <TimelineTab projectId={projectId} />}
        {activeTab === 'items' && <LineItemsTab projectId={projectId} />}
        {activeTab === 'seguimiento' && <BudgetTrackingTab projectId={projectId} />}
        {activeTab === 'cobranzas' && (
          <CobranzasTab projectId={projectId} project={project} />
        )}
      </div>
    </div>
  );
};

// ─── MAIN EXPORT ───────────────────────────────────────────────────────────────

const ProjectDetailEditor = () => {
  const { projectId } = useParams();
  const isNew = !projectId || projectId === 'new';
  return isNew ? <CreateProjectForm /> : <EditProjectView projectId={projectId} />;
};

export default ProjectDetailEditor;
