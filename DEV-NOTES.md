# DEV NOTES — Presupuestador Aura

## Stack
- React 18 + Vite + TailwindCSS
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- jsPDF + jspdf-autotable (exportar PDF)
- xlsx (exportar Excel)

---

## Supabase — Configuración aplicada

### Storage Buckets
| Bucket | Uso | Política |
|--------|-----|----------|
| `product-images` | Imágenes de productos | Public, INSERT authenticated |
| `product-pdfs` | Fichas técnicas PDF | Public, INSERT authenticated |

### Columnas agregadas manualmente
```sql
ALTER TABLE products ADD COLUMN technical_pdf TEXT;
```

---

## Lo que está implementado

### Gestión de Productos (`/product-management`)
- CRUD completo de categorías y productos
- Subida de imagen (drag & drop o selección)
- Subida de ficha técnica PDF → guardada en `product-pdfs`, URL en `products.technical_pdf`
- Badge PDF clickeable en tarjeta del producto (abre PDF en nueva pestaña)
- Modal de edición incluye ver/reemplazar/quitar PDF
- Soft delete + papelera (`/trash-management`)

### Presupuesto (`/budget-builder/:projectId`)
- Catálogo de productos a la izquierda (2 columnas, scroll)
- Click en imagen → lightbox ampliado
- Botón PDF en cada tarjeta del catálogo (rojo, abre ficha técnica)
- Panel derecho: lista de items del presupuesto
- Vista cliente / vista interna (toggle segmentado)
- Vista interna: costo material / mano de obra / ganancia por item
- Descuento en % (input compacto)
- Exportar PDF (logo Aura Hogar, colores dorados)
- Exportar Excel
- Botón "Vaciar presupuesto" con confirmación modal
- Persistencia en Supabase (tabla `line_items`)

### Proyectos (`/projects-main`, `/project-detail-editor`)
- CRUD de proyectos con estado, tipo, fechas, cliente
- 4 tabs: Info, Timeline, Items, Seguimiento
- Estados: presupuestado / en_proceso / finalizado / cancelado
- Tipos: Domótica / Seguridad / Redes / Iluminación / Audio-Video / Mixto

### Auth
- SignIn / SignUp con logo Aura
- Sesión persistente, ProtectedRoute, expiración detectada

---

## Moneda
Todo en **USD** — `Intl.NumberFormat('es-US', { currency: 'USD' })`

---

## Imágenes públicas
```
/public/assets/Varios/aura-logo.jpg      ← logo completo (login)
/public/assets/Varios/aura-isotipo.jpg   ← isotipo (dashboard)
/public/assets/Varios/aura-logo-alt.jpg  ← alternativa
```

---

## Ideas / Pendientes

### AI Assistant (futuro)
- Objetivo: Claude lee las fichas técnicas PDF de productos y genera automáticamente un presupuesto dado un requerimiento (ej: "necesito 8 cámaras, un switch y una UPS")
- Los PDFs ya se guardan en Supabase Storage con URL pública → listos para ser leídos por la API
- Usar Anthropic API con `claude-sonnet-4-6` o `claude-opus-4-6`
- Flujo pensado: usuario describe el proyecto → Claude analiza PDFs de productos relevantes → sugiere items y cantidades → se agregan al presupuesto

---

## Migración pendiente: Cuentas Corrientes y Pagos

Ejecutar en **Supabase → SQL Editor**:

```sql
-- Cuentas corrientes (una por proyecto aprobado)
create table payment_accounts (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) not null,
  user_id uuid references user_profiles(id) not null,
  total_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  status text not null default 'pendiente',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references user_profiles(id)
);

alter table payment_accounts enable row level security;

create policy "Users can manage their own payment accounts"
  on payment_accounts for all
  using (user_id = auth.uid());

-- Pagos individuales
create table payments (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references payment_accounts(id) not null,
  user_id uuid references user_profiles(id) not null,
  amount numeric not null,
  payment_date date not null,
  method text not null default 'transferencia',
  notes text,
  receipt_number text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references user_profiles(id)
);

alter table payments enable row level security;

create policy "Users can manage their own payments"
  on payments for all
  using (user_id = auth.uid());
```

---

### Otras ideas mencionadas
- Playwright para automatización / testing de la app
- Recomendación automática de switch/router/UPS según cantidad de cámaras

---

## Archivos clave

| Archivo | Descripción |
|---------|-------------|
| `src/services/supabaseService.js` | Toda la capa de datos |
| `src/utils/constants.js` | PROJECT_TYPE_OPTIONS, PROJECT_STATUS_OPTIONS |
| `src/contexts/AuthContext.jsx` | Auth global |
| `src/Routes.jsx` | Todas las rutas |
| `src/pages/budget-builder/` | Presupuestador completo |
| `src/pages/product-management/` | Catálogo de productos |
| `src/pages/project-detail-editor/` | Editor de proyecto (4 tabs) |
| `src/components/ui/` | Button, Input, Select, Checkbox (cva) |
| `src/utils/cn.js` | Utility clsx + tailwind-merge |
