import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const ProductRow = ({ product, addedCount, onAddToBudget }) => {
  const [imageError, setImageError] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  return (
    <>
    <div
      onClick={() => onAddToBudget(product, 1)}
      className={`relative flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer group transition-all duration-200 hover:shadow-md hover:border-accent ${
        addedCount > 0 ? 'border-accent bg-accent/5' : 'border-border bg-white'
      }`}
    >
      {/* Added badge */}
      {addedCount > 0 && (
        <div className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shadow">
          {addedCount}
        </div>
      )}

      {/* Image */}
      <div
        className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-border flex items-center justify-center p-1 relative"
        onClick={(e) => {
          if (!imageError && product?.image) {
            e.stopPropagation();
            setLightbox(true);
          }
        }}
      >
        {!imageError && product?.image ? (
          <>
            <img
              src={product.image}
              alt={product?.alt || product?.name}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
              <Icon name="ZoomIn" size={16} className="text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
            </div>
          </>
        ) : (
          <Icon name="Package" size={22} className="text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-accent transition-colors">
          {product?.name}
        </h4>
        {product?.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 leading-tight">
            {product.description}
          </p>
        )}
        <span className="text-sm font-bold text-accent mt-1 block">
          {formatCurrency(product?.final_price || 0)}
        </span>
      </div>

      {/* PDF button */}
      {product?.technical_pdf && (
        <a
          href={product.technical_pdf}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-100 hover:bg-red-600 flex items-center justify-center transition-colors group/pdf"
          title="Ver ficha técnica"
        >
          <Icon name="FileText" size={13} className="text-red-600 group-hover/pdf:text-white transition-colors" />
        </a>
      )}

      {/* Add button */}
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-accent/10 group-hover:bg-accent flex items-center justify-center transition-colors">
        <Icon name="Plus" size={14} className="text-accent group-hover:text-white transition-colors" />
      </div>
    </div>

    {/* Lightbox */}
    {lightbox && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={() => setLightbox(false)}
      >
        <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <img
            src={product.image}
            alt={product?.alt || product?.name}
            className="w-full max-h-[70vh] object-contain rounded-xl shadow-2xl bg-white p-4"
          />
          <p className="text-white text-center text-sm font-medium mt-3 drop-shadow">
            {product?.name}
          </p>
          <button
            onClick={() => setLightbox(false)}
            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
          >
            <Icon name="X" size={15} className="text-foreground" />
          </button>
        </div>
      </div>
    )}
    </>
  );
};

export default ProductRow;
