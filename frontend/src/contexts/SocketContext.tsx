import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

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

interface TouristLocation {
  tourist_id: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  battery_level?: number;
  heart_rate?: number;
  status: 'active' | 'inactive' | 'emergency';
}

interface SystemStatus {
  cameras_online: number;
  cameras_total: number;
  tourists_active: number;
  alerts_pending: number;
  system_health: 'healthy' | 'warning' | 'critical';
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  alerts: Alert[];
  touristLocations: TouristLocation[];
  systemStatus: SystemStatus;
  sendAlert: (alert: Partial<Alert>) => void;
  updateAlertStatus: (alertId: string, status: Alert['status'], assignedTo?: string) => void;
  subscribeToCamera: (cameraId: string) => void;
  unsubscribeFromCamera: (cameraId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [touristLocations, setTouristLocations] = useState<TouristLocation[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    cameras_online: 0,
    cameras_total: 0,
    tourists_active: 0,
    alerts_pending: 0,
    system_health: 'healthy'
  });

  useEffect(() => {
    if (user) {
      const baseUrl = (process.env.REACT_APP_WS_URL || window.location.origin).replace(/\/$/, '');
      const newSocket = io(baseUrl, {
        path: '/socket.io',
        auth: {
          token: localStorage.getItem('access_token')
        },
        transports: ['websocket', 'polling']
      });

      // Backend generic alert event
      newSocket.on('alert', (payload: any) => {
        // payload: { type, details: { confidence, location, camera_id, severity, description }, timestamp }
        try {
          const details = payload?.details || {};
          const loc = details.location || {};
          const mapped: Alert = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type: (payload.type || 'violence') as Alert['type'],
            severity: (details.severity || 'high') as Alert['severity'],
            confidence: typeof details.confidence === 'number' ? details.confidence : 0.8,
            timestamp: payload.timestamp || new Date().toISOString(),
            location: {
              lat: loc.lat ?? loc.latitude ?? 0,
              lng: loc.lng ?? loc.longitude ?? 0,
              address: loc.address,
            },
            camera_id: details.camera_id,
            tourist_ids: details.tourist_ids || [],
            evidence: details.evidence,
            status: 'pending',
            description: details.description || 'Alert received'
          };
          setAlerts(prev => [mapped, ...prev]);
        } catch (e) {
          console.error('Error mapping alert payload', e);
        }
      });

      // Backend violence alert around tourists
      newSocket.on('tourist_violence_alert', (payload: any) => {
        try {
          const loc = payload?.location || {};
          const mapped: Alert = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type: 'violence',
            severity: 'high',
            confidence: 0.9,
            timestamp: new Date().toISOString(),
            location: {
              lat: loc.lat ?? loc.latitude ?? 0,
              lng: loc.lng ?? loc.longitude ?? 0,
            },
            camera_id: payload.camera_id,
            tourist_ids: payload.tourist_id ? [payload.tourist_id] : [],
            description: `Violence detected near tourist ${payload.tourist_name || ''}`.trim(),
            status: 'pending'
          };
          setAlerts(prev => [mapped, ...prev]);
        } catch (e) {
          console.error('Error mapping tourist_violence_alert', e);
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to SafeYatri server');
        setConnected(true);
        toast.success('Connected to real-time monitoring');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from SafeYatri server');
        setConnected(false);
        toast.error('Lost connection to monitoring system');
      });

      // Alert events
      newSocket.on('new_alert', (alert: Alert) => {
        setAlerts(prev => [alert, ...prev]);
        
        // Show toast notification based on severity
        const message = `${alert.type.toUpperCase()} Alert: ${alert.description}`;
        if (alert.severity === 'critical') {
          toast.error(message, { duration: 8000 });
        } else if (alert.severity === 'high') {
          toast.error(message, { duration: 6000 });
        } else if (alert.severity === 'medium') {
          toast((t) => (
            <div className="flex items-center">
              <div className="flex-1">
                <p className="font-medium text-yellow-800">{message}</p>
                <p className="text-sm text-yellow-600">Confidence: {Math.round(alert.confidence * 100)}%</p>
              </div>
            </div>
          ), { duration: 4000 });
        }
      });

      newSocket.on('alert_updated', (updatedAlert: Alert) => {
        setAlerts(prev => prev.map(alert => 
          alert.id === updatedAlert.id ? updatedAlert : alert
        ));
      });

      // Tourist location updates
      newSocket.on('tourist_location_update', (locations: TouristLocation[]) => {
        setTouristLocations(locations);
      });

      // System status updates
      newSocket.on('system_status_update', (status: SystemStatus) => {
        setSystemStatus(status);
      });

      // IoT band updates
      newSocket.on('iot_band_update', (data: any) => {
        console.log('IoT Band Update:', data);
        // Handle IoT band data updates
        if (data.alert_type) {
          // Create alert from IoT band data
          const iotAlert: Partial<Alert> = {
            type: data.alert_type,
            severity: data.severity || 'medium',
            confidence: data.confidence || 0.8,
            location: data.location,
            tourist_ids: [data.tourist_id],
            description: data.description || 'IoT Band Alert'
          };
          sendAlert(iotAlert);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const sendAlert = (alert: Partial<Alert>) => {
    if (socket && connected) {
      socket.emit('send_alert', alert);
    }
  };

  const updateAlertStatus = (alertId: string, status: Alert['status'], assignedTo?: string) => {
    if (socket && connected) {
      socket.emit('update_alert_status', { alertId, status, assignedTo });
    }
  };

  const subscribeToCamera = (cameraId: string) => {
    if (socket && connected) {
      socket.emit('subscribe_camera', { cameraId });
    }
  };

  const unsubscribeFromCamera = (cameraId: string) => {
    if (socket && connected) {
      socket.emit('unsubscribe_camera', { cameraId });
    }
  };

  const value: SocketContextType = {
    socket,
    connected,
    alerts,
    touristLocations,
    systemStatus,
    sendAlert,
    updateAlertStatus,
    subscribeToCamera,
    unsubscribeFromCamera
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
