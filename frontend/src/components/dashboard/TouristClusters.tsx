import React, { useMemo } from 'react';
import {
  UserGroupIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  BatteryIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface TouristLocation {
  tourist_id: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  battery_level?: number;
  heart_rate?: number;
  status: 'active' | 'inactive' | 'emergency';
}

interface TouristClustersProps {
  locations: TouristLocation[];
}

interface Cluster {
  id: string;
  center: { lat: number; lng: number };
  tourists: TouristLocation[];
  radius: number;
  density: 'low' | 'medium' | 'high' | 'critical';
  risk_level: 'safe' | 'caution' | 'warning' | 'danger';
  area_name: string;
}

const TouristClusters: React.FC<TouristClustersProps> = ({ locations }) => {
  // Mock clustering algorithm - in real implementation, this would use proper clustering
  const clusters = useMemo(() => {
    const mockClusters: Cluster[] = [
      {
        id: 'cluster_1',
        center: { lat: 28.6562, lng: 77.2410 },
        tourists: locations.filter((_, i) => i % 3 === 0),
        radius: 500,
        density: 'high',
        risk_level: 'caution',
        area_name: 'Red Fort Area'
      },
      {
        id: 'cluster_2',
        center: { lat: 28.6289, lng: 77.2217 },
        tourists: locations.filter((_, i) => i % 3 === 1),
        radius: 300,
        density: 'medium',
        risk_level: 'safe',
        area_name: 'Connaught Place'
      },
      {
        id: 'cluster_3',
        center: { lat: 28.6129, lng: 77.2295 },
        tourists: locations.filter((_, i) => i % 3 === 2),
        radius: 800,
        density: 'critical',
        risk_level: 'warning',
        area_name: 'India Gate'
      }
    ];

    return mockClusters.filter(cluster => cluster.tourists.length > 0);
  }, [locations]);

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'danger':
        return 'text-red-700 bg-red-50';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50';
      case 'caution':
        return 'text-orange-700 bg-orange-50';
      case 'safe':
        return 'text-green-700 bg-green-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const totalTourists = locations.length;
  const activeTourists = locations.filter(t => t.status === 'active').length;
  const emergencyTourists = locations.filter(t => t.status === 'emergency').length;
  const lowBatteryTourists = locations.filter(t => t.battery_level && t.battery_level < 20).length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Tourist Clusters</h3>
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-gray-600">{totalTourists} tourists tracked</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-semibold text-blue-600">{activeTourists}</div>
          <div className="text-xs text-blue-700">Active</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-semibold text-red-600">{emergencyTourists}</div>
          <div className="text-xs text-red-700">Emergency</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-lg font-semibold text-yellow-600">{lowBatteryTourists}</div>
          <div className="text-xs text-yellow-700">Low Battery</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-semibold text-green-600">{clusters.length}</div>
          <div className="text-xs text-green-700">Clusters</div>
        </div>
      </div>

      {/* Cluster List */}
      <div className="space-y-4">
        {clusters.map((cluster) => {
          const emergencyCount = cluster.tourists.filter(t => t.status === 'emergency').length;
          const avgBattery = cluster.tourists
            .filter(t => t.battery_level)
            .reduce((sum, t) => sum + (t.battery_level || 0), 0) / 
            cluster.tourists.filter(t => t.battery_level).length || 0;
          const avgHeartRate = cluster.tourists
            .filter(t => t.heart_rate)
            .reduce((sum, t) => sum + (t.heart_rate || 0), 0) / 
            cluster.tourists.filter(t => t.heart_rate).length || 0;

          return (
            <div key={cluster.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="h-5 w-5 text-gray-500" />
                  <h4 className="font-medium text-gray-900">{cluster.area_name}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={clsx(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                    getDensityColor(cluster.density)
                  )}>
                    {cluster.density.toUpperCase()} DENSITY
                  </span>
                  <span className={clsx(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    getRiskColor(cluster.risk_level)
                  )}>
                    {cluster.risk_level.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {cluster.tourists.length}
                    </div>
                    <div className="text-xs text-gray-500">Tourists</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {cluster.radius}m
                    </div>
                    <div className="text-xs text-gray-500">Radius</div>
                  </div>
                </div>

                {avgBattery > 0 && (
                  <div className="flex items-center space-x-2">
                    <BatteryIcon className={clsx(
                      'h-4 w-4',
                      avgBattery > 50 ? 'text-green-500' :
                      avgBattery > 20 ? 'text-yellow-500' : 'text-red-500'
                    )} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round(avgBattery)}%
                      </div>
                      <div className="text-xs text-gray-500">Avg Battery</div>
                    </div>
                  </div>
                )}

                {avgHeartRate > 0 && (
                  <div className="flex items-center space-x-2">
                    <HeartIcon className={clsx(
                      'h-4 w-4',
                      avgHeartRate > 100 ? 'text-red-500' :
                      avgHeartRate > 80 ? 'text-yellow-500' : 'text-green-500'
                    )} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round(avgHeartRate)}
                      </div>
                      <div className="text-xs text-gray-500">Avg BPM</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Emergency Alerts */}
              {emergencyCount > 0 && (
                <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                  <ExclamationTriangleIcon className="h-4 w-4 animate-pulse" />
                  <span className="text-sm font-medium">
                    {emergencyCount} tourist{emergencyCount !== 1 ? 's' : ''} in emergency
                  </span>
                </div>
              )}

              {/* Tourist Status Breakdown */}
              <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{cluster.tourists.filter(t => t.status === 'active').length} Active</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span>{cluster.tourists.filter(t => t.status === 'inactive').length} Inactive</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>{emergencyCount} Emergency</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {clusters.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm">No tourist clusters detected</p>
          <p className="text-xs text-gray-400 mt-1">Clusters will appear when tourists are actively tracked</p>
        </div>
      )}
    </div>
  );
};

export default TouristClusters;
