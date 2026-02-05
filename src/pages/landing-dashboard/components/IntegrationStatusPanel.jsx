import React from 'react';
import Icon from '../../../components/AppIcon';

const IntegrationStatusPanel = ({ integrations }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-success';
      case 'syncing':
        return 'text-warning';
      case 'error':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return 'CheckCircle2';
      case 'syncing':
        return 'RefreshCw';
      case 'error':
        return 'AlertCircle';
      default:
        return 'Circle';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'syncing':
        return 'Sincronizando';
      case 'error':
        return 'Error';
      default:
        return 'Desconectado';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Plug" size={20} className="text-accent" />
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Estado de Integraciones
        </h3>
      </div>
      <div className="space-y-3">
        {integrations?.map((integration, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-smooth"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                <Icon name={integration?.icon} size={20} className="text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{integration?.name}</p>
                <p className="text-xs font-caption text-muted-foreground">
                  {integration?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Icon
                name={getStatusIcon(integration?.status)}
                size={16}
                className={`${getStatusColor(integration?.status)} ${
                  integration?.status === 'syncing' ? 'animate-spin' : ''
                }`}
              />
              <span className={`text-xs font-caption ${getStatusColor(integration?.status)}`}>
                {getStatusLabel(integration?.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationStatusPanel;