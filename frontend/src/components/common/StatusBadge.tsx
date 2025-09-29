import React from 'react';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'active' | 'inactive' | 'emergency' | 'pending' | 'resolved';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md', 
  showText = true,
  className 
}) => {
  const statusConfig = {
    online: { color: 'bg-green-500', text: 'Online', textColor: 'text-green-700' },
    offline: { color: 'bg-red-500', text: 'Offline', textColor: 'text-red-700' },
    warning: { color: 'bg-yellow-500', text: 'Warning', textColor: 'text-yellow-700' },
    active: { color: 'bg-green-500', text: 'Active', textColor: 'text-green-700' },
    inactive: { color: 'bg-gray-500', text: 'Inactive', textColor: 'text-gray-700' },
    emergency: { color: 'bg-red-500 animate-pulse', text: 'Emergency', textColor: 'text-red-700' },
    pending: { color: 'bg-yellow-500', text: 'Pending', textColor: 'text-yellow-700' },
    resolved: { color: 'bg-green-500', text: 'Resolved', textColor: 'text-green-700' }
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const config = statusConfig[status];

  if (showText) {
    return (
      <span className={clsx('inline-flex items-center gap-2', className)}>
        <span 
          className={clsx(
            'rounded-full',
            sizeClasses[size],
            config.color
          )}
        />
        <span className={clsx('text-sm font-medium', config.textColor)}>
          {config.text}
        </span>
      </span>
    );
  }

  return (
    <span 
      className={clsx(
        'rounded-full',
        sizeClasses[size],
        config.color,
        className
      )}
      title={config.text}
    />
  );
};

export default StatusBadge;
