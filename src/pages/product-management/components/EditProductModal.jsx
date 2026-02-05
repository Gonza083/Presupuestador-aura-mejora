import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { productsService } from '../../../services/supabaseService';

const EditProductModal = ({ isOpen, onClose, product, allCategories, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: null,
    code: '',
    image: '',
    cost: '',
    labor: '',
    profit: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product?.name || '',
        category: product?.category_id || null,
        code: product?.code || '',
        image: product?.image || '',
        cost: product?.cost?.toString() || '',
        labor: product?.labor?.toString() || '',
        profit: product?.profit?.toString() || ''
      });
    }
  }, [product]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e?.target || {};
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateFinalPrice = () => {
    const cost = parseFloat(formData?.cost) || 0;
    const labor = parseFloat(formData?.labor) || 0;
    const profit = parseFloat(formData?.profit) || 0;
    return cost + labor + profit;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!formData?.name?.trim()) {
        setError('El nombre del producto es requerido');
        setLoading(false);
        return;
      }
      
      // CRITICAL: Validate category is selected
      if (!formData?.category) {
        setError('La categoría es requerida. Por favor selecciona una categoría.');
        setLoading(false);
        return;
      }
      
      const finalPrice = calculateFinalPrice();
      
      // Prepare update data - category is now guaranteed to be set
      const updateData = {
        categoryId: formData?.category,
        name: formData?.name?.trim(),
        code: formData?.code?.trim() || '',
        image: formData?.image?.trim() || null,
        alt: `${formData?.name?.trim()} product image`,
        finalPrice: finalPrice,
        cost: parseFloat(formData?.cost) || 0,
        labor: parseFloat(formData?.labor) || 0,
        profit: parseFloat(formData?.profit) || 0
      };
      
      console.log('Updating product:', product?.id, updateData);
      
      const result = await productsService?.update(product?.id, updateData);
      
      if (!result) {
        throw new Error('No se pudo actualizar el producto');
      }
      
      console.log('Product updated successfully:', result);
      
      // Notify parent and close
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Update product error:', err);
      setError(err?.message || 'Error al actualizar el producto. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const finalPrice = calculateFinalPrice();

  // Convert categories to select options
  const categoryOptions = allCategories?.map(cat => ({
    value: cat?.id,
    label: cat?.name
  })) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 rounded-t-xl z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-heading font-semibold text-foreground">
                Editar Producto
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Modifica la información del producto
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              iconName="X"
              onClick={onClose}
              className="-mt-1 -mr-2"
            />
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
              <Icon name="AlertCircle" size={16} className="text-error flex-shrink-0" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* 1. Información General */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="FileText" size={20} className="text-accent" />
              <h3 className="text-lg font-semibold text-foreground">
                Información General
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nombre del producto *
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData?.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Cámara IP Exterior 4MP"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Categoría *
                </label>
                <Select
                  options={categoryOptions}
                  value={formData?.category}
                  onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  placeholder="Seleccionar categoría"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Código / Modelo
                </label>
                <Input
                  type="text"
                  name="code"
                  value={formData?.code}
                  onChange={handleInputChange}
                  placeholder="Ej: CAM-EXT-4MP-001"
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  URL de Imagen
                </label>
                <Input
                  type="text"
                  name="image"
                  value={formData?.image}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* 2. Costos y Precios */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="DollarSign" size={20} className="text-accent" />
              <h3 className="text-lg font-semibold text-foreground">
                Costos y Precios
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Costo Material
                </label>
                <Input
                  type="number"
                  name="cost"
                  value={formData?.cost}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Mano de Obra
                </label>
                <Input
                  type="number"
                  name="labor"
                  value={formData?.labor}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Ganancia
                </label>
                <Input
                  type="number"
                  name="profit"
                  value={formData?.profit}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Final Price Display */}
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Precio Final al Cliente:
                </span>
                <span className="text-2xl font-heading font-bold text-accent">
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })?.format(finalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
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
              type="submit"
              variant="default"
              size="default"
              iconName={loading ? 'Loader2' : 'Check'}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;