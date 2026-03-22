import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";
import NotFound from "pages/NotFound";
import Icon from "components/AppIcon";

const SignIn = lazy(() => import('./pages/auth/SignIn'));
const SignUp = lazy(() => import('./pages/auth/SignUp'));
const Profile = lazy(() => import('./pages/auth/Profile'));
const LandingDashboard = lazy(() => import('./pages/landing-dashboard'));
const ProductManagement = lazy(() => import('./pages/product-management'));
const TrashManagement = lazy(() => import('./pages/trash-management'));
const ProjectsMain = lazy(() => import('./pages/projects-main'));
const ProjectDetailEditor = lazy(() => import('./pages/project-detail-editor'));
const BudgetBuilder = lazy(() => import('./pages/budget-builder'));
const Cobranzas = lazy(() => import('./pages/cobranzas'));

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Icon name="Loader2" size={40} className="text-accent animate-spin" />
  </div>
);

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <RouterRoutes>
            {/* Public routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><LandingDashboard /></ProtectedRoute>} />
            <Route path="/landing-dashboard" element={<ProtectedRoute><LandingDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/product-management" element={<ProtectedRoute><ProductManagement /></ProtectedRoute>} />
            <Route path="/trash-management" element={<ProtectedRoute><TrashManagement /></ProtectedRoute>} />
            <Route path="/projects-main" element={<ProtectedRoute><ProjectsMain /></ProtectedRoute>} />
            <Route path="/project-detail-editor/new" element={<ProtectedRoute><ProjectDetailEditor /></ProtectedRoute>} />
            <Route path="/project-detail-editor/:projectId" element={<ProtectedRoute><ProjectDetailEditor /></ProtectedRoute>} />
            <Route path="/budget-builder/:projectId" element={<ProtectedRoute><BudgetBuilder /></ProtectedRoute>} />
            <Route path="/cobranzas" element={<ProtectedRoute><Cobranzas /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
