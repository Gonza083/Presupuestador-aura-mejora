import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { milestonesService, subscribeToMilestones, unsubscribeChannel } from '../../../services/supabaseService';

const TimelineTab = ({ projectId }) => {
  const [milestones, setMilestones] = useState([]);
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMilestones();
  }, [projectId]);

  // Real-time subscription for milestone changes
  useEffect(() => {
    if (!projectId) return;

    const subscription = subscribeToMilestones(projectId, (payload) => {
      if (payload?.eventType === 'INSERT') {
        loadMilestones(); // Reload to get complete milestone with tasks
      } else if (payload?.eventType === 'UPDATE') {
        loadMilestones(); // Reload to get updated milestone with tasks
      } else if (payload?.eventType === 'DELETE') {
        setMilestones(prev => prev?.filter(m => m?.id !== payload?.old?.id));
      }
    });

    return () => {
      unsubscribeChannel(subscription);
    };
  }, [projectId]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await milestonesService?.getByProject(projectId);
      setMilestones(data?.map(m => ({
        id: m?.id,
        title: m?.title,
        description: m?.description,
        startDate: m?.start_date,
        endDate: m?.end_date,
        status: m?.status,
        progress: m?.progress || 0,
        tasks: m?.milestone_tasks?.map(t => ({
          id: t?.id,
          name: t?.name,
          completed: t?.completed
        })) || []
      })) || []);
    } catch (err) {
      console.error('Load milestones error:', err);
      setError('Error al cargar el cronograma');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completado',
          color: 'bg-success/10 text-success border-success/30',
          icon: 'CheckCircle2'
        };
      case 'in-progress':
        return {
          label: 'En Progreso',
          color: 'bg-warning/10 text-warning border-warning/30',
          icon: 'Clock'
        };
      case 'pending':
        return {
          label: 'Pendiente',
          color: 'bg-muted text-muted-foreground border-border',
          icon: 'Circle'
        };
      default:
        return {
          label: 'Desconocido',
          color: 'bg-muted text-muted-foreground border-border',
          icon: 'Circle'
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })?.format(date);
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Calendar" size={24} className="text-accent" />
          <h2 className="text-2xl font-heading font-semibold text-foreground">
            Cronograma del Proyecto
          </h2>
        </div>
        <Button variant="outline" size="sm" iconName="Download">
          Exportar Cronograma
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
          <Icon name="AlertCircle" size={16} className="text-error flex-shrink-0" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {milestones?.map((milestone, index) => {
          const statusConfig = getStatusConfig(milestone?.status);
          const duration = calculateDuration(milestone?.startDate, milestone?.endDate);
          const isExpanded = expandedMilestone === milestone?.id;

          return (
            <div key={milestone?.id} className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
              {/* Milestone Header */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Timeline Indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusConfig?.color}`}>
                      <Icon name={statusConfig?.icon} size={24} />
                    </div>
                    {index < milestones?.length - 1 && (
                      <div className="w-0.5 h-16 bg-border mt-2" />
                    )}
                  </div>

                  {/* Milestone Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-heading font-semibold text-foreground">
                          {milestone?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone?.description}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full border text-xs font-medium ${statusConfig?.color}`}>
                        {statusConfig?.label}
                      </span>
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Icon name="Calendar" size={16} />
                        <span>{formatDate(milestone?.startDate)} - {formatDate(milestone?.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Clock" size={16} />
                        <span>{duration} días</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Progreso</span>
                        <span className="text-sm font-semibold text-accent">{milestone?.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-500"
                          style={{ width: `${milestone?.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Tasks Toggle */}
                    {milestone?.tasks?.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                        onClick={() => setExpandedMilestone(isExpanded ? null : milestone?.id)}
                      >
                        {isExpanded ? 'Ocultar' : 'Ver'} Tareas ({milestone?.tasks?.length})
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tasks List (Collapsible) */}
              {isExpanded && milestone?.tasks?.length > 0 && (
                <div className="border-t border-border bg-muted/30 p-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Tareas del Hito</h4>
                  <div className="space-y-2">
                    {milestone?.tasks?.map((task) => (
                      <div
                        key={task?.id}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-border"
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          task?.completed ? 'bg-success text-white' : 'bg-muted border border-border'
                        }`}>
                          {task?.completed && <Icon name="Check" size={14} />}
                        </div>
                        <span className={`text-sm ${
                          task?.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                        }`}>
                          {task?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineTab;