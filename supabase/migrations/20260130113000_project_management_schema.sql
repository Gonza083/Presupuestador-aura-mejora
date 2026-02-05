-- =====================================================
-- Project Management System Schema Migration
-- =====================================================

-- 1. TYPES (ENUMs)
-- =====================================================

DROP TYPE IF EXISTS public.project_status CASCADE;
CREATE TYPE public.project_status AS ENUM ('active', 'completed', 'paused', 'archived');

DROP TYPE IF EXISTS public.milestone_status CASCADE;
CREATE TYPE public.milestone_status AS ENUM ('pending', 'in-progress', 'completed');

-- 2. CORE TABLES
-- =====================================================

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
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
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Line Items Table (for project products)
CREATE TABLE IF NOT EXISTS public.line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_cost DECIMAL(10, 2) DEFAULT 0,
    markup DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Budget Categories Table
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

-- Milestones Table (Timeline)
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

-- Milestone Tasks Table
CREATE TABLE IF NOT EXISTS public.milestone_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_line_items_project_id ON public.line_items(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_project_id ON public.budget_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestone_tasks_milestone_id ON public.milestone_tasks(milestone_id);

-- 4. FUNCTIONS (BEFORE RLS POLICIES)
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 5. ENABLE RLS
-- =====================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_tasks ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES
-- =====================================================

-- Categories Policies
DROP POLICY IF EXISTS "users_manage_own_categories" ON public.categories;
CREATE POLICY "users_manage_own_categories"
ON public.categories
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Products Policies
DROP POLICY IF EXISTS "users_manage_own_products" ON public.products;
CREATE POLICY "users_manage_own_products"
ON public.products
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Projects Policies
DROP POLICY IF EXISTS "users_manage_own_projects" ON public.projects;
CREATE POLICY "users_manage_own_projects"
ON public.projects
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Line Items Policies (access through project ownership)
DROP POLICY IF EXISTS "users_manage_project_line_items" ON public.line_items;
CREATE POLICY "users_manage_project_line_items"
ON public.line_items
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = line_items.project_id
        AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = line_items.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Budget Categories Policies (access through project ownership)
DROP POLICY IF EXISTS "users_manage_project_budget_categories" ON public.budget_categories;
CREATE POLICY "users_manage_project_budget_categories"
ON public.budget_categories
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = budget_categories.project_id
        AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = budget_categories.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Milestones Policies (access through project ownership)
DROP POLICY IF EXISTS "users_manage_project_milestones" ON public.milestones;
CREATE POLICY "users_manage_project_milestones"
ON public.milestones
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = milestones.project_id
        AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = milestones.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Milestone Tasks Policies (access through milestone -> project ownership)
DROP POLICY IF EXISTS "users_manage_milestone_tasks" ON public.milestone_tasks;
CREATE POLICY "users_manage_milestone_tasks"
ON public.milestone_tasks
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.milestones
        JOIN public.projects ON projects.id = milestones.project_id
        WHERE milestones.id = milestone_tasks.milestone_id
        AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.milestones
        JOIN public.projects ON projects.id = milestones.project_id
        WHERE milestones.id = milestone_tasks.milestone_id
        AND projects.user_id = auth.uid()
    )
);

-- 7. TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_line_items_updated_at ON public.line_items;
CREATE TRIGGER update_line_items_updated_at
BEFORE UPDATE ON public.line_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_categories_updated_at ON public.budget_categories;
CREATE TRIGGER update_budget_categories_updated_at
BEFORE UPDATE ON public.budget_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestones_updated_at ON public.milestones;
CREATE TRIGGER update_milestones_updated_at
BEFORE UPDATE ON public.milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestone_tasks_updated_at ON public.milestone_tasks;
CREATE TRIGGER update_milestone_tasks_updated_at
BEFORE UPDATE ON public.milestone_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. MOCK DATA
-- =====================================================

DO $$
DECLARE
    existing_user_id UUID;
    cat_cameras_id UUID := gen_random_uuid();
    cat_networks_id UUID := gen_random_uuid();
    cat_alarms_id UUID := gen_random_uuid();
    proj_1_id UUID := gen_random_uuid();
    proj_2_id UUID := gen_random_uuid();
    milestone_1_id UUID := gen_random_uuid();
    milestone_2_id UUID := gen_random_uuid();
