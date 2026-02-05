import React from 'react';

const MetricsDisplay = ({ metrics }) => {
  if (!metrics || metrics?.length === 0) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-error';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="metrics-display">
      {metrics?.map((metric, index) => (
        <div key={index} className="metric-item">
          <span className="metric-label">{metric?.label}</span>
          <span className={`metric-value ${getStatusColor(metric?.status)}`}>
            {metric?.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MetricsDisplay;