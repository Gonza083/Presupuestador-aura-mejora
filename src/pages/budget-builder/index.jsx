import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ProductCatalog from './components/ProductCatalog';
import BudgetSummary from './components/BudgetSummary';
import { productsService, categoriesService, projectsService, lineItemsService, subscribeToProducts, unsubscribeChannel } from '../../services/supabaseService';
import { useParams } from 'react-router-dom';

const BudgetBuilder = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [viewMode, setViewMode] = useState('client'); // 'client' or 'internal'
  const [initialDiscount, setInitialDiscount] = useState(0);

  // Load products, categories, and project data on mount
  useEffect(() => {
    loadData();
  }, [projectId]);

  // Real-time subscription for products
  useEffect(() => {
    const subscription = subscribeToProducts((payload) => {
      if (payload?.eventType === 'INSERT') {
        loadProductsAndCategories();
      } else if (payload?.eventType === 'UPDATE') {
        setProducts(prev => prev?.map(p =>
          p?.id === payload?.new?.id ? payload?.new : p
        ));
      } else if (payload?.eventType === 'DELETE') {
        setProducts(prev => prev?.filter(p => p?.id !== payload?.old?.id));
      }
    });

    return () => {
      unsubscribeChannel(subscription);
    };
  }, []);

  const loadProductsAndCategories = async () => {
    const [productsData, categoriesData] = await Promise.all([
      productsService?.getAll(),
      categoriesService?.getAll()
    ]);
    setProducts(productsData || []);
    setCategories(categoriesData || []);
    return { productsData, categoriesData };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { productsData } = await loadProductsAndCategories();

      // Load project specific data if projectId exists
      if (projectId) {
        const [project, lineItems] = await Promise.all([
          projectsService?.getById(projectId),
          lineItemsService?.getByProject(projectId)
        ]);

        if (project) {
          setInitialDiscount(project?.discount || 0);
        }

        if (lineItems && lineItems.length > 0) {
          const mappedItems = lineItems.map(item => {
            // Try to find original product to recover image/code if possible (optional)
            // Since we don't store productId, we can only guess by name or code if we stored it.
            // But we only stored name.
            // Let's just use what we have in line_items.

            // Reconstruct Item
            // unit_cost in DB is 'cost'.
            // Price? We need to reverse markup?
            // markup = ((price - cost) / cost) * 100
            // price = cost * (1 + markup/100)

            const cost = Number(item?.unit_cost) || 0;
            const markup = Number(item?.markup) || 0;
            const labor = Number(item?.labor) || 0;
            const unitPrice = cost * (1 + markup / 100);
            const profit = unitPrice - cost;

            return {
              id: item?.id,
              productId: null, // Lost reference
              name: item?.name,
              category: item?.category,
              // Try to find an image from products if name matches exact
              image: productsData?.find(p => p?.name === item?.name)?.image || null,
              unitPrice: unitPrice,
              cost: cost,
              labor: labor,
              profit: profit,
              quantity: item?.quantity || 1
            };
          });
          setBudgetItems(mappedItems);
        }
      }

    } catch (err) {
      console.error('Load data error:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToBudget = (product, quantity) => {
    const existingItem = budgetItems?.find(item => item?.productId === product?.id);

    if (existingItem) {
      // Update quantity if already exists
      setBudgetItems(budgetItems?.map(item =>
        item?.productId === product?.id
          ? { ...item, quantity: item?.quantity + quantity }
          : item
      ));
    } else {
      // Add new item
      setBudgetItems([...budgetItems, {
        id: `temp-${Date.now()}`,
        productId: product?.id,
        category: product?.categories?.name || 'General',
        name: product?.name,
        code: product?.code,
        image: product?.image,
        alt: product?.alt,
        unitPrice: product?.final_price || 0,
        cost: product?.cost || 0,
        labor: product?.labor || 0,
        profit: product?.profit || 0,
        quantity: quantity
      }]);
    }
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      setBudgetItems(budgetItems?.map(item =>
        item?.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleRemoveItem = (itemId) => {
    setBudgetItems(budgetItems?.filter(item => item?.id !== itemId));
  };

  const handleClearBudget = () => {
    if (window.confirm('¿Estás seguro de vaciar el presupuesto?')) {
      setBudgetItems([]);
    }
  };

  const handleSaveProject = async (totals) => {
    if (!projectId) return;

    try {
      setLoading(true);
      setSuccessMessage(null);
      setError(null);

      // 1. Update Project Totals
      await projectsService?.update(projectId, {
        subtotal: totals?.subtotal,
        discount: totals?.discount,
        total: totals?.grandTotal
      });

      // 2. Save Line Items (Replace)
      await lineItemsService?.replaceForProject(projectId, budgetItems);

      setSuccessMessage('Proyecto guardado correctamente');

      // Hide success message after 3s
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reload data to get fresh IDs? 
      // useful but might reset UI state. 
      // Ideally we just continue.
    } catch (err) {
      console.error('Save error:', err);
      setError('Error al guardar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" size={48} className="text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                iconName="ArrowLeft"
                onClick={() => navigate('/projects-main')}
              >
                Volver atrás
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">
                  Constructor de Presupuestos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Arma presupuestos profesionales en tiempo real
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'client' ? 'default' : 'outline'}
                size="sm"
                iconName="Eye"
                onClick={() => setViewMode('client')}
              >
                Vista Cliente
              </Button>
              <Button
                variant={viewMode === 'internal' ? 'default' : 'outline'}
                size="sm"
                iconName="Lock"
                onClick={() => setViewMode('internal')}
              >
                Vista Interna
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {successMessage && (
          <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2">
            <Icon name="CheckCircle" size={20} className="text-success flex-shrink-0" />
            <p className="text-sm text-success">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
            <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Product Catalog Section */}
          <ProductCatalog
            products={products}
            categories={categories}
            budgetItems={budgetItems}
            onAddToBudget={handleAddToBudget}
          />

          {/* Budget Summary Section */}
          <BudgetSummary
            budgetItems={budgetItems}
            viewMode={viewMode}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearBudget={handleClearBudget}
            onSave={handleSaveProject}
            initialDiscount={initialDiscount}
          />
        </div>
      </div>
    </div>
  );
};

export default BudgetBuilder;