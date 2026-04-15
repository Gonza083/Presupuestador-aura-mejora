import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { categoriesService, productsService } from '../../../services/supabaseService';

// ── helpers ────────────────────────────────────────────────────────────────
const TEMPLATE_HEADERS = ['nombre', 'categoria', 'costo', 'mano_de_obra', 'ganancia'];

const normalize = (str) => String(str || '').trim().toLowerCase();

const findHeader = (keys, candidates) => {
  for (const key of keys) {
    const n = normalize(key);
    if (candidates.some(c => n === c || n.includes(c))) return key;
  }
  return null;
};

const parseRow = (raw, headerMap) => {
  const get = (field) => {
    const key = headerMap[field];
    return key !== undefined ? raw[key] : undefined;
  };
  const name = String(get('nombre') ?? '').trim();
  const categoria = String(get('categoria') ?? '').trim();
  const cost = parseFloat(get('costo')) || 0;
  const labor = parseFloat(get('mano_de_obra')) || 0;
  const profit = parseFloat(get('ganancia')) || 0;
  const finalPrice = cost + labor + profit;
  return { name, categoria, cost, labor, profit, finalPrice };
};

const validateRow = (row) => {
  const errors = [];
  if (!row.name) errors.push('Falta el nombre');
  if (!row.categoria) errors.push('Falta la categoría');
  if (row.cost < 0) errors.push('Costo negativo');
  if (row.labor < 0) errors.push('Mano de obra negativa');
  if (row.profit < 0) errors.push('Ganancia negativa');
  return errors;
};

const downloadTemplate = () => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ['Cámara IP 4MP', 'Seguridad', 120, 30, 50],
    ['Switch 8 puertos', 'Redes', 85, 20, 35],
  ]);
  ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, 'plantilla_productos_aura.xlsx');
};

// ── component ──────────────────────────────────────────────────────────────
const STEPS = { UPLOAD: 'upload', PREVIEW: 'preview', DONE: 'done' };

