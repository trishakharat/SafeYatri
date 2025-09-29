import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import {
  DevicePhoneMobileIcon,
  HeartIcon,
  BatteryIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WifiIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface IoTBand {
  id: string;
  tourist_id: string;
  tourist_name: string;
  status: 'active' | 'inactive' | 'emergency' | 'low_battery';
  battery_level: number;
  last_heartbeat: string;
  location: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  vitals: {
    heart_rate: number;
    temperature: number;
    activity_level: 'resting' | 'walking' | 'running' | 'stationary';
  };
  alerts: Array<{
    type: 'panic' | 'fall' | 'medical' | 'geofence' | 'battery';
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

const IoTBandManager: React.FC = () => {
  const { socket, connected } = useSocket();
  const [bands, setBands] = useState<IoTBand[]>([]);
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [showAddBand, setShowAddBand] = useState(false);

  // Mock IoT bands data
  useEffect(() => {
    const mockBands: IoTBand[] = [
      {
        id: 'band_001',
        tourist_id: 'tourist_001',
        tourist_name: 'John Smith',
        status: 'active',
        battery_level: 78,
        last_heartbeat: new Date(Date.now() - 30000).toISOString(),
        location: {
          lat: 28.6562,
          lng: 77.2410,
          accuracy: 5
        },
        vitals: {
          heart_rate: 72,
          temperature: 36.5,
          activity_level: 'walking'
        },
        alerts: []
      },
      {
        id: 'band_002',
        tourist_id: 'tourist_002',
        tourist_name: 'Sarah Johnson',
        status: 'emergency',
        battery_level: 45,
        last_heartbeat: new Date(Date.now() - 60000).toISOString(),
        location: {
          lat: 28.6289,
          lng: 77.2217,
          accuracy: 8
        },
        vitals: {
          heart_rate: 110,
          temperature: 37.2,
          activity_level: 'stationary'
        },
        alerts: [
          {
            type: 'panic',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            severity: 'critical'
          }
        ]
      },
      {
        id: 'band_003',
        tourist_id: 'tourist_003',
        tourist_name: 'Mike Chen',
        status: 'low_battery',
        battery_level: 15,
        last_heartbeat: new Date(Date.now() - 120000).toISOString(),
        location: {
          lat: 28.6129,
          lng: 77.2295,
          accuracy: 12
        },
        vitals: {
          heart_rate: 68,
          temperature: 36.8,
          activity_level: 'resting'
        },
        alerts: [
          {
            type: 'battery',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            severity: 'medium'
          }
        ]
      }
    ];

    setBands(mockBands);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    if (!connected || !socket) return;

    const interval = setInterval(() => {
      setBands(prevBands => 
        prevBands.map(band => ({
          ...band,
          vitals: {
            ...band.vitals,
            heart_rate: Math.max(60, Math.min(120, band.vitals.heart_rate + (Math.random() - 0.5) * 10)),
            temperature: Math.max(36, Math.min(38, band.vitals.temperature + (Math.random() - 0.5) * 0.5))
          },
          battery_level: Math.max(0, band.battery_level - (Math.random() * 0.1)),
          last_heartbeat: new Date().toISOString()
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [connected, socket]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'emergency':
        return 'text-red-700 bg-red-100 border-red-200 animate-pulse';
      case 'low_battery':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'inactive':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHeartRateColor = (rate: number) => {
    if (rate > 100 || rate < 60) return 'text-red-600';
    if (rate > 90 || rate < 65) return 'text-yellow-600';
    return 'text-green-600';
  };

  const sendPanicAlert = (bandId: string) => {
    if (!socket || !connected) return;
    
    const band = bands.find(b => b.id === bandId);
    if (!band) return;

    const panicAlert = {
      type: 'panic',
      severity: 'critical',
      confidence: 1.0,
      location: band.location,
      tourist_ids: [band.tourist_id],
      description: `Panic button activated by ${band.tourist_name}`,
      evidence: {
        metadata: {
          heart_rate: band.vitals.heart_rate,
          temperature: band.vitals.temperature,
          battery_level: band.battery_level
        }
      }
    };

    socket.emit('iot_panic_alert', panicAlert);
    
    // Update band status
    setBands(prevBands =>
      prevBands.map(b =>
        b.id === bandId
          ? {
              ...b,
              status: 'emergency' as const,
              alerts: [
                ...b.alerts,
                {
                  type: 'panic' as const,
                  timestamp: new Date().toISOString(),
                  severity: 'critical' as const
                }
              ]
            }
          : b
      )
    );
  };

  const selectedBandData = bands.find(b => b.id === selectedBand);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">IoT Band Monitoring</h3>
          <p className="text-sm text-gray-600">Real-time tourist health and location tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <WifiIcon className="h-4 w-4" />
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <button
            onClick={() => setShowAddBand(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <DevicePhoneMobileIcon className="h-4 w-4 mr-2" />
            Add Band
          </button>
        </div>
      </div>

      {/* Band Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bands.map((band) => (
          <div
            key={band.id}
            className={clsx(
              'bg-white border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md',
              selectedBand === band.id ? 'ring-2 ring-primary-500' : 'border-gray-200'
            )}
            onClick={() => setSelectedBand(band.id)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-900">{band.tourist_name}</span>
              </div>
              <span className={clsx(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                getStatusColor(band.status)
              )}>
                {band.status.toUpperCase()}
              </span>
            </div>

            {/* Vitals */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center space-x-2">
                <HeartIcon className={clsx('h-4 w-4', getHeartRateColor(band.vitals.heart_rate))} />
                <div>
                  <div className={clsx('text-sm font-medium', getHeartRateColor(band.vitals.heart_rate))}>
                    {band.vitals.heart_rate} BPM
                  </div>
                  <div className="text-xs text-gray-500">Heart Rate</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <BatteryIcon className={clsx('h-4 w-4', getBatteryColor(band.battery_level))} />
                <div>
                  <div className={clsx('text-sm font-medium', getBatteryColor(band.battery_level))}>
                    {Math.round(band.battery_level)}%
                  </div>
                  <div className="text-xs text-gray-500">Battery</div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center space-x-2 mb-3">
              <MapPinIcon className="h-4 w-4 text-gray-500" />
              <div className="text-xs text-gray-600">
                {band.location.lat.toFixed(4)}, {band.location.lng.toFixed(4)}
                <span className="ml-1 text-gray-500">(±{band.location.accuracy}m)</span>
              </div>
            </div>

            {/* Activity & Temperature */}
            <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
              <span className="capitalize">{band.vitals.activity_level}</span>
              <span>{band.vitals.temperature.toFixed(1)}°C</span>
            </div>

            {/* Alerts */}
            {band.alerts.length > 0 && (
              <div className="flex items-center space-x-1 mb-3">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-600">
                  {band.alerts.length} alert{band.alerts.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Last Update */}
            <div className="text-xs text-gray-500">
              Last update: {new Date(band.last_heartbeat).toLocaleTimeString()}
            </div>

            {/* Emergency Button */}
            {band.status !== 'emergency' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sendPanicAlert(band.id);
                }}
                className="mt-3 w-full bg-red-600 text-white text-xs py-2 px-3 rounded hover:bg-red-700 transition-colors"
              >
                Simulate Panic Alert
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Selected Band Details */}
      {selectedBandData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Band Details - {selectedBandData.tourist_name}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">Current Status</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={clsx(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    getStatusColor(selectedBandData.status)
                  )}>
                    {selectedBandData.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Heart Rate:</span>
                  <span className={clsx('text-sm font-medium', getHeartRateColor(selectedBandData.vitals.heart_rate))}>
                    {selectedBandData.vitals.heart_rate} BPM
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Temperature:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedBandData.vitals.temperature.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Activity:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {selectedBandData.vitals.activity_level}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Battery:</span>
                  <span className={clsx('text-sm font-medium', getBatteryColor(selectedBandData.battery_level))}>
                    {Math.round(selectedBandData.battery_level)}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">Location & Alerts</h5>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Location:</span>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedBandData.location.lat.toFixed(6)}, {selectedBandData.location.lng.toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Accuracy: ±{selectedBandData.location.accuracy}m
                  </div>
                </div>
                
                {selectedBandData.alerts.length > 0 ? (
                  <div>
                    <span className="text-sm text-gray-600">Recent Alerts:</span>
                    <div className="mt-2 space-y-2">
                      {selectedBandData.alerts.slice(0, 3).map((alert, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 rounded">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-red-800 capitalize">
                              {alert.type} Alert
                            </div>
                            <div className="text-xs text-red-600">
                              {new Date(alert.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span className="text-sm">No recent alerts</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Band Modal */}
      {showAddBand && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add IoT Band</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Band ID</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="band_004"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tourist Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tourist Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tourist ID</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="tourist_004"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddBand(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddBand(false)}
                className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700"
              >
                Add Band
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IoTBandManager;
