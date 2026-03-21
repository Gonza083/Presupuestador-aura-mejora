import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import BudgetItem from './BudgetItem';

const BudgetSummary = ({ budgetItems, viewMode, onUpdateQuantity, onRemoveItem, onClearBudget, onSave, initialDiscount = 0, project }) => {
  const [budgetDate, setBudgetDate] = useState(new Date()?.toISOString()?.split('T')?.[0]);
  const [discount, setDiscount] = useState(initialDiscount);

  useEffect(() => {
    if (initialDiscount) setDiscount(initialDiscount);
  }, [initialDiscount]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const subtotal = budgetItems?.reduce((sum, item) => sum + (item?.unitPrice * item?.quantity), 0);
  const totalCosts = budgetItems?.reduce((sum, item) => sum + (item?.cost * item?.quantity), 0);
  const totalLabor = budgetItems?.reduce((sum, item) => sum + (item?.labor * item?.quantity), 0);
  const totalProfit = budgetItems?.reduce((sum, item) => sum + (item?.profit * item?.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const grandTotal = subtotal - discountAmount;
  const profitMargin = subtotal > 0 ? ((totalProfit / subtotal) * 100)?.toFixed(1) : 0;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(201, 169, 110);
    doc.text("Presupuesto", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Aura Hogar", 14, 28);
    doc.text(`Fecha: ${budgetDate || new Date().toLocaleDateString()}`, 14, 34);
    if (project?.client) doc.text(`Cliente: ${project.client}`, 14, 40);
    if (project?.name) doc.text(`Proyecto: ${project.name}`, 14, 46);

    const tableColumn = ["Producto", "Categoría", "Cant.", "Precio Unit.", "Total"];
    const tableRows = budgetItems.map(item => [
      item.name,
      item.category || '-',
      item.quantity,
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.unitPrice),
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.unitPrice * item.quantity)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 58,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [201, 169, 110], textColor: 255 },
      alternateRowStyles: { fillColor: [252, 248, 240] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    const textX = 140;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Subtotal: ${formatCurrency(subtotal)}`, textX, finalY);
    doc.text(`Descuento (${discount}%): -${formatCurrency(discountAmount)}`, textX, finalY + 6);
    doc.setFontSize(14);
    doc.setTextColor(201, 169, 110);
    doc.text(`Total Final: ${formatCurrency(grandTotal)}`, textX, finalY + 14);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Documento generado automáticamente por Aura Hogar", 14, 280);

    const fileName = `Presupuesto_${project?.client || project?.name || 'Sin_Nombre'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handleExportExcel = () => {
    import('xlsx').then(XLSX => {
      const data = budgetItems.map(item => {
        const itemTotal = item.unitPrice * item.quantity;
        const profit = item.unitPrice - item.cost;
        return {
          "Producto": item.name,
          "Categoría": item.category || 'General',
          "Cantidad": item.quantity,
          "Precio Unitario": item.unitPrice,
          "Costo Unitario": item.cost || 0,
          "Mano de Obra": item.labor || 0,
          "Ganancia x Unidad": profit,
          "Total Venta": itemTotal,
          "Total Costo": (item.cost || 0) * item.quantity,
          "Total Ganancia": profit * item.quantity
        };
      });
      data.push({}, { "Producto": "RESUMEN" });
      data.push({ "Producto": "Subtotal Venta", "Total Venta": subtotal });
      data.push({ "Producto": `Descuento (${discount}%)`, "Total Venta": -discountAmount });
      data.push({ "Producto": "Total Final", "Total Venta": grandTotal });
      data.push({}, { "Producto": "METRICAS INTERNAS" });
      data.push({ "Producto": "Total Costos", "Total Venta": totalCosts });
      data.push({ "Producto": "Total Mano de Obra", "Total Venta": totalLabor });
      data.push({ "Producto": "Ganancia Neta", "Total Venta": totalProfit });
      data.push({ "Producto": "Margen %", "Total Venta": `${profitMargin}%` });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Presupuesto Interno");
      XLSX.writeFile(workbook, `Presupuesto_Interno_${project?.client || project?.name || 'Sin_Nombre'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  };

  const isEmpty = budgetItems?.length === 0;

  return (
    <div className="flex flex-col bg-white rounded-xl border border-border shadow-sm h-[calc(100vh-88px)]">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon name="FileText" size={18} className="text-accent" />
          <span className="text-sm font-semibold text-foreground">Presupuesto</span>
          {budgetItems?.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {budgetItems.length} {budgetItems.length === 1 ? 'ítem' : 'ítems'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={budgetDate}
            onChange={(e) => setBudgetDate(e?.target?.value)}
            className="text-xs text-muted-foreground border-0 focus:outline-none bg-transparent cursor-pointer"
          />
          {!isEmpty && (
            <button
              onClick={onClearBudget}
              className="text-xs text-muted-foreground hover:text-error transition-colors"
            >
              Vaciar
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Icon name="ShoppingCart" size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">El presupuesto está vacío</p>
            <p className="text-xs text-muted-foreground">Hacé clic en los productos del catálogo para agregarlos</p>
          </div>
        ) : (
          <div>
            {/* Column headers */}
            {viewMode === 'client' ? (
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b border-border text-xs text-muted-foreground">
                <div className="w-12 flex-shrink-0" />
                <div className="flex-1">Producto</div>
                <div className="flex-shrink-0 w-24 text-center">Cantidad</div>
                <div className="w-24 text-right">Subtotal</div>
                <div className="w-7 flex-shrink-0" />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b border-border text-xs text-muted-foreground">
                <div className="w-12 flex-shrink-0" />
                <div className="flex-1">Producto · cantidad · costo / M.O. / ganancia</div>
                <div className="w-24 text-right">Subtotal</div>
                <div className="w-7 flex-shrink-0" />
              </div>
            )}
            {budgetItems?.map(item => (
              <BudgetItem
                key={item?.id}
                item={item}
                viewMode={viewMode}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Totals + actions */}
      {!isEmpty && (
        <div className="border-t border-border flex-shrink-0">

          {/* Subtotal + discount */}
          <div className="px-5 pt-4 pb-3 space-y-3 border-b border-border">

            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm font-medium text-foreground">{formatCurrency(subtotal)}</span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Descuento</span>
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e?.target?.value) || 0)))}
                    className="w-14 h-9 px-2 text-center text-sm font-semibold focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    min="0" max="100" step="0.5"
                  />
                  <span className="px-2 h-9 flex items-center text-sm text-muted-foreground bg-muted border-l border-border">%</span>
                </div>
              </div>
              <span className="text-sm font-medium text-error">
                {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : '—'}
              </span>
            </div>

            {/* Internal metrics */}
            {viewMode === 'internal' && (
              <div className="mt-1 pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Desglose interno</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Costo material</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(totalCosts)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Mano de obra</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(totalLabor)}</p>
                  </div>
                  <div className="bg-success/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-success/80 mb-1">Ganancia</p>
                    <p className="text-sm font-bold text-success">{formatCurrency(totalProfit)}</p>
                    <p className="text-xs text-success/70 mt-0.5">{profitMargin}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grand total */}
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total final</p>
                <p className="text-xs text-muted-foreground mt-0.5">{budgetItems.length} {budgetItems.length === 1 ? 'producto' : 'productos'}</p>
              </div>
              <span className="text-2xl font-heading font-bold text-accent">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-5 py-3 flex flex-col gap-2">
            {onSave && (
              <button
                onClick={() => onSave({ subtotal, discount, grandTotal })}
                className="w-full h-10 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="Save" size={15} />
                Guardar presupuesto
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportPDF}
                className="h-9 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
              >
                <Icon name="FileText" size={14} />
                Exportar PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="h-9 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
              >
                <Icon name="FileSpreadsheet" size={14} />
                Exportar Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetSummary;
