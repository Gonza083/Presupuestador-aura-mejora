import React, { createContext, useContext, useState, useCallback } from 'react';
import { formatCurrency as fmt } from '../utils/currency';

const STORAGE_KEY_CURRENCY = 'aura_display_currency';
const STORAGE_KEY_RATE = 'aura_exchange_rate';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [displayCurrency, setDisplayCurrency] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_CURRENCY) || 'USD';
  });

  const [exchangeRate, setExchangeRateState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY_RATE);
    return stored ? parseFloat(stored) : 1200;
  });

  const setExchangeRate = useCallback((rate) => {
    const n = parseFloat(rate);
    if (!isNaN(n) && n > 0) {
      localStorage.setItem(STORAGE_KEY_RATE, String(n));
      setExchangeRateState(n);
    }
  }, []);

  const toggleCurrency = useCallback(() => {
    setDisplayCurrency(prev => {
      const next = prev === 'USD' ? 'ARS' : 'USD';
      localStorage.setItem(STORAGE_KEY_CURRENCY, next);
      return next;
    });
  }, []);

  /** Format a USD-stored amount using the current display currency & exchange rate */
  const formatAmount = useCallback(
    (amountUSD) => fmt(amountUSD, displayCurrency, exchangeRate),
    [displayCurrency, exchangeRate]
  );

  return (
    <CurrencyContext.Provider value={{ displayCurrency, exchangeRate, setExchangeRate, toggleCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
