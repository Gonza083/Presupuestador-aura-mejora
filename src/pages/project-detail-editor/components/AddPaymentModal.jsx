import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const PAYMENT_METHODS = [
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'tarjeta', label: 'Tarjeta' },
];

const today = () => new Date().toISOString().slice(0, 10);

const fmtUSD = (n) =>
  new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

const fmtARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);

const AddPaymentModal = ({ isOpen, onClose, onConfirm, maxAmount, loading }) => {
  const [currency, setCurrency] = useState('USD');
  const [form, setForm] = useState({
    amount: '',
    payment_date: today(),
    method: 'transferencia',
    notes: ''
  });
  const [exchangeRate, setExchangeRate] = useState(null);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [exchangeError, setExchangeError] = useState(null);
  const [error, setError] = useState(null);

  // Fetch official exchange rate when switching to ARS
  useEffect(() => {
    if (currency === 'ARS' && !exchangeRate) {
      fetchExchangeRate();
    }
  }, [currency]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setForm({ amount: '', payment_date: today(), method: 'transferencia', notes: '' });
      setCurrency('USD');
      setExchangeRate(null);
      setExchangeError(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchExchangeRate = async () => {
    try {
      setExchangeLoading(true);
      setExchangeError(null);
      const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
      if (!res.ok) throw new Error('No se pudo obtener el tipo de cambio');
      const data = await res.json();
      const rate = data?.oficial?.value_sell;
      if (!rate) throw new Error('Datos de cambio no disponibles');
      setExchangeRate(rate);
    } catch (err) {
      setExchangeError('No se pudo obtener el dólar oficial. Podés ingresar en USD directamente.');
    } finally {
      setExchangeLoading(false);
    }
  };

  if (!isOpen) return null;

  const arsAmount = parseFloat(form.amount) || 0;
  const usdAmount = currency === 'ARS' && exchangeRate
    ? arsAmount / exchangeRate
    : parseFloat(form.amount) || 0;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCurrencySwitch = (c) => {
    setCurrency(c);
    setForm(prev => ({ ...prev, amount: '' }));
    setError(null);
  };

  const handleSubmit = () => {
    const raw = parseFloat(form.amount);
    if (!form.amount || isNaN(raw) || raw <= 0) {
      setError('Ingresá un monto válido mayor a cero.');
      return;
    }
    if (currency === 'ARS' && !exchangeRate) {
      setError('No hay tipo de cambio disponible. Cambiá a USD para continuar.');
      return;
    }
    const finalUSD = currency === 'ARS' ? arsAmount / exchangeRate : raw;
    if (maxAmount > 0 && finalUSD > maxAmount + 0.01) {
      setError(`El monto no puede superar el saldo pendiente (${fmtUSD(maxAmount)}).`);
      return;
    }
    if (!form.payment_date) {
      setError('Seleccioná una fecha de pago.');
      return;
    }

    // Build auto-note for ARS payments
    let notes = form.notes;
    if (currency === 'ARS' && exchangeRate) {
      const arsNote = `Pago en ARS ${fmtARS(arsAmount)} @ $${exchangeRate.toLocaleString('es-AR', { minimumFractionDigits: 2 })} (dólar oficial)`;
      notes = notes ? `${arsNote} — ${notes}` : arsNote;
    }

    onConfirm({ ...form, amount: finalUSD, notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && onClose()} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <Icon name="DollarSign" size={18} className="text-success" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground">Registrar Pago</h2>
              {maxAmount > 0 && (
                <p className="text-xs text-muted-foreground">Saldo pendiente: {fmtUSD(maxAmount)}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" iconName="X" onClick={() => !loading && onClose()} />
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* Currency toggle */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Moneda</label>
            <div className="flex items-center bg-muted rounded-lg p-1 gap-1 w-fit">
              {['USD', 'ARS'].map((c) => (
                <button
                  key={c}
                  onClick={() => handleCurrencySwitch(c)}
                  disabled={loading}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    currency === c
                      ? 'bg-white shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Exchange rate info */}
          {currency === 'ARS' && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              exchangeError
                ? 'bg-error/10 border border-error/30 text-error'
                : 'bg-muted/50 border border-border text-muted-foreground'
            }`}>
              {exchangeLoading ? (
                <>
                  <Icon name="Loader2" size={14} className="animate-spin flex-shrink-0" />
                  <span>Obteniendo dólar oficial...</span>
                </>
              ) : exchangeError ? (
                <>
                  <Icon name="AlertCircle" size={14} className="flex-shrink-0" />
                  <span>{exchangeError}</span>
                </>
              ) : exchangeRate ? (
                <>
                  <Icon name="TrendingUp" size={14} className="flex-shrink-0 text-accent" />
                  <span className="text-foreground">
                    Dólar oficial (venta): <strong>{fmtARS(exchangeRate)}</strong>
                  </span>
                  <button onClick={fetchExchangeRate} className="ml-auto text-xs text-accent hover:underline flex-shrink-0">
                    Actualizar
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Monto en {currency} <span className="text-error">*</span>
            </label>
            <Input
              type="number"
              min="0.01"
              step={currency === 'ARS' ? '1' : '0.01'}
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder={currency === 'ARS' ? '0' : '0.00'}
              disabled={loading || (currency === 'ARS' && exchangeLoading)}
            />
            {/* ARS → USD conversion preview */}
            {currency === 'ARS' && exchangeRate && arsAmount > 0 && (
              <p className="mt-1.5 text-sm text-accent font-medium">
                = {fmtUSD(arsAmount / exchangeRate)}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fecha de Pago <span className="text-error">*</span>
            </label>
            <Input
              type="date"
              value={form.payment_date}
              onChange={(e) => handleChange('payment_date', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Método de Pago</label>
            <Select
              options={PAYMENT_METHODS}
              value={form.method}
              onChange={(val) => handleChange('method', val)}
              disabled={loading}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Observaciones</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="N° de transferencia, banco, aclaraciones..."
              rows={2}
              disabled={loading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
            />
            {currency === 'ARS' && exchangeRate && (
              <p className="mt-1 text-xs text-muted-foreground">
                Se agregará automáticamente la referencia de cambio a las observaciones.
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
              <Icon name="AlertCircle" size={16} className="text-error flex-shrink-0" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => !loading && onClose()} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (currency === 'ARS' && exchangeLoading)}
            iconName={loading ? 'Loader2' : 'CheckCircle'}
            className={loading ? '[&_svg]:animate-spin' : ''}
          >
            {loading ? 'Registrando...' : 'Registrar y emitir comprobante'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentModal;
