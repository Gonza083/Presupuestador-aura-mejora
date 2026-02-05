import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";
import NotFound from "pages/NotFound";
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import Profile from './pages/auth/Profile';
import LandingDashboard from './pages/landing-dashboard';
import ProductManagement from './pages/product-management';
import TrashManagement from './pages/trash-management';
import ProjectsMain from './pages/projects-main';
import ProjectDetailEditor from './pages/project-detail-editor';
import BudgetBuilder from './pages/budget-builder';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
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
        
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
