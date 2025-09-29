import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  ClipboardDocumentListIcon,
  MapPinIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import clsx from 'clsx';

interface Assignment {
  id: string;
  alert_id: string;
  type: 'violence' | 'anomaly' | 'geofence' | 'panic' | 'missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  description: string;
  assigned_time: string;
  status: 'assigned' | 'en_route' | 'on_scene' | 'resolved';
  priority: number;
  tourist_ids: string[];
  dispatcher_notes?: string;
}

const PoliceDashboard: React.FC = () => {
  const { user } = useAuth();
  const { alerts } = useSocket();
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [fieldReport, setFieldReport] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');

  // Mock assignments for the current officer
  const assignments: Assignment[] = [
    {
      id: 'assign_001',
      alert_id: 'alert_001',
      type: 'violence',
      severity: 'high',
      location: { lat: 28.6562, lng: 77.2410, address: 'Red Fort Main Gate' },
      description: 'Suspected altercation detected near tourist area',
      assigned_time: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      status: 'en_route',
      priority: 1,
      tourist_ids: ['tourist_001', 'tourist_002'],
      dispatcher_notes: 'Multiple tourists in vicinity. Handle with care.'
    },
    {
      id: 'assign_002',
      alert_id: 'alert_002',
      type: 'panic',
      severity: 'critical',
      location: { lat: 28.6289, lng: 77.2217, address: 'Connaught Place Block A' },
      description: 'Tourist panic button activated',
      assigned_time: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
      status: 'assigned',
      priority: 1,
      tourist_ids: ['tourist_003'],
      dispatcher_notes: 'Tourist reported feeling unsafe. Immediate response required.'
    },
    {
      id: 'assign_003',
      alert_id: 'alert_003',
      type: 'geofence',
      severity: 'medium',
      location: { lat: 28.6129, lng: 77.2295, address: 'India Gate Restricted Area' },
      description: 'Tourist entered restricted zone',
      assigned_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      status: 'resolved',
      priority: 2,
      tourist_ids: ['tourist_004'],
      dispatcher_notes: 'Tourist guided back to safe area. No further action needed.'
    }
  ];

  const selectedAssignmentData = assignments.find(a => a.id === selectedAssignment);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'text-yellow-700 bg-yellow-100';
      case 'en_route':
        return 'text-blue-700 bg-blue-100';
      case 'on_scene':
        return 'text-orange-700 bg-orange-100';
      case 'resolved':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const updateAssignmentStatus = (newStatus: Assignment['status']) => {
    if (!selectedAssignmentData) return;
    // In real implementation, this would call the API
    console.log('Updating assignment status:', selectedAssignmentData.id, 'to', newStatus);
    alert(`Status updated to: ${newStatus}`);
  };

  const submitFieldReport = () => {
    if (!selectedAssignmentData || !fieldReport.trim()) return;
    // In real implementation, this would call the API
    console.log('Submitting field report for:', selectedAssignmentData.id, fieldReport);
    alert('Field report submitted successfully!');
    setFieldReport('');
  };

  const activeAssignments = assignments.filter(a => a.status !== 'resolved');
  const resolvedAssignments = assignments.filter(a => a.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Police Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Officer: {user?.full_name || user?.username} • Badge: {user?.id?.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activeAssignments.length}</div>
              <div className="text-xs text-gray-600">Active Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{resolvedAssignments.length}</div>
              <div className="text-xs text-gray-600">Resolved Today</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">My Assignments</h3>
            </div>
            
            {/* Active Assignments */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Active ({activeAssignments.length})</h4>
              <div className="space-y-3">
                {activeAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={clsx(
                      'p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                      selectedAssignment === assignment.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200',
                      assignment.severity === 'critical' ? 'border-l-4 border-l-red-500' : ''
                    )}
                    onClick={() => setSelectedAssignment(assignment.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {assignment.type}
                        </span>
                      </div>
                      <span className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(assignment.status)
                      )}>
                        {assignment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">{assignment.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="h-3 w-3" />
                        <span>{assignment.location.address}</span>
                      </div>
                      <span>{format(new Date(assignment.assigned_time), 'HH:mm')}</span>
                    </div>
                    
                    {assignment.severity === 'critical' && (
                      <div className="mt-2 text-xs text-red-600 font-medium animate-pulse">
                        HIGH PRIORITY
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resolved Assignments */}
            {resolvedAssignments.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Resolved Today ({resolvedAssignments.length})
                </h4>
                <div className="space-y-2">
                  {resolvedAssignments.slice(0, 3).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-2 bg-green-50 border border-green-200 rounded text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-800 capitalize">
                          {assignment.type}
                        </span>
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-green-700 mt-1">{assignment.location.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Details */}
        <div className="lg:col-span-2">
          {selectedAssignmentData ? (
            <div className="space-y-6">
              {/* Assignment Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Assignment Details - {selectedAssignmentData.id.slice(-6).toUpperCase()}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={clsx(
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
                      getSeverityColor(selectedAssignmentData.severity)
                    )}>
                      {selectedAssignmentData.severity.toUpperCase()}
                    </span>
                    <span className={clsx(
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                      getStatusColor(selectedAssignmentData.status)
                    )}>
                      {selectedAssignmentData.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Incident Information</h4>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-gray-500">Type:</dt>
                        <dd className="text-gray-900 capitalize">{selectedAssignmentData.type}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Priority:</dt>
                        <dd className="text-gray-900">P{selectedAssignmentData.priority}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Assigned:</dt>
                        <dd className="text-gray-900">
                          {format(new Date(selectedAssignmentData.assigned_time), 'PPpp')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Location:</dt>
                        <dd className="text-gray-900">{selectedAssignmentData.location.address}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Coordinates:</dt>
                        <dd className="text-gray-900">
                          {selectedAssignmentData.location.lat.toFixed(4)}, {selectedAssignmentData.location.lng.toFixed(4)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Dispatcher Notes</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-800">
                        {selectedAssignmentData.dispatcher_notes || 'No special instructions'}
                      </p>
                    </div>

                    <h4 className="text-sm font-medium text-gray-900 mt-4 mb-3">Affected Tourists</h4>
                    <div className="space-y-2">
                      {selectedAssignmentData.tourist_ids.map((touristId) => (
                        <div key={touristId} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                          <UserIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-800">Tourist {touristId.slice(-6)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Description:</strong> {selectedAssignmentData.description}
                  </p>
                </div>
              </div>

              {/* Status Update */}
              {selectedAssignmentData.status !== 'resolved' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Update Status</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <button
                      onClick={() => updateAssignmentStatus('en_route')}
                      disabled={selectedAssignmentData.status === 'en_route'}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                    >
                      En Route
                    </button>
                    <button
                      onClick={() => updateAssignmentStatus('on_scene')}
                      disabled={selectedAssignmentData.status === 'on_scene'}
                      className="inline-flex items-center px-3 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50"
                    >
                      On Scene
                    </button>
                    <button
                      onClick={() => updateAssignmentStatus('resolved')}
                      className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Resolved
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Status Update Notes
                    </label>
                    <textarea
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any relevant updates or observations..."
                    />
                  </div>
                </div>
              )}

              {/* Field Report */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Field Report</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Report Details
                    </label>
                    <textarea
                      value={fieldReport}
                      onChange={(e) => setFieldReport(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the situation, actions taken, and outcome..."
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={submitFieldReport}
                      disabled={!fieldReport.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Submit Report
                    </button>
                    
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      <CameraIcon className="h-4 w-4 mr-2" />
                      Add Photos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Assignment</h3>
              <p className="text-gray-600">Choose an assignment from your queue to view details and update status</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoliceDashboard;
