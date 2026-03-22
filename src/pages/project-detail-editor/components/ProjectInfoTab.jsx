import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { projectsService } from '../../../services/supabaseService';
import { PROJECT_STATUS_OPTIONS } from '../../../utils/constants';

const ProjectInfoTab = ({ projectData, setProjectData, projectId, onUpdate }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setSaved(false);
    setError(null);
    if (field === 'startDate') {
      setProjectData(prev => ({ ...prev, start_date: value }));
    } else {
      setProjectData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (!projectData?.name?.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!projectData?.client?.trim()) { setError('El cliente es obligatorio.'); return; }

    try {
      setSaving(true);
      setError(null);
      await projectsService?.update(projectId, {
        name: projectData?.name,
        description: projectData?.description,
        client: projectData?.client,
        status: projectData?.status,
        startDate: projectData?.start_date,
      });
      setSaved(true);
      if (onUpdate) onUpdate();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save project error:', err);
      setError('Error al guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Icon name="FileText" size={24} className="text-accent" />
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Información del Proyecto
        </h2>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <div className="space-y-6">

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nombre del Proyecto <span className="text-error">*</span>
            </label>
            <Input
              type="text"
              value={projectData?.name || ''}
              onChange={(e) => handleInputChange('name', e?.target?.value)}
              placeholder="Ej: Instalación Domótica Residencial"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Descripción
            </label>
            <textarea
              value={projectData?.description || ''}
              onChange={(e) => handleInputChange('description', e?.target?.value)}
              placeholder="Breve descripción del proyecto..."
              rows={4}
              disabled={saving}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cliente <span className="text-error">*</span>
            </label>
            <Input
              type="text"
              value={projectData?.client || ''}
              onChange={(e) => handleInputChange('client', e?.target?.value)}
              placeholder="Nombre del cliente"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Estado del Proyecto
            </label>
            <Select
              options={PROJECT_STATUS_OPTIONS}
              value={projectData?.status || ''}
              onChange={(value) => handleInputChange('status', value)}
              disabled={saving}
              placeholder="Seleccionar estado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fecha de Inicio
            </label>
            <Input
              type="date"
              value={projectData?.start_date || ''}
              onChange={(e) => handleInputChange('startDate', e?.target?.value)}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-error">
          <Icon name="AlertCircle" size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <Icon name="CheckCircle" size={15} />
            Guardado
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={saving}
          iconName={saving ? 'Loader2' : 'Save'}
          className={saving ? '[&_svg]:animate-spin' : ''}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
};

export default ProjectInfoTab;
