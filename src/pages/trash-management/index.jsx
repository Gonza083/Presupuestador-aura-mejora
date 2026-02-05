import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import DeletedProductCard from './components/DeletedProductCard';
import DeletedCategoryCard from './components/DeletedCategoryCard';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import { productsService, categoriesService, trashService } from '../../services/supabaseService';

const TrashManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, item: null });
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [deletedCategories, setDeletedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch deleted items
  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const fetchDeletedItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const [products, categories] = await Promise.all([
        productsService?.getDeleted(),
        categoriesService?.getDeleted()
      ]);

      setDeletedProducts(products || []);
      setDeletedCategories(categories || []);
    } catch (err) {
      console.error('Error fetching deleted items:', err);
      setError(err?.message || 'Error al cargar elementos eliminados');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e?.target?.value || '');
  };

  const getRelativeTime = (date) => {
    const deletedDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - deletedDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Eliminado hoy';
    if (diffDays === 1) return 'Eliminado hace 1 día';
    if (diffDays < 30) return `Eliminado hace ${diffDays} días`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return 'Eliminado hace 1 mes';
    return `Eliminado hace ${diffMonths} meses`;
  };

  const filteredProducts = deletedProducts?.filter((product) => {
    if (!searchQuery?.trim()) return true;
    const query = searchQuery?.toLowerCase();
    return (
      product?.name?.toLowerCase()?.includes(query) ||
      product?.code?.toLowerCase()?.includes(query) ||
      product?.categories?.name?.toLowerCase()?.includes(query)
    );
  });

  const filteredCategories = deletedCategories?.filter((category) => {
    if (!searchQuery?.trim()) return true;
    const query = searchQuery?.toLowerCase();
    return category?.name?.toLowerCase()?.includes(query);
  });

  const handleRestore = async (type, item) => {
    try {
      setActionLoading(true);
      
      if (type === 'product') {
        await productsService?.restore(item?.id);
        setDeletedProducts(prev => prev?.filter(p => p?.id !== item?.id));
      } else if (type === 'category') {
        await categoriesService?.restore(item?.id);
        setDeletedCategories(prev => prev?.filter(c => c?.id !== item?.id));
      }

      // Refresh the list
      await fetchDeletedItems();
    } catch (err) {
      console.error('Error restoring item:', err);
      alert(err?.message || 'Error al restaurar el elemento');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePermanently = (type, item) => {
    setConfirmModal({ isOpen: true, type, item });
  };

  const handleConfirmDelete = async () => {
    try {
      setActionLoading(true);
      const { type, item } = confirmModal;

      if (type === 'product') {
        await productsService?.permanentDelete(item?.id);
        setDeletedProducts(prev => prev?.filter(p => p?.id !== item?.id));
      } else if (type === 'category') {
        await categoriesService?.permanentDelete(item?.id);
        setDeletedCategories(prev => prev?.filter(c => c?.id !== item?.id));
      }

      setConfirmModal({ isOpen: false, type: null, item: null });
      
      // Refresh the list
      await fetchDeletedItems();
    } catch (err) {
      console.error('Error deleting permanently:', err);
      alert(err?.message || 'Error al eliminar permanentemente');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmptyTrash = () => {
    setConfirmModal({ isOpen: true, type: 'empty-all', item: null });
  };

  const handleConfirmEmptyTrash = async () => {
    try {
      setActionLoading(true);
      await trashService?.emptyTrash();
      
      setDeletedProducts([]);
      setDeletedCategories([]);
      setConfirmModal({ isOpen: false, type: null, item: null });
      
      // Refresh the list
      await fetchDeletedItems();
    } catch (err) {
      console.error('Error emptying trash:', err);
      alert(err?.message || 'Error al vaciar la papelera');
    } finally {
      setActionLoading(false);
    }
  };

  const currentItems = activeTab === 'products' ? filteredProducts : filteredCategories;
  const hasItems = (deletedProducts?.length > 0) || (deletedCategories?.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando papelera...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-error mx-auto mb-4" />
          <p className="text-error font-semibold mb-2">Error al cargar la papelera</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDeletedItems}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="sm"
                iconName="ArrowLeft"
                onClick={() => navigate('/product-management')}
                disabled={actionLoading}
              >
                Volver a Productos
              </Button>
              <div>
                <h1 className="text-3xl font-heading font-semibold text-foreground">
                  Papelera
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Elementos eliminados recientemente
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasItems && (
                <Button
                  variant="outline"
                  size="default"
                  iconName="Trash2"
                  onClick={handleEmptyTrash}
                  disabled={actionLoading}
                  className="text-error hover:text-error hover:border-error"
                >
                  Vaciar papelera
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {hasItems && (
            <div className="relative max-w-2xl">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={20} />
              </div>
              <Input
                type="search"
                placeholder="Buscar en papelera…"
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 w-full"
                disabled={actionLoading}
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasItems ? (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 bg-white rounded-lg p-1 border border-border w-fit">
              <button
                onClick={() => setActiveTab('products')}
                disabled={actionLoading}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${activeTab === 'products' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                  ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                Productos eliminados
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === 'products' ? 'bg-accent-foreground/20' : 'bg-muted'
                }`}>
                  {deletedProducts?.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                disabled={actionLoading}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${activeTab === 'categories' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                  ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                Categorías eliminadas
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === 'categories' ? 'bg-accent-foreground/20' : 'bg-muted'
                }`}>
                  {deletedCategories?.length}
                </span>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              {currentItems?.length > 0 ? (
                activeTab === 'products' ? (
                  filteredProducts?.map((product) => (
                    <DeletedProductCard
                      key={product?.id}
                      product={product}
                      getRelativeTime={getRelativeTime}
                      onRestore={() => handleRestore('product', product)}
                      onDeletePermanently={() => handleDeletePermanently('product', product)}
                      disabled={actionLoading}
                    />
                  ))
                ) : (
                  filteredCategories?.map((category) => (
                    <DeletedCategoryCard
                      key={category?.id}
                      category={category}
                      getRelativeTime={getRelativeTime}
                      onRestore={() => handleRestore('category', category)}
                      onDeletePermanently={() => handleDeletePermanently('category', category)}
                      disabled={actionLoading}
                    />
                  ))
                )
              ) : (
                <div className="text-center py-12">
                  <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No se encontraron resultados</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <Icon name="Trash2" size={48} className="text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-2">
              La papelera está vacía
            </h2>
            <p className="text-muted-foreground mb-6">
              Los elementos eliminados aparecerán aquí
            </p>
            <Button
              variant="default"
              iconName="ArrowLeft"
              onClick={() => navigate('/product-management')}
            >
              Volver a Productos
            </Button>
          </div>
        )}
      </main>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={confirmModal?.isOpen}
        type={confirmModal?.type}
        item={confirmModal?.item}
        onClose={() => setConfirmModal({ isOpen: false, type: null, item: null })}
        onConfirm={confirmModal?.type === 'empty-all' ? handleConfirmEmptyTrash : handleConfirmDelete}
        disabled={actionLoading}
      />
    </div>
  );
};

export default TrashManagement;