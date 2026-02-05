import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { categoriesService } from '../../../services/supabaseService';

const AddCategoryModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Folder'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Available icons for category selection
  const availableIcons = [
    { name: 'Camera', label: 'Cámara' },
    { name: 'Network', label: 'Red' },
    { name: 'Bell', label: 'Alarma' },
    { name: 'Lightbulb', label: 'Iluminación' },
    { name: 'Lock', label: 'Seguridad' },
    { name: 'Wifi', label: 'WiFi' },
    { name: 'Monitor', label: 'Monitor' },
    { name: 'Cpu', label: 'Hardware' },
    { name: 'Cable', label: 'Cables' },
    { name: 'Zap', label: 'Eléctrico' },
    { name: 'Speaker', label: 'Audio' },
    { name: 'Mic', label: 'Micrófono' },
    { name: 'Video', label: 'Video' },
    { name: 'Smartphone', label: 'Móvil' },
    { name: 'Tablet', label: 'Tablet' },
    { name: 'Folder', label: 'Carpeta' }
  ];

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e?.target || {};
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleIconSelect = (iconName) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      await categoriesService?.create({
        name: formData?.name,
        icon: formData?.icon
      });
      
      // Reset form
      setFormData({ name: '', description: '', icon: 'Folder' });
      
      // Notify parent and close
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Create category error:', err);
      setError('Error al crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-heading font-semibold text-foreground">
                Nueva Categoría
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Organiza tus productos creando una categoría
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
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

          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nombre de la categoría
            </label>
            <Input
              type="text"
              name="name"
              value={formData?.name}
              onChange={handleInputChange}
              placeholder="Ej: Cámaras, Redes, Alarmas, Iluminación…"
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <textarea
              name="description"
              value={formData?.description}
              onChange={handleInputChange}
              placeholder="Breve descripción de los productos que incluirá esta categoría"
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none text-sm"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Ícono de la categoría <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <div className="grid grid-cols-8 gap-2">
              {availableIcons?.map((icon) => (
                <button
                  key={icon?.name}
                  type="button"
                  onClick={() => handleIconSelect(icon?.name)}
                  disabled={loading}
                  className={`
                    aspect-square rounded-lg border-2 transition-all duration-200
                    flex items-center justify-center hover:bg-accent/10
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                    ${
                      formData?.icon === icon?.name
                        ? 'border-accent bg-accent/10' :'border-border bg-white hover:border-accent/50'
                    }
                  `}
                  title={icon?.label}
                >
                  <Icon 
                    name={icon?.name} 
                    size={20} 
                    className={formData?.icon === icon?.name ? 'text-accent' : 'text-muted-foreground'}
                  />
                </button>
              ))}
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
              {loading ? 'Creando...' : 'Crear Categoría'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;