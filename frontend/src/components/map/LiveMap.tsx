import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token here
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

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

interface Alert {
  id: string;
  type: 'violence' | 'anomaly' | 'geofence' | 'panic' | 'missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  timestamp: string;
  description: string;
}

interface LiveMapProps {
  touristLocations: TouristLocation[];
  alerts: Alert[];
  onAlertSelect?: (alertId: string) => void;
}

const LiveMap: React.FC<LiveMapProps> = ({ touristLocations, alerts, onAlertSelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(77.2090); // Delhi longitude
  const [lat, setLat] = useState(28.6139); // Delhi latitude
  const [zoom, setZoom] = useState(12);

  // Geo-fence zones (example data)
  const geoFenceZones = [
    {
      id: 'red_fort_restricted',
      name: 'Red Fort - Restricted Area',
      type: 'restricted',
      coordinates: [
        [77.2395, 28.6562],
        [77.2415, 28.6562],
        [77.2415, 28.6582],
        [77.2395, 28.6582],
        [77.2395, 28.6562]
      ]
    },
    {
      id: 'connaught_place_safe',
      name: 'Connaught Place - Safe Zone',
      type: 'safe',
      coordinates: [
        [77.2167, 28.6289],
        [77.2267, 28.6289],
        [77.2267, 28.6389],
        [77.2167, 28.6389],
        [77.2167, 28.6289]
      ]
    }
  ];

  useEffect(() => {
    if (map.current) return; // Initialize map only once
    
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [lng, lat],
      zoom: zoom
    });

    map.current.on('move', () => {
      if (map.current) {
        setLng(parseFloat(map.current.getCenter().lng.toFixed(4)));
        setLat(parseFloat(map.current.getCenter().lat.toFixed(4)));
        setZoom(parseFloat(map.current.getZoom().toFixed(2)));
      }
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geo-fence zones
    map.current.on('load', () => {
      if (!map.current) return;

      // Add geo-fence source and layers
      map.current.addSource('geofences', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: geoFenceZones.map(zone => ({
            type: 'Feature',
            properties: {
              id: zone.id,
              name: zone.name,
              type: zone.type
            },
            geometry: {
              type: 'Polygon',
              coordinates: [zone.coordinates]
            }
          }))
        }
      });

      // Restricted zones (red)
      map.current.addLayer({
        id: 'geofence-restricted-fill',
        type: 'fill',
        source: 'geofences',
        filter: ['==', 'type', 'restricted'],
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.3
        }
      });

      map.current.addLayer({
        id: 'geofence-restricted-border',
        type: 'line',
        source: 'geofences',
        filter: ['==', 'type', 'restricted'],
        paint: {
          'line-color': '#dc2626',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });

      // Safe zones (green)
      map.current.addLayer({
        id: 'geofence-safe-fill',
        type: 'fill',
        source: 'geofences',
        filter: ['==', 'type', 'safe'],
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.2
        }
      });

      map.current.addLayer({
        id: 'geofence-safe-border',
        type: 'line',
        source: 'geofences',
        filter: ['==', 'type', 'safe'],
        paint: {
          'line-color': '#16a34a',
          'line-width': 2
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Update tourist locations
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Remove existing tourist markers
    const existingMarkers = document.querySelectorAll('.tourist-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add tourist location markers
    touristLocations.forEach(tourist => {
      const el = document.createElement('div');
      el.className = 'tourist-marker';
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      
      // Color based on status
      switch (tourist.status) {
        case 'emergency':
          el.style.backgroundColor = '#ef4444';
          el.style.animation = 'pulse 2s infinite';
          break;
        case 'inactive':
          el.style.backgroundColor = '#6b7280';
          break;
        default:
          el.style.backgroundColor = '#22c55e';
      }

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">Tourist ${tourist.tourist_id.slice(-6)}</h3>
          <p class="text-xs text-gray-600">Status: ${tourist.status}</p>
          ${tourist.battery_level ? `<p class="text-xs text-gray-600">Battery: ${tourist.battery_level}%</p>` : ''}
          ${tourist.heart_rate ? `<p class="text-xs text-gray-600">Heart Rate: ${tourist.heart_rate} bpm</p>` : ''}
          <p class="text-xs text-gray-600">Last seen: ${new Date(tourist.timestamp).toLocaleTimeString()}</p>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([tourist.location.lng, tourist.location.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });
  }, [touristLocations]);

  // Update alert markers
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Remove existing alert markers
    const existingAlertMarkers = document.querySelectorAll('.alert-marker');
    existingAlertMarkers.forEach(marker => marker.remove());

    // Add alert markers
    alerts.forEach(alert => {
      const el = document.createElement('div');
      el.className = 'alert-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      
      // Color and animation based on severity
      switch (alert.severity) {
        case 'critical':
          el.style.backgroundColor = '#dc2626';
          el.style.animation = 'pulse 1s infinite';
          break;
        case 'high':
          el.style.backgroundColor = '#ea580c';
          break;
        case 'medium':
          el.style.backgroundColor = '#d97706';
          break;
        default:
          el.style.backgroundColor = '#2563eb';
      }

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3">
          <h3 class="font-semibold text-sm capitalize">${alert.type} Alert</h3>
          <p class="text-xs text-gray-600 mb-2">${alert.description}</p>
          <p class="text-xs text-gray-600">Severity: ${alert.severity}</p>
          <p class="text-xs text-gray-600">Time: ${new Date(alert.timestamp).toLocaleString()}</p>
          ${onAlertSelect ? `
            <button 
              onclick="window.selectAlert('${alert.id}')"
              class="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              View Details
            </button>
          ` : ''}
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([alert.location.lng, alert.location.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Add global function for alert selection
    if (onAlertSelect) {
      (window as any).selectAlert = (alertId: string) => {
        onAlertSelect(alertId);
      };
    }
  }, [alerts, onAlertSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Map controls overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="text-xs font-medium text-gray-900">Live Tourist Map</div>
        <div className="text-xs text-gray-600">
          Lng: {lng} | Lat: {lat} | Zoom: {zoom}
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Active Tourists ({touristLocations.filter(t => t.status === 'active').length})</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span>Emergency ({touristLocations.filter(t => t.status === 'emergency').length})</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>Inactive ({touristLocations.filter(t => t.status === 'inactive').length})</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="text-xs font-medium text-gray-900">Geo-fence Zones</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-4 h-2 bg-red-400 opacity-50 border border-red-600 border-dashed"></div>
            <span>Restricted Areas</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-4 h-2 bg-green-400 opacity-30 border border-green-600"></div>
            <span>Safe Zones</span>
          </div>
        </div>
      </div>

      {/* Alert summary */}
      {alerts.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3">
          <div className="text-xs font-medium text-gray-900 mb-2">Active Alerts</div>
          <div className="space-y-1">
            {['critical', 'high', 'medium', 'low'].map(severity => {
              const count = alerts.filter(a => a.severity === severity).length;
              if (count === 0) return null;
              
              const colors = {
                critical: 'text-red-600',
                high: 'text-orange-600',
                medium: 'text-yellow-600',
                low: 'text-blue-600'
              };
              
              return (
                <div key={severity} className={`text-xs ${colors[severity as keyof typeof colors]}`}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}: {count}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveMap;
