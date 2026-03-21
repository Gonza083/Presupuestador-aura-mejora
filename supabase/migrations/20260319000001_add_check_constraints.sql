-- Constraints de validación para evitar datos inválidos en la base de datos

-- Precios no pueden ser negativos en productos
ALTER TABLE public.products
ADD CONSTRAINT IF NOT EXISTS chk_products_prices
CHECK (final_price >= 0 AND cost >= 0 AND labor >= 0 AND profit >= 0);

-- Cantidad mínima 1 y costos no negativos en line_items
ALTER TABLE public.line_items
ADD CONSTRAINT IF NOT EXISTS chk_line_items_quantity
CHECK (quantity >= 1);

ALTER TABLE public.line_items
ADD CONSTRAINT IF NOT EXISTS chk_line_items_unit_cost
CHECK (unit_cost >= 0 AND labor >= 0);

-- Progreso de hitos entre 0 y 100
ALTER TABLE public.milestones
ADD CONSTRAINT IF NOT EXISTS chk_milestones_progress
CHECK (progress >= 0 AND progress <= 100);

-- Totales de proyecto no negativos
ALTER TABLE public.projects
ADD CONSTRAINT IF NOT EXISTS chk_projects_totals
CHECK (subtotal >= 0 AND discount >= 0 AND discount <= 100 AND total >= 0);
