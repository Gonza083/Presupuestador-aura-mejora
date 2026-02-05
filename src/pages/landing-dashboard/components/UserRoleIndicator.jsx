import React from 'react';
import Icon from '../../../components/AppIcon';

const UserRoleIndicator = ({ userName, userRole, userAvatar }) => {
  const getRoleConfig = () => {
    switch (userRole) {
      case 'admin':
        return {
          color: 'text-accent',
          bgColor: 'bg-accent',
          icon: 'Shield',
          label: 'Administrador'
        };
      case 'project_manager':
        return {
          color: 'text-primary',
          bgColor: 'bg-primary',
          icon: 'Briefcase',
          label: 'Gestor de Proyectos'
        };
      case 'technician':
        return {
          color: 'text-secondary',
          bgColor: 'bg-secondary',
          icon: 'Wrench',
          label: 'Técnico'
        };
      default:
        return {
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          icon: 'User',
          label: 'Usuario'
        };
    }
  };

  const config = getRoleConfig();

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card border border-border">
      <div className={`w-8 h-8 rounded-full ${config?.bgColor} flex items-center justify-center`}>
        <Icon name={config?.icon} size={18} className="text-white" />
      </div>
      <div className="hidden sm:block">
        <p className="text-sm font-medium text-foreground">{userName}</p>
        <p className="text-xs font-caption text-muted-foreground">{config?.label}</p>
      </div>
    </div>
  );
};

export default UserRoleIndicator;