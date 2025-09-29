import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  UserIcon,
  MapPinIcon,
  VideoCameraIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  PaperAirplaneIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface Alert {
  id: string;
  type: 'violence' | 'anomaly' | 'geofence' | 'panic' | 'missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  camera_id?: string;
  tourist_ids: string[];
  evidence?: {
    video_url?: string;
    image_url?: string;
    metadata?: any;
  };
  status: 'pending' | 'reviewing' | 'dispatched' | 'resolved' | 'false_positive';
  assigned_to?: string;
  description: string;
}

interface IncidentWorkflowProps {
  alerts: Alert[];
  selectedAlert: string | null;
  onAlertSelect: (alertId: string) => void;
}

const IncidentWorkflow: React.FC<IncidentWorkflowProps> = ({
  alerts,
  selectedAlert,
  onAlertSelect
}) => {
  const [showEFIRModal, setShowEFIRModal] = useState(false);
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [selectedOfficers, setSelectedOfficers] = useState<string[]>([]);

  const selectedAlertData = alerts.find(alert => alert.id === selectedAlert);

  // Mock officer data
  const availableOfficers = [
    { id: 'off_001', name: 'Inspector Raj Kumar', badge: 'DL001', location: 'Red Fort Station', distance: '0.5 km' },
    { id: 'off_002', name: 'SI Priya Sharma', badge: 'DL002', location: 'CP Station', distance: '1.2 km' },
    { id: 'off_003', name: 'Constable Amit Singh', badge: 'DL003', location: 'Patrol Unit 1', distance: '0.8 km' },
    { id: 'off_004', name: 'Inspector Maya Patel', badge: 'DL004', location: 'India Gate Post', distance: '2.1 km' }
  ];

  // Mock tourist data
  const getTouristInfo = (touristId: string) => ({
    id: touristId,
    name: `Tourist ${touristId.slice(-4)}`,
    nationality: 'India',
    phone: '+91-XXXX-XXXX',
    emergency_contact: '+91-YYYY-YYYY',
    hotel: 'Hotel Ashoka',
    check_in: '2024-01-15',
    itinerary: ['Red Fort', 'India Gate', 'Qutub Minar']
  });

  const handleDispatch = () => {
    if (!selectedAlertData || selectedOfficers.length === 0) return;
    
    // In real implementation, this would call the API
    console.log('Dispatching alert:', selectedAlertData.id, 'to officers:', selectedOfficers);
    alert('Alert dispatched successfully!');
  };

  const generateEFIR = () => {
    if (!selectedAlertData) return;
    
    setShowEFIRModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-red-600 bg-red-100';
      case 'reviewing':
        return 'text-yellow-600 bg-yellow-100';
      case 'dispatched':
        return 'text-blue-600 bg-blue-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Alert List */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Incident Queue</h3>
            <p className="text-sm text-gray-600">
              {alerts.filter(a => a.status === 'pending').length} pending incidents
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={clsx(
                  'p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors',
                  selectedAlert === alert.id ? 'bg-blue-50 border-blue-200' : ''
                )}
                onClick={() => onAlertSelect(alert.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {alert.type} Alert
                    </span>
                  </div>
                  <span className={clsx(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    getStatusColor(alert.status)
                  )}>
                    {alert.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{alert.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{format(new Date(alert.timestamp), 'MMM dd, HH:mm')}</span>
                  <span>{alert.tourist_ids.length} tourist(s)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Details */}
      <div className="lg:col-span-2">
        {selectedAlertData ? (
          <div className="space-y-6">
            {/* Alert Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Incident Details - {selectedAlertData.id.slice(-8).toUpperCase()}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={clsx(
                    'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                    selectedAlertData.severity === 'critical' ? 'text-red-700 bg-red-100' :
                    selectedAlertData.severity === 'high' ? 'text-orange-700 bg-orange-100' :
                    selectedAlertData.severity === 'medium' ? 'text-yellow-700 bg-yellow-100' :
                    'text-blue-700 bg-blue-100'
                  )}>
                    {selectedAlertData.severity.toUpperCase()} PRIORITY
                  </span>
                  <span className={clsx(
                    'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                    getStatusColor(selectedAlertData.status)
                  )}>
                    {selectedAlertData.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Alert Information</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Type:</dt>
                      <dd className="text-gray-900 capitalize">{selectedAlertData.type}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Confidence:</dt>
                      <dd className="text-gray-900">{Math.round(selectedAlertData.confidence * 100)}%</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Time:</dt>
                      <dd className="text-gray-900">{format(new Date(selectedAlertData.timestamp), 'PPpp')}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Location:</dt>
                      <dd className="text-gray-900">
                        {selectedAlertData.location.address || 
                         `${selectedAlertData.location.lat.toFixed(4)}, ${selectedAlertData.location.lng.toFixed(4)}`}
                      </dd>
                    </div>
                    {selectedAlertData.camera_id && (
                      <div>
                        <dt className="text-gray-500">Camera:</dt>
                        <dd className="text-gray-900">{selectedAlertData.camera_id}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Evidence</h4>
                  {selectedAlertData.evidence ? (
                    <div className="space-y-2">
                      {selectedAlertData.evidence.video_url && (
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <VideoCameraIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-900">Video Evidence</span>
                          <button className="text-blue-600 hover:text-blue-500 text-xs">
                            View
                          </button>
                        </div>
                      )}
                      {selectedAlertData.evidence.image_url && (
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <EyeIcon className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-900">Image Evidence</span>
                          <button className="text-blue-600 hover:text-blue-500 text-xs">
                            View
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No evidence available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tourist Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Affected Tourists</h3>
              <div className="space-y-4">
                {selectedAlertData.tourist_ids.map((touristId) => {
                  const tourist = getTouristInfo(touristId);
                  return (
                    <div key={touristId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-5 w-5 text-blue-500" />
                          <span className="font-medium text-gray-900">{tourist.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">ID: {tourist.id.slice(-6)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Nationality:</span>
                          <span className="ml-2 text-gray-900">{tourist.nationality}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Hotel:</span>
                          <span className="ml-2 text-gray-900">{tourist.hotel}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <span className="ml-2 text-gray-900">{tourist.phone}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Emergency:</span>
                          <span className="ml-2 text-gray-900">{tourist.emergency_contact}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dispatch Actions */}
            {selectedAlertData.status === 'pending' || selectedAlertData.status === 'reviewing' ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dispatch Response</h3>
                
                {/* Officer Selection */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Select Officers</h4>
                  <div className="space-y-2">
                    {availableOfficers.map((officer) => (
                      <label key={officer.id} className="flex items-center space-x-3 p-2 border border-gray-200 rounded hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedOfficers.includes(officer.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOfficers([...selectedOfficers, officer.id]);
                            } else {
                              setSelectedOfficers(selectedOfficers.filter(id => id !== officer.id));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{officer.name}</span>
                            <span className="text-xs text-gray-500">{officer.distance}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {officer.badge} • {officer.location}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dispatch Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Dispatch Instructions
                  </label>
                  <textarea
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter special instructions for responding officers..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleDispatch}
                    disabled={selectedOfficers.length === 0}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Dispatch Now
                  </button>
                  
                  <button
                    onClick={generateEFIR}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Generate e-FIR
                  </button>
                  
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Mark False Positive
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Incident Status</h3>
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckIcon className="h-5 w-5" />
                  <span>Incident has been {selectedAlertData.status}</span>
                </div>
                {selectedAlertData.assigned_to && (
                  <p className="text-sm text-gray-600 mt-2">
                    Assigned to: {selectedAlertData.assigned_to}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Incident</h3>
            <p className="text-gray-600">Choose an incident from the queue to view details and take action</p>
          </div>
        )}
      </div>

      {/* e-FIR Modal */}
      {showEFIRModal && selectedAlertData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">e-FIR Draft</h3>
              <button
                onClick={() => setShowEFIRModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">FIR No: {selectedAlertData.id.toUpperCase()}</h4>
                <p>Date: {format(new Date(selectedAlertData.timestamp), 'PP')}</p>
                <p>Time: {format(new Date(selectedAlertData.timestamp), 'pp')}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Incident Details:</h4>
                <p>Type: {selectedAlertData.type.toUpperCase()}</p>
                <p>Location: {selectedAlertData.location.address || `${selectedAlertData.location.lat}, ${selectedAlertData.location.lng}`}</p>
                <p>Description: {selectedAlertData.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Affected Persons:</h4>
                {selectedAlertData.tourist_ids.map(id => (
                  <p key={id}>Tourist ID: {id}</p>
                ))}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Evidence:</h4>
                <p>AI Detection Confidence: {Math.round(selectedAlertData.confidence * 100)}%</p>
                {selectedAlertData.camera_id && <p>CCTV Camera: {selectedAlertData.camera_id}</p>}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEFIRModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700">
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print e-FIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentWorkflow;
