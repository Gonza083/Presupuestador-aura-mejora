import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import EditProductModal from './EditProductModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { productsService } from '../../../services/supabaseService';

const ProductCard = ({ product, allCategories, onDataChange }) => {
  const [imageError, setImageError] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const calculateMargin = () => {
    if (!product?.finalPrice) return '0.0';
    return ((product?.profit / product?.finalPrice) * 100)?.toFixed(1);
  };

  const handleDeleteProduct = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await productsService?.delete(product?.id);
      setIsDeleteModalOpen(false);
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error('Delete product error:', err);
      setDeleteError(err?.message || 'Error al eliminar el producto');
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasImage = product?.image && !imageError;

  return (
    <>
      <div className="bg-white rounded-xl border border-border shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group flex flex-col">

        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {hasImage ? (
            <img
              src={product?.image}
              alt={product?.alt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/50">
              <Icon name="Package" size={36} className="text-muted-foreground/40" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          {/* PDF Badge */}
          {product?.hasPDF && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/90 backdrop-blur-sm text-white text-xs font-medium rounded-md shadow-sm">
                <Icon name="FileText" size={11} />
                PDF
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="w-8 h-8 rounded-lg bg-white/95 shadow-sm flex items-center justify-center hover:bg-white transition-colors"
              title="Editar"
            >
              <Icon name="Pencil" size={14} className="text-gray-600" />
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-8 h-8 rounded-lg bg-white/95 shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors"
              title="Eliminar"
            >
              <Icon name="Trash2" size={14} className="text-red-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-3">

          {/* Name + code */}
          <div>
            <h4 className="font-semibold text-foreground leading-snug line-clamp-2 mb-1">
              {product?.name}
            </h4>
            {product?.code && (
              <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                {product?.code}
              </span>
            )}
          </div>

          {/* Description */}
          {product?.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {product?.description}
            </p>
          )}

          {/* Price + margin */}
          <div className="flex items-end justify-between mt-auto pt-3 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Precio final</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(product?.finalPrice)}
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              {calculateMargin()}% margen
            </span>
          </div>

          {/* Cost breakdown */}
          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border/50">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Costo</p>
              <p className="text-xs font-medium text-foreground">{formatCurrency(product?.cost)}</p>
            </div>
            <div className="text-center border-x border-border/50">
              <p className="text-xs text-muted-foreground">M.O.</p>
              <p className="text-xs font-medium text-foreground">{formatCurrency(product?.labor)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ganancia</p>
              <p className="text-xs font-medium text-emerald-600">{formatCurrency(product?.profit)}</p>
            </div>
          </div>

        </div>
      </div>

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={product}
        allCategories={allCategories}
        onSuccess={onDataChange}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteError(null); }}
        onConfirm={handleDeleteProduct}
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto?"
        itemName={product?.name}
        loading={deleteLoading}
        error={deleteError}
      />
    </>
  );
};

export default ProductCard;
