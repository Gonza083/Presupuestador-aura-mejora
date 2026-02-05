import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';

const GlobalSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const mockSearchData = [
    { id: 1, type: 'project', name: 'Instalación Domótica Villa Moderna', category: 'Domótica' },
    { id: 2, type: 'project', name: 'Sistema de Seguridad Oficina Central', category: 'Seguridad' },
    { id: 3, type: 'product', name: 'Panel de Control KNX', category: 'Domótica' },
    { id: 4, type: 'product', name: 'Cámara IP 4K', category: 'Seguridad' },
    { id: 5, type: 'project', name: 'Red Empresarial Edificio Norte', category: 'Redes' },
    { id: 6, type: 'product', name: 'Switch Gigabit 24 Puertos', category: 'Redes' },
    { id: 7, type: 'product', name: 'Luminaria LED Inteligente', category: 'Iluminación' },
    { id: 8, type: 'project', name: 'Iluminación Arquitectónica Hotel', category: 'Iluminación' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef?.current && !searchRef?.current?.contains(event?.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const query = e?.target?.value;
    setSearchQuery(query);

    if (query?.trim()?.length > 0) {
      const filtered = mockSearchData?.filter(item =>
        item?.name?.toLowerCase()?.includes(query?.toLowerCase()) ||
        item?.category?.toLowerCase()?.includes(query?.toLowerCase())
      );
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (searchQuery?.trim()?.length > 0) {
      setShowResults(true);
    }
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const handleResultClick = (result) => {
    console.log('Navigate to:', result);
    setSearchQuery('');
    setShowResults(false);
  };

  const getTypeIcon = (type) => {
    return type === 'project' ? 'Briefcase' : 'Package';
  };

  const getTypeLabel = (type) => {
    return type === 'project' ? 'Proyecto' : 'Producto';
  };

  return (
    <div ref={searchRef} className="relative w-full md:w-96">
      <div className="relative">
        <Input
          type="search"
          placeholder="Buscar proyectos, productos..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          className="pr-10"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
          aria-label="Buscar"
        >
          <Icon name="Search" size={20} />
        </button>
      </div>
      {showResults && searchResults?.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {searchResults?.map((result) => (
            <button
              key={result?.id}
              onClick={() => handleResultClick(result)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-smooth text-left"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                <Icon name={getTypeIcon(result?.type)} size={20} className="text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{result?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-caption text-muted-foreground">
                    {getTypeLabel(result?.type)}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs font-caption text-muted-foreground">
                    {result?.category}
                  </span>
                </div>
              </div>
              <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
      {showResults && searchQuery?.trim()?.length > 0 && searchResults?.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Icon name="Search" size={20} />
            <p className="text-sm">No se encontraron resultados para "{searchQuery}"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;