const ImportProductsModal = ({ isOpen, onClose, existingCategories, onSuccess }) => {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [isDragging, setIsDragging] = useState(false);
  const [rows, setRows] = useState([]);        // parsed + validated rows
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);  // { imported, skipped }
  const [parseError, setParseError] = useState(null);
  const fileRef = useRef(null);

  if (!isOpen) return null;

  // ── parse xlsx ────────────────────────────────────────────────────────
  const handleFile = (file) => {
    setParseError(null);
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setParseError('El archivo debe ser .xlsx, .xls o .csv');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!raw.length) {
          setParseError('El archivo está vacío o no tiene datos en la primera hoja.');
          return;
        }

        const keys = Object.keys(raw[0]);

        // Map header variations to canonical fields
        const headerMap = {
          nombre:      findHeader(keys, ['nombre', 'name', 'producto']),
          categoria:   findHeader(keys, ['categoria', 'categoría', 'category']),
          costo:       findHeader(keys, ['costo', 'cost', 'precio_costo', 'precio costo']),
          mano_de_obra: findHeader(keys, ['mano_de_obra', 'mano de obra', 'labor', 'instalacion', 'instalación']),
          ganancia:    findHeader(keys, ['ganancia', 'profit', 'utilidad', 'markup']),
        };

        if (!headerMap.nombre || !headerMap.categoria) {
          setParseError('No se encontraron las columnas "nombre" y "categoria". Verificá que el archivo tenga los encabezados correctos.');
          return;
        }

        const parsed = raw.map((r, i) => {
          const row = parseRow(r, headerMap);
          const errors = validateRow(row);
          return { ...row, _index: i + 2, _errors: errors };
        }).filter(r => r.name || r.categoria); // skip fully empty rows

        setRows(parsed);
        setStep(STEPS.PREVIEW);
      } catch (err) {
        setParseError('No se pudo leer el archivo. Asegurate de que sea un Excel válido.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── import ────────────────────────────────────────────────────────────
  const handleImport = async () => {
    const validRows = rows.filter(r => r._errors.length === 0);
    if (!validRows.length) return;

    setImporting(true);
    try {
      // 1. Resolve categories (create new ones if needed)
      const catMap = {};
      existingCategories.forEach(c => { catMap[normalize(c.name)] = c.id; });

      const uniqueCats = [...new Set(validRows.map(r => r.categoria))];
      for (const catName of uniqueCats) {
        const key = normalize(catName);
        if (!catMap[key]) {
          const created = await categoriesService.create({ name: catName });
          if (created) catMap[key] = created.id;
        }
      }

      // 2. Build products array
      const toCreate = validRows.map(r => ({
        categoryId: catMap[normalize(r.categoria)],
        name: r.name,
        cost: r.cost,
        labor: r.labor,
        profit: r.profit,
        finalPrice: r.finalPrice,
      })).filter(p => p.categoryId);

      // 3. Bulk insert
      await productsService.bulkCreate(toCreate);

      setResult({ imported: toCreate.length, skipped: rows.length - validRows.length });
      setStep(STEPS.DONE);
      onSuccess();
    } catch (err) {
      console.error('Import error:', err);
      setParseError('Ocurrió un error al importar. Intentá de nuevo.');
    } finally {
      setImporting(false);
    }
  };

  // ── reset ─────────────────────────────────────────────────────────────
  const handleClose = () => {
    setStep(STEPS.UPLOAD);
    setRows([]);
    setResult(null);
    setParseError(null);
    onClose();
  };

  const validCount = rows.filter(r => r._errors.length === 0).length;
  const invalidCount = rows.length - validCount;

  // ── render ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!importing ? handleClose : undefined} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <Icon name="FileSpreadsheet" size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground">Importar desde Excel</h2>
              <p className="text-xs text-muted-foreground">
                {step === STEPS.UPLOAD && 'Subí un archivo .xlsx con tus productos'}
                {step === STEPS.PREVIEW && `${rows.length} filas detectadas · ${validCount} válidas${invalidCount > 0 ? ` · ${invalidCount} con errores` : ''}`}
                {step === STEPS.DONE && 'Importación completada'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" iconName="X" onClick={handleClose} disabled={importing} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP 1: UPLOAD ── */}
          {step === STEPS.UPLOAD && (
            <div className="p-6 space-y-4">
              {/* Template download */}
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <Icon name="Download" size={16} className="text-accent" />
                  <span className="text-sm text-foreground">¿Primera vez? Descargá la plantilla con el formato correcto</span>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="text-xs font-semibold text-accent hover:underline flex-shrink-0"
                >
                  Descargar plantilla
                </button>
              </div>

              {/* Columns reference */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { col: 'nombre', req: true, desc: 'Requerido' },
                  { col: 'categoria', req: true, desc: 'Requerido' },
                  { col: 'costo', req: false, desc: 'En USD' },
                  { col: 'mano_de_obra', req: false, desc: 'En USD' },
                  { col: 'ganancia', req: false, desc: 'En USD' },
                ].map(({ col, req, desc }) => (
                  <div key={col} className="bg-muted/30 rounded-lg p-2 text-center">
                    <p className="text-xs font-mono font-semibold text-foreground">{col}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                    {req && <span className="text-[10px] text-error font-medium">*</span>}
                  </div>
                ))}
              </div>

              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                  isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-muted/20'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="Upload" size={36} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Arrastrá el archivo acá o hacé clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground">.xlsx, .xls o .csv</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              {parseError && (
                <div className="p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
                  <Icon name="AlertCircle" size={15} className="text-error flex-shrink-0" />
                  <p className="text-sm text-error">{parseError}</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: PREVIEW ── */}
          {step === STEPS.PREVIEW && (
            <div className="p-6 space-y-4">
              {invalidCount > 0 && (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2">
                  <Icon name="AlertTriangle" size={15} className="text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-warning">
                    {invalidCount} {invalidCount === 1 ? 'fila tiene errores' : 'filas tienen errores'} y no se importarán. Solo se importarán las {validCount} filas válidas.
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-border overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">#</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Nombre</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Categoría</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Costo</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">M.O.</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Ganancia</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Precio final</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const hasError = row._errors.length > 0;
                      return (
                        <tr key={i} className={`border-b border-border last:border-0 ${hasError ? 'bg-error/5' : 'hover:bg-muted/10'}`}>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{row._index}</td>
                          <td className="px-3 py-2 font-medium text-foreground max-w-[140px] truncate">{row.name || <span className="text-error italic">vacío</span>}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.categoria || <span className="text-error italic">vacío</span>}</td>
                          <td className="px-3 py-2 text-right text-foreground">${row.cost.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right text-foreground">${row.labor.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right text-success">${row.profit.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-accent">${row.finalPrice.toFixed(2)}</td>
                          <td className="px-3 py-2 text-center">
                            {hasError ? (
                              <span title={row._errors.join(', ')}>
                                <Icon name="AlertCircle" size={14} className="text-error" />
                              </span>
                            ) : (
                              <Icon name="CheckCircle" size={14} className="text-success" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {parseError && (
                <div className="p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
                  <Icon name="AlertCircle" size={15} className="text-error flex-shrink-0" />
                  <p className="text-sm text-error">{parseError}</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: DONE ── */}
          {step === STEPS.DONE && result && (
            <div className="p-10 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <Icon name="CheckCircle" size={32} className="text-success" />
              </div>
              <div>
                <p className="text-xl font-heading font-semibold text-foreground mb-1">
                  ¡Importación exitosa!
                </p>
                <p className="text-sm text-muted-foreground">
                  Se importaron <strong>{result.imported}</strong> productos correctamente.
                  {result.skipped > 0 && ` ${result.skipped} filas con errores fueron omitidas.`}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => { setStep(STEPS.UPLOAD); setRows([]); setParseError(null); }}
            className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${step === STEPS.UPLOAD || step === STEPS.DONE ? 'invisible' : ''}`}
          >
            ← Subir otro archivo
          </button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={importing}>
              {step === STEPS.DONE ? 'Cerrar' : 'Cancelar'}
            </Button>

            {step === STEPS.PREVIEW && (
              <Button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                iconName={importing ? 'Loader2' : 'Upload'}
                className={importing ? '[&_svg]:animate-spin' : ''}
              >
                {importing ? 'Importando...' : `Importar ${validCount} producto${validCount !== 1 ? 's' : ''}`}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImportProductsModal;
