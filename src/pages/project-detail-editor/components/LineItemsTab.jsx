import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { lineItemsService, subscribeToLineItems, unsubscribeChannel } from '../../../services/supabaseService';

const LineItemsTab = ({ projectId }) => {
  const [lineItems, setLineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLineItems();
  }, [projectId]);

  // Real-time subscription for line items changes
  useEffect(() => {
    if (!projectId) return;

    const subscription = subscribeToLineItems(projectId, (payload) => {
      if (payload?.eventType === 'INSERT') {
        loadLineItems(); // Reload to get complete data
      } else if (payload?.eventType === 'UPDATE') {
        setLineItems(prev => prev?.map(item => 
          item?.id === payload?.new?.id ? payload?.new : item
        ));
      } else if (payload?.eventType === 'DELETE') {
        setLineItems(prev => prev?.filter(item => item?.id !== payload?.old?.id));
      }
    });

    return () => {
      unsubscribeChannel(subscription);
    };
  }, [projectId]);

  const loadLineItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await lineItemsService?.getByProject(projectId);
      setLineItems(data || []);
    } catch (err) {
      console.error('Load line items error:', err);
      setError('Error al cargar las líneas de producto');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: 'Cámaras', label: 'Cámaras' },
    { value: 'Cableado', label: 'Cableado' },
    { value: 'Mano de Obra', label: 'Mano de Obra' },
    { value: 'Equipos', label: 'Equipos' },
    { value: 'Accesorios', label: 'Accesorios' }
  ];

  const calculateItemTotal = (item) => {
    const subtotal = (item?.quantity || 0) * (item?.unit_cost || 0);
    const markupAmount = subtotal * ((item?.markup || 0) / 100);
    return subtotal + markupAmount;
  };

  const calculateGrandTotal = () => {
    return lineItems?.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleAddItem = async () => {
    try {
      const newItem = await lineItemsService?.create({
        projectId: projectId,
        category: '',
        name: '',
        quantity: 1,
        unitCost: 0,
        markup: 0
      });
      
      if (newItem) {
        await loadLineItems();
      }
    } catch (err) {
      console.error('Add line item error:', err);
      setError('Error al agregar línea');
    }
  };

  const handleUpdateItem = async (id, field, value) => {
    try {
      // Update local state immediately for better UX
      setLineItems(lineItems?.map(item => 
        item?.id === id ? { ...item, [field]: value } : item
      ));
      
      // Prepare update object
      const updates = {};
      if (field === 'category') updates.category = value;
      if (field === 'name') updates.name = value;
      if (field === 'quantity') updates.quantity = parseFloat(value) || 0;
      if (field === 'unit_cost') updates.unitCost = parseFloat(value) || 0;
      if (field === 'markup') updates.markup = parseFloat(value) || 0;
      
      // Update in database
      await lineItemsService?.update(id, updates);
    } catch (err) {
      console.error('Update line item error:', err);
      setError('Error al actualizar línea');
      // Reload to restore correct state
      await loadLineItems();
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await lineItemsService?.delete(id);
      await loadLineItems();
    } catch (err) {
      console.error('Delete line item error:', err);
      setError('Error al eliminar línea');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    })?.format(amount);
  };

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
          <Icon name="ShoppingCart" size={24} className="text-accent" />
          <h2 className="text-2xl font-heading font-semibold text-foreground">
            Líneas de Producto
          </h2>
        </div>
        <Button variant="default" size="sm" iconName="Plus" onClick={handleAddItem}>
          Agregar Línea
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
          <Icon name="AlertCircle" size={16} className="text-error flex-shrink-0" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Spreadsheet Table */}
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nombre del Producto
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Costo Unitario
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Markup (%)
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineItems?.map((item) => (
                <tr key={item?.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Select
                      options={categoryOptions}
                      value={item?.category || ''}
                      onChange={(value) => handleUpdateItem(item?.id, 'category', value)}
                      placeholder="Seleccionar"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item?.name || ''}
                      onChange={(e) => handleUpdateItem(item?.id, 'name', e?.target?.value)}
                      className="w-full px-2 py-1 border border-input rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                      placeholder="Nombre del producto"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item?.quantity || 0}
                      onChange={(e) => handleUpdateItem(item?.id, 'quantity', e?.target?.value)}
                      className="w-20 px-2 py-1 border border-input rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm text-right"
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item?.unit_cost || 0}
                      onChange={(e) => handleUpdateItem(item?.id, 'unit_cost', e?.target?.value)}
                      className="w-24 px-2 py-1 border border-input rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm text-right"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item?.markup || 0}
                      onChange={(e) => handleUpdateItem(item?.id, 'markup', e?.target?.value)}
                      className="w-20 px-2 py-1 border border-input rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm text-right"
                      min="0"
                      step="0.1"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {formatCurrency(calculateItemTotal(item))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Trash2"
                      onClick={() => handleDeleteItem(item?.id)}
                      className="text-error hover:bg-error/10"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/50 border-t-2 border-border">
              <tr>
                <td colSpan="5" className="px-4 py-4 text-right font-semibold text-foreground">
                  Total General:
                </td>
                <td className="px-4 py-4 text-right font-bold text-xl text-accent">
                  {formatCurrency(calculateGrandTotal())}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LineItemsTab;