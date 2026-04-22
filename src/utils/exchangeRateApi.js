/**
 * Fetch the current official USD→ARS exchange rate from Bluelytics.
 * Returns the sell value of the "oficial" rate.
 * @returns {Promise<number>}
 */
export async function fetchOfficialRate() {
  const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
  if (!res.ok) throw new Error('No se pudo obtener el tipo de cambio');
  const data = await res.json();
  const rate = data?.oficial?.value_sell;
  if (!rate) throw new Error('Datos de cambio no disponibles');
  return parseFloat(rate);
}
