import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AlertPanel from '../alerts/AlertPanel';
import { useSocket } from '../../contexts/SocketContext';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const { alerts } = useSocket();

  const pendingAlerts = alerts.filter(alert => alert.status === 'pending').length;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header 
          setSidebarOpen={setSidebarOpen}
          alertCount={pendingAlerts}
          onAlertsClick={() => setAlertPanelOpen(true)}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Alert Panel */}
      <AlertPanel 
        open={alertPanelOpen}
        onClose={() => setAlertPanelOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;
