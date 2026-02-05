import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const KeyboardShortcutsHelper = () => {
  const [showHelper, setShowHelper] = useState(false);

  const shortcuts = [
    { key: 'C', description: 'Ir a Gestión de Categorías', action: 'categories' },
    { key: 'P', description: 'Ir a Mis Proyectos', action: 'projects' },
    { key: '/', description: 'Enfocar búsqueda', action: 'search' },
    { key: '?', description: 'Mostrar atajos de teclado', action: 'help' }
  ];

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e?.key === '?' && !e?.ctrlKey && !e?.metaKey) {
        e?.preventDefault();
        setShowHelper(!showHelper);
      }

      if (e?.key === 'Escape') {
        setShowHelper(false);
      }

      if (!showHelper && !e?.ctrlKey && !e?.metaKey) {
        switch (e?.key?.toLowerCase()) {
          case 'c':
            if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
              e?.preventDefault();
              console.log('Navigate to categories');
            }
            break;
          case 'p':
            if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
              e?.preventDefault();
              console.log('Navigate to projects');
            }
            break;
          case '/':
            e?.preventDefault();
            const searchInput = document.querySelector('input[type="search"]');
            if (searchInput) searchInput?.focus();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showHelper]);

  if (!showHelper) {
    return (
      <button
        onClick={() => setShowHelper(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-xl transition-smooth flex items-center justify-center z-50"
        aria-label="Mostrar atajos de teclado"
      >
        <Icon name="Keyboard" size={24} />
      </button>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setShowHelper(false)}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-lg shadow-xl border border-border z-50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            Atajos de Teclado
          </h3>
          <button
            onClick={() => setShowHelper(false)}
            className="w-8 h-8 rounded-lg hover:bg-muted transition-smooth flex items-center justify-center"
            aria-label="Cerrar"
          >
            <Icon name="X" size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts?.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <span className="text-sm text-foreground">{shortcut?.description}</span>
              <kbd className="px-3 py-1 text-sm font-mono font-medium bg-background border border-border rounded-md text-foreground">
                {shortcut?.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Presiona <kbd className="px-2 py-0.5 text-xs font-mono bg-muted rounded">Esc</kbd> para cerrar
          </p>
        </div>
      </div>
    </>
  );
};

export default KeyboardShortcutsHelper;