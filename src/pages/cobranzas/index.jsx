import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { paymentAccountsService, paymentsService } from '../../services/supabaseService';
import { generateReceiptPdf } from '../../utils/receiptPdf';
import AddPaymentModal from '../project-detail-editor/components/AddPaymentModal';

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

const ACCOUNT_STATUS = {
  pendiente: { label: 'Pendiente',     color: 'text-warning bg-warning/10 border-warning/30' },
  parcial:   { label: 'Pago parcial',  color: 'text-accent bg-accent/10 border-accent/30' },
  saldado:   { label: 'Saldado',       color: 'text-success bg-success/10 border-success/30' },
};

const AMOUNTS_KEY = 'aura_show_amounts';
const masked = '$ ••••••';

const CobranzasPage = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [payments, setPayments] = useState({}); // { accountId: [...payments] }
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, account: null, loading: false });
  const [filter, setFilter] = useState('all'); // all | pendiente | parcial | saldado
  const [showAmounts, setShowAmounts] = useState(() => {
    return localStorage.getItem(AMOUNTS_KEY) === 'true';
  });

  const toggleAmounts = () => {
    setShowAmounts(prev => {
      localStorage.setItem(AMOUNTS_KEY, String(!prev));
      return !prev;
    });
  };

  const show = (n) => showAmounts ? fmt(n) : masked;

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentAccountsService.getAll();
      setAccounts(data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar las cobranzas.');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (accountId) => {
    if (payments[accountId]) return; // ya cargados
    const data = await paymentsService.getByAccount(accountId);
    setPayments(prev => ({ ...prev, [accountId]: data }));
  };

  const handleToggleExpand = async (accountId) => {
    if (expanded === accountId) {
      setExpanded(null);
    } else {
      setExpanded(accountId);
      await loadPayments(accountId);
    }
  };

  const handleAddPayment = async (formData) => {
    try {
      setModal(prev => ({ ...prev, loading: true }));
      const { account } = modal;

      const payment = await paymentsService.create(account.id, formData);

      // Refresh account
      const updatedAccounts = await paymentAccountsService.getAll();
      setAccounts(updatedAccounts);

      // Refresh payments for this account
      const updatedPayments = await paymentsService.getByAccount(account.id);
      setPayments(prev => ({ ...prev, [account.id]: updatedPayments }));

      const updatedAccount = updatedAccounts.find(a => a.id === account.id);
      setModal({ open: false, account: null, loading: false });

      generateReceiptPdf({
        receipt: payment,
        project: account.projects,
        account: updatedAccount
      });
    } catch (err) {
      console.error(err);
      setModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDownloadReceipt = (payment, account) => {
    generateReceiptPdf({ receipt: payment, project: account.projects, account });
  };

  const handleDeletePayment = async (paymentId, accountId) => {
    if (!window.confirm('¿Anular este pago?')) return;
    await paymentsService.softDelete(paymentId, accountId);
    const updatedAccounts = await paymentAccountsService.getAll();
    setAccounts(updatedAccounts);
    const updatedPayments = await paymentsService.getByAccount(accountId);
    setPayments(prev => ({ ...prev, [accountId]: updatedPayments }));
  };

  // Summary stats
  const totalPresupuestado = accounts.reduce((s, a) => s + Number(a.total_amount), 0);
  const totalCobrado = accounts.reduce((s, a) => s + Number(a.paid_amount), 0);
  const totalPendiente = totalPresupuestado - totalCobrado;

  const filtered = filter === 'all' ? accounts : accounts.filter(a => a.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" size={40} className="text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/landing-dashboard')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Icon name="ArrowLeft" size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Inicio</span>
            </button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Icon name="Wallet" size={20} className="text-accent" />
              <h1 className="text-xl font-heading font-semibold text-foreground">Cobranzas</h1>
            </div>
          </div>
          <button
            onClick={toggleAmounts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={showAmounts ? 'Ocultar montos' : 'Mostrar montos'}
          >
            <Icon name={showAmounts ? 'Eye' : 'EyeOff'} size={15} />
            {showAmounts ? 'Ocultar montos' : 'Mostrar montos'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {error && (
          <div className="p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
            <Icon name="AlertCircle" size={16} className="text-error" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total presupuestado</p>
            <p className="text-2xl font-bold text-foreground">{show(totalPresupuestado)}</p>
            <p className="text-xs text-muted-foreground mt-1">{accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Cobrado</p>
            <p className="text-2xl font-bold text-success">{show(totalCobrado)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPresupuestado > 0 ? ((totalCobrado / totalPresupuestado) * 100).toFixed(1) : 0}% del total
            </p>
          </div>
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Pendiente de cobro</p>
            <p className="text-2xl font-bold text-error">{show(totalPendiente)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {accounts.filter(a => a.status !== 'saldado').length} cuenta{accounts.filter(a => a.status !== 'saldado').length !== 1 ? 's' : ''} activa{accounts.filter(a => a.status !== 'saldado').length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'pendiente', label: 'Pendientes' },
            { key: 'parcial', label: 'Parciales' },
            { key: 'saldado', label: 'Saldadas' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                filter === f.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-70">
                ({f.key === 'all' ? accounts.length : accounts.filter(a => a.status === f.key).length})
              </span>
            </button>
          ))}
        </div>

        {/* Accounts list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-border shadow-sm py-16 text-center">
            <Icon name="Inbox" size={40} className="text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No hay cuentas en esta categoría.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((account) => {
              const project = account.projects;
              const remaining = account.total_amount - account.paid_amount;
              const progress = account.total_amount > 0
                ? Math.min((account.paid_amount / account.total_amount) * 100, 100)
                : 0;
              const statusCfg = ACCOUNT_STATUS[account.status] || ACCOUNT_STATUS.pendiente;
              const isExpanded = expanded === account.id;
              const accountPayments = payments[account.id] || [];

              return (
                <div key={account.id} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">

                  {/* Row */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-foreground truncate">{project?.name}</h3>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                        {project?.client && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Icon name="User" size={12} />
                            {project.client}
                          </p>
                        )}
                        {/* Progress bar */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 bg-muted rounded-full h-1.5">
                            <div
                              className="bg-accent h-1.5 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">{progress.toFixed(0)}%</span>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        <p className="text-lg font-bold text-foreground">{show(account.total_amount)}</p>
                        <p className="text-sm text-success">Cobrado: {show(account.paid_amount)}</p>
                        <p className={`text-sm font-medium ${remaining > 0 ? 'text-error' : 'text-success'}`}>
                          {remaining > 0 ? `Pendiente: ${show(remaining)}` : 'Saldado'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <button
                        onClick={() => handleToggleExpand(account.id)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={15} />
                        {isExpanded ? 'Ocultar pagos' : 'Ver pagos'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/project-detail-editor/${project?.id}`)}
                          className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
                        >
                          <Icon name="ExternalLink" size={13} />
                          Ver proyecto
                        </button>
                        {remaining > 0.01 && (
                          <Button
                            size="sm"
                            iconName="Plus"
                            onClick={() => setModal({ open: true, account, loading: false })}
                          >
                            Registrar pago
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded payments */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20">
                      {accountPayments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Sin pagos registrados.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left px-5 py-2 text-xs font-semibold text-muted-foreground">Comprobante</th>
                              <th className="text-left px-5 py-2 text-xs font-semibold text-muted-foreground">Fecha</th>
                              <th className="text-left px-5 py-2 text-xs font-semibold text-muted-foreground">Método</th>
                              <th className="text-right px-5 py-2 text-xs font-semibold text-muted-foreground">Monto</th>
                              <th className="px-5 py-2" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {accountPayments.map(p => (
                              <tr key={p.id} className="hover:bg-muted/30">
                                <td className="px-5 py-2 font-mono text-xs text-muted-foreground">{p.receipt_number}</td>
                                <td className="px-5 py-2">{formatDate(p.payment_date)}</td>
                                <td className="px-5 py-2">{PAYMENT_METHOD_LABELS[p.method] || p.method}</td>
                                <td className="px-5 py-2 text-right font-bold">{show(p.amount)}</td>
                                <td className="px-5 py-2">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleDownloadReceipt(p, account)}
                                      title="Descargar comprobante"
                                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-accent transition-colors"
                                    >
                                      <Icon name="Download" size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePayment(p.id, account.id)}
                                      title="Anular"
                                      className="p-1.5 rounded hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
                                    >
                                      <Icon name="Trash2" size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddPaymentModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, account: null, loading: false })}
        onConfirm={handleAddPayment}
        maxAmount={modal.account ? modal.account.total_amount - modal.account.paid_amount : 0}
        loading={modal.loading}
      />
    </div>
  );
};

export default CobranzasPage;
