import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import StatusBadge from '../common/StatusBadge';
import {
  Bars3Icon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  alertCount: number;
  onAlertsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen, alertCount, onAlertsClick }) => {
  const { user, logout } = useAuth();
  const { connected, systemStatus } = useSocket();

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <div className="flex-1 px-4 flex justify-between items-center">
        {/* Left side - System status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <WifiIcon className={clsx('h-5 w-5', connected ? 'text-green-500' : 'text-red-500')} />
            <StatusBadge 
              status={connected ? 'online' : 'offline'} 
              size="sm"
              showText={false}
            />
            <span className="text-sm text-gray-600">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-600">
            <span>Cameras: {systemStatus.cameras_online}/{systemStatus.cameras_total}</span>
            <span>Active Tourists: {systemStatus.tourists_active}</span>
            <StatusBadge 
              status={
                systemStatus.system_health === 'healthy' ? 'online' :
                systemStatus.system_health === 'warning' ? 'warning' : 'offline'
              }
              size="sm"
            />
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-4">
          {/* Alerts */}
          <button
            type="button"
            className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={onAlertsClick}
          >
            <BellIcon className="h-6 w-6" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {user?.full_name || user?.username}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
            
            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>

            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={logout}
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
