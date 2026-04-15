import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const STATUS_CONFIG = {
  presupuestado: { label: 'Presupuestado', badge: 'bg-blue-50 text-blue-700',   border: 'border-l-blue-400' },
  aprobado:      { label: 'Aprobado',      badge: 'bg-violet-50 text-violet-700', border: 'border-l-violet-400' },
  en_proceso:    { label: 'En proceso',    badge: 'bg-amber-50 text-amber-700',  border: 'border-l-amber-400' },
  finalizado:    { label: 'Finalizado',    badge: 'bg-emerald-50 text-emerald-700', border: 'border-l-emerald-400' },
  cancelado:     { label: 'Cancelado',     badge: 'bg-red-50 text-red-600',      border: 'border-l-red-400' },
  active:        { label: 'Presupuestado', badge: 'bg-blue-50 text-blue-700',    border: 'border-l-blue-400' },
};

const ALL_STATUSES = ['presupuestado', 'aprobado', 'en_proceso', 'finalizado', 'cancelado'];

const HAS_ACCOUNT_STATUSES = ['aprobado', 'en_proceso', 'finalizado'];

const ProjectCard = ({ project, onOpen, onEdit, onDuplicate, onDelete, onStatusChange, onCobranzas, formatDate }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const currentStatus = project?.status || 'active';
  const status = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.active;

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleStatusClick = (e) => {
    e.stopPropagation();
    setDropdownOpen(prev => !prev);
  };

  const handleSelectStatus = (e, newStatus) => {
    e.stopPropagation();
    setDropdownOpen(false);
    if (newStatus !== currentStatus) {
      onStatusChange(project?.id, newStatus);
    }
  };

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

            {/* Status badge — clickable dropdown */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={handleStatusClick}
                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-opacity hover:opacity-80 ${status.badge}`}
                title="Cambiar estado"
              >
                {status.label}
                <Icon name="ChevronDown" size={11} />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                  {ALL_STATUSES.map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    const isCurrent = s === currentStatus;
                    return (
                      <button
                        key={s}
                        onClick={(e) => handleSelectStatus(e, s)}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          isCurrent
                            ? 'bg-muted/60 font-semibold cursor-default'
                            : 'hover:bg-muted/40'
                        }`}
                      >
                        {isCurrent && <Icon name="Check" size={13} className="text-accent flex-shrink-0" />}
                        {!isCurrent && <span className="w-[13px]" />}
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="Calendar" size={13} />
              <span>{formatDate(project?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0">
          {HAS_ACCOUNT_STATUSES.includes(currentStatus) && (
            <button
              onClick={(e) => { e.stopPropagation(); onCobranzas(project?.id); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-violet-600 hover:bg-violet-50 transition-colors"
              title="Cuenta corriente"
            >
              <Icon name="Wallet" size={15} />
            </button>
          )}
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
