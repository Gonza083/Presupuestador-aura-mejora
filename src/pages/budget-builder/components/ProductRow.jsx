import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProductRow = ({ product, addedCount, onAddToBudget }) => {
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e?.target?.value) || 1;
    setQuantity(Math.max(1, value));
  };

  const handleAdd = () => {
    onAddToBudget(product, quantity);
    setQuantity(1);
  };

  return (
    <div className="p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg overflow-hidden">
          {!imageError ? (
            <img
              src={product?.image}
              alt={product?.alt || product?.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="ImageOff" size={24} className="text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-heading font-semibold text-foreground truncate">
            {product?.name}
          </h4>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {product?.code}
          </p>
          {product?.categories?.name && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
              {product?.categories?.name}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          <div className="text-lg font-heading font-bold text-accent">
            {formatCurrency(product?.final_price || 0)}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleDecrement}
            disabled={quantity <= 1}
          >
            <Icon name="Minus" size={14} />
          </Button>
          <input
            type="number"
            value={quantity}
            onChange={handleQuantityChange}
            className="w-16 h-8 text-center border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            min="1"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleIncrement}
          >
            <Icon name="Plus" size={14} />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleAdd}
            className="ml-2"
          >
            Agregar
          </Button>
        </div>

        {/* Added Indicator */}
        {addedCount > 0 && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
              <Icon name="Check" size={12} />
              {addedCount} añadidos
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductRow;