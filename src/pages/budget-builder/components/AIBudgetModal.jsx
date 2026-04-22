import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { generateBudgetSuggestions } from '../../../services/anthropicService';
import { useCurrency } from '../../../contexts/CurrencyContext';

const AIBudgetModal = ({ isOpen, onClose, products, onAddItems }) => {
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const { formatAmount } = useCurrency();

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!requirements.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSuggestions(null);

      const result = await generateBudgetSuggestions(requirements, products);

      // Enrich suggestions with product data
      const enriched = result
        .map(s => {
          const product = products.find(p => p.id === s.id);
          if (!product) return null;
          return { ...s, product };
        })
        .filter(Boolean);

      setSuggestions(enriched);
    } catch (err) {
      console.error('AI generation error:', err);
      setError(`Error: ${err?.message || err?.toString() || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAll = () => {
    if (!suggestions) return;
    onAddItems(suggestions.map(s => ({ product: s.product, quantity: s.quantity })));
    onClose();
  };

  const handleAddOne = (s) => {
    onAddItems([{ product: s.product, quantity: s.quantity }]);
  };

  const handleClose = () => {
    setRequirements('');
    setSuggestions(null);
    setError(null);
    onClose();
  };

  const formatCurrency = formatAmount;

  const totalEstimado = suggestions?.reduce((sum, s) => sum + (s.product?.final_price || 0) * s.quantity, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <Icon name="Sparkles" size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground">Generar Presupuesto con IA</h2>
              <p className="text-xs text-muted-foreground">Describí lo que necesita el cliente</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" iconName="X" onClick={handleClose} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Requirements input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Requerimiento del cliente
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Ej: Necesito instalar 6 cámaras de exterior HD, un NVR con grabación 24hs, control de acceso para 2 puertas y una UPS que respalde todo el sistema."
              rows={4}
              disabled={loading}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
              <Icon name="AlertCircle" size={16} className="text-error flex-shrink-0" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Suggestions */}
          {suggestions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {suggestions.length} producto{suggestions.length !== 1 ? 's' : ''} sugerido{suggestions.length !== 1 ? 's' : ''}
                </h3>
                <span className="text-sm font-bold text-accent">{formatCurrency(totalEstimado)}</span>
              </div>

              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                    {/* Image */}
                    <div className="w-12 h-12 flex-shrink-0 rounded-lg border border-border bg-white flex items-center justify-center overflow-hidden">
                      {s.product?.image ? (
                        <img src={s.product.image} alt={s.product.name} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <Icon name="Package" size={18} className="text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">{s.product?.name}</p>
                      {s.product?.code && (
                        <p className="text-xs text-muted-foreground">{s.product.code}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.reason}</p>
                    </div>

                    {/* Quantity & price */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">x{s.quantity}</p>
                      <p className="text-sm font-bold text-accent">{formatCurrency((s.product?.final_price || 0) * s.quantity)}</p>
                      <button
                        onClick={() => handleAddOne(s)}
                        className="mt-1 text-xs text-accent hover:text-accent/80 font-medium"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="flex items-center gap-2">
            {suggestions && (
              <Button
                variant="default"
                iconName="ShoppingCart"
                onClick={handleAddAll}
              >
                Agregar todos al presupuesto
              </Button>
            )}
            {!suggestions && (
              <Button
                onClick={handleGenerate}
                disabled={loading || !requirements.trim()}
                iconName={loading ? 'Loader2' : 'Sparkles'}
                className={loading ? '[&_svg]:animate-spin' : ''}
              >
                {loading ? 'Generando...' : 'Generar'}
              </Button>
            )}
            {suggestions && (
              <Button
                variant="outline"
                iconName="RefreshCw"
                onClick={handleGenerate}
                disabled={loading}
              >
                Regenerar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIBudgetModal;
