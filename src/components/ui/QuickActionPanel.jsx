import React from 'react';
import Icon from '../AppIcon';

const QuickActionPanel = ({ actions }) => {
  if (!actions || actions?.length === 0) {
    return null;
  }

  const handleActionClick = (e, action) => {
    e?.stopPropagation();
    if (action?.onClick) {
      action?.onClick();
    }
  };

  const handleKeyPress = (e, action) => {
    if (e?.key === 'Enter' || e?.key === ' ') {
      e?.preventDefault();
      e?.stopPropagation();
      if (action?.onClick) {
        action?.onClick();
      }
    }
  };

  return (
    <div className="quick-action-panel">
      {actions?.map((action, index) => (
        <button
          key={index}
          className="quick-action-button focus-ring"
          onClick={(e) => handleActionClick(e, action)}
          onKeyPress={(e) => handleKeyPress(e, action)}
          aria-label={action?.label}
          title={`${action?.label} ${action?.shortcut ? `(${action?.shortcut})` : ''}`}
        >
          <Icon name={action?.iconName} size={20} />
        </button>
      ))}
    </div>
  );
};

export default QuickActionPanel;