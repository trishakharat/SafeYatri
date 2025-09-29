import React from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';
import {
  ExclamationTriangleIcon,
  MapPinIcon,
  UserIcon,
  VideoCameraIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

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

interface AlertCardProps {
  alert: Alert;
  onAction?: (alertId: string, action: 'review' | 'dispatch' | 'false_positive') => void;
  showActions?: boolean;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAction, showActions = true }) => {
  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: Alert['type']) => {
    switch (type) {
      case 'violence':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'panic':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'geofence':
        return <MapPinIcon className="h-5 w-5 text-yellow-500" />;
      case 'missing':
        return <UserIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Alert['status']) => {
    switch (status) {
      case 'pending':
        return 'text-red-600';
      case 'reviewing':
        return 'text-yellow-600';
      case 'dispatched':
        return 'text-blue-600';
      case 'resolved':
        return 'text-green-600';
      case 'false_positive':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={clsx(
      'border rounded-lg p-4 space-y-3',
      alert.severity === 'critical' ? 'border-red-300 bg-red-50' :
      alert.severity === 'high' ? 'border-orange-300 bg-orange-50' :
      'border-gray-200 bg-white'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          {getTypeIcon(alert.type)}
          <div>
            <h4 className="text-sm font-medium text-gray-900 capitalize">
              {alert.type} Alert
            </h4>
            <p className="text-xs text-gray-500">
              {format(new Date(alert.timestamp), 'MMM dd, HH:mm:ss')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={clsx(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
            getSeverityColor(alert.severity)
          )}>
            {alert.severity.toUpperCase()}
          </span>
          <span className={clsx('text-xs font-medium', getStatusColor(alert.status))}>
            {alert.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700">{alert.description}</p>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <MapPinIcon className="h-4 w-4" />
          <span>{alert.location.address || `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-medium">Confidence:</span>
          <span>{Math.round(alert.confidence * 100)}%</span>
        </div>
        {alert.camera_id && (
          <div className="flex items-center space-x-1">
            <VideoCameraIcon className="h-4 w-4" />
            <span>Camera {alert.camera_id}</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <UserIcon className="h-4 w-4" />
          <span>{alert.tourist_ids.length} Tourist(s)</span>
        </div>
      </div>

      {/* Tourist IDs */}
      {alert.tourist_ids.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {alert.tourist_ids.slice(0, 3).map((touristId) => (
            <span
              key={touristId}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
            >
              {touristId.slice(-6)}
            </span>
          ))}
          {alert.tourist_ids.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
              +{alert.tourist_ids.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Evidence */}
      {alert.evidence && (
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <EyeIcon className="h-4 w-4" />
          <span>Evidence available</span>
          {alert.evidence.video_url && (
            <span className="text-blue-600 hover:text-blue-500 cursor-pointer">
              View Video
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && onAction && alert.status === 'pending' && (
        <div className="flex space-x-2 pt-2 border-t border-gray-200">
          <button
            onClick={() => onAction(alert.id, 'review')}
            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            Review
          </button>
          <button
            onClick={() => onAction(alert.id, 'dispatch')}
            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <CheckIcon className="h-4 w-4 mr-1" />
            Dispatch
          </button>
          <button
            onClick={() => onAction(alert.id, 'false_positive')}
            className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {showActions && onAction && alert.status === 'reviewing' && (
        <div className="flex space-x-2 pt-2 border-t border-gray-200">
          <button
            onClick={() => onAction(alert.id, 'dispatch')}
            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <CheckIcon className="h-4 w-4 mr-1" />
            Confirm Dispatch
          </button>
          <button
            onClick={() => onAction(alert.id, 'false_positive')}
            className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertCard;
