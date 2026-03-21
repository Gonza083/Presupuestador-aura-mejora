-- =====================================================
-- SCHEMA COMPLETO - Presupuestador Aura
-- Consolidado de todas las migraciones
-- Ejecutar de una vez en el SQL Editor de Supabase
-- =====================================================


-- =====================================================
-- 1. TIPOS ENUM
-- =====================================================

DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'user');

DROP TYPE IF EXISTS public.project_status CASCADE;
CREATE TYPE public.project_status AS ENUM ('active', 'completed', 'paused', 'archived');

DROP TYPE IF EXISTS public.milestone_status CASCADE;
CREATE TYPE public.milestone_status AS ENUM ('pending', 'in-progress', 'completed');


-- =====================================================
-- 2. TABLAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role public.user_role DEFAULT 'user'::public.user_role,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    image TEXT,
    alt TEXT,
    has_pdf BOOLEAN DEFAULT false,
    final_price DECIMAL(10, 2) DEFAULT 0,
    cost DECIMAL(10, 2) DEFAULT 0,
    labor DECIMAL(10, 2) DEFAULT 0,
    profit DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    client TEXT,
    project_type TEXT,
    status public.project_status DEFAULT 'active'::public.project_status,
    start_date DATE,
    end_date DATE,
    subtotal DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_cost DECIMAL(10, 2) DEFAULT 0,
    markup DECIMAL(5, 2) DEFAULT 0,
    labor NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    allocated DECIMAL(10, 2) DEFAULT 0,
    spent DECIMAL(10, 2) DEFAULT 0,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status public.milestone_status DEFAULT 'pending'::public.milestone_status,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.milestone_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- 3. ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON public.categories(deleted_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_user_unique ON public.categories(user_id, name) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code_user_unique ON public.products(user_id, code) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects(deleted_at);

CREATE INDEX IF NOT EXISTS idx_line_items_project_id ON public.line_items(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_project_id ON public.budget_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestone_tasks_milestone_id ON public.milestone_tasks(milestone_id);


-- =====================================================
-- 4. FUNCIONES
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'user'::public.user_role)
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cascade_category_soft_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE public.products
        SET deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
        WHERE category_id = NEW.id AND deleted_at IS NULL;
    END IF;
    IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
        UPDATE public.products
        SET deleted_at = NULL, deleted_by = NULL
        WHERE category_id = NEW.id AND deleted_at IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$;


-- =====================================================
-- 5. HABILITAR RLS
-- =====================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_tasks ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- 6. POLÍTICAS RLS
-- =====================================================

-- user_profiles
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles" ON public.user_profiles
FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_can_view_all_profiles" ON public.user_profiles;
CREATE POLICY "users_can_view_all_profiles" ON public.user_profiles
FOR SELECT TO authenticated USING (true);

-- categories
DROP POLICY IF EXISTS "categories_select_active" ON public.categories;
CREATE POLICY "categories_select_active" ON public.categories
FOR SELECT TO authenticated USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "categories_select_deleted" ON public.categories;
CREATE POLICY "categories_select_deleted" ON public.categories
FOR SELECT TO authenticated USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

DROP POLICY IF EXISTS "categories_insert" ON public.categories;
CREATE POLICY "categories_insert" ON public.categories
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "categories_update_active" ON public.categories;
CREATE POLICY "categories_update_active" ON public.categories
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "categories_update_restore" ON public.categories;
CREATE POLICY "categories_update_restore" ON public.categories
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL)
WITH CHECK (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "categories_delete_permanent" ON public.categories;
CREATE POLICY "categories_delete_permanent" ON public.categories
FOR DELETE TO authenticated USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- products
DROP POLICY IF EXISTS "products_select_active" ON public.products;
CREATE POLICY "products_select_active" ON public.products
FOR SELECT TO authenticated USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "products_select_deleted" ON public.products;
CREATE POLICY "products_select_deleted" ON public.products
FOR SELECT TO authenticated USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

DROP POLICY IF EXISTS "products_insert" ON public.products;
CREATE POLICY "products_insert" ON public.products
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "products_update_active" ON public.products;
CREATE POLICY "products_update_active" ON public.products
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "products_update_restore" ON public.products;
CREATE POLICY "products_update_restore" ON public.products
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL)
WITH CHECK (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "products_delete_permanent" ON public.products;
CREATE POLICY "products_delete_permanent" ON public.products
FOR DELETE TO authenticated USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- projects
DROP POLICY IF EXISTS "projects_select_active" ON public.projects;
CREATE POLICY "projects_select_active" ON public.projects
FOR SELECT TO authenticated USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "projects_select_deleted" ON public.projects;
CREATE POLICY "projects_select_deleted" ON public.projects
FOR SELECT TO authenticated USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "projects_update_active" ON public.projects;
CREATE POLICY "projects_update_active" ON public.projects
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "projects_update_restore" ON public.projects;
CREATE POLICY "projects_update_restore" ON public.projects
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NOT NULL)
WITH CHECK (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "projects_delete_permanent" ON public.projects;
CREATE POLICY "projects_delete_permanent" ON public.projects
FOR DELETE TO authenticated USING (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- line_items
DROP POLICY IF EXISTS "line_items_select" ON public.line_items;
CREATE POLICY "line_items_select" ON public.line_items
FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = line_items.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "line_items_insert" ON public.line_items;
CREATE POLICY "line_items_insert" ON public.line_items
FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = line_items.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "line_items_update" ON public.line_items;
CREATE POLICY "line_items_update" ON public.line_items
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = line_items.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = line_items.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL));

