import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-accent opacity-20 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Página no encontrada</h2>
        <p className="text-muted-foreground mb-8">
          La página que buscás no existe. Volvé al inicio para continuar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            iconName="ArrowLeft"
            onClick={() => window.history?.back()}
          >
            Volver atrás
          </Button>
          <Button
            iconName="Home"
            onClick={() => navigate('/landing-dashboard')}
          >
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
