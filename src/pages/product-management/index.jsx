import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import CategoryAccordion from './components/CategoryAccordion';
import AddCategoryModal from './components/AddCategoryModal';
import { categoriesService, productsService, subscribeToCategories, subscribeToProducts, unsubscribeChannel } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';

const ProductManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Real-time subscription for categories
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToCategories(user?.id, (payload) => {
      if (payload?.eventType === 'INSERT') {
        setCategories(prev => [payload?.new, ...prev]);
      } else if (payload?.eventType === 'UPDATE') {
        setCategories(prev => prev?.map(c => c?.id === payload?.new?.id ? payload?.new : c));
      } else if (payload?.eventType === 'DELETE') {
        setCategories(prev => prev?.filter(c => c?.id !== payload?.old?.id));
      }
    });

    return () => {
      unsubscribeChannel(subscription);
    };
  }, [user?.id]);

  // Real-time subscription for products
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToProducts(user?.id, (payload) => {
      if (payload?.eventType === 'INSERT') {
        setProducts(prev => [payload?.new, ...prev]);
      } else if (payload?.eventType === 'UPDATE') {
        setProducts(prev => prev?.map(p => p?.id === payload?.new?.id ? payload?.new : p));
      } else if (payload?.eventType === 'DELETE') {
        setProducts(prev => prev?.filter(p => p?.id !== payload?.old?.id));
      }
    });

    return () => {
      unsubscribeChannel(subscription);
    };
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [categoriesData, productsData] = await Promise.all([
        categoriesService?.getAll(),
        productsService?.getAll()
      ]);

      setCategories(categoriesData || []);
      setProducts(productsData || []);
      
      // Expand first category by default
      if (categoriesData?.length > 0) {
        setExpandedCategories([categoriesData?.[0]?.id]);
      }
    } catch (err) {
      console.error('Load data error:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) =>
      prev?.includes(categoryId)
        ? prev?.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e?.target?.value);
  };

  // Group products by category
  const categoriesWithProducts = categories?.map(category => {
    const categoryProducts = products?.filter(p => p?.category_id === category?.id) || [];
    return {
      id: category?.id,
      name: category?.name,
      icon: category?.icon,
      productCount: categoryProducts?.length,
      products: categoryProducts?.map(p => ({
        id: p?.id,
        name: p?.name,
        code: p?.code,
        image: p?.image,
        alt: p?.alt,
        hasPDF: p?.has_pdf,
        finalPrice: p?.final_price,
        cost: p?.cost,
        labor: p?.labor,
        profit: p?.profit
      }))
    };
  });

  const filteredCategories = categoriesWithProducts?.filter((category) => {
    if (!searchQuery?.trim()) return true;
    const query = searchQuery?.toLowerCase();
    const categoryMatch = category?.name?.toLowerCase()?.includes(query);
    const productMatch = category?.products?.some((product) =>
      product?.name?.toLowerCase()?.includes(query) ||
      product?.code?.toLowerCase()?.includes(query)
    );
    return categoryMatch || productMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="text-accent animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                iconName="ArrowLeft"
                onClick={() => navigate('/')}>
                Inicio
              </Button>
              <div>
                <h1 className="text-3xl font-heading font-semibold text-foreground">
                  Gestión de Productos
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Organiza tus productos por categorías
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="default"
                iconName="Trash2"
                onClick={() => navigate('/trash-management')}>
                Papelera
              </Button>
              <Button
                variant="default"
                size="default"
                iconName="FolderPlus"
                onClick={() => setIsCategoryModalOpen(true)}>
                + Nueva Categoría
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Icon name="Search" size={20} />
            </div>
            <Input
              type="search"
              placeholder="Buscar categorías o productos…"
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-3">
            <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0" />
            <p className="text-error">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {filteredCategories?.length > 0 ? (
            filteredCategories?.map((category) => (
              <CategoryAccordion
                key={category?.id}
                category={category}
                isExpanded={expandedCategories?.includes(category?.id)}
                onToggle={() => toggleCategory(category?.id)}
                searchQuery={searchQuery}
                allCategories={categoriesWithProducts}
                onDataChange={loadData}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Icon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                No se encontraron categorías o productos
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default ProductManagement;