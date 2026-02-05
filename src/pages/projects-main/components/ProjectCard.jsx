import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProjectCard = ({ project, onOpen, onEdit, onDuplicate, onDelete, formatDate }) => {
  const handleCardClick = () => {
    onOpen(project?.id);
  };

  const handleEdit = (e) => {
    e?.stopPropagation();
    onEdit(project?.id);
  };

  const handleDuplicate = (e) => {
    e?.stopPropagation();
    onDuplicate(project?.id);
  };

  const handleDelete = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    onDelete(project?.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-250 p-6 cursor-pointer group"
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e?.key === 'Enter' || e?.key === ' ') {
          e?.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="flex items-start justify-between gap-6">
        {/* Project Info */}
        <div className="flex-1">
          {/* Project Name */}
          <h3 className="text-xl font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
            {project?.name}
          </h3>

          {/* Description */}
          {project?.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {project?.description}
            </p>
          )}

          {/* Creation Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Calendar" size={16} />
            <span>Creado el {formatDate(project?.createdAt)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            iconName="Edit2"
            onClick={handleEdit}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Editar proyecto"
          />
          <Button
            variant="ghost"
            size="icon"
            iconName="Copy"
            onClick={handleDuplicate}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Duplicar proyecto"
          />
          <Button
            variant="ghost"
            size="icon"
            iconName="Trash2"
            onClick={handleDelete}
            className="h-9 w-9 text-muted-foreground hover:text-error"
            aria-label="Eliminar proyecto"
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;