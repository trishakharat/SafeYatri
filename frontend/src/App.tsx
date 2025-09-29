import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DispatcherDashboard from './pages/DispatcherDashboard';
import PoliceDashboard from './pages/PoliceDashboard';
import TourismDashboard from './pages/TourismDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuditorDashboard from './pages/AuditorDashboard';
import LoadingSpinner from './components/common/LoadingSpinner';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/dashboard" 
            element={
              user.role === 'dispatcher' ? <DispatcherDashboard /> :
              user.role === 'police' ? <PoliceDashboard /> :
              user.role === 'tourism_officer' ? <TourismDashboard /> :
              user.role === 'admin' ? <AdminDashboard /> :
              user.role === 'auditor' ? <AuditorDashboard /> :
              <Navigate to="/login" replace />
            } 
          />
          <Route path="/dispatcher" element={<DispatcherDashboard />} />
          <Route path="/police" element={<PoliceDashboard />} />
          <Route path="/tourism" element={<TourismDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/auditor" element={<AuditorDashboard />} />
        </Route>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
