import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DeletedCategoryCard = ({ category, getRelativeTime, onRestore, onDeletePermanently, disabled }) => {
  return (
    <div className="bg-white rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-250 overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        {/* Category Icon */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon name={category?.icon} size={32} className="text-accent" />
          </div>
        </div>

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
                {category?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Categoría eliminada
              </p>
            </div>

            {/* Deletion Info */}
            <div className="flex-shrink-0 text-right">
              <p className="text-sm text-muted-foreground mb-1">
                {getRelativeTime(category?.deleted_at)}
              </p>
              <p className="text-xs text-muted-foreground">
                Por: {category?.deleted_by_profile?.full_name || 'Usuario'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <Button
            variant="success"
            size="default"
            iconName="RotateCcw"
            onClick={onRestore}
            disabled={disabled}
          >
            Restaurar categoría
          </Button>
          <Button
            variant="danger"
            size="default"
            iconName="Trash2"
            onClick={onDeletePermanently}
            disabled={disabled}
          >
            Eliminar definitivamente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeletedCategoryCard;