import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ConfirmDeleteModal = ({ isOpen, type, item, onClose, onConfirm, disabled }) => {
  if (!isOpen) return null;

  const isEmptyAll = type === 'empty-all';
  const isProduct = type === 'product';
  const isCategory = type === 'category';

  const getTitle = () => {
    if (isEmptyAll) return '¿Vaciar papelera?';
    if (isProduct) return '¿Eliminar producto definitivamente?';
    if (isCategory) return '¿Eliminar categoría definitivamente?';
    return '¿Confirmar eliminación?';
  };

  const getMessage = () => {
    if (isEmptyAll) {
      return 'Se eliminarán permanentemente todos los productos y categorías de la papelera. Esta acción no se puede deshacer.';
    }
    if (isProduct) {
      return `El producto "${item?.name}" será eliminado permanentemente del sistema. Esta acción no se puede deshacer.`;
    }
    if (isCategory) {
      return `La categoría "${item?.name}" será eliminada permanentemente. Esta acción no se puede deshacer.`;
    }
    return 'Esta acción no se puede deshacer.';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={disabled ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header with warning */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
              <Icon name="AlertCircle" size={24} className="text-error" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-heading font-semibold text-foreground">
                {getTitle()}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {getMessage()}
              </p>
            </div>
          </div>
        </div>

        {/* Warning message */}
        <div className="px-6 py-4 bg-error/5">
          <div className="flex items-start gap-2">
            <Icon name="AlertTriangle" size={16} className="text-error mt-0.5 flex-shrink-0" />
            <p className="text-sm text-error font-medium">
              Advertencia: Esta acción es irreversible
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onClose}
            disabled={disabled}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="default"
            iconName="Trash2"
            onClick={onConfirm}
            disabled={disabled}
          >
            {disabled ? 'Eliminando...' : (isEmptyAll ? 'Vaciar papelera' : 'Eliminar definitivamente')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;