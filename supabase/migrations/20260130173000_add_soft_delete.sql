-- =====================================================
-- Soft Delete Migration for Products and Categories
-- =====================================================

-- Add soft delete columns to categories table
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Add soft delete columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON public.categories(deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at);

-- Update RLS policies to exclude soft-deleted items from normal queries
-- Categories: Only show non-deleted items
DROP POLICY IF EXISTS "users_manage_own_categories" ON public.categories;
CREATE POLICY "users_manage_own_categories"
ON public.categories
FOR ALL
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (user_id = auth.uid());

-- Categories: Allow viewing deleted items (for trash management)
DROP POLICY IF EXISTS "users_view_deleted_categories" ON public.categories;
CREATE POLICY "users_view_deleted_categories"
ON public.categories
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- Products: Only show non-deleted items
DROP POLICY IF EXISTS "users_manage_own_products" ON public.products;
CREATE POLICY "users_manage_own_products"
ON public.products
FOR ALL
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (user_id = auth.uid());

-- Products: Allow viewing deleted items (for trash management)
DROP POLICY IF EXISTS "users_view_deleted_products" ON public.products;
CREATE POLICY "users_view_deleted_products"
ON public.products
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- Products: Allow updating deleted items (for restore)
DROP POLICY IF EXISTS "users_restore_deleted_products" ON public.products;
CREATE POLICY "users_restore_deleted_products"
ON public.products
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL)
WITH CHECK (user_id = auth.uid());

-- Categories: Allow updating deleted items (for restore)
DROP POLICY IF EXISTS "users_restore_deleted_categories" ON public.categories;
CREATE POLICY "users_restore_deleted_categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL)
WITH CHECK (user_id = auth.uid());

-- Products: Allow permanent deletion of soft-deleted items
DROP POLICY IF EXISTS "users_permanent_delete_products" ON public.products;
CREATE POLICY "users_permanent_delete_products"
ON public.products
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- Categories: Allow permanent deletion of soft-deleted items
DROP POLICY IF EXISTS "users_permanent_delete_categories" ON public.categories;
CREATE POLICY "users_permanent_delete_categories"
ON public.categories
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);