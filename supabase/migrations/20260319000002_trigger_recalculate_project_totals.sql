-- Trigger para recalcular automáticamente los totales del proyecto
-- cuando se modifican sus line_items.
-- Fórmula: subtotal = SUM(unit_cost * (1 + markup/100) * quantity)
--          total    = subtotal - (subtotal * discount / 100)

CREATE OR REPLACE FUNCTION public.recalculate_project_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_project_id UUID;
    v_subtotal   DECIMAL(10, 2);
    v_discount   DECIMAL(10, 2);
    v_total      DECIMAL(10, 2);
BEGIN
    -- En DELETE usamos OLD, en INSERT/UPDATE usamos NEW
    IF TG_OP = 'DELETE' THEN
        v_project_id := OLD.project_id;
    ELSE
        v_project_id := NEW.project_id;
    END IF;

    -- Calcular subtotal desde los line_items actuales
    SELECT COALESCE(SUM(unit_cost * (1 + markup / 100.0) * quantity), 0)
    INTO v_subtotal
    FROM public.line_items
    WHERE project_id = v_project_id;

    -- Leer el descuento actual del proyecto
    SELECT COALESCE(discount, 0)
    INTO v_discount
    FROM public.projects
    WHERE id = v_project_id;

    -- Calcular total final
    v_total := v_subtotal - (v_subtotal * v_discount / 100.0);

    -- Actualizar el proyecto
    UPDATE public.projects
    SET subtotal = v_subtotal,
        total    = v_total
    WHERE id = v_project_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_recalculate_project_totals ON public.line_items;
CREATE TRIGGER trigger_recalculate_project_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.line_items
    FOR EACH ROW
    EXECUTE FUNCTION public.recalculate_project_totals();
