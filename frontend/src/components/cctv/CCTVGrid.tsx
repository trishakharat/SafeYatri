import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import CCTVFeed from './CCTVFeed';
import {
  VideoCameraIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface Camera {
  id: string;
  name: string;
  location: string;
  stream_url: string;
  status: 'online' | 'offline' | 'maintenance';
  ai_enabled: boolean;
  last_detection?: {
    type: string;
    confidence: number;
    timestamp: string;
  };
}

const CCTVGrid: React.FC = () => {
  const { socket, connected } = useSocket();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<'2x2' | '3x3' | '4x4'>('2x2');
  const [showAddCamera, setShowAddCamera] = useState(false);

  // Mock camera data - in real implementation, this would come from the backend
  useEffect(() => {
    const mockCameras: Camera[] = [
      {
        id: 'cam_001',
        name: 'Red Fort Main Gate',
        location: 'Red Fort, Delhi',
        stream_url: 'http://localhost:5000/api/camera/stream/cam_001',
        status: 'online',
        ai_enabled: true,
        last_detection: {
          type: 'crowd_density',
          confidence: 0.85,
          timestamp: new Date().toISOString()
        }
      },
      {
        id: 'cam_002',
        name: 'Connaught Place Central',
        location: 'Connaught Place, Delhi',
        stream_url: 'http://localhost:5000/api/camera/stream/cam_002',
        status: 'online',
        ai_enabled: true
      },
      {
        id: 'cam_003',
        name: 'India Gate Approach',
        location: 'India Gate, Delhi',
        stream_url: 'http://localhost:5000/api/camera/stream/cam_003',
        status: 'offline',
        ai_enabled: false
      },
      {
        id: 'cam_004',
        name: 'Chandni Chowk Market',
        location: 'Chandni Chowk, Delhi',
        stream_url: 'http://localhost:5000/api/camera/stream/cam_004',
        status: 'online',
        ai_enabled: true,
        last_detection: {
          type: 'violence',
          confidence: 0.92,
          timestamp: new Date(Date.now() - 300000).toISOString()
        }
      },
      {
        id: 'phone_cam',
        name: 'Mobile Phone Camera',
        location: 'Demo Location',
        stream_url: 'http://localhost:5000/api/camera/stream/phone',
        status: 'online',
        ai_enabled: true
      }
    ];

    setCameras(mockCameras);
  }, []);

  const getGridColumns = () => {
    switch (gridSize) {
      case '2x2':
        return 'grid-cols-2';
      case '3x3':
        return 'grid-cols-3';
      case '4x4':
        return 'grid-cols-4';
      default:
        return 'grid-cols-2';
    }
  };

  const getMaxCameras = () => {
    switch (gridSize) {
      case '2x2':
        return 4;
      case '3x3':
        return 9;
      case '4x4':
        return 16;
      default:
        return 4;
    }
  };

  const onlineCameras = cameras.filter(cam => cam.status === 'online');
  const displayCameras = onlineCameras.slice(0, getMaxCameras());

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium text-gray-900">Live CCTV Feeds</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {onlineCameras.length} of {cameras.length} cameras online
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Grid size selector */}
          <select
            value={gridSize}
            onChange={(e) => setGridSize(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="2x2">2×2 Grid</option>
            <option value="3x3">3×3 Grid</option>
            <option value="4x4">4×4 Grid</option>
          </select>

          <button
            onClick={() => setShowAddCamera(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Camera
          </button>

          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Camera Grid */}
      <div className={`grid ${getGridColumns()} gap-4`}>
        {displayCameras.map((camera) => (
          <div key={camera.id} className="relative">
            <CCTVFeed
              camera={camera}
              isSelected={selectedCamera === camera.id}
              onSelect={() => setSelectedCamera(camera.id)}
              showControls={true}
            />
            
            {/* AI Detection Overlay */}
            {camera.ai_enabled && camera.last_detection && (
              <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
                {camera.last_detection.type.toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: getMaxCameras() - displayCameras.length }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="aspect-video bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
          >
            <div className="text-center text-gray-500">
              <VideoCameraIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No camera assigned</p>
            </div>
          </div>
        ))}
      </div>

      {/* Camera Status Summary */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Camera Status Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {cameras.filter(c => c.status === 'online').length} Online
              </p>
              <p className="text-xs text-gray-500">Streaming normally</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {cameras.filter(c => c.status === 'offline').length} Offline
              </p>
              <p className="text-xs text-gray-500">Connection issues</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {cameras.filter(c => c.status === 'maintenance').length} Maintenance
              </p>
              <p className="text-xs text-gray-500">Scheduled downtime</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Detection Alerts */}
      {cameras.some(c => c.last_detection) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">Recent AI Detections</h3>
          </div>
          <div className="space-y-2">
            {cameras
              .filter(c => c.last_detection)
              .map(camera => (
                <div key={camera.id} className="flex items-center justify-between text-sm">
                  <span className="text-yellow-700">
                    <strong>{camera.name}:</strong> {camera.last_detection!.type} 
                    ({Math.round(camera.last_detection!.confidence * 100)}% confidence)
                  </span>
                  <span className="text-yellow-600 text-xs">
                    {new Date(camera.last_detection!.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add Camera Modal */}
      {showAddCamera && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Camera</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Camera Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter camera name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stream URL</label>
                <input
                  type="url"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="rtsp://camera-ip:port/stream"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Camera location"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ai-enabled"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="ai-enabled" className="ml-2 block text-sm text-gray-900">
                  Enable AI Detection
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddCamera(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddCamera(false)}
                className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700"
              >
                Add Camera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CCTVGrid;
