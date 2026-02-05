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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const calculateMargin = () => {
    const margin = ((product?.profit / product?.finalPrice) * 100)?.toFixed(1);
    return `${margin}%`;
  };

  const handleDeleteProduct = async () => {
    try {
      setDeleteLoading(true);
      await productsService?.delete(product?.id);
      setIsDeleteModalOpen(false);
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error('Delete product error:', err);
      alert('Error al eliminar el producto: ' + (err?.message || 'Error desconocido'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-250 overflow-hidden group">
        {/* Product Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {!imageError ? (
            <img
              src={product?.image}
              alt={product?.alt}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="ImageOff" size={48} className="text-muted-foreground" />
            </div>
          )}
          
          {/* PDF Badge */}
          {product?.hasPDF && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
                <Icon name="FileText" size={12} />
                PDF
              </span>
            </div>
          )}

          {/* Action Buttons (visible on hover) */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/90 hover:bg-white"
              iconName="Edit2"
              onClick={() => setIsEditModalOpen(true)}
            />
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/90 hover:bg-white"
              iconName="Trash2"
              onClick={() => setIsDeleteModalOpen(true)}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Name and Code */}
          <div className="mb-3">
            <h4 className="text-base font-heading font-semibold text-foreground mb-1 line-clamp-2">
              {product?.name}
            </h4>
            <p className="text-xs text-muted-foreground font-mono">
              {product?.code}
            </p>
          </div>

          {/* Final Price */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-heading font-bold text-accent">
                {formatCurrency(product?.finalPrice)}
              </span>
              <span className="text-xs text-success font-medium">
                {calculateMargin()} ganancia
              </span>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-2 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Icon name="DollarSign" size={14} />
                Costo:
              </span>
              <span className="font-medium text-foreground">
                {formatCurrency(product?.cost)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Icon name="Wrench" size={14} />
                M.O.:
              </span>
              <span className="font-medium text-foreground">
                {formatCurrency(product?.labor)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Icon name="TrendingUp" size={14} />
                Ganancia:
              </span>
              <span className="font-medium text-success">
                {formatCurrency(product?.profit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={product}
        allCategories={allCategories}
        onSuccess={onDataChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProduct}
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto?"
        itemName={product?.name}
        loading={deleteLoading}
      />
    </>
  );
};

export default ProductCard;