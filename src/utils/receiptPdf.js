import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GOLD = [201, 169, 110];

const PAYMENT_METHOD_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia bancaria',
  cheque: 'Cheque',
  tarjeta: 'Tarjeta'
};

const fmt = (n) =>
  new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function generateReceiptPdf({ receipt, project, account }) {
  const doc = new jsPDF();

  // ---- Header ----
  doc.setFontSize(22);
  doc.setTextColor(...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.text('Aura Hogar', 14, 22);

  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.setFont('helvetica', 'normal');
  doc.text('Domótica · Seguridad · Redes · Iluminación · Audio/Video', 14, 29);

  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROBANTE DE PAGO', 196, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text(`N° ${receipt?.receipt_number}`, 196, 27, { align: 'right' });

  // Divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(14, 34, 196, 34);

  // ---- Client / Project / Date block ----
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', 14, 43);
  doc.text('PROYECTO', 90, 43);
  doc.text('FECHA DE PAGO', 158, 43);

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(project?.client || '—', 14, 51);
  doc.text(project?.name || '—', 90, 51);
  doc.text(formatDate(receipt?.payment_date), 158, 51);

  // ---- Payment detail table ----
  autoTable(doc, {
    startY: 62,
    head: [['Descripción', 'Método de Pago', 'Monto Pagado']],
    body: [[
      'Pago de presupuesto',
      PAYMENT_METHOD_LABELS[receipt?.method] || receipt?.method || '—',
      fmt(receipt?.amount)
    ]],
    theme: 'grid',
    headStyles: { fillColor: GOLD, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 11 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 60 },
      2: { cellWidth: 36, halign: 'right', fontStyle: 'bold' }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 12;

  // ---- Account summary ----
  const remaining = (account?.total_amount || 0) - (account?.paid_amount || 0);
  const isSaldado = remaining <= 0;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text('Total del presupuesto:', 130, finalY);
  doc.text('Total pagado hasta la fecha:', 130, finalY + 7);
  doc.text('Saldo pendiente:', 130, finalY + 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  doc.setTextColor(40, 40, 40);
  doc.text(fmt(account?.total_amount || 0), 196, finalY, { align: 'right' });
  doc.text(fmt(account?.paid_amount || 0), 196, finalY + 7, { align: 'right' });

  if (isSaldado) {
    doc.setTextColor(22, 163, 74); // green
    doc.text('SALDADO', 196, finalY + 14, { align: 'right' });
  } else {
    doc.setTextColor(220, 38, 38); // red
    doc.text(fmt(remaining), 196, finalY + 14, { align: 'right' });
  }

  // ---- Notes ----
  if (receipt?.notes) {
    const notesY = finalY + 28;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(130, 130, 130);
    doc.text('OBSERVACIONES', 14, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(receipt.notes, 14, notesY + 6);
  }

  // ---- Footer ----
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.setFont('helvetica', 'normal');
  doc.line(14, 280, 196, 280);
  doc.text('Este comprobante fue generado electrónicamente por Aura Hogar.', 105, 285, { align: 'center' });

  doc.save(`Comprobante_${receipt?.receipt_number}.pdf`);
}
