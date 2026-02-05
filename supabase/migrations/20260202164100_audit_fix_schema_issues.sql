-- =====================================================
-- Database Schema Audit Fix Migration
-- =====================================================
-- This migration addresses critical issues found during audit:
-- 1. Missing soft delete columns on projects table
-- 2. Incomplete RLS policies for categories and products
-- 3. Missing CASCADE behavior for category deletion -> products
-- 4. Missing unique constraints
-- 5. Incomplete RLS policies for project-related tables
-- 6. Missing DELETE policies for active items

-- =====================================================
-- 1. ADD MISSING SOFT DELETE COLUMNS TO PROJECTS
-- =====================================================

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects(deleted_at);

-- =====================================================
-- 2. ADD UNIQUE CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- Ensure product codes are unique per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code_user_unique 
ON public.products(user_id, code) 
WHERE deleted_at IS NULL;

-- Ensure category names are unique per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_user_unique 
ON public.categories(user_id, name) 
WHERE deleted_at IS NULL;

-- =====================================================
-- 3. FIX CATEGORIES RLS POLICIES (COMPLETE SET)
-- =====================================================

-- Drop all existing category policies
DROP POLICY IF EXISTS "users_manage_own_categories" ON public.categories;
DROP POLICY IF EXISTS "users_view_deleted_categories" ON public.categories;
DROP POLICY IF EXISTS "users_update_active_categories" ON public.categories;
DROP POLICY IF EXISTS "users_restore_categories" ON public.categories;
DROP POLICY IF EXISTS "users_restore_deleted_categories" ON public.categories;
DROP POLICY IF EXISTS "users_permanent_delete_categories" ON public.categories;

-- SELECT: View active categories
CREATE POLICY "categories_select_active"
ON public.categories
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- SELECT: View deleted categories (for trash)
CREATE POLICY "categories_select_deleted"
ON public.categories
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- INSERT: Create new categories
CREATE POLICY "categories_insert"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Update active categories (including soft delete)
CREATE POLICY "categories_update_active"
ON public.categories
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (user_id = auth.uid());

-- UPDATE: Restore deleted categories
CREATE POLICY "categories_update_restore"
ON public.categories
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL)
WITH CHECK (user_id = auth.uid() AND deleted_at IS NULL);

-- DELETE: Permanent delete only for soft-deleted items
CREATE POLICY "categories_delete_permanent"
ON public.categories
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- =====================================================
-- 4. FIX PRODUCTS RLS POLICIES (COMPLETE SET)
-- =====================================================

-- Drop all existing product policies
DROP POLICY IF EXISTS "users_manage_own_products" ON public.products;
DROP POLICY IF EXISTS "users_view_deleted_products" ON public.products;
DROP POLICY IF EXISTS "users_update_active_products" ON public.products;
DROP POLICY IF EXISTS "users_restore_products" ON public.products;
DROP POLICY IF EXISTS "users_restore_deleted_products" ON public.products;
DROP POLICY IF EXISTS "users_permanent_delete_products" ON public.products;

-- SELECT: View active products
CREATE POLICY "products_select_active"
ON public.products
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- SELECT: View deleted products (for trash)
CREATE POLICY "products_select_deleted"
ON public.products
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- INSERT: Create new products
CREATE POLICY "products_insert"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Update active products (including soft delete)
CREATE POLICY "products_update_active"
ON public.products
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (user_id = auth.uid());

-- UPDATE: Restore deleted products
CREATE POLICY "products_update_restore"
ON public.products
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL)
WITH CHECK (user_id = auth.uid() AND deleted_at IS NULL);

-- DELETE: Permanent delete only for soft-deleted items
CREATE POLICY "products_delete_permanent"
ON public.products
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- =====================================================
-- 5. FIX PROJECTS RLS POLICIES (ADD SOFT DELETE SUPPORT)
-- =====================================================

-- Drop existing project policy
DROP POLICY IF EXISTS "users_manage_own_projects" ON public.projects;

-- SELECT: View active projects
CREATE POLICY "projects_select_active"
ON public.projects
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- SELECT: View deleted projects (for trash if needed)
CREATE POLICY "projects_select_deleted"
ON public.projects
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- INSERT: Create new projects
CREATE POLICY "projects_insert"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Update active projects (including soft delete)
CREATE POLICY "projects_update_active"
ON public.projects
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (user_id = auth.uid());

-- UPDATE: Restore deleted projects
CREATE POLICY "projects_update_restore"
ON public.projects
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL)
WITH CHECK (user_id = auth.uid() AND deleted_at IS NULL);

-- DELETE: Permanent delete only for soft-deleted items
CREATE POLICY "projects_delete_permanent"
ON public.projects
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- =====================================================
-- 6. FIX LINE_ITEMS RLS POLICIES (SPLIT BY OPERATION)
-- =====================================================

