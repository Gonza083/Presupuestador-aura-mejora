import React, { useState } from 'react';
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

const AddPaymentModal = ({ isOpen, onClose, onConfirm, maxAmount, loading }) => {
  const [form, setForm] = useState({
    amount: '',
    payment_date: today(),
    method: 'transferencia',
    notes: ''
  });
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = () => {
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      setError('Ingresá un monto válido mayor a cero.');
      return;
    }
    if (maxAmount > 0 && amount > maxAmount + 0.01) {
      setError(`El monto no puede superar el saldo pendiente (${new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(maxAmount)}).`);
      return;
    }
    if (!form.payment_date) {
      setError('Seleccioná una fecha de pago.');
      return;
    }
    onConfirm({ ...form, amount });
  };

  const handleClose = () => {
    setForm({ amount: '', payment_date: today(), method: 'transferencia', notes: '' });
    setError(null);
    onClose();
  };

  const fmt = (n) =>
    new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
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
                <p className="text-xs text-muted-foreground">Saldo pendiente: {fmt(maxAmount)}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" iconName="X" onClick={handleClose} />
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Monto <span className="text-error">*</span>
            </label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="0.00"
              disabled={loading}
            />
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
            <label className="block text-sm font-medium text-foreground mb-2">
              Método de Pago
            </label>
            <Select
              options={PAYMENT_METHODS}
              value={form.method}
              onChange={(val) => handleChange('method', val)}
              disabled={loading}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Observaciones
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="N° de transferencia, banco, aclaraciones..."
              rows={3}
              disabled={loading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
            />
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
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
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