BEGIN
    -- Get existing user
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) THEN
        SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
        
        IF existing_user_id IS NOT NULL THEN
            -- Insert Categories
            INSERT INTO public.categories (id, user_id, name, icon) VALUES
                (cat_cameras_id, existing_user_id, 'Cámaras', 'Camera'),
                (cat_networks_id, existing_user_id, 'Redes', 'Network'),
                (cat_alarms_id, existing_user_id, 'Alarmas', 'Bell')
            ON CONFLICT (id) DO NOTHING;

            -- Insert Products
            INSERT INTO public.products (user_id, category_id, name, code, image, alt, has_pdf, final_price, cost, labor, profit) VALUES
                (existing_user_id, cat_cameras_id, 'Cámara IP Exterior 4MP', 'CAM-EXT-4MP-001', 'https://img.rocket.new/generatedImages/rocket_gen_img_1e3b7e4f7-1765090734789.png', 'Cámara de seguridad IP exterior de 4 megapíxeles montada en pared', true, 12500, 7800, 1200, 3500),
                (existing_user_id, cat_cameras_id, 'Cámara Domo Interior 2MP', 'CAM-DOM-2MP-002', 'https://img.rocket.new/generatedImages/rocket_gen_img_1cdcf3180-1769716465290.png', 'Cámara domo interior de 2 megapíxeles con visión nocturna', true, 8900, 5200, 900, 2800),
                (existing_user_id, cat_cameras_id, 'Cámara PTZ 5MP', 'CAM-PTZ-5MP-003', 'https://img.rocket.new/generatedImages/rocket_gen_img_1b84ed9d8-1765999910746.png', 'Cámara PTZ motorizada de 5 megapíxeles con zoom óptico', false, 28500, 18200, 2800, 7500),
                (existing_user_id, cat_networks_id, 'Switch PoE 24 Puertos', 'NET-SW-24P-001', 'https://img.rocket.new/generatedImages/rocket_gen_img_136247c32-1769716464294.png', 'Switch de red PoE de 24 puertos para instalaciones empresariales', true, 32500, 22000, 2500, 8000),
                (existing_user_id, cat_networks_id, 'Router Empresarial', 'NET-ROU-ENT-002', 'https://img.rocket.new/generatedImages/rocket_gen_img_11d14a09c-1769716464059.png', 'Router empresarial de alto rendimiento con firewall integrado', true, 18900, 12500, 1800, 4600),
                (existing_user_id, cat_alarms_id, 'Panel de Alarma Central', 'ALM-PAN-CEN-001', 'https://img.rocket.new/generatedImages/rocket_gen_img_11ee50fcc-1769716464643.png', 'Panel central de alarma con teclado táctil y conectividad GSM', true, 24500, 16000, 2200, 6300),
                (existing_user_id, cat_alarms_id, 'Sensor de Movimiento PIR', 'ALM-SEN-PIR-002', 'https://img.rocket.new/generatedImages/rocket_gen_img_131f2558d-1769716465404.png', 'Sensor de movimiento PIR inalámbrico con inmunidad a mascotas', true, 4200, 2500, 400, 1300)
            ON CONFLICT (id) DO NOTHING;

            -- Insert Projects
            INSERT INTO public.projects (id, user_id, name, description, client, project_type, status, start_date, end_date) VALUES
                (proj_1_id, existing_user_id, 'Instalación Domótica Residencial', 'Sistema completo de automatización para vivienda unifamiliar', 'Juan Pérez', 'Domótica', 'active'::public.project_status, '2025-10-01', '2025-12-15'),
                (proj_2_id, existing_user_id, 'Red Corporativa Oficinas', 'Infraestructura de red para edificio de 5 plantas', 'Empresa ABC', 'Redes', 'active'::public.project_status, '2025-09-15', '2025-11-30')
            ON CONFLICT (id) DO NOTHING;

            -- Insert Line Items for Project 1
            INSERT INTO public.line_items (project_id, category, name, quantity, unit_cost, markup) VALUES
                (proj_1_id, 'Cámaras', 'Cámara IP Exterior 4MP', 4, 150, 30),
                (proj_1_id, 'Cableado', 'Cable UTP Cat6 (metro)', 200, 0.5, 50),
                (proj_1_id, 'Mano de Obra', 'Instalación y Configuración', 16, 25, 0)
            ON CONFLICT (id) DO NOTHING;

            -- Insert Budget Categories for Project 1
            INSERT INTO public.budget_categories (project_id, name, allocated, spent, color) VALUES
                (proj_1_id, 'Materiales', 8000, 6200, 'bg-blue-500'),
                (proj_1_id, 'Mano de Obra', 4000, 2800, 'bg-green-500'),
                (proj_1_id, 'Equipos', 2000, 850, 'bg-purple-500'),
                (proj_1_id, 'Contingencia', 1000, 0, 'bg-orange-500')
            ON CONFLICT (id) DO NOTHING;

            -- Insert Milestones for Project 1
            INSERT INTO public.milestones (id, project_id, title, description, start_date, end_date, status, progress) VALUES
                (milestone_1_id, proj_1_id, 'Planificación y Diseño', 'Diseño del sistema y aprobación del cliente', '2025-10-01', '2025-10-15', 'completed'::public.milestone_status, 100),
                (milestone_2_id, proj_1_id, 'Adquisición de Materiales', 'Compra y recepción de equipos y materiales', '2025-10-16', '2025-10-30', 'in-progress'::public.milestone_status, 65)
            ON CONFLICT (id) DO NOTHING;

            -- Insert Milestone Tasks
            INSERT INTO public.milestone_tasks (milestone_id, name, completed) VALUES
                (milestone_1_id, 'Reunión inicial con cliente', true),
                (milestone_1_id, 'Diseño de planos', true),
                (milestone_1_id, 'Aprobación del presupuesto', true),
                (milestone_2_id, 'Orden de compra de cámaras', true),
                (milestone_2_id, 'Recepción de cableado', true),
                (milestone_2_id, 'Verificación de equipos', false)
            ON CONFLICT (id) DO NOTHING;

        ELSE
            RAISE NOTICE 'No existing users found. Run auth migration first.';
        END IF;
    ELSE
        RAISE NOTICE 'Table user_profiles does not exist. Run auth migration first.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;