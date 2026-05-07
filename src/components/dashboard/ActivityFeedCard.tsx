import React from 'react';

export interface ActivityItem {
  id: string | number;
  title: string;
  description: string;
  time: string;
  icon?: React.ReactNode;
  iconVariant?: 'success' | 'warning' | 'info' | 'neutral';
}

export interface ActivityFeedCardProps {
  title: string;
  items: ActivityItem[];
  className?: string;
  onViewAll?: () => void;
}

export function ActivityFeedCard({ title, items, className = '', onViewAll }: ActivityFeedCardProps) {
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex justify-between items-center">
        <h3 className="text-md font-semibold text-text-primary m-0">{title}</h3>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
          >
            View All
          </button>
        )}
      </div>
      <div className="activity-feed">
        {items.length === 0 ? (
          <div className="p-4 text-center text-sm text-text-muted">No recent activity</div>
        ) : (
          items.map(item => (
            <div key={item.id} className="activity-item">
              {item.icon ? (
                <div className={`activity-icon icon-${item.iconVariant || 'neutral'}`}>
                  {item.icon}
                </div>
              ) : (
                <div className="activity-icon icon-neutral">
                  <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
                </div>
              )}
              <div className="activity-body">
                <div className="activity-title">{item.title}</div>
                <div className="activity-desc">{item.description}</div>
              </div>
              <div className="activity-time">{item.time}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
