import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import LiveMap from '../components/map/LiveMap';
import CCTVGrid from '../components/cctv/CCTVGrid';
import AlertSummary from '../components/dashboard/AlertSummary';
import SystemStatus from '../components/dashboard/SystemStatus';
import TouristClusters from '../components/dashboard/TouristClusters';
import IncidentWorkflow from '../components/workflow/IncidentWorkflow';
import {
  MapIcon,
  VideoCameraIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const DispatcherDashboard: React.FC = () => {
  const { alerts, touristLocations, systemStatus, connected } = useSocket();
  const [activeView, setActiveView] = useState<'overview' | 'map' | 'cctv' | 'workflow'>('overview');
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const pendingAlerts = alerts.filter(alert => alert.status === 'pending');
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');

  const viewTabs = [
    { id: 'overview', name: 'Overview', icon: ExclamationTriangleIcon },
    { id: 'map', name: 'Live Map', icon: MapIcon },
    { id: 'cctv', name: 'CCTV Feeds', icon: VideoCameraIcon },
    { id: 'workflow', name: 'Incidents', icon: ClipboardDocumentListIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dispatcher Control Room</h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time tourist safety monitoring and incident response
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
              connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{connected ? 'Live' : 'Disconnected'}</span>
            </div>
            {criticalAlerts.length > 0 && (
              <div className="bg-red-100 text-red-800 px-3 py-2 rounded-full text-sm font-medium animate-pulse">
                {criticalAlerts.length} Critical Alert{criticalAlerts.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Alerts</dt>
                  <dd className="text-lg font-medium text-gray-900">{pendingAlerts.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Tourists</dt>
                  <dd className="text-lg font-medium text-gray-900">{systemStatus.tourists_active}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <VideoCameraIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cameras Online</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {systemStatus.cameras_online}/{systemStatus.cameras_total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-6 h-6 rounded-full ${
                  systemStatus.system_health === 'healthy' ? 'bg-green-500' :
                  systemStatus.system_health === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">System Health</dt>
                  <dd className="text-lg font-medium text-gray-900 capitalize">
                    {systemStatus.system_health}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {viewTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`${
                  activeView === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview */}
          {activeView === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AlertSummary alerts={alerts} />
                <SystemStatus status={systemStatus} />
              </div>
              <TouristClusters locations={touristLocations} />
            </div>
          )}

          {/* Live Map */}
          {activeView === 'map' && (
            <div className="h-96">
              <LiveMap 
                touristLocations={touristLocations}
                alerts={alerts}
                onAlertSelect={setSelectedAlert}
              />
            </div>
          )}

          {/* CCTV Feeds */}
          {activeView === 'cctv' && (
            <CCTVGrid />
          )}

          {/* Incident Workflow */}
          {activeView === 'workflow' && (
            <IncidentWorkflow 
              alerts={alerts}
              selectedAlert={selectedAlert}
              onAlertSelect={setSelectedAlert}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
