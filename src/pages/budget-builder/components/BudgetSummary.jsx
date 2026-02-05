import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import BudgetItem from './BudgetItem';

const BudgetSummary = ({ budgetItems, viewMode, onUpdateQuantity, onRemoveItem, onClearBudget, onSave, initialDiscount = 0 }) => {
  const [clientName, setClientName] = useState('');
  const [budgetDate, setBudgetDate] = useState(new Date()?.toISOString()?.split('T')?.[0]);
  const [discount, setDiscount] = useState(initialDiscount);

  useEffect(() => {
    if (initialDiscount) {
      setDiscount(initialDiscount);
    }
  }, [initialDiscount]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  // Calculate totals
  const subtotal = budgetItems?.reduce((sum, item) => {
    return sum + (item?.unitPrice * item?.quantity);
  }, 0);

  const totalCosts = budgetItems?.reduce((sum, item) => {
    return sum + (item?.cost * item?.quantity);
  }, 0);

  const totalLabor = budgetItems?.reduce((sum, item) => {
    return sum + (item?.labor * item?.quantity);
  }, 0);

  const totalProfit = budgetItems?.reduce((sum, item) => {
    return sum + (item?.profit * item?.quantity);
  }, 0);

  const discountAmount = (subtotal * discount) / 100;
  const grandTotal = subtotal - discountAmount;
  const profitMargin = subtotal > 0 ? ((totalProfit / subtotal) * 100)?.toFixed(1) : 0;

  // Import libraries dynamically or at top if possible. Since this is React, top-level import is better, 
  // but if we want to avoid import errors if install failed, we can use require inside or just import at top.
  // Let's assume imports will be added at the top. Here we implement the logic.

  // Standard handleExportPDF implementation using top-level imports

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Project/Company Info
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); // Accent blue
    doc.text("Presupuesto", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Tech Project Manager", 14, 28);
    doc.text(`Fecha: ${budgetDate || new Date().toLocaleDateString()}`, 14, 34);
    if (clientName) {
      doc.text(`Cliente: ${clientName}`, 14, 40);
    }

    // Table Data
    const tableColumn = ["Producto", "Categoría", "Cant.", "Precio Unit.", "Total"];
    const tableRows = [];

    budgetItems.forEach(item => {
      const itemTotal = item.unitPrice * item.quantity;
      const price = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.unitPrice);
      const total = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(itemTotal);

      const itemData = [
        item.name,
        item.category || '-',
        item.quantity,
        price,
        total
      ];
      tableRows.push(itemData);
    });

    // Generate Table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 245, 255] }
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setTextColor(0);

    // Align to right approximately (A4 width is ~210mm)
    const textX = 140;

    doc.text(`Subtotal: ${formatCurrency(subtotal)}`, textX, finalY);
    doc.text(`Descuento (${discount}%): -${formatCurrency(discountAmount)}`, textX, finalY + 6);

    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text(`Total Final: ${formatCurrency(grandTotal)}`, textX, finalY + 14);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Documento generado automáticamente por Tech Project Manager", 14, 280);

    // Save
    const fileName = `Presupuesto_${clientName || 'Sin_Nombre'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handleExportExcel = () => {
    import('xlsx').then(XLSX => {
      // 1. Prepare Data
      const data = budgetItems.map(item => {
        const itemTotal = item.unitPrice * item.quantity;
        const profit = item.unitPrice - item.cost;
        const totalProfit = profit * item.quantity;

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
          "Total Ganancia": totalProfit
        };
      });

      // 2. Add Summary Rows
      data.push({}); // Empty row
      data.push({ "Producto": "RESUMEN" });
      data.push({ "Producto": "Subtotal Venta", "Total Venta": subtotal });
      data.push({ "Producto": `Descuento (${discount}%)`, "Total Venta": -discountAmount });
      data.push({ "Producto": "Total Final", "Total Venta": grandTotal });

      // Internal metrics
      data.push({});
      data.push({ "Producto": "METRICAS INTERNAS" });
      data.push({ "Producto": "Total Costos", "Total Venta": totalCosts });
      data.push({ "Producto": "Total Mano de Obra", "Total Venta": totalLabor });
      data.push({ "Producto": "Ganancia Neta", "Total Venta": totalProfit });
      data.push({ "Producto": "Margen %", "Total Venta": `${profitMargin}%` });

      // 3. Create Workbook
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Presupuesto Interno");

      // 4. Save
      const fileName = `Presupuesto_Interno_${clientName || 'Sin_Nombre'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    });
  };

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm h-fit">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Resumen del Presupuesto
          </h2>
          {budgetItems?.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              iconName="Trash2"
              onClick={onClearBudget}
              className="text-error hover:bg-error/10"
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Client Info */}
      <div className="p-6 border-b border-border">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre del cliente"
            type="text"
            placeholder="Ingrese el nombre"
            value={clientName}
            onChange={(e) => setClientName(e?.target?.value)}
          />
          <Input
            label="Fecha del presupuesto"
            type="date"
            value={budgetDate}
            onChange={(e) => setBudgetDate(e?.target?.value)}
          />
        </div>
      </div>

      {/* Budget Items List */}
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {budgetItems?.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="ShoppingCart" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay productos agregados
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona productos del catálogo para comenzar
            </p>
          </div>
        ) : (
          budgetItems?.map(item => (
            <BudgetItem
              key={item?.id}
              item={item}
              viewMode={viewMode}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* Totals Section */}
      {budgetItems?.length > 0 && (
        <div className="p-6 border-t border-border bg-muted/30">
          <div className="space-y-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Descuento</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e?.target?.value) || 0)))}
                  className="w-16 h-7 px-2 text-center border border-input rounded text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <span className="font-medium text-error">
                -{formatCurrency(discountAmount)}
              </span>
            </div>

            {/* Internal View - Cost Breakdown */}
            {viewMode === 'internal' && (
              <>
                <div className="pt-3 border-t border-border" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Icon name="DollarSign" size={14} />
                    Total costos
                  </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(totalCosts)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Icon name="Wrench" size={14} />
                    Total mano de obra
                  </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(totalLabor)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Icon name="TrendingUp" size={14} />
                    Ganancia total
                  </span>
                  <span className="font-medium text-success">
                    {formatCurrency(totalProfit)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Icon name="Percent" size={14} />
                    Margen
                  </span>
                  <span className="font-medium text-success">
                    {profitMargin}%
                  </span>
                </div>
              </>
            )}

            {/* Grand Total */}
            <div className="pt-3 border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-lg font-heading font-semibold text-foreground">
                TOTAL FINAL
              </span>
              <span className="text-2xl font-heading font-bold text-accent">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Export Actions */}
      <div className="p-6 border-t border-border">
        <div className="space-y-3">
          {onSave && (
            <Button
              variant="default"
              size="default"
              iconName="Save"
              onClick={() => onSave({ subtotal, discount, grandTotal })}
              fullWidth
              className="bg-accent hover:bg-accent/90 mb-4"
            >
              Guardar Proyecto
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="default"
              iconName="FileText"
              onClick={handleExportPDF}
              fullWidth
            >
              Descargar PDF
            </Button>
            <Button
              variant="outline"
              size="default"
              iconName="FileSpreadsheet"
              onClick={handleExportExcel}
              fullWidth
            >
              Descargar Excel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSummary;