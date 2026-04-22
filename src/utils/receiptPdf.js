import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Constants ──────────────────────────────────────────────────────────────
const GOLD   = [201, 169, 110];
const DARK   = [30,  30,  30];
const GRAY   = [130, 130, 130];
const LGRAY  = [220, 220, 220];
const GREEN  = [22,  163, 74];
const RED    = [220, 38,  38];
const WHITE  = [255, 255, 255];

const METHOD_LABELS = {
  efectivo:      'Efectivo',
  transferencia: 'Transferencia bancaria',
  cheque:        'Cheque',
  tarjeta:       'Tarjeta',
};

// ─── Formatters ─────────────────────────────────────────────────────────────
const fmtUSD = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n ?? 0);

const fmtARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n ?? 0);

const fmtTC = (n) =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Try to extract the exchange rate used from the payment notes.
 * Notes format: "Pago en ARS $xxx.xxx @ $x.xxx,xx (dólar oficial)"
 * Falls back to projectRate.
 */
function extractTCFromNotes(notes, projectRate) {
  if (!notes) return projectRate || null;
  // Match patterns like "@ $1.283,50" or "@ 1283.50"
  const match = notes.match(/@\s*\$?([\d.,]+)/);
  if (match) {
    // Argentine format: dots as thousands separator, comma as decimal
    const raw = match[1].replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 1) return parsed;
  }
  return projectRate || null;
}

/**
 * Try to extract the ARS amount from the payment notes.
 * Notes format: "Pago en ARS $641.750 @ ..."
 */
