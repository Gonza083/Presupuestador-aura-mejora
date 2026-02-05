import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { projectsService } from '../../services/supabaseService';

const ProjectDetailEditor = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const isEditMode = projectId && projectId !== 'new';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    start_date: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Load project data if editing
  useEffect(() => {
    if (isEditMode) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await projectsService?.getById(projectId);

      if (data) {
        setFormData({
          name: data?.name || '',
          description: data?.description || '',
          client: data?.client || '',
          start_date: data?.start_date || ''
        });
      } else {
        setError('Proyecto no encontrado');
      }
    } catch (err) {
      console.error('Load project error:', err);
      setError('Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData?.name?.trim()) {
      setError('El nombre del proyecto es obligatorio');
      return false;
    }
    if (!formData?.client?.trim()) {
      setError('El cliente es obligatorio');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      if (isEditMode) {
        // Update existing project
        await projectsService?.update(projectId, formData);
        setSuccessMessage('Proyecto actualizado exitosamente');
      } else {
        // Create new project
        const newProject = await projectsService?.create(formData);
        setSuccessMessage('Proyecto creado exitosamente');

        // Redirect to the newly created project in edit mode
        setTimeout(() => {
          navigate(`/project-detail-editor/${newProject?.id}`);
        }, 1500);
        return;
      }

      // For edit mode, redirect to projects list after short delay
      setTimeout(() => {
        navigate('/projects-main');
      }, 1500);
    } catch (err) {
      console.error('Save project error:', err);
      setError('Error al guardar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/projects-main');
  };

  if (loading && isEditMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="text-accent animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            iconName="ArrowLeft"
            onClick={handleCancel}
            className="mb-4"
          >
            Volver a Proyectos
          </Button>

          {/* Page Title */}
          <div className="flex items-center gap-3">
            <Icon name="FileText" size={32} className="text-accent" />
            <h1 className="text-3xl font-heading font-bold text-foreground">
              {isEditMode ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
            </h1>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-lg flex items-center gap-3">
            <Icon name="CheckCircle" size={20} className="text-success flex-shrink-0" />
            <p className="text-success font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-3">
            <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0" />
            <p className="text-error">{error}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <div className="space-y-6">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre del Proyecto <span className="text-error">*</span>
              </label>
              <Input
                type="text"
                value={formData?.name}
                onChange={(e) => handleInputChange('name', e?.target?.value)}
                placeholder="Ej: Instalación Domótica Residencial"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descripción
              </label>
              <textarea
                value={formData?.description}
                onChange={(e) => handleInputChange('description', e?.target?.value)}
                placeholder="Breve descripción del proyecto..."
                rows={4}
                disabled={loading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              />
            </div>

            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cliente <span className="text-error">*</span>
              </label>
              <Input
                type="text"
                value={formData?.client}
                onChange={(e) => handleInputChange('client', e?.target?.value)}
                placeholder="Nombre del cliente"
                disabled={loading}
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fecha de Inicio
              </label>
              <Input
                type="date"
                value={formData?.start_date}
                onChange={(e) => handleInputChange('start_date', e?.target?.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            iconName={loading ? 'Loader2' : 'Save'}
            className={loading ? 'animate-spin' : ''}
          >
            {loading ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Proyecto')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailEditor;