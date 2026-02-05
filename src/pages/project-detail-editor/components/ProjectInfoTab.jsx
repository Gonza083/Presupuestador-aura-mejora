import React from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { projectsService } from '../../../services/supabaseService';

const ProjectInfoTab = ({ projectData, setProjectData, projectId, onUpdate }) => {
  const handleInputChange = async (field, value) => {
    try {
      // Update local state immediately
      setProjectData(prev => ({ ...prev, [field]: value }));
      
      // Prepare update object based on field
      const updates = {};
      if (field === 'name') updates.name = value;
      if (field === 'description') updates.description = value;
      if (field === 'client') updates.client = value;
      if (field === 'projectType') updates.projectType = value;
      if (field === 'startDate') updates.startDate = value;
      if (field === 'endDate') updates.endDate = value;
      
      // Update in database
      await projectsService?.update(projectId, updates);
      
      // Refresh project data to get updated timestamp
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Update project error:', err);
    }
  };

  const projectTypeOptions = [
    { value: 'Domótica', label: 'Domótica' },
    { value: 'Seguridad', label: 'Seguridad' },
    { value: 'Redes', label: 'Redes' },
    { value: 'Iluminación', label: 'Iluminación' },
    { value: 'Audio/Video', label: 'Audio/Video' },
    { value: 'Mixto', label: 'Mixto' }
  ];

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
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nombre del Proyecto *
            </label>
            <Input
              type="text"
              value={projectData?.name || ''}
              onChange={(e) => handleInputChange('name', e?.target?.value)}
              placeholder="Ej: Instalación Domótica Residencial"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Descripción
            </label>
            <textarea
              value={projectData?.description || ''}
              onChange={(e) => handleInputChange('description', e?.target?.value)}
              placeholder="Breve descripción del proyecto..."
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Client & Project Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cliente *
              </label>
              <Input
                type="text"
                value={projectData?.client || ''}
                onChange={(e) => handleInputChange('client', e?.target?.value)}
                placeholder="Nombre del cliente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tipo de Proyecto *
              </label>
              <Select
                options={projectTypeOptions}
                value={projectData?.project_type || ''}
                onChange={(value) => handleInputChange('projectType', value)}
                placeholder="Seleccionar tipo"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fecha de Inicio
              </label>
              <Input
                type="date"
                value={projectData?.start_date || ''}
                onChange={(e) => handleInputChange('startDate', e?.target?.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fecha de Finalización Estimada
              </label>
              <Input
                type="date"
                value={projectData?.end_date || ''}
                onChange={(e) => handleInputChange('endDate', e?.target?.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoTab;