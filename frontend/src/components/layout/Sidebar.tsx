import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  VideoCameraIcon,
  MapIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  XMarkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon }
    ];

    switch (user?.role) {
      case 'dispatcher':
        return [
          ...baseItems,
          { name: 'Live Monitoring', href: '/dispatcher', icon: VideoCameraIcon },
          { name: 'Tourist Map', href: '/map', icon: MapIcon },
          { name: 'Incidents', href: '/incidents', icon: ClipboardDocumentListIcon }
        ];
      case 'police':
        return [
          ...baseItems,
          { name: 'Assigned Cases', href: '/police', icon: ClipboardDocumentListIcon },
          { name: 'Tourist Map', href: '/map', icon: MapIcon },
          { name: 'Field Reports', href: '/reports', icon: DocumentTextIcon }
        ];
      case 'tourism_officer':
        return [
          ...baseItems,
          { name: 'Tourism Dashboard', href: '/tourism', icon: UserGroupIcon },
          { name: 'Tourist Clusters', href: '/clusters', icon: MapIcon },
          { name: 'Safety Analytics', href: '/analytics', icon: ClipboardDocumentListIcon }
        ];
      case 'admin':
        return [
          ...baseItems,
          { name: 'System Admin', href: '/admin', icon: Cog6ToothIcon },
          { name: 'User Management', href: '/users', icon: UserGroupIcon },
          { name: 'Camera Management', href: '/cameras', icon: VideoCameraIcon },
          { name: 'System Settings', href: '/settings', icon: Cog6ToothIcon }
        ];
      case 'auditor':
        return [
          ...baseItems,
          { name: 'Audit Dashboard', href: '/auditor', icon: DocumentTextIcon },
          { name: 'Audit Logs', href: '/audit-logs', icon: ClipboardDocumentListIcon },
          { name: 'Evidence Review', href: '/evidence', icon: VideoCameraIcon }
        ];
      default:
        return baseItems;
    }
  };

  const navigation = getNavigationItems();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-700">
        <ShieldCheckIcon className="h-8 w-8 text-white" />
        <span className="ml-2 text-white font-bold text-lg">SafeYatri</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  isActive
                    ? 'bg-primary-800 text-white'
                    : 'text-primary-100 hover:bg-primary-700 hover:text-white',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150'
                )}
                onClick={() => setOpen(false)}
              >
                <item.icon
                  className={clsx(
                    isActive ? 'text-white' : 'text-primary-300 group-hover:text-white',
                    'mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="flex-shrink-0 flex border-t border-primary-800 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-primary-300 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-primary-600">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-primary-600">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
