import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut } from 'lucide-react';

import NavigationCard from '../../components/ui/NavigationCard';



import SystemStatusIndicator from './components/SystemStatusIndicator';
import UserRoleIndicator from './components/UserRoleIndicator';
import GlobalSearchBar from './components/GlobalSearchBar';
import KeyboardShortcutsHelper from './components/KeyboardShortcutsHelper';



const LandingDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [currentUser] = useState({
    name: profile?.full_name || 'Carlos Martínez',
    role: profile?.role || 'admin',
    avatar: profile?.avatar_url || 'https://randomuser.me/api/portraits/men/45.jpg'
  });

  const [systemStatus] = useState({
    status: 'active',
    lastUpdated: '29/01/2026 19:42'
  });

  const categoriesMetrics = [
    { label: 'Total Categorías', value: '12', status: 'default' },
    { label: 'Productos Activos', value: '248', status: 'success' },
    { label: 'Actualizaciones Pendientes', value: '3', status: 'warning' }
  ];

  const projectsMetrics = [
    { label: 'Proyectos Activos', value: '8', status: 'success' },
    { label: 'En Progreso', value: '5', status: 'default' },
    { label: 'Pendientes de Revisión', value: '2', status: 'warning' }
  ];

  const categoriesQuickActions = [
    {
      label: 'Añadir Categoría',
      iconName: 'FolderPlus',
      shortcut: 'Ctrl+N',
      onClick: () => console.log('Añadir categoría')
    },
    {
      label: 'Importar Productos',
      iconName: 'Upload',
      shortcut: 'Ctrl+I',
      onClick: () => console.log('Importar productos')
    }
  ];

  const projectsQuickActions = [
    {
      label: 'Nuevo Proyecto',
      iconName: 'Plus',
      shortcut: 'Ctrl+P',
      onClick: () => navigate('/projects-main')
    },
    {
      label: 'Ver Informes',
      iconName: 'BarChart3',
      shortcut: 'Ctrl+R',
      onClick: () => console.log('Ver informes')
    }
  ];

  const integrations = [
    {
      name: 'Sistema Contable',
      description: 'Sincronización de facturas',
      icon: 'Calculator',
      status: 'connected'
    },
    {
      name: 'Catálogo Proveedores',
      description: 'Actualización de precios',
      icon: 'Package',
      status: 'syncing'
    },
    {
      name: 'CRM Clientes',
      description: 'Gestión de contactos',
      icon: 'Users',
      status: 'connected'
    }
  ];

  const recentActivities = [
    {
      type: 'project_created',
      description: 'Nuevo proyecto "Instalación Domótica Villa Moderna" creado',
      user: 'Carlos Martínez',
      timestamp: new Date(Date.now() - 15 * 60000)
    },
    {
      type: 'budget_generated',
      description: 'Presupuesto generado para "Sistema de Seguridad Oficina Central"',
      user: 'Ana García',
      timestamp: new Date(Date.now() - 45 * 60000)
    },
    {
      type: 'product_added',
      description: 'Producto "Panel de Control KNX" añadido a categoría Domótica',
      user: 'Luis Rodríguez',
      timestamp: new Date(Date.now() - 120 * 60000)
    },
    {
      type: 'project_updated',
      description: 'Proyecto "Red Empresarial Edificio Norte" actualizado',
      user: 'María López',
      timestamp: new Date(Date.now() - 180 * 60000)
    },
    {
      type: 'category_created',
      description: 'Nueva categoría "Sistemas de Audio" creada',
      user: 'Carlos Martínez',
      timestamp: new Date(Date.now() - 240 * 60000)
    }
  ];

  const navigationCards = [
    {
      title: 'Gestión de Productos',
      description: 'Administra tu catálogo de productos y categorías',
      icon: 'Package',
      route: '/product-management',
      color: 'bg-blue-500',
      stats: { label: 'Productos activos', value: '156' }
    },
    {
      title: 'Ver proyectos',
      description: 'Gestiona tus proyectos y presupuestos',
      icon: 'FolderOpen',
      route: '/projects-main',
      color: 'bg-green-500',
      stats: { label: 'Proyectos activos', value: '12' }
    },
    {
      title: 'Constructor de Presupuestos',
      description: 'Crea presupuestos profesionales en tiempo real',
      icon: 'Calculator',
      route: '/budget-builder',
      color: 'bg-orange-500',
      stats: { label: 'Herramienta profesional', value: 'Nuevo' }
    },
    {
      title: 'Papelera',
      description: 'Recupera o elimina permanentemente elementos',
      icon: 'Trash2',
      route: '/trash-management',
      color: 'bg-red-500',
      stats: { label: 'Elementos eliminados', value: '8' }
    }
  ];

  useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      if (e?.ctrlKey || e?.metaKey) {
        switch (e?.key?.toLowerCase()) {
          case 'n':
            e?.preventDefault();
            console.log('Añadir categoría shortcut');
            break;
          case 'i':
            e?.preventDefault();
            console.log('Importar productos shortcut');
            break;
          case 'p':
            e?.preventDefault();
            console.log('Nuevo proyecto shortcut');
            break;
          case 'r':
            e?.preventDefault();
            console.log('Ver informes shortcut');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Principal</h1>
              <SystemStatusIndicator status={systemStatus?.status} lastUpdated={systemStatus?.lastUpdated} />
            </div>
            <div className="flex items-center gap-4">
              <GlobalSearchBar />
              <UserRoleIndicator 
                userName={currentUser?.name} 
                userRole={currentUser?.role} 
                userAvatar={currentUser?.avatar}
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
            metrics={categoriesMetrics}
            quickActions={categoriesQuickActions}
          />

          <NavigationCard
            title="Proyectos"
            description="Crea y gestiona presupuestos para tus instalaciones"
            iconName="Briefcase"
            route="/projects-main"
            metrics={projectsMetrics}
            quickActions={projectsQuickActions}
          />
        </div>

        <KeyboardShortcutsHelper />
      </main>
    </div>
  );
};

export default LandingDashboard;