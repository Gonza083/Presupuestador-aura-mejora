/**
 * Format a USD amount for display.
 * @param {number} amountUSD - Value stored in the database (always USD)
 * @param {'USD'|'ARS'} currency - Target display currency
 * @param {number} exchangeRate - How many ARS per 1 USD
 * @returns {string}
 */
export function formatCurrency(amountUSD, currency = 'USD', exchangeRate = 1200) {
  const amount = currency === 'ARS' ? (amountUSD ?? 0) * exchangeRate : (amountUSD ?? 0);

  if (currency === 'ARS') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
