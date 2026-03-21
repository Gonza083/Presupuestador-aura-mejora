import React from 'react';
import Icon from '../../../components/AppIcon';

const statusConfig = {
  presupuestado: { label: 'Presupuestado', className: 'bg-blue-50 text-blue-700', border: 'border-l-blue-400' },
  en_proceso:    { label: 'En proceso',    className: 'bg-amber-50 text-amber-700', border: 'border-l-amber-400' },
  finalizado:    { label: 'Finalizado',    className: 'bg-emerald-50 text-emerald-700', border: 'border-l-emerald-400' },
  cancelado:     { label: 'Cancelado',     className: 'bg-red-50 text-red-600', border: 'border-l-red-400' },
  active:        { label: 'Presupuestado', className: 'bg-blue-50 text-blue-700', border: 'border-l-blue-400' },
};

const ProjectCard = ({ project, onOpen, onEdit, onDuplicate, onDelete, formatDate }) => {
  const status = statusConfig[project?.status] || statusConfig.active;

  return (
    <div
      onClick={() => onOpen(project?.id)}
      className={`bg-white rounded-xl border border-border border-l-4 ${status.border} shadow-sm hover:shadow-md transition-all duration-200 p-5 cursor-pointer group`}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e?.key === 'Enter' || e?.key === ' ') {
          e?.preventDefault();
          onOpen(project?.id);
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">

        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors truncate">
              {project?.name}
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${status.className}`}>
              {status.label}
            </span>
          </div>

          {project?.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {project?.description}
            </p>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            {project?.client && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="User" size={13} />
                <span>{project.client}</span>
              </div>
            )}
            {project?.project_type && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="Tag" size={13} />
                <span>{project.project_type}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="Calendar" size={13} />
              <span>{formatDate(project?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(project?.id); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Editar"
          >
            <Icon name="Pencil" size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(project?.id); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Duplicar"
          >
            <Icon name="Copy" size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project?.id); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Eliminar"
          >
            <Icon name="Trash2" size={15} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProjectCard;
