# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm start            # Dev server (Vite, port 5173)
npm run build        # Production build → /build directory
npm run serve        # Preview production build
```

No test runner is configured — testing libraries are installed but no tests exist yet.

## Environment

Create a `.env` file in the project root:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Architecture

**Presupuestador Aura** is a budget and project management app for technical/commercial teams. Built with React 18 + Vite, TailwindCSS, and Supabase (PostgreSQL + Auth + Realtime).

### Data Layer (`src/services/supabaseService.js`)

All database operations live in a single service file, organized into exported service objects:
- `categoriesService`, `productsService` — product catalog management
- `projectsService`, `lineItemsService`, `budgetCategoriesService` — budget management
- `milestonesService`, `milestoneTasksService` — project timeline
- `trashService` — soft-deleted item recovery

Every table uses soft deletes (`deleted_at`, `deleted_by` columns) and Row Level Security (RLS) filtered by `user_id`. Real-time subscriptions follow the pattern `subscribeToX(id, callback)` / `unsubscribeChannel(subscription)`.

### Authentication (`src/contexts/AuthContext.jsx`)

`AuthContext` wraps the app in `App.jsx` and exposes the current user and profile. Route protection is handled by `ProtectedRoute.jsx`.

### Routing (`src/Routes.jsx`)

Public routes: `/signin`, `/signup`
Protected routes: `/landing-dashboard`, `/profile`, `/product-management`, `/trash-management`, `/projects-main`, `/project-detail-editor/new`, `/project-detail-editor/:id`, `/budget-builder/:projectId`

### Pages (`src/pages/`)

Each domain has its own directory with a page component and a `components/` subfolder. Pages manage their own state, load data on mount via `useEffect`, and subscribe to Supabase Realtime for live updates (always clean up subscriptions on unmount).

The most complex page is `project-detail-editor/`, which has four tabs: ProjectInfoTab, TimelineTab, LineItemsTab, and BudgetTrackingTab.

### UI (`src/components/ui/`)

Base components (Button, Input, Select, Checkbox, etc.) use class variance authority (`cva`) for variants. Use the `cn()` utility from `src/utils/cn.js` (clsx + tailwind-merge) for conditional class names.

### Styling

TailwindCSS with a custom semantic color system using CSS variables (`--color-primary`, `--color-secondary`, `--color-accent`, `--color-muted`, `--color-success`, `--color-warning`, `--color-error`, etc.). Dark mode is class-based. Four font families: Outfit (headings), Source Sans 3 (body), Inter (captions), JetBrains Mono (code).

### Exports

PDF export uses jsPDF + jspdf-autotable. Excel export uses the `xlsx` library.
