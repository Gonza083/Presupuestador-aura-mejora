# Presupuestador Aura (versión mejorada)

Aplicación web para gestionar **productos**, **categorías** y **proyectos** de presupuestación técnica, con autenticación, persistencia y tiempo real sobre **Supabase**.

---

## ¿Qué resuelve este proyecto?

Permite a un equipo comercial/técnico:

- Mantener un catálogo de productos por categoría.
- Crear y editar proyectos.
- Construir presupuestos por proyecto con cálculo de subtotales, descuentos y total.
- Exportar presupuestos a **PDF** y **Excel**.
- Recuperar elementos eliminados desde una papelera (soft delete).

---

## Stack tecnológico

- **Frontend:** React 18 + Vite
- **Routing:** React Router v6
- **Backend as a Service:** Supabase (Auth + Postgres + Realtime)
- **Estilos:** TailwindCSS + tokens de diseño (variables CSS)
- **Exportación:** jsPDF / jspdf-autotable / xlsx
- **UI Icons:** lucide-react

---

## Requisitos

- Node.js 18+
- npm 9+

---

## Puesta en marcha

1. Instalar dependencias:

```bash
npm install
Crear archivo de entorno .env (si no existe) con:

VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
Levantar entorno de desarrollo:

npm start
La app corre por defecto en http://localhost:4028.

Scripts disponibles
npm start → inicia Vite en modo desarrollo.

npm run build → build de producción con sourcemaps en carpeta build/.

npm run serve → previsualiza el build local.

Estructura del proyecto
.
├── src
│   ├── components/              # Componentes UI reutilizables y wrappers
│   ├── contexts/                # Contextos (Auth)
│   ├── lib/                     # Inicialización de clientes (Supabase)
│   ├── pages/                   # Pantallas por dominio
│   │   ├── auth/
│   │   ├── landing-dashboard/
│   │   ├── product-management/
│   │   ├── projects-main/
│   │   ├── project-detail-editor/
│   │   ├── budget-builder/
│   │   └── trash-management/
│   ├── services/                # Capa de acceso a datos (Supabase)
│   ├── styles/                  # Tailwind + estilos base
│   ├── App.jsx
│   ├── Routes.jsx
│   └── index.jsx
├── public/
├── tailwind.config.js
├── vite.config.mjs
└── package.json
Flujo funcional principal
Usuario inicia sesión (/signin).

Accede al dashboard principal (/landing-dashboard).

Gestiona catálogo (/product-management) o proyectos (/projects-main).

Crea/edita proyecto (/project-detail-editor/:projectId).

Construye presupuesto (/budget-builder/:projectId).

Exporta presupuesto en PDF/Excel.

Si elimina productos/categorías, puede restaurarlos en /trash-management.

Rutas de la aplicación
Públicas
/signin

/signup

Protegidas
/

/landing-dashboard

/profile

/product-management

/trash-management

/projects-main

/project-detail-editor/new

/project-detail-editor/:projectId

/budget-builder/:projectId

Modelo de datos (alto nivel)
El frontend espera tablas en Supabase similares a:

user_profiles

categories

products

projects

line_items

budget_categories

milestones

milestone_tasks

Además, varias entidades usan soft-delete mediante campos como deleted_at y deleted_by.

Recomendación: aplicar políticas RLS en todas las tablas por user_id/relación de pertenencia.

Realtime
La app está preparada para suscripciones realtime de Supabase en:

proyectos

productos

categorías

categorías de presupuesto

milestones y tareas

line items

Esto permite reflejar cambios sin recargar manualmente.

Estilo y sistema visual
Tema basado en variables CSS (--color-*, --radius-*, --shadow-*).

Tailwind extendido con paleta semántica (accent, muted, error, etc.).

Tipografías: Outfit, Source Sans 3, Inter y JetBrains Mono.

Estado actual y notas para contributors
La lógica de datos principal está centralizada en src/services/supabaseService.js.

Hay oportunidades de mejora en:

modularización por dominio,

reducción del bundle inicial,

cobertura de tests automatizados,

robustez de manejo de errores y estados de carga.

Build de producción
npm run build
npm run serve
Licencia
Proyecto privado (ajustar según política de tu equipo/empresa).


Fuente: leído de `README.md` actual del repo. ​:codex-file-citation[codex-file-citation]{line_range_start=1 line_range_end=196 path=README.md git_url="https://github.com/Gonza083/Presupuestador-aura-mejora/blob/main/README.md#L1-L196"}​  
Comando usado: `nl -ba README.md | sed -n '1,260p'`.