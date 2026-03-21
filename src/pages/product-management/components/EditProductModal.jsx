import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { productsService, uploadProductImage, uploadProductPDF } from '../../../services/supabaseService';

const EditProductModal = ({ isOpen, onClose, product, allCategories, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: null,
    code: '',
    description: '',
    cost: '',
    labor: '',
    profit: ''
  });
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
  const [newPdfFile, setNewPdfFile] = useState(null);
  const [profitMode, setProfitMode] = useState('amount');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update form when modal opens
  useEffect(() => {
    if (isOpen && product) {
      setFormData({
        name: product?.name || '',
        category: product?.category_id || null,
        code: product?.code || '',
        description: product?.description || '',
        cost: product?.cost?.toString() || '',
        labor: product?.labor?.toString() || '',
        profit: product?.profit?.toString() || ''
      });
      setCurrentImageUrl(product?.image || null);
      setNewImageFile(null);
      setNewImagePreview(null);
      setCurrentPdfUrl(product?.technicalPdf || null);
      setNewPdfFile(null);
      setProfitMode('amount');
      setError(null);
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e?.target || {};
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateProfit = () => {
    const cost = parseFloat(formData?.cost) || 0;
    const labor = parseFloat(formData?.labor) || 0;
    const value = parseFloat(formData?.profit) || 0;
    if (profitMode === 'percent') return (cost + labor) * value / 100;
    return value;
  };

  const calculateFinalPrice = () => {
    const cost = parseFloat(formData?.cost) || 0;
    const labor = parseFloat(formData?.labor) || 0;
    return cost + labor + calculateProfit();
  };

  const handleImageFile = (file) => {
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const handleImageSelect = (e) => {
    const file = e?.target?.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleImageDrop = (e) => {
    e?.preventDefault();
    setIsDragging(false);
    const file = e?.dataTransfer?.files?.[0];
    if (file && file?.type?.startsWith('image/')) handleImageFile(file);
  };

  const handleRemoveImage = () => {
    setNewImageFile(null);
    setNewImagePreview(null);
    setCurrentImageUrl(null);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (!formData?.name?.trim()) {
        setError('El nombre del producto es requerido');
        setLoading(false);
        return;
      }

      if (!formData?.category) {
        setError('La categoría es requerida. Por favor selecciona una categoría.');
        setLoading(false);
        return;
      }

      const finalPrice = calculateFinalPrice();

      let imageUrl = currentImageUrl;
      if (newImageFile) {
        imageUrl = await uploadProductImage(newImageFile);
      }

      let pdfUrl = currentPdfUrl;
      if (newPdfFile) {
        pdfUrl = await uploadProductPDF(newPdfFile);
      }

      const updateData = {
        categoryId: formData?.category,
        name: formData?.name?.trim(),
        code: formData?.code?.trim() || '',
        description: formData?.description?.trim() || null,
        image: imageUrl,
        alt: `${formData?.name?.trim()} product image`,
        hasPdf: !!pdfUrl,
        technicalPdf: pdfUrl,
        finalPrice: finalPrice,
        cost: parseFloat(formData?.cost) || 0,
        labor: parseFloat(formData?.labor) || 0,
        profit: calculateProfit()
      };

      const result = await productsService?.update(product?.id, updateData);

      if (!result) {
        throw new Error('No se pudo actualizar el producto');
      }

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
                  Descripción breve
                </label>
                <textarea
                  name="description"
                  value={formData?.description}
                  onChange={handleInputChange}
                  placeholder="Descripción opcional del producto..."
                  rows={3}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Imagen del producto
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                  }`}
                  onDragOver={(e) => { e?.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleImageDrop}
                >
                  {newImagePreview || currentImageUrl ? (
                    <div className="space-y-3">
                      <img
                        src={newImagePreview || currentImageUrl}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        iconName="Trash2"
                        onClick={handleRemoveImage}
                        disabled={loading}
                      >
                        Quitar imagen
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Icon name="Upload" size={36} className="mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Arrastrá una imagen o hacé clic para subir
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="edit-image-upload"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        iconName="Upload"
                        onClick={() => document.getElementById('edit-image-upload')?.click()}
                        disabled={loading}
                      >
                        Seleccionar archivo
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Ficha Técnica (PDF) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="FileText" size={20} className="text-accent" />
              <h3 className="text-lg font-semibold text-foreground">
                Ficha Técnica (PDF)
              </h3>
            </div>
            {currentPdfUrl || newPdfFile ? (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Icon name="FileText" size={20} className="text-red-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {newPdfFile ? (
                    <p className="text-sm font-medium text-foreground truncate">{newPdfFile.name}</p>
                  ) : (
                    <a
                      href={currentPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-red-700 hover:underline truncate block"
                    >
                      Ver ficha técnica actual
                    </a>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {newPdfFile ? 'Nuevo archivo seleccionado' : 'PDF cargado'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setNewPdfFile(e?.target?.files?.[0] || null)}
                    className="hidden"
                    id="edit-pdf-replace"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    iconName="RefreshCw"
                    onClick={() => document.getElementById('edit-pdf-replace')?.click()}
                    disabled={loading}
                  >
                    Reemplazar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    iconName="Trash2"
                    onClick={() => { setCurrentPdfUrl(null); setNewPdfFile(null); }}
                    disabled={loading}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-5 text-center">
                <Icon name="FileText" size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Subí la ficha técnica en formato PDF
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setNewPdfFile(e?.target?.files?.[0] || null)}
                  className="hidden"
                  id="edit-pdf-upload"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  iconName="Upload"
                  onClick={() => document.getElementById('edit-pdf-upload')?.click()}
                  disabled={loading}
                >
                  Seleccionar PDF
                </Button>
              </div>
            )}
          </div>

          {/* 3. Costos y Precios */}
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Ganancia</label>
                  <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setProfitMode('amount')}
                      className={`px-2 py-1 ${profitMode === 'amount' ? 'bg-accent text-white' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      $
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfitMode('percent')}
                      className={`px-2 py-1 ${profitMode === 'percent' ? 'bg-accent text-white' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      %
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {profitMode === 'percent' ? '%' : '$'}
                  </span>
                  <Input
                    type="number"
                    name="profit"
                    value={formData?.profit}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    disabled={loading}
                    className="pl-7"
                  />
                </div>
                {profitMode === 'percent' && formData?.profit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    = ${calculateProfit().toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* Final Price Display */}
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Precio Final al Cliente:
                </span>
                <span className="text-2xl font-heading font-bold text-accent">
                  {new Intl.NumberFormat('es-US', {
                    style: 'currency',
                    currency: 'USD',
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