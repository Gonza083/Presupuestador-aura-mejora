import React from 'react';
import Icon from '../../../components/AppIcon';

const SystemStatusIndicator = ({ status, lastUpdated }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          color: 'text-success',
          bgColor: 'bg-success/10',
          icon: 'CheckCircle2',
          label: 'Sistema Activo'
        };
      case 'syncing':
        return {
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          icon: 'RefreshCw',
          label: 'Sincronizando'
        };
      case 'error':
        return {
          color: 'text-error',
          bgColor: 'bg-error/10',
          icon: 'AlertCircle',
          label: 'Error de Sistema'
        };
      default:
        return {
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          icon: 'Circle',
          label: 'Estado Desconocido'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card border border-border">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${config?.bgColor}`}>
        <Icon 
          name={config?.icon} 
          size={16} 
          className={`${config?.color} ${status === 'syncing' ? 'animate-spin' : ''}`} 
        />
      </div>
      <div className="hidden sm:block">
        <p className={`text-sm font-medium ${config?.color}`}>{config?.label}</p>
        <p className="text-xs font-caption text-muted-foreground">
          Actualizado: {lastUpdated}
        </p>
      </div>
    </div>
  );
};

export default SystemStatusIndicator;