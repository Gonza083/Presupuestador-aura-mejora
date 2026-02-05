import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BudgetItem = ({ item, viewMode, onUpdateQuantity, onRemove }) => {
  const [imageError, setImageError] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const handleIncrement = () => {
    onUpdateQuantity(item?.id, item?.quantity + 1);
  };

  const handleDecrement = () => {
    if (item?.quantity > 1) {
      onUpdateQuantity(item?.id, item?.quantity - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e?.target?.value) || 1;
    onUpdateQuantity(item?.id, Math.max(1, value));
  };

  const subtotal = item?.unitPrice * item?.quantity;
  const itemCost = item?.cost * item?.quantity;
  const itemLabor = item?.labor * item?.quantity;
  const itemProfit = item?.profit * item?.quantity;

  return (
    <div className="p-4 hover:bg-muted/20 transition-colors">
      <div className="flex items-start gap-3">
        {/* Product Image */}
        <div className="flex-shrink-0 w-12 h-12 bg-muted rounded overflow-hidden">
          {!imageError ? (
            <img
              src={item?.image}
              alt={item?.alt || item?.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="ImageOff" size={20} className="text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-heading font-semibold text-foreground truncate">
                {item?.name}
              </h4>
              <p className="text-xs text-muted-foreground font-mono">
                {item?.code}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-error hover:bg-error/10 flex-shrink-0"
              onClick={() => onRemove(item?.id)}
            >
              <Icon name="Trash2" size={14} />
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Price Info */}
            <div className="flex items-center gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Precio: </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(item?.unitPrice)}
                </span>
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handleDecrement}
                disabled={item?.quantity <= 1}
              >
                <Icon name="Minus" size={12} />
              </Button>
              <input
                type="number"
                value={item?.quantity}
                onChange={handleQuantityChange}
                className="w-14 h-7 text-center border border-input rounded text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                min="1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handleIncrement}
              >
                <Icon name="Plus" size={12} />
              </Button>
            </div>

            {/* Subtotal */}
            <div className="text-right">
              <div className="text-sm font-heading font-bold text-accent">
                {formatCurrency(subtotal)}
              </div>
            </div>
          </div>

          {/* Internal View - Cost Breakdown */}
          {viewMode === 'internal' && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Costo: </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(itemCost)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">M.O.: </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(itemLabor)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ganancia: </span>
                  <span className="font-medium text-success">
                    {formatCurrency(itemProfit)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetItem;