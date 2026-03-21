import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

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

  const subtotal = item?.unitPrice * item?.quantity;
  const itemCost = item?.cost * item?.quantity;
  const itemLabor = item?.labor * item?.quantity;
  const itemProfit = item?.profit * item?.quantity;

  const image = (
    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-border bg-white flex items-center justify-center p-1">
      {!imageError && item?.image ? (
        <img
          src={item.image}
          alt={item?.name}
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        <Icon name="Package" size={18} className="text-muted-foreground" />
      )}
    </div>
  );

  const removeBtn = (
    <button
      onClick={() => onRemove(item?.id)}
      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error/10 transition-all"
    >
      <Icon name="X" size={14} />
    </button>
  );

  const qtyControls = (size = 'md') => {
    const h = size === 'lg' ? 'h-10' : 'h-9';
    const btnW = size === 'lg' ? 'w-9' : 'w-8';
    const inputW = size === 'lg' ? 'w-12' : 'w-10';
    const iconSize = size === 'lg' ? 14 : 12;
    return (
      <div className={`flex items-center border border-border rounded-lg overflow-hidden flex-shrink-0`}>
        <button
          onClick={() => onUpdateQuantity(item?.id, item?.quantity - 1)}
          disabled={item?.quantity <= 1}
          className={`${btnW} ${h} flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 transition-colors`}
        >
          <Icon name="Minus" size={iconSize} />
        </button>
        <input
          type="number"
          value={item?.quantity}
          onChange={(e) => onUpdateQuantity(item?.id, Math.max(1, parseInt(e.target.value) || 1))}
          className={`${inputW} ${h} text-center text-sm font-semibold focus:outline-none bg-transparent border-x border-border [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
          min="1"
        />
        <button
          onClick={() => onUpdateQuantity(item?.id, item?.quantity + 1)}
          className={`${btnW} ${h} flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors`}
        >
          <Icon name="Plus" size={iconSize} />
        </button>
      </div>
    );
  };

  // ── VISTA CLIENTE ──────────────────────────────────────────────
  if (viewMode === 'client') {
    return (
      <div className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border last:border-0">
        {image}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{item?.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(item?.unitPrice)} c/u</p>
        </div>
        {qtyControls()}
        <div className="flex-shrink-0 w-24 text-right">
          <span className="text-sm font-bold text-accent">{formatCurrency(subtotal)}</span>
        </div>
        {removeBtn}
      </div>
    );
  }

  // ── VISTA INTERNA ──────────────────────────────────────────────
  return (
    <div className="group px-4 py-4 border-b border-border last:border-0 hover:bg-muted/10 transition-colors">

      {/* Fila 1: imagen + nombre + subtotal */}
      <div className="flex items-start gap-3">
        {image}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{item?.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(item?.unitPrice)} c/u</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-base font-bold text-accent">{formatCurrency(subtotal)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item?.quantity} {item?.quantity === 1 ? 'unidad' : 'unidades'}</p>
        </div>
        {removeBtn}
      </div>

      {/* Fila 2: cantidad + desglose interno */}
      <div className="mt-3 ml-15 flex flex-col gap-2.5 pl-[60px]">

        {/* Selector de cantidad */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Cantidad</span>
          {qtyControls('lg')}
        </div>

        {/* Mini grilla: costo / M.O. / ganancia */}
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-[11px] text-muted-foreground mb-1">Costo mat.</p>
            <p className="text-sm font-semibold text-foreground">{formatCurrency(itemCost)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <p className="text-[11px] text-muted-foreground mb-1">Mano de obra</p>
            <p className="text-sm font-semibold text-foreground">{formatCurrency(itemLabor)}</p>
          </div>
          <div className="bg-success/10 rounded-lg px-3 py-2">
            <p className="text-[11px] text-success/70 mb-1">Ganancia</p>
            <p className="text-sm font-semibold text-success">{formatCurrency(itemProfit)}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BudgetItem;
