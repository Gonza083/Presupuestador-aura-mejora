-- Add labor column to line_items table
ALTER TABLE line_items
ADD COLUMN labor NUMERIC DEFAULT 0;

COMMENT ON COLUMN line_items.labor IS 'Labor cost (Mano de Obra) for the item';
