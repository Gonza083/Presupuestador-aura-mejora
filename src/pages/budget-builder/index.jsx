import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ProductCatalog from './components/ProductCatalog';
import BudgetSummary from './components/BudgetSummary';
import { productsService, categoriesService, projectsService, lineItemsService, subscribeToProducts, unsubscribeChannel } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';
import DeleteConfirmModal from '../product-management/components/DeleteConfirmModal';
import AIBudgetModal from './components/AIBudgetModal';

const BudgetBuilder = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [viewMode, setViewMode] = useState('client'); // 'client' or 'internal'
  const [initialDiscount, setInitialDiscount] = useState(0);
  const [project, setProject] = useState(null);
  const [clearModal, setClearModal] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  // Load products, categories, and project data on mount
  useEffect(() => {
    loadData();
  }, [projectId]);

  // Real-time subscription for products
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToProducts(user?.id, (payload) => {
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
  }, [user?.id]);

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
          setProject(project);
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

            const linkedProduct = item?.product_id
              ? productsData?.find(p => p?.id === item?.product_id)
              : productsData?.find(p => p?.name === item?.name);

            return {
              id: item?.id,
              productId: item?.product_id || null,
              name: item?.name,
              category: item?.category,
              image: linkedProduct?.image || null,
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
    setClearModal(true);
  };

  const confirmClearBudget = () => {
    setBudgetItems([]);
    setClearModal(false);
  };

  const handleAIAddItems = (items) => {
    items.forEach(({ product, quantity }) => {
      handleAddToBudget(product, quantity);
    });
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
      timeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);

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
    <>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/projects-main')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <Icon name="ArrowLeft" size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Proyectos</span>
              </button>
              <div className="h-5 w-px bg-border" />
              <div>
                <h1 className="text-base font-heading font-semibold text-foreground leading-tight">
                  {project?.name || 'Presupuesto'}
                </h1>
                {project?.client && (
                  <p className="text-xs text-muted-foreground">Cliente: {project.client}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!['aprobado', 'finalizado', 'cancelado'].includes(project?.status) && (
                <button
                  onClick={() => setAiModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold transition-colors"
                >
                  <Icon name="Sparkles" size={13} />
                  Generar con IA
                </button>
              )}
              {successMessage && (
                <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                  <Icon name="CheckCircle" size={14} />
                  {successMessage}
                </span>
              )}
              {error && (
                <span className="flex items-center gap-1.5 text-xs text-error font-medium">
                  <Icon name="AlertCircle" size={14} />
                  {error}
                </span>
              )}
              <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
                <button
                  onClick={() => setViewMode('client')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'client' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name="Eye" size={13} />
                  Cliente
                </button>
                <button
                  onClick={() => setViewMode('internal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'internal' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name="Lock" size={13} />
                  Interno
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
          {/* Product Catalog Section */}
          <ProductCatalog
            products={products}
            categories={categories}
            budgetItems={budgetItems}
            onAddToBudget={handleAddToBudget}
            isLocked={['aprobado', 'finalizado', 'cancelado'].includes(project?.status)}
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
            project={project}
            isLocked={['aprobado', 'finalizado', 'cancelado'].includes(project?.status)}
          />
        </div>
      </div>
    </div>

    <DeleteConfirmModal
      isOpen={clearModal}
      onClose={() => setClearModal(false)}
      onConfirm={confirmClearBudget}
      title="Vaciar presupuesto"
      message="¿Estás seguro de que deseas quitar todos los productos del presupuesto?"
      itemName={project?.name || ''}
    />
    <AIBudgetModal
      isOpen={aiModal}
      onClose={() => setAiModal(false)}
      products={products}
      onAddItems={handleAIAddItems}
    />
    </>
  );
};

export default BudgetBuilder;