DROP POLICY IF EXISTS "line_items_delete" ON public.line_items;
CREATE POLICY "line_items_delete" ON public.line_items
FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = line_items.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
);

-- budget_categories
DROP POLICY IF EXISTS "budget_categories_select" ON public.budget_categories;
CREATE POLICY "budget_categories_select" ON public.budget_categories
FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = budget_categories.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "budget_categories_insert" ON public.budget_categories;
CREATE POLICY "budget_categories_insert" ON public.budget_categories
FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = budget_categories.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "budget_categories_update" ON public.budget_categories;
CREATE POLICY "budget_categories_update" ON public.budget_categories
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = budget_categories.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = budget_categories.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL));

DROP POLICY IF EXISTS "budget_categories_delete" ON public.budget_categories;
CREATE POLICY "budget_categories_delete" ON public.budget_categories
FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = budget_categories.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
);

-- milestones
DROP POLICY IF EXISTS "milestones_select" ON public.milestones;
CREATE POLICY "milestones_select" ON public.milestones
FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = milestones.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "milestones_insert" ON public.milestones;
CREATE POLICY "milestones_insert" ON public.milestones
FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = milestones.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "milestones_update" ON public.milestones;
CREATE POLICY "milestones_update" ON public.milestones
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = milestones.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = milestones.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL));

DROP POLICY IF EXISTS "milestones_delete" ON public.milestones;
CREATE POLICY "milestones_delete" ON public.milestones
FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = milestones.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
);

-- milestone_tasks
DROP POLICY IF EXISTS "milestone_tasks_select" ON public.milestone_tasks;
CREATE POLICY "milestone_tasks_select" ON public.milestone_tasks
FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.milestones JOIN public.projects ON projects.id = milestones.project_id WHERE milestones.id = milestone_tasks.milestone_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "milestone_tasks_insert" ON public.milestone_tasks;
CREATE POLICY "milestone_tasks_insert" ON public.milestone_tasks
FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.milestones JOIN public.projects ON projects.id = milestones.project_id WHERE milestones.id = milestone_tasks.milestone_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "milestone_tasks_update" ON public.milestone_tasks;
CREATE POLICY "milestone_tasks_update" ON public.milestone_tasks
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.milestones JOIN public.projects ON projects.id = milestones.project_id WHERE milestones.id = milestone_tasks.milestone_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL))
WITH CHECK (EXISTS (SELECT 1 FROM public.milestones JOIN public.projects ON projects.id = milestones.project_id WHERE milestones.id = milestone_tasks.milestone_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL));

DROP POLICY IF EXISTS "milestone_tasks_delete" ON public.milestone_tasks;
CREATE POLICY "milestone_tasks_delete" ON public.milestone_tasks
FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.milestones JOIN public.projects ON projects.id = milestones.project_id WHERE milestones.id = milestone_tasks.milestone_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
);


-- =====================================================
-- 7. TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_user_profile_updated ON public.user_profiles;
CREATE TRIGGER on_user_profile_updated
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_cascade_category_soft_delete ON public.categories;
CREATE TRIGGER trigger_cascade_category_soft_delete
    AFTER UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.cascade_category_soft_delete();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_line_items_updated_at ON public.line_items;
CREATE TRIGGER update_line_items_updated_at
    BEFORE UPDATE ON public.line_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_categories_updated_at ON public.budget_categories;
CREATE TRIGGER update_budget_categories_updated_at
    BEFORE UPDATE ON public.budget_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestones_updated_at ON public.milestones;
CREATE TRIGGER update_milestones_updated_at
    BEFORE UPDATE ON public.milestones
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestone_tasks_updated_at ON public.milestone_tasks;
CREATE TRIGGER update_milestone_tasks_updated_at
    BEFORE UPDATE ON public.milestone_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =====================================================
-- 8. USUARIOS DEMO
-- =====================================================

DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    manager_uuid UUID := gen_random_uuid();
    user_uuid UUID := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@projectmanager.com', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Carlos Martínez', 'role', 'admin', 'avatar_url', 'https://randomuser.me/api/portraits/men/45.jpg'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (manager_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'manager@projectmanager.com', crypt('manager123', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Ana García', 'role', 'manager', 'avatar_url', 'https://randomuser.me/api/portraits/women/32.jpg'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'user@projectmanager.com', crypt('user123', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Luis Rodríguez', 'role', 'user'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (email) DO NOTHING;

    RAISE NOTICE 'Usuarios demo creados:';
    RAISE NOTICE '  admin@projectmanager.com / admin123';
    RAISE NOTICE '  manager@projectmanager.com / manager123';
    RAISE NOTICE '  user@projectmanager.com / user123';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creando usuarios demo: %', SQLERRM;
END $$;
