import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import ProductRow from './ProductRow';

const ProductCatalog = ({ products, categories, budgetItems, onAddToBudget }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategory !== 'all') {
      filtered = filtered?.filter(p => p?.category_id === selectedCategory);
    }
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

  const getProductCount = (productId) => {
    const item = budgetItems?.find(item => item?.productId === productId);
    return item?.quantity || 0;
  };

  return (
    <div className="flex flex-col bg-white rounded-xl border border-border shadow-sm overflow-hidden h-[calc(100vh-88px)]">
      {/* Search */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-accent text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === category?.id
                    ? 'bg-accent text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {category?.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Icon name="Package" size={48} className="text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredProducts?.map(product => (
              <ProductRow
                key={product?.id}
                product={product}
                addedCount={getProductCount(product?.id)}
                onAddToBudget={onAddToBudget}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCatalog;
