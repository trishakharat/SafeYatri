import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import AlertCard from './AlertCard';
import clsx from 'clsx';

interface AlertPanelProps {
  open: boolean;
  onClose: () => void;
}

const AlertPanel: React.FC<AlertPanelProps> = ({ open, onClose }) => {
  const { alerts, updateAlertStatus } = useSocket();
  const { user } = useAuth();

  const pendingAlerts = alerts.filter(alert => alert.status === 'pending');
  const reviewingAlerts = alerts.filter(alert => alert.status === 'reviewing');
  const dispatchedAlerts = alerts.filter(alert => alert.status === 'dispatched');

  const canDispatch = user?.role === 'dispatcher' || user?.role === 'admin';

  const handleAlertAction = (alertId: string, action: 'review' | 'dispatch' | 'false_positive') => {
    const statusMap = {
      review: 'reviewing' as const,
      dispatch: 'dispatched' as const,
      false_positive: 'false_positive' as const
    };

    updateAlertStatus(alertId, statusMap[action], user?.id);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-primary-600 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-medium text-white">
                          Alert Center
                        </Dialog.Title>
                        <button
                          type="button"
                          className="rounded-md text-primary-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                          onClick={onClose}
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-primary-200">
                          {pendingAlerts.length} pending alerts requiring attention
                        </p>
                      </div>
                    </div>

                    {/* Alert sections */}
                    <div className="flex-1 px-4 py-6 sm:px-6">
                      {/* Critical/Pending Alerts */}
                      {pendingAlerts.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center mb-3">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                            <h3 className="text-lg font-medium text-gray-900">
                              Pending Alerts ({pendingAlerts.length})
                            </h3>
                          </div>
                          <div className="space-y-3">
                            {pendingAlerts.map((alert) => (
                              <AlertCard
                                key={alert.id}
                                alert={alert}
                                onAction={canDispatch ? handleAlertAction : undefined}
                                showActions={canDispatch}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reviewing Alerts */}
                      {reviewingAlerts.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center mb-3">
                            <ShieldExclamationIcon className="h-5 w-5 text-yellow-500 mr-2" />
                            <h3 className="text-lg font-medium text-gray-900">
                              Under Review ({reviewingAlerts.length})
                            </h3>
                          </div>
                          <div className="space-y-3">
                            {reviewingAlerts.map((alert) => (
                              <AlertCard
                                key={alert.id}
                                alert={alert}
                                onAction={canDispatch ? handleAlertAction : undefined}
                                showActions={canDispatch}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dispatched Alerts */}
                      {dispatchedAlerts.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-3">
                            Dispatched ({dispatchedAlerts.length})
                          </h3>
                          <div className="space-y-3">
                            {dispatchedAlerts.slice(0, 5).map((alert) => (
                              <AlertCard
                                key={alert.id}
                                alert={alert}
                                showActions={false}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No alerts */}
                      {alerts.length === 0 && (
                        <div className="text-center py-12">
                          <ShieldExclamationIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            All systems are operating normally.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Last updated: {new Date().toLocaleTimeString()}</span>
                        <button
                          onClick={onClose}
                          className="text-primary-600 hover:text-primary-500 font-medium"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AlertPanel;
