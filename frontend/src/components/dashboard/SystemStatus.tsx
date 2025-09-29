import React from 'react';
import {
  VideoCameraIcon,
  UserGroupIcon,
  ServerIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface SystemStatus {
  cameras_online: number;
  cameras_total: number;
  tourists_active: number;
  alerts_pending: number;
  system_health: 'healthy' | 'warning' | 'critical';
}

interface SystemStatusProps {
  status: SystemStatus;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ status }) => {
  const cameraUptime = status.cameras_total > 0 ? (status.cameras_online / status.cameras_total) * 100 : 0;
  
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ServerIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Mock system metrics (in real implementation, these would come from monitoring systems)
  const systemMetrics = {
    cpu_usage: 45,
    memory_usage: 62,
    disk_usage: 78,
    network_latency: 12,
    uptime: '99.8%',
    last_backup: '2 hours ago'
  };

  const services = [
    { name: 'AI Detection Service', status: 'healthy', uptime: '99.9%' },
    { name: 'Database', status: 'healthy', uptime: '100%' },
    { name: 'Message Queue', status: 'warning', uptime: '98.5%' },
    { name: 'Blockchain Service', status: 'healthy', uptime: '99.7%' },
    { name: 'Notification Service', status: 'healthy', uptime: '99.8%' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">System Status</h3>
        <div className="flex items-center space-x-2">
          {getHealthIcon(status.system_health)}
          <span className={clsx(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
            getHealthColor(status.system_health)
          )}>
            {status.system_health}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
          <VideoCameraIcon className="h-8 w-8 text-blue-600" />
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {status.cameras_online}/{status.cameras_total}
            </div>
            <div className="text-sm text-gray-600">Cameras Online</div>
            <div className="text-xs text-blue-600">{cameraUptime.toFixed(1)}% uptime</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
          <UserGroupIcon className="h-8 w-8 text-green-600" />
          <div>
            <div className="text-lg font-semibold text-gray-900">{status.tourists_active}</div>
            <div className="text-sm text-gray-600">Active Tourists</div>
            <div className="text-xs text-green-600">Real-time tracking</div>
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">System Resources</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">CPU Usage</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className={clsx(
                    'h-2 rounded-full transition-all duration-300',
                    systemMetrics.cpu_usage > 80 ? 'bg-red-500' :
                    systemMetrics.cpu_usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  )}
                  style={{ width: `${systemMetrics.cpu_usage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-10">
                {systemMetrics.cpu_usage}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Memory Usage</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className={clsx(
                    'h-2 rounded-full transition-all duration-300',
                    systemMetrics.memory_usage > 80 ? 'bg-red-500' :
                    systemMetrics.memory_usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  )}
                  style={{ width: `${systemMetrics.memory_usage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-10">
                {systemMetrics.memory_usage}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Disk Usage</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className={clsx(
                    'h-2 rounded-full transition-all duration-300',
                    systemMetrics.disk_usage > 80 ? 'bg-red-500' :
                    systemMetrics.disk_usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  )}
                  style={{ width: `${systemMetrics.disk_usage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-10">
                {systemMetrics.disk_usage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Network & Performance */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Network & Performance</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <WifiIcon className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">{systemMetrics.network_latency}ms</div>
              <div className="text-xs text-gray-500">Network Latency</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-green-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">{systemMetrics.uptime}</div>
              <div className="text-xs text-gray-500">System Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Services</h4>
        <div className="space-y-2">
          {services.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <div className={clsx(
                  'w-2 h-2 rounded-full',
                  service.status === 'healthy' ? 'bg-green-500' :
                  service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                )} />
                <span className="text-sm text-gray-900">{service.name}</span>
              </div>
              <div className="text-xs text-gray-500">{service.uptime}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last backup: {systemMetrics.last_backup}</span>
          <span>Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
