import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut } from 'lucide-react';

import NavigationCard from '../../components/ui/NavigationCard';
import UserRoleIndicator from './components/UserRoleIndicator';
import { dashboardService } from '../../services/supabaseService';

const fmtUSD = (n) =>
  new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const LandingDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardService.getStats().then(setStats);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/assets/Varios/aura-isotipo.jpg"
                alt="Aura Hogar"
                className="h-10 w-auto object-contain"
              />
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Principal</h1>
            </div>
            <div className="flex items-center gap-4">
<UserRoleIndicator
                userName={profile?.full_name}
                userRole={profile?.role}
              />
              <button
                onClick={() => navigate('/profile')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ver perfil"
              >
                <User className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={async () => {
                  await signOut();
                  navigate('/signin');
                }}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <NavigationCard
            title="Gestión de Categorías"
            description="Organiza y administra tus productos por categorías"
            iconName="FolderTree"
            route="/product-management"
            metrics={stats ? [
              { label: 'Categorías', value: stats.categories },
              { label: 'Productos', value: stats.products },
            ] : undefined}
          />

          <NavigationCard
            title="Proyectos"
            description="Crea y gestiona presupuestos para tus instalaciones"
            iconName="Briefcase"
            route="/projects-main"
            metrics={stats ? [
              { label: 'Total', value: stats.totalProjects },
              { label: 'Presupuestados', value: stats.projectCounts?.presupuestado || 0 },
              { label: 'Aprobados', value: stats.projectCounts?.aprobado || 0, status: stats.projectCounts?.aprobado > 0 ? 'success' : undefined },
            ] : undefined}
          />

          <NavigationCard
            title="Cobranzas"
            description="Seguimiento de pagos y comprobantes de todos los proyectos"
            iconName="Wallet"
            route="/cobranzas"
            metrics={stats ? [
              { label: 'Cobrado', value: fmtUSD(stats.totalCollected), status: 'success' },
              { label: 'Pendiente', value: fmtUSD(stats.totalPending), status: stats.totalPending > 0 ? 'warning' : undefined },
            ] : undefined}
          />
        </div>

      </main>
    </div>
  );
};

export default LandingDashboard;
