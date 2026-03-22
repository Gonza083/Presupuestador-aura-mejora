import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { paymentAccountsService, paymentsService, lineItemsService } from '../../../services/supabaseService';
import { generateReceiptPdf } from '../../../utils/receiptPdf';
import AddPaymentModal from './AddPaymentModal';

const fmt = (n) =>
  new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n ?? 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const PAYMENT_METHOD_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  tarjeta: 'Tarjeta'
};

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'text-warning bg-warning/10 border-warning/30' },
  parcial: { label: 'Pago parcial', color: 'text-accent bg-accent/10 border-accent/30' },
  saldado: { label: 'Saldado', color: 'text-success bg-success/10 border-success/30' }
};

const CobranzasTab = ({ projectId, project }) => {
  const [account, setAccount] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const isApproved = project?.status === 'aprobado' ||
    project?.status === 'en_proceso' ||
    project?.status === 'finalizado';

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const acc = await paymentAccountsService.getByProject(projectId);
      setAccount(acc);
      if (acc) {
        const pmts = await paymentsService.getByAccount(acc.id);
        setPayments(pmts);
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar los datos de cobranzas.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setCreating(true);
      setError(null);

      // Calculate total from line_items
      const items = await lineItemsService.getByProject(projectId);
      const total = items.reduce((sum, item) => {
        const unitPrice = Number(item.unit_cost) * (1 + Number(item.markup) / 100);
        return sum + unitPrice * Number(item.quantity);
      }, 0);

      const acc = await paymentAccountsService.create(projectId, total);
      setAccount(acc);
      setPayments([]);
    } catch (err) {
      console.error(err);
      setError('Error al generar la cuenta corriente.');
    } finally {
      setCreating(false);
    }
  };

  const handleAddPayment = async (formData) => {
    try {
      setPaymentLoading(true);
      setError(null);

      const payment = await paymentsService.create(account.id, formData);

      // Refresh account (amounts updated server-side)
      const updatedAccount = await paymentAccountsService.getByProject(projectId);
      setAccount(updatedAccount);

      const updatedPayments = await paymentsService.getByAccount(account.id);
      setPayments(updatedPayments);

      setShowModal(false);

      // Generate receipt PDF
      generateReceiptPdf({
        receipt: payment,
        project,
        account: updatedAccount
      });
    } catch (err) {
      console.error(err);
      setError('Error al registrar el pago.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('¿Seguro que querés anular este pago? La operación no se puede deshacer.')) return;
    try {
      setDeletingId(paymentId);
      setError(null);
      await paymentsService.softDelete(paymentId, account.id);
      const updatedAccount = await paymentAccountsService.getByProject(projectId);
      setAccount(updatedAccount);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
    } catch (err) {
      console.error(err);
      setError('Error al anular el pago.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadReceipt = (payment) => {
    generateReceiptPdf({ receipt: payment, project, account });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="Loader2" size={32} className="text-accent animate-spin" />
      </div>
    );
  }

  const remaining = account ? (account.total_amount - account.paid_amount) : 0;
  const progress = account && account.total_amount > 0
    ? Math.min((account.paid_amount / account.total_amount) * 100, 100)
    : 0;
  const statusCfg = account ? (STATUS_CONFIG[account.status] || STATUS_CONFIG.pendiente) : null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon name="Wallet" size={24} className="text-accent" />
        <h2 className="text-2xl font-heading font-semibold text-foreground">Cobranzas</h2>
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
          <Icon name="AlertCircle" size={16} className="text-error flex-shrink-0" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* No account yet */}
      {!account && (
        <div className="bg-white rounded-lg border border-border shadow-sm p-8 text-center">
          {!isApproved ? (
            <>
              <Icon name="Lock" size={40} className="text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Presupuesto no aprobado</h3>
              <p className="text-sm text-muted-foreground">
                Cambiá el estado del proyecto a <strong>Aprobado</strong> en la pestaña Info para habilitar el módulo de cobranzas.
              </p>
            </>
          ) : (
            <>
              <Icon name="FileCheck" size={40} className="text-accent mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Presupuesto aprobado</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Generá la cuenta corriente del cliente para comenzar a registrar pagos.
                El monto se calculará automáticamente a partir de las líneas del presupuesto.
              </p>
              <Button
                onClick={handleCreateAccount}
                disabled={creating}
                iconName={creating ? 'Loader2' : 'Plus'}
                className={creating ? '[&_svg]:animate-spin' : ''}
              >
                {creating ? 'Generando...' : 'Generar cuenta corriente'}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Account exists */}
      {account && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-border shadow-sm p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total del presupuesto</p>
              <p className="text-2xl font-bold text-foreground">{fmt(account.total_amount)}</p>
            </div>
            <div className="bg-white rounded-lg border border-border shadow-sm p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Pagado</p>
              <p className="text-2xl font-bold text-success">{fmt(account.paid_amount)}</p>
            </div>
            <div className="bg-white rounded-lg border border-border shadow-sm p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Saldo pendiente</p>
              <p className={`text-2xl font-bold ${remaining <= 0 ? 'text-success' : 'text-error'}`}>
                {remaining <= 0 ? 'Saldado' : fmt(remaining)}
              </p>
            </div>
          </div>

          {/* Progress bar + status */}
          <div className="bg-white rounded-lg border border-border shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Progreso de cobro</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusCfg?.color}`}>
                {statusCfg?.label}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-accent h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{progress.toFixed(1)}% cobrado</p>
          </div>

          {/* Payments table */}
          <div className="bg-white rounded-lg border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Pagos registrados</h3>
              {remaining > 0.01 && (
                <Button
                  size="sm"
                  iconName="Plus"
                  onClick={() => setShowModal(true)}
                >
                  Registrar pago
                </Button>
              )}
            </div>

            {payments.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Icon name="Inbox" size={28} className="mx-auto mb-2 text-muted-foreground/50" />
                No hay pagos registrados todavía.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Comprobante</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Método</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monto</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notas</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs text-muted-foreground">{p.receipt_number}</span>
                        </td>
                        <td className="px-5 py-3 text-foreground">{formatDate(p.payment_date)}</td>
                        <td className="px-5 py-3 text-foreground">{PAYMENT_METHOD_LABELS[p.method] || p.method}</td>
                        <td className="px-5 py-3 text-right font-bold text-foreground">{fmt(p.amount)}</td>
                        <td className="px-5 py-3 text-muted-foreground max-w-[180px] truncate">{p.notes || '—'}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDownloadReceipt(p)}
                              title="Descargar comprobante"
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-accent transition-colors"
                            >
                              <Icon name="Download" size={15} />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              disabled={deletingId === p.id}
                              title="Anular pago"
                              className="p-1.5 rounded hover:bg-error/10 text-muted-foreground hover:text-error transition-colors disabled:opacity-50"
                            >
                              {deletingId === p.id
                                ? <Icon name="Loader2" size={15} className="animate-spin" />
                                : <Icon name="Trash2" size={15} />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <AddPaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleAddPayment}
        maxAmount={remaining}
        loading={paymentLoading}
      />
    </div>
  );
};

export default CobranzasTab;
