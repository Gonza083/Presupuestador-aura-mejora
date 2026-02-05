import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, itemName, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
              <Icon name="AlertTriangle" size={20} className="text-error" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-heading font-semibold text-foreground">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-sm text-foreground font-medium">
              {itemName}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Actions */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            size="default"
            iconName={loading ? 'Loader2' : 'Trash2'}
            onClick={onConfirm}
            disabled={loading}
            className="bg-error hover:bg-error/90"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;