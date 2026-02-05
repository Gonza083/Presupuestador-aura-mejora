import React from 'react';


const RecentActivityFeed = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'project_created':
        return 'Plus';
      case 'project_updated':
        return 'Edit';
      case 'budget_generated':
        return 'FileText';
      case 'product_added':
        return 'Package';
      case 'category_created':
        return 'FolderPlus';
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'project_created':
        return 'text-success';
      case 'project_updated':
        return 'text-primary';
      case 'budget_generated':
        return 'text-accent';
      case 'product_added':
        return 'text-secondary';
      case 'category_created':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  };

  return null;
};

export default RecentActivityFeed;