DROP POLICY IF EXISTS "users_manage_project_line_items" ON public.line_items;

-- SELECT: View line items for owned projects
CREATE POLICY "line_items_select"
ON public.line_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = line_items.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- INSERT: Create line items for owned projects
CREATE POLICY "line_items_insert"
ON public.line_items
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = line_items.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- UPDATE: Update line items for owned projects
CREATE POLICY "line_items_update"
ON public.line_items
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = line_items.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = line_items.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- DELETE: Delete line items for owned projects
CREATE POLICY "line_items_delete"
ON public.line_items
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = line_items.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- =====================================================
-- 7. FIX BUDGET_CATEGORIES RLS POLICIES (SPLIT BY OPERATION)
-- =====================================================

DROP POLICY IF EXISTS "users_manage_project_budget_categories" ON public.budget_categories;

-- SELECT: View budget categories for owned projects
CREATE POLICY "budget_categories_select"
ON public.budget_categories
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = budget_categories.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- INSERT: Create budget categories for owned projects
CREATE POLICY "budget_categories_insert"
ON public.budget_categories
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = budget_categories.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- UPDATE: Update budget categories for owned projects
CREATE POLICY "budget_categories_update"
ON public.budget_categories
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = budget_categories.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = budget_categories.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- DELETE: Delete budget categories for owned projects
CREATE POLICY "budget_categories_delete"
ON public.budget_categories
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = budget_categories.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- =====================================================
-- 8. FIX MILESTONES RLS POLICIES (SPLIT BY OPERATION)
-- =====================================================

DROP POLICY IF EXISTS "users_manage_project_milestones" ON public.milestones;

-- SELECT: View milestones for owned projects
CREATE POLICY "milestones_select"
ON public.milestones
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = milestones.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- INSERT: Create milestones for owned projects
CREATE POLICY "milestones_insert"
ON public.milestones
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = milestones.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- UPDATE: Update milestones for owned projects
CREATE POLICY "milestones_update"
ON public.milestones
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = milestones.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = milestones.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- DELETE: Delete milestones for owned projects
CREATE POLICY "milestones_delete"
ON public.milestones
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = milestones.project_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- =====================================================
-- 9. FIX MILESTONE_TASKS RLS POLICIES (SPLIT BY OPERATION)
-- =====================================================

DROP POLICY IF EXISTS "users_manage_milestone_tasks" ON public.milestone_tasks;

-- SELECT: View milestone tasks for owned projects
CREATE POLICY "milestone_tasks_select"
ON public.milestone_tasks
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.milestones
        JOIN public.projects ON projects.id = milestones.project_id
        WHERE milestones.id = milestone_tasks.milestone_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- INSERT: Create milestone tasks for owned projects
CREATE POLICY "milestone_tasks_insert"
ON public.milestone_tasks
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.milestones
        JOIN public.projects ON projects.id = milestones.project_id
        WHERE milestones.id = milestone_tasks.milestone_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- UPDATE: Update milestone tasks for owned projects
CREATE POLICY "milestone_tasks_update"
ON public.milestone_tasks
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.milestones
        JOIN public.projects ON projects.id = milestones.project_id
        WHERE milestones.id = milestone_tasks.milestone_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.milestones
        JOIN public.projects ON projects.id = milestones.project_id
        WHERE milestones.id = milestone_tasks.milestone_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- DELETE: Delete milestone tasks for owned projects
CREATE POLICY "milestone_tasks_delete"
ON public.milestone_tasks
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.milestones
        JOIN public.projects ON projects.id = milestones.project_id
        WHERE milestones.id = milestone_tasks.milestone_id
        AND projects.user_id = auth.uid()
        AND projects.deleted_at IS NULL
    )
);

-- =====================================================
-- 10. CREATE FUNCTION FOR CASCADING SOFT DELETE
-- =====================================================

-- Function to soft delete products when category is soft deleted
CREATE OR REPLACE FUNCTION public.cascade_category_soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- When a category is soft deleted, soft delete all its products
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE public.products
        SET deleted_at = NEW.deleted_at,
            deleted_by = NEW.deleted_by
        WHERE category_id = NEW.id
        AND deleted_at IS NULL;
    END IF;
    
    -- When a category is restored, restore all its products
    IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
        UPDATE public.products
        SET deleted_at = NULL,
            deleted_by = NULL
        WHERE category_id = NEW.id
        AND deleted_at IS NOT NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for cascading soft delete
DROP TRIGGER IF EXISTS trigger_cascade_category_soft_delete ON public.categories;
CREATE TRIGGER trigger_cascade_category_soft_delete
    AFTER UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.cascade_category_soft_delete();

-- =====================================================
-- 11. ADD TRIGGER FOR PROJECTS UPDATED_AT
-- =====================================================

-- Ensure projects table has updated_at trigger
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();