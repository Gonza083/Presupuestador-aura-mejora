-- =====================================================
-- Fix Soft Delete WITH CHECK Clause
-- =====================================================
-- This migration fixes the WITH CHECK clause to allow
-- soft delete operations (setting deleted_at on active items)

-- =====================================================
-- CATEGORIES POLICIES
-- =====================================================

-- Drop existing update policies
DROP POLICY IF EXISTS "users_update_active_categories" ON public.categories;
DROP POLICY IF EXISTS "users_restore_categories" ON public.categories;

-- UPDATE: Update active categories (including soft delete)
-- Allow setting deleted_at on active items
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

-- =====================================================
-- PRODUCTS POLICIES
-- =====================================================

-- Drop existing update policies
DROP POLICY IF EXISTS "users_update_active_products" ON public.products;
DROP POLICY IF EXISTS "users_restore_products" ON public.products;

-- UPDATE: Update active products (including soft delete)
-- Allow setting deleted_at on active items
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