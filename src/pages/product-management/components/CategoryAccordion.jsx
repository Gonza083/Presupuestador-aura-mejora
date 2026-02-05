import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ProductCard from './ProductCard';
import AddProductModal from './AddProductModal';
import EditCategoryModal from './EditCategoryModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { categoriesService } from '../../../services/supabaseService';


const CategoryAccordion = ({ category, isExpanded, onToggle, searchQuery, allCategories, onDataChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredProducts = category?.products?.filter(product => {
    if (!searchQuery?.trim()) return true;
    const query = searchQuery?.toLowerCase();
    return (
      product?.name?.toLowerCase()?.includes(query) ||
      product?.code?.toLowerCase()?.includes(query)
    );
  });

  const displayCount = searchQuery?.trim() ? filteredProducts?.length : category?.productCount;

  const handleDeleteCategory = async () => {
    try {
      setDeleteLoading(true);
      await categoriesService?.delete(category?.id);
      setIsDeleteModalOpen(false);
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error('Delete category error:', err);
      alert('Error al eliminar la categoría: ' + (err?.message || 'Error desconocido'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden transition-all duration-250">
      {/* Category Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon name={category?.icon} size={24} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground">
              {category?.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {displayCount} {displayCount === 1 ? 'producto' : 'productos'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            onClick={(e) => {
              e?.stopPropagation();
              setIsModalOpen(true);
            }}
          >
            Agregar Producto
          </Button>
          <Button
            variant="ghost"
            size="icon"
            iconName="Edit2"
            onClick={(e) => {
              e?.stopPropagation();
              setIsEditModalOpen(true);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            iconName="Trash2"
            onClick={(e) => {
              e?.stopPropagation();
              setIsDeleteModalOpen(true);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
          />
        </div>
      </div>

      {/* Expanded Products Grid */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/20 p-6 animate-slide-down">
          {filteredProducts?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts?.map(product => (
                <ProductCard 
                  key={product?.id} 
                  product={product} 
                  allCategories={allCategories}
                  onDataChange={onDataChange}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon name="Package" size={40} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No se encontraron productos
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryId={category?.id}
        allCategories={allCategories}
        onSuccess={onDataChange}
      />

      {/* Edit Category Modal */}
      <EditCategoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={category}
        onSuccess={onDataChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCategory}
        title="Eliminar Categoría"
        message="¿Estás seguro de que deseas eliminar esta categoría?"
        itemName={category?.name}
        loading={deleteLoading}
      />
    </div>
  );
};

export default CategoryAccordion;