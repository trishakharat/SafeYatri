import React from 'react';
import { format } from 'date-fns';
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface Alert {
  id: string;
  type: 'violence' | 'anomaly' | 'geofence' | 'panic' | 'missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  tourist_ids: string[];
  status: 'pending' | 'reviewing' | 'dispatched' | 'resolved' | 'false_positive';
  description: string;
}

interface AlertSummaryProps {
  alerts: Alert[];
}

const AlertSummary: React.FC<AlertSummaryProps> = ({ alerts }) => {
  const pendingAlerts = alerts.filter(alert => alert.status === 'pending');
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const recentAlerts = alerts
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const alertsByType = alerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const alertsBySeverity = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'violence':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'panic':
        return <ShieldExclamationIcon className="h-4 w-4 text-red-600" />;
      case 'geofence':
        return <MapPinIcon className="h-4 w-4 text-yellow-500" />;
      case 'missing':
        return <UserIcon className="h-4 w-4 text-orange-500" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Alert Summary</h3>
        <div className="flex items-center space-x-2">
          {criticalAlerts.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
              {criticalAlerts.length} Critical
            </span>
          )}
          <span className="text-sm text-gray-500">
            {pendingAlerts.length} pending
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{alerts.length}</div>
          <div className="text-sm text-gray-500">Total Alerts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{pendingAlerts.length}</div>
          <div className="text-sm text-gray-500">Pending Action</div>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">By Severity</h4>
        <div className="space-y-2">
          {['critical', 'high', 'medium', 'low'].map(severity => {
            const count = alertsBySeverity[severity] || 0;
            const percentage = alerts.length > 0 ? (count / alerts.length) * 100 : 0;
            
            return (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={clsx(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize',
                    getSeverityColor(severity)
                  )}>
                    {severity}
                  </span>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={clsx(
                        'h-2 rounded-full transition-all duration-300',
                        severity === 'critical' ? 'bg-red-500' :
                        severity === 'high' ? 'bg-orange-500' :
                        severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert Types */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">By Type</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(alertsByType).map(([type, count]) => (
            <div key={type} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              {getTypeIcon(type)}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 capitalize">{type}</div>
                <div className="text-xs text-gray-500">{count} alerts</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Alerts */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Alerts</h4>
        {recentAlerts.length > 0 ? (
          <div className="space-y-3">
            {recentAlerts.map(alert => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {getTypeIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate capitalize">
                      {alert.type} Alert
                    </p>
                    <span className={clsx(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      getSeverityColor(alert.severity)
                    )}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate mt-1">
                    {alert.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-3 w-3" />
                      <span>{format(new Date(alert.timestamp), 'HH:mm')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <UserIcon className="h-3 w-3" />
                      <span>{alert.tourist_ids.length} tourist(s)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <ShieldExclamationIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No recent alerts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertSummary;
