import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ProductRow from './ProductRow';

const ProductCatalog = ({ products, categories, budgetItems, onAddToBudget }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered?.filter(p => p?.category_id === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm?.toLowerCase();
      filtered = filtered?.filter(p => 
        p?.name?.toLowerCase()?.includes(term) ||
        p?.code?.toLowerCase()?.includes(term) ||
        p?.categories?.name?.toLowerCase()?.includes(term)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchTerm]);

  // Get count of items added to budget for each product
  const getProductCount = (productId) => {
    const item = budgetItems?.find(item => item?.productId === productId);
    return item?.quantity || 0;
  };

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm h-fit xl:sticky xl:top-24">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-heading font-semibold text-foreground">
              Catálogo de Productos
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona los productos para tu presupuesto
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            onClick={() => console.log('Add new product')}
          >
            Producto
          </Button>
        </div>

        {/* Search Bar */}
        <Input
          type="text"
          placeholder="Buscar por nombre, categoría o código…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e?.target?.value)}
          className="w-full"
        />
      </div>

      {/* Category Filters */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all' ?'bg-accent text-accent-foreground' :'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todos ({products?.length || 0})
          </button>
          {categories?.map(category => {
            const count = products?.filter(p => p?.category_id === category?.id)?.length || 0;
            return (
              <button
                key={category?.id}
                onClick={() => setSelectedCategory(category?.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category?.id
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {category?.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Product List */}
      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {filteredProducts?.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="Package" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
            </p>
          </div>
        ) : (
          filteredProducts?.map(product => (
            <ProductRow
              key={product?.id}
              product={product}
              addedCount={getProductCount(product?.id)}
              onAddToBudget={onAddToBudget}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ProductCatalog;