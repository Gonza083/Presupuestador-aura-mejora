import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { budgetCategoriesService, subscribeToBudgetCategories, unsubscribeChannel } from '../../../services/supabaseService';

const BudgetTrackingTab = ({ projectId }) => {
  const [budgetData, setBudgetData] = useState({ totalBudget: 0, totalSpent: 0, categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBudgetData();
  }, [projectId]);

  // Real-time subscription for budget changes
  useEffect(() => {
    if (!projectId) return;

    const subscription = subscribeToBudgetCategories(projectId, (payload) => {
      if (payload?.eventType === 'INSERT') {
        loadBudgetData(); // Reload all data to recalculate totals
      } else if (payload?.eventType === 'UPDATE') {
        loadBudgetData(); // Reload all data to recalculate totals
      } else if (payload?.eventType === 'DELETE') {
        loadBudgetData(); // Reload all data to recalculate totals
      }
    });

    return () => {
      unsubscribeChannel(subscription);
    };
  }, [projectId]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const categories = await budgetCategoriesService?.getByProject(projectId);
      
      const totalBudget = categories?.reduce((sum, cat) => sum + (parseFloat(cat?.allocated) || 0), 0);
      const totalSpent = categories?.reduce((sum, cat) => sum + (parseFloat(cat?.spent) || 0), 0);
      
      setBudgetData({
        totalBudget,
        totalSpent,
        categories: categories?.map(cat => ({
          id: cat?.id,
          name: cat?.name,
          allocated: parseFloat(cat?.allocated) || 0,
          spent: parseFloat(cat?.spent) || 0,
          color: cat?.color || 'bg-blue-500'
        })) || []
      });
    } catch (err) {
      console.error('Load budget data error:', err);
      setError('Error al cargar los datos del presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (spent, allocated) => {
    return allocated > 0 ? (spent / allocated) * 100 : 0;
  };

  const calculateVariance = (allocated, spent) => {
    return allocated - spent;
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-error';
    if (percentage >= 75) return 'text-warning';
    return 'text-success';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 90) return 'bg-error';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-success';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    })?.format(amount);
  };

  const overallPercentage = calculatePercentage(budgetData?.totalSpent, budgetData?.totalBudget);
  const overallVariance = calculateVariance(budgetData?.totalBudget, budgetData?.totalSpent);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="DollarSign" size={24} className="text-accent" />
          <h2 className="text-2xl font-heading font-semibold text-foreground">
            Seguimiento de Presupuesto
          </h2>
        </div>
        <Button variant="outline" size="sm" iconName="Download">
          Exportar Reporte
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
          <Icon name="AlertCircle" size={16} className="text-error flex-shrink-0" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Overall Budget Summary */}
      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Presupuesto Total</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(budgetData?.totalBudget)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Gastado</p>
            <p className="text-2xl font-bold text-accent">{formatCurrency(budgetData?.totalSpent)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Restante</p>
            <p className={`text-2xl font-bold ${overallVariance >= 0 ? 'text-success' : 'text-error'}`}>
              {formatCurrency(overallVariance)}
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progreso General</span>
            <span className={`text-sm font-semibold ${getStatusColor(overallPercentage)}`}>
              {overallPercentage?.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor(overallPercentage)} transition-all duration-500`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Alert if overspending */}
        {overallPercentage >= 90 && (
          <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-lg flex items-start gap-3">
            <Icon name="AlertTriangle" size={20} className="text-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-error">Alerta de Presupuesto</p>
              <p className="text-sm text-error mt-1">
                El proyecto ha alcanzado el {overallPercentage?.toFixed(1)}% del presupuesto total.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Desglose por Categoría
        </h3>
        <div className="space-y-4">
          {budgetData?.categories?.map((category) => {
            const percentage = calculatePercentage(category?.spent, category?.allocated);
            const variance = calculateVariance(category?.allocated, category?.spent);

            return (
              <div key={category?.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${category?.color}`} />
                    <span className="font-medium text-foreground">{category?.name}</span>
                  </div>
                  <span className={`text-sm font-semibold ${getStatusColor(percentage)}`}>
                    {percentage?.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Asignado</p>
                    <p className="font-semibold text-foreground">{formatCurrency(category?.allocated)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gastado</p>
                    <p className="font-semibold text-accent">{formatCurrency(category?.spent)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Restante</p>
                    <p className={`font-semibold ${variance >= 0 ? 'text-success' : 'text-error'}`}>
                      {formatCurrency(variance)}
                    </p>
                  </div>
                </div>

                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressBarColor(percentage)} transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetTrackingTab;