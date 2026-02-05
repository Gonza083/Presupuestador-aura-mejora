-- =====================================================
-- Fix Duplicate Policy Error
-- =====================================================
-- This migration fixes the duplicate policy error by ensuring
-- all policies are dropped before being recreated.

-- =====================================================
-- CATEGORIES POLICIES
-- =====================================================

-- Drop ALL existing policies for categories
DROP POLICY IF EXISTS "users_manage_own_categories" ON public.categories;
DROP POLICY IF EXISTS "users_view_deleted_categories" ON public.categories;
DROP POLICY IF EXISTS "users_restore_deleted_categories" ON public.categories;
DROP POLICY IF EXISTS "users_permanent_delete_categories" ON public.categories;
DROP POLICY IF EXISTS "users_select_active_categories" ON public.categories;
DROP POLICY IF EXISTS "users_select_deleted_categories" ON public.categories;
DROP POLICY IF EXISTS "users_insert_categories" ON public.categories;
DROP POLICY IF EXISTS "users_update_active_categories" ON public.categories;
DROP POLICY IF EXISTS "users_restore_categories" ON public.categories;

-- SELECT: View non-deleted categories
CREATE POLICY "users_select_active_categories"
ON public.categories
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- SELECT: View deleted categories (for trash management)
CREATE POLICY "users_select_deleted_categories"
ON public.categories
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- INSERT: Create new categories
CREATE POLICY "users_insert_categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Update active categories (including soft delete)
CREATE POLICY "users_update_active_categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (user_id = auth.uid());

-- UPDATE: Restore deleted categories
CREATE POLICY "users_restore_categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL)
WITH CHECK (user_id = auth.uid() AND deleted_at IS NULL);

-- DELETE: Permanently delete soft-deleted categories
CREATE POLICY "users_permanent_delete_categories"
ON public.categories
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- =====================================================
-- PRODUCTS POLICIES
-- =====================================================

-- Drop ALL existing policies for products
DROP POLICY IF EXISTS "users_manage_own_products" ON public.products;
DROP POLICY IF EXISTS "users_view_deleted_products" ON public.products;
DROP POLICY IF EXISTS "users_restore_deleted_products" ON public.products;
DROP POLICY IF EXISTS "users_permanent_delete_products" ON public.products;
DROP POLICY IF EXISTS "users_select_active_products" ON public.products;
DROP POLICY IF EXISTS "users_select_deleted_products" ON public.products;
DROP POLICY IF EXISTS "users_insert_products" ON public.products;
DROP POLICY IF EXISTS "users_update_active_products" ON public.products;
DROP POLICY IF EXISTS "users_restore_products" ON public.products;

-- SELECT: View non-deleted products
CREATE POLICY "users_select_active_products"
ON public.products
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- SELECT: View deleted products (for trash management)
CREATE POLICY "users_select_deleted_products"
ON public.products
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- INSERT: Create new products
CREATE POLICY "users_insert_products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Update active products (including soft delete)
CREATE POLICY "users_update_active_products"
ON public.products
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (user_id = auth.uid());

-- UPDATE: Restore deleted products
CREATE POLICY "users_restore_products"
ON public.products
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL)
WITH CHECK (user_id = auth.uid() AND deleted_at IS NULL);

-- DELETE: Permanently delete soft-deleted products
CREATE POLICY "users_permanent_delete_products"
ON public.products
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL);