import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import MetricsDisplay from './MetricsDisplay';
import QuickActionPanel from './QuickActionPanel';

const NavigationCard = ({ 
  title, 
  description, 
  iconName, 
  route, 
  metrics, 
  quickActions 
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(route);
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter' || e?.key === ' ') {
      e?.preventDefault();
      navigate(route);
    }
  };

  return (
    <div
      className="navigation-card cursor-pointer"
      onClick={handleCardClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`Navigate to ${title}`}
    >
      <div className="navigation-card-icon">
        <Icon name={iconName} size={32} />
      </div>

      <h2 className="text-2xl font-heading font-semibold text-foreground mb-2">
        {title}
      </h2>

      <p className="text-muted-foreground mb-6 max-measure">
        {description}
      </p>

      <MetricsDisplay metrics={metrics} />

      <QuickActionPanel actions={quickActions} />
    </div>
  );
};

export default NavigationCard;