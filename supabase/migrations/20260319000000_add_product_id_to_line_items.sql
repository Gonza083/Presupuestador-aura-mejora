-- Agregar referencia al producto original en line_items
-- Permite trazabilidad: saber qué producto originó cada ítem del presupuesto

ALTER TABLE public.line_items
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_line_items_product_id ON public.line_items(product_id);
