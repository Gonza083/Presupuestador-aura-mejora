import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DeletedProductCard = ({ product, getRelativeTime, onRestore, onDeletePermanently, disabled }) => {
  const [imageError, setImageError] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-250 overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24 rounded-lg bg-muted overflow-hidden">
            {!imageError ? (
              <img
                src={product?.image}
                alt={product?.alt}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon name="ImageOff" size={32} className="text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-1 truncate">
                {product?.name}
              </h3>
              <p className="text-sm text-muted-foreground font-mono mb-2">
                {product?.code}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Icon name="Folder" size={14} />
                  <span>{product?.categories?.name || 'Sin categoría'}</span>
                </div>
                <div className="flex items-center gap-1 text-accent font-semibold">
                  <Icon name="DollarSign" size={14} />
                  <span>{formatCurrency(product?.final_price)}</span>
                </div>
              </div>
            </div>

            {/* Deletion Info */}
            <div className="flex-shrink-0 text-right">
              <p className="text-sm text-muted-foreground mb-1">
                {getRelativeTime(product?.deleted_at)}
              </p>
              <p className="text-xs text-muted-foreground">
                Por: {product?.deleted_by_profile?.full_name || 'Usuario'}
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
            Restaurar
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

export default DeletedProductCard;