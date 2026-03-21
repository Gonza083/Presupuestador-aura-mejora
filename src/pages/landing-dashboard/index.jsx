import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut } from 'lucide-react';

import NavigationCard from '../../components/ui/NavigationCard';
import UserRoleIndicator from './components/UserRoleIndicator';

const LandingDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NavigationCard
            title="Gestión de Categorías"
            description="Organiza y administra tus productos por categorías"
            iconName="FolderTree"
            route="/product-management"
          />

          <NavigationCard
            title="Proyectos"
            description="Crea y gestiona presupuestos para tus instalaciones"
            iconName="Briefcase"
            route="/projects-main"
          />
        </div>

      </main>
    </div>
  );
};

export default LandingDashboard;
