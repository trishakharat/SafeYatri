import React, { useState } from 'react';
import {
  UserGroupIcon,
  VideoCameraIcon,
  Cog6ToothIcon,
  ServerIcon,
  KeyIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'police' | 'tourism_officer' | 'auditor';
  status: 'active' | 'inactive' | 'suspended';
  last_login: string;
  two_factor_enabled: boolean;
}

interface Camera {
  id: string;
  name: string;
  location: string;
  stream_url: string;
  status: 'online' | 'offline' | 'maintenance';
  ai_enabled: boolean;
  resolution: string;
  fps: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'cameras' | 'system' | 'security'>('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  // Mock data
  const users: User[] = [
    {
      id: 'user_001',
      username: 'admin',
      full_name: 'System Administrator',
      email: 'admin@safeyatri.gov.in',
      role: 'admin',
      status: 'active',
      last_login: new Date(Date.now() - 3600000).toISOString(),
      two_factor_enabled: true
    },
    {
      id: 'user_002',
      username: 'dispatcher',
      full_name: 'Control Room Operator',
      email: 'dispatcher@safeyatri.gov.in',
      role: 'dispatcher',
      status: 'active',
      last_login: new Date(Date.now() - 1800000).toISOString(),
      two_factor_enabled: true
    },
    {
      id: 'user_003',
      username: 'police_001',
      full_name: 'Inspector Raj Kumar',
      email: 'raj.kumar@delhipolice.gov.in',
      role: 'police',
      status: 'active',
      last_login: new Date(Date.now() - 7200000).toISOString(),
      two_factor_enabled: false
    }
  ];

  const cameras: Camera[] = [
    {
      id: 'cam_001',
      name: 'Red Fort Main Gate',
      location: 'Red Fort, Delhi',
      stream_url: 'rtsp://192.168.1.101:554/stream',
      status: 'online',
      ai_enabled: true,
      resolution: '1920x1080',
      fps: 30
    },
    {
      id: 'cam_002',
      name: 'Connaught Place Central',
      location: 'Connaught Place, Delhi',
      stream_url: 'rtsp://192.168.1.102:554/stream',
      status: 'online',
      ai_enabled: true,
      resolution: '1920x1080',
      fps: 25
    },
    {
      id: 'phone_cam',
      name: 'Mobile Phone Camera',
      location: 'Demo Location',
      stream_url: 'http://localhost:5000/api/camera/stream/phone',
      status: 'online',
      ai_enabled: true,
      resolution: '1280x720',
      fps: 30
    }
  ];

  const systemSettings = {
    data_retention_days: 30,
    alert_cooldown_seconds: 300,
    ai_confidence_threshold: 0.7,
    max_concurrent_streams: 16,
    backup_frequency_hours: 6,
    log_level: 'INFO'
  };

  const securitySettings = {
    session_timeout_minutes: 30,
    password_min_length: 8,
    require_2fa_for_roles: ['admin', 'dispatcher'],
    max_login_attempts: 5,
    lockout_duration_minutes: 15
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-purple-700 bg-purple-100';
      case 'dispatcher':
        return 'text-blue-700 bg-blue-100';
      case 'police':
        return 'text-green-700 bg-green-100';
      case 'tourism_officer':
        return 'text-orange-700 bg-orange-100';
      case 'auditor':
        return 'text-gray-700 bg-gray-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-100';
      case 'inactive':
        return 'text-gray-700 bg-gray-100';
      case 'suspended':
        return 'text-red-700 bg-red-100';
      case 'online':
        return 'text-green-700 bg-green-100';
      case 'offline':
        return 'text-red-700 bg-red-100';
      case 'maintenance':
        return 'text-yellow-700 bg-yellow-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'users', name: 'User Management', icon: UserGroupIcon },
    { id: 'cameras', name: 'Camera Management', icon: VideoCameraIcon },
    { id: 'system', name: 'System Settings', icon: Cog6ToothIcon },
    { id: 'security', name: 'Security Settings', icon: ShieldCheckIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage users, cameras, and system configuration
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'active').length}</div>
              <div className="text-xs text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{cameras.filter(c => c.status === 'online').length}</div>
              <div className="text-xs text-gray-600">Online Cameras</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* User Management */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">System Users</h3>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add User
                </button>
              </div>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        2FA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                            getRoleColor(user.role)
                          )}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                            getStatusColor(user.status)
                          )}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.two_factor_enabled ? (
                            <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.last_login).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900 mr-3">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Camera Management */}
          {activeTab === 'cameras' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">CCTV Cameras</h3>
                <button
                  onClick={() => setShowCameraModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Camera
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cameras.map((camera) => (
                  <div key={camera.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">{camera.name}</h4>
                      <span className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(camera.status)
                      )}>
                        {camera.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <VideoCameraIcon className="h-4 w-4" />
                        <span>{camera.location}</span>
                      </div>
                      <div>Resolution: {camera.resolution} @ {camera.fps}fps</div>
                      <div>AI Detection: {camera.ai_enabled ? 'Enabled' : 'Disabled'}</div>
                      <div className="text-xs text-gray-500 break-all">{camera.stream_url}</div>
                    </div>

                    <div className="mt-4 flex justify-end space-x-2">
                      <button className="text-primary-600 hover:text-primary-900 text-sm">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900 text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">System Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Retention (days)</label>
                    <input
                      type="number"
                      value={systemSettings.data_retention_days}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Alert Cooldown (seconds)</label>
                    <input
                      type="number"
                      value={systemSettings.alert_cooldown_seconds}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">AI Confidence Threshold</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={systemSettings.ai_confidence_threshold}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Concurrent Streams</label>
                    <input
                      type="number"
                      value={systemSettings.max_concurrent_streams}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Backup Frequency (hours)</label>
                    <input
                      type="number"
                      value={systemSettings.backup_frequency_hours}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Log Level</label>
                    <select
                      value={systemSettings.log_level}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="DEBUG">DEBUG</option>
                      <option value="INFO">INFO</option>
                      <option value="WARNING">WARNING</option>
                      <option value="ERROR">ERROR</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={securitySettings.session_timeout_minutes}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Password Length</label>
                    <input
                      type="number"
                      value={securitySettings.password_min_length}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Login Attempts</label>
                    <input
                      type="number"
                      value={securitySettings.max_login_attempts}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lockout Duration (minutes)</label>
                    <input
                      type="number"
                      value={securitySettings.lockout_duration_minutes}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Require 2FA for Roles</label>
                    <div className="mt-2 space-y-2">
                      {['admin', 'dispatcher', 'police', 'tourism_officer', 'auditor'].map((role) => (
                        <label key={role} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={securitySettings.require_2fa_for_roles.includes(role)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">
                            {role.replace('_', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                  Save Security Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
