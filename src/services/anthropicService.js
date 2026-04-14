// Anthropic API calls will be implemented via Supabase Edge Functions in a future release.
// These stubs keep the UI intact without exposing API keys in the browser bundle.

export async function extractProductSpecs(_pdfUrl) {
  throw new Error('La extracción de specs con IA estará disponible próximamente.');
}

export async function generateBudgetSuggestions(_requirements, _products) {
  throw new Error('La generación de presupuestos con IA estará disponible próximamente.');
}
