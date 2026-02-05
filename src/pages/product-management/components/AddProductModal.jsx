import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { productsService } from '../../../services/supabaseService';

const AddProductModal = ({ isOpen, onClose, allCategories, categoryId, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: categoryId || '',
    code: '',
    description: '',
    image: null,
    imagePreview: null,
    pdfFile: null,
    cost: '',
    labor: '',
    profit: ''
  });

  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e?.target || {};
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageDrop = (e) => {
    e?.preventDefault();
    setIsDragging(false);
    const file = e?.dataTransfer?.files?.[0];
    if (file && file?.type?.startsWith('image/')) {
      handleImageFile(file);
    }
  };

  const handleImageFile = (file) => {
    setFormData(prev => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file)
    }));
  };

  const handleImageSelect = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handlePDFSelect = (e) => {
    const file = e?.target?.files?.[0];
    if (file && file?.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, pdfFile: file }));
    }
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
      
      const finalPrice = calculateFinalPrice();
      
      await productsService?.create({
        categoryId: formData?.category,
        name: formData?.name,
        code: formData?.code,
        image: formData?.imagePreview || 'https://img.rocket.new/generatedImages/rocket_gen_img_1e3b7e4f7-1765090734789.png',
        alt: `${formData?.name} product image`,
        hasPdf: !!formData?.pdfFile,
        finalPrice: finalPrice,
        cost: parseFloat(formData?.cost) || 0,
        labor: parseFloat(formData?.labor) || 0,
        profit: parseFloat(formData?.profit) || 0
      });
      
      // Reset form
      setFormData({
        name: '',
        category: categoryId || '',
        code: '',
        description: '',
        image: null,
        imagePreview: null,
        pdfFile: null,
        cost: '',
        labor: '',
        profit: ''
      });
      
      // Notify parent and close
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Create product error:', err);
      setError('Error al crear el producto');
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
                Agregar Producto
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Completa la información del nuevo producto
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
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Descripción breve
                </label>
                <textarea
                  name="description"
                  value={formData?.description}
                  onChange={handleInputChange}
                  placeholder="Descripción opcional del producto..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* 2. Imagen del Producto */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Image" size={20} className="text-accent" />
              <h3 className="text-lg font-semibold text-foreground">
                Imagen del Producto
              </h3>
            </div>

            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
              }`}
              onDragOver={(e) => {
                e?.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleImageDrop}
            >
              {formData?.imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={formData?.imagePreview}
                    alt="Preview del producto"
                    className="max-h-48 mx-auto rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    iconName="Trash2"
                    onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
                  >
                    Eliminar imagen
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Icon name="Upload" size={40} className="mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-foreground font-medium mb-1">
                      Arrastra una imagen o haz clic para subir
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG hasta 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      iconName="Upload"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      Seleccionar archivo
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* 3. Ficha Técnica (PDF) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="FileText" size={20} className="text-accent" />
              <h3 className="text-lg font-semibold text-foreground">
                Ficha Técnica (PDF)
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePDFSelect}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  iconName="Upload"
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                  className="w-full"
                >
                  Subir PDF técnico
                </Button>
              </label>
            </div>

            {formData?.pdfFile && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                <Icon name="FileText" size={24} className="text-red-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {formData?.pdfFile?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(formData?.pdfFile?.size / 1024)?.toFixed(2)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  iconName="X"
                  onClick={() => setFormData(prev => ({ ...prev, pdfFile: null }))}
                />
              </div>
            )}
          </div>

          {/* 4. Estructura de Costos */}
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="DollarSign" size={20} className="text-accent" />
              <h3 className="text-lg font-semibold text-foreground">
                Estructura de Costos
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Costo del producto *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    name="cost"
                    value={formData?.cost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="pl-7"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Costo de mano de obra *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    name="labor"
                    value={formData?.labor}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="pl-7"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Ganancia *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    name="profit"
                    value={formData?.profit}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="pl-7"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Final Price Calculation */}
            <div className="pt-4 border-t border-accent/20">
              <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Icon name="Calculator" size={24} className="text-accent" />
                  <span className="text-base font-semibold text-foreground">
                    Precio de venta final:
                  </span>
                </div>
                <div className="text-2xl font-bold text-accent">
                  ${finalPrice?.toFixed(2)}
                </div>
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
              className={loading ? 'animate-spin' : ''}
            >
              {loading ? 'Creando...' : 'Agregar Producto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;