function extractARSFromNotes(notes) {
  if (!notes) return null;
  const match = notes.match(/Pago en ARS\s+\$?([\d.,]+)/);
  if (match) {
    const raw = match[1].replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return null;
}

// ─── Helper: draw a row with label on left and two right-aligned values ──────
function summaryRow(doc, y, label, usdVal, arsVal, opts = {}) {
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
  doc.setFontSize(opts.size || 9);
  doc.setTextColor(...(opts.color || GRAY));
  doc.text(label, 14, y);

  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
  doc.setTextColor(...(opts.usdColor || DARK));
  doc.text(usdVal, 148, y, { align: 'right' });

  if (arsVal !== null) {
    doc.setTextColor(...(opts.arsColor || DARK));
    doc.text(arsVal, 196, y, { align: 'right' });
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function generateReceiptPdf({ receipt, project, account }) {
  const doc = new jsPDF();

  const tc = extractTCFromNotes(receipt?.notes, project?.exchange_rate);
  const hasTC = tc != null && tc > 1;

  const arsFromNotes = extractARSFromNotes(receipt?.notes);
  const paymentARS = arsFromNotes ?? (hasTC ? (receipt?.amount ?? 0) * tc : null);

  const totalUSD      = account?.total_amount ?? 0;
  const paidUSD       = account?.paid_amount  ?? 0;
  const remainingUSD  = totalUSD - paidUSD;
  const thisPayUSD    = receipt?.amount ?? 0;
  const prevPaidUSD   = paidUSD - thisPayUSD;

  const totalARS     = hasTC ? totalUSD    * tc : null;
  const paidARS      = hasTC ? paidUSD     * tc : null;
  const remainingARS = hasTC ? remainingUSD * tc : null;

  const progress     = totalUSD > 0 ? Math.min(paidUSD / totalUSD, 1) : 0;
  const isSaldado    = remainingUSD <= 0.005;

  // ── HEADER ────────────────────────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setTextColor(...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.text('Aura Hogar', 14, 22);

  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('Domótica · Seguridad · Redes · Iluminación · Audio/Video', 14, 29);

  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROBANTE DE PAGO', 196, 20, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`N° ${receipt?.receipt_number ?? '—'}`, 196, 27, { align: 'right' });

  // Gold divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(14, 34, 196, 34);

  // ── CLIENT / PROJECT / DATE ───────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text('CLIENTE',       14,  43);
  doc.text('PROYECTO',      90,  43);
  doc.text('FECHA DE PAGO', 158, 43);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(project?.client ?? '—', 14,  51);
  doc.text(project?.name   ?? '—', 90,  51);
  doc.text(formatDate(receipt?.payment_date), 158, 51);

  // ── PAYMENT TABLE ────────────────────────────────────────────────────────
  const tableColumns = hasTC
    ? ['Concepto', 'Método de Pago', 'USD', 'ARS']
    : ['Concepto', 'Método de Pago', 'Monto Pagado'];

  const tableBody = hasTC
    ? [[
        'Pago de presupuesto',
        METHOD_LABELS[receipt?.method] ?? receipt?.method ?? '—',
        fmtUSD(thisPayUSD),
        fmtARS(paymentARS),
      ]]
    : [[
        'Pago de presupuesto',
        METHOD_LABELS[receipt?.method] ?? receipt?.method ?? '—',
        fmtUSD(thisPayUSD),
      ]];

  const colStyles = hasTC
    ? {
        0: { cellWidth: 72 },
        1: { cellWidth: 56 },
        2: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      }
    : {
        0: { cellWidth: 90 },
        1: { cellWidth: 60 },
        2: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
      };

  autoTable(doc, {
    startY: 60,
    head: [tableColumns],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: GOLD, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 11 },
    columnStyles: colStyles,
  });

  let y = doc.lastAutoTable.finalY + 6;

  // ── TIPO DE CAMBIO ────────────────────────────────────────────────────────
  if (hasTC) {
    doc.setFillColor(248, 245, 235);
    doc.roundedRect(14, y, 182, 9, 1.5, 1.5, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('Tipo de cambio utilizado (dólar oficial venta):', 18, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(`$${fmtTC(tc)}`, 190, y + 6, { align: 'right' });
    y += 15;
  } else {
    y += 6;
  }

  // ── COLUMN HEADERS FOR SUMMARY ────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  if (hasTC) {
    doc.text('USD', 148, y, { align: 'right' });
    doc.text('ARS', 196, y, { align: 'right' });
  } else {
    doc.text('MONTO', 196, y, { align: 'right' });
  }

  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.3);
  doc.line(14, y + 2, 196, y + 2);
  y += 8;

  // ── SUMMARY ROWS ──────────────────────────────────────────────────────────
  const arsOrNull = (v) => hasTC ? fmtARS(v) : null;

  summaryRow(doc, y,      'Total del presupuesto:',    fmtUSD(totalUSD),    arsOrNull(totalARS));
  y += 7;
  summaryRow(doc, y,      'Pagado anteriormente:',     fmtUSD(prevPaidUSD), arsOrNull(hasTC ? prevPaidUSD * tc : null));
  y += 7;
  summaryRow(doc, y,      'Este pago:',                fmtUSD(thisPayUSD),  arsOrNull(paymentARS), { bold: true, color: DARK, usdColor: GOLD, arsColor: GOLD });
  y += 3;
  doc.setDrawColor(...LGRAY);
  doc.line(100, y, 196, y);
  y += 5;
  summaryRow(doc, y, 'Pagado hasta la fecha:', fmtUSD(paidUSD), arsOrNull(paidARS), { bold: true });
  y += 7;

  if (isSaldado) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text('Saldo pendiente:', 14, y);
    doc.setTextColor(...GREEN);
    doc.text('SALDADO ✓', 196, y, { align: 'right' });
    doc.text('SALDADO ✓', 148, y, { align: 'right' });
  } else {
    summaryRow(doc, y, 'Saldo pendiente:', fmtUSD(remainingUSD), arsOrNull(remainingARS), { bold: true, usdColor: RED, arsColor: RED });
  }

  y += 12;

  // ── PROGRESS BAR ─────────────────────────────────────────────────────────
  const barX = 14, barW = 182, barH = 6;
  const filledW = barW * progress;
  const pct = Math.round(progress * 100);

  // Background
  doc.setFillColor(...LGRAY);
  doc.roundedRect(barX, y, barW, barH, barH / 2, barH / 2, 'F');

  // Fill
  if (filledW > 0) {
    const fillColor = isSaldado ? GREEN : GOLD;
    doc.setFillColor(...fillColor);
    // Clip fill to bar width
    doc.roundedRect(barX, y, Math.min(filledW, barW), barH, barH / 2, barH / 2, 'F');
  }

  // Percentage label
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(isSaldado ? GREEN : DARK));
  doc.text(`${pct}% pagado`, 196, y + 4.5, { align: 'right' });
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${pct}% pagado`, 14 + 2, y + 4.5);

  y += 14;

  // ── NOTES ────────────────────────────────────────────────────────────────
  if (receipt?.notes) {
    // Clean auto-generated ARS note from display if we already show it in the table
    let displayNotes = receipt.notes;
    if (hasTC && arsFromNotes) {
      // Remove the auto-generated prefix, keep any manual text after " — "
      const sepIdx = displayNotes.indexOf(' — ');
      displayNotes = sepIdx >= 0 ? displayNotes.slice(sepIdx + 3) : '';
    }

    if (displayNotes.trim()) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GRAY);
      doc.text('OBSERVACIONES', 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(displayNotes.trim(), 182);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 3;
    }

    // Always show the TC reference line if it was an ARS payment
    if (hasTC && arsFromNotes) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...GRAY);
      const tcLine = `Pago recibido en pesos: ${fmtARS(arsFromNotes)} al TC $${fmtTC(tc)}/USD (dólar oficial venta)`;
      doc.text(tcLine, 14, y);
    }
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...LGRAY);
  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.3);
  doc.line(14, 280, 196, 280);
  doc.text('Este comprobante fue generado electrónicamente · Aura Hogar', 105, 285, { align: 'center' });

  doc.save(`Comprobante_${receipt?.receipt_number ?? 'pago'}.pdf`);
}
