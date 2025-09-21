import json
import sqlite3
import requests
import time
import threading
from datetime import datetime, timedelta
import uuid

class IoTDeviceManager:
    def __init__(self, db_path="tourist_database.db"):
        """Initialize IoT device manager for tourist tracking bands"""
        self.db_path = db_path
        self.device_status = {}
        self.location_updates = {}
        self.alert_thresholds = {
            'battery_low': 20,
            'signal_weak': 30,
            'inactive_time': 300  # 5 minutes
        }
        
        # Start background monitoring
        self.monitor_thread = threading.Thread(target=self._monitor_devices, daemon=True)
        self.monitor_thread.start()
    
    def register_device(self, tourist_id, device_type="smart_band"):
        """Register a new IoT device for a tourist"""
        device_id = f"IOT_{uuid.uuid4().hex[:8]}"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO iot_devices (device_id, tourist_id, battery_level, signal_strength, 
                                   last_ping, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            device_id,
            tourist_id,
            100,  # Full battery
            100,  # Strong signal
            datetime.now().isoformat(),
            'active'
        ))
        
        conn.commit()
        conn.close()
        
        # Initialize device status
        self.device_status[device_id] = {
            'tourist_id': tourist_id,
            'battery_level': 100,
            'signal_strength': 100,
            'last_ping': datetime.now(),
            'location': None,
            'status': 'active',
            'device_type': device_type
        }
        
        return device_id
    
    def update_device_status(self, device_id, status_data):
        """Update device status from IoT device"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Update database
        cursor.execute('''
            UPDATE iot_devices 
            SET battery_level = ?, signal_strength = ?, last_ping = ?, status = ?
            WHERE device_id = ?
        ''', (
            status_data.get('battery_level', 100),
            status_data.get('signal_strength', 100),
            datetime.now().isoformat(),
            status_data.get('status', 'active'),
            device_id
        ))
        
        conn.commit()
        conn.close()
        
        # Update in-memory status
        if device_id in self.device_status:
            self.device_status[device_id].update(status_data)
            self.device_status[device_id]['last_ping'] = datetime.now()
    
    def update_device_location(self, device_id, location_data):
        """Update device location from GPS/network data"""
        if device_id in self.device_status:
            self.device_status[device_id]['location'] = location_data
            self.location_updates[device_id] = {
                'location': location_data,
                'timestamp': datetime.now()
            }
            
            # Update tourist location in database
            tourist_id = self.device_status[device_id]['tourist_id']
            self._update_tourist_location(tourist_id, location_data)
    
    def _update_tourist_location(self, tourist_id, location):
        """Update tourist location in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE tourists 
            SET current_location = ?, last_seen = ?
            WHERE id = ?
        ''', (
            json.dumps(location),
            datetime.now().isoformat(),
            tourist_id
        ))
        
        conn.commit()
        conn.close()
    
    def get_device_status(self, device_id):
        """Get current device status"""
        return self.device_status.get(device_id, None)
    
    def get_all_devices(self):
        """Get all registered devices"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT d.*, t.name, t.digital_id 
            FROM iot_devices d 
            JOIN tourists t ON d.tourist_id = t.id 
            WHERE d.status = 'active'
        ''')
        
        results = cursor.fetchall()
        devices = []
        
        for result in results:
            devices.append({
                'device_id': result[1],
                'tourist_id': result[2],
                'tourist_name': result[6],
                'digital_id': result[7],
                'battery_level': result[3],
                'signal_strength': result[4],
                'last_ping': result[5],
                'status': result[6]
            })
        
        conn.close()
        return devices
    
    def check_device_health(self, device_id):
        """Check device health and generate alerts if needed"""
        if device_id not in self.device_status:
            return []
        
        device = self.device_status[device_id]
        alerts = []
        
        # Check battery level
        if device['battery_level'] < self.alert_thresholds['battery_low']:
            alerts.append({
                'type': 'battery_low',
                'severity': 'medium',
                'message': f"Device {device_id} battery low: {device['battery_level']}%"
            })
        
        # Check signal strength
        if device['signal_strength'] < self.alert_thresholds['signal_weak']:
            alerts.append({
                'type': 'signal_weak',
                'severity': 'low',
                'message': f"Device {device_id} weak signal: {device['signal_strength']}%"
            })
        
        # Check if device is inactive
        time_since_ping = (datetime.now() - device['last_ping']).total_seconds()
        if time_since_ping > self.alert_thresholds['inactive_time']:
            alerts.append({
                'type': 'device_inactive',
                'severity': 'high',
                'message': f"Device {device_id} inactive for {int(time_since_ping)} seconds"
            })
        
        return alerts
    
    def _monitor_devices(self):
        """Background thread to monitor all devices"""
        while True:
            try:
                for device_id in list(self.device_status.keys()):
                    alerts = self.check_device_health(device_id)
                    
                    # Process alerts
                    for alert in alerts:
                        self._create_device_alert(device_id, alert)
                
                time.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                print(f"Error in device monitoring: {e}")
                time.sleep(60)
    
    def _create_device_alert(self, device_id, alert_data):
        """Create alert for device issues"""
        if device_id not in self.device_status:
            return
        
        tourist_id = self.device_status[device_id]['tourist_id']
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO alerts (tourist_id, alert_type, severity, timestamp, description)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            tourist_id,
            alert_data['type'],
            alert_data['severity'],
            datetime.now().isoformat(),
            alert_data['message']
        ))
        
        conn.commit()
        conn.close()
    
    def simulate_device_data(self, device_id):
        """Simulate IoT device data for testing"""
        if device_id not in self.device_status:
            return
        
        # Simulate battery drain
        current_battery = self.device_status[device_id]['battery_level']
        new_battery = max(0, current_battery - 1)
        
        # Simulate signal variation
        signal_strength = max(10, min(100, self.device_status[device_id]['signal_strength'] + 
                                     (1 if hash(device_id) % 2 else -1)))
        
        # Simulate location update
        location = {
            'latitude': 26.1445 + (hash(device_id) % 100) * 0.0001,
            'longitude': 91.7362 + (hash(device_id) % 100) * 0.0001,
            'accuracy': 10,
            'timestamp': datetime.now().isoformat()
        }
        
        # Update device status
        self.update_device_status(device_id, {
            'battery_level': new_battery,
            'signal_strength': signal_strength,
            'status': 'active'
        })
        
        # Update location
        self.update_device_location(device_id, location)
    
    def get_tourist_tracking_data(self, tourist_id):
        """Get tracking data for a specific tourist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get tourist's device
        cursor.execute('''
            SELECT d.* FROM iot_devices d 
            WHERE d.tourist_id = ? AND d.status = 'active'
        ''', (tourist_id,))
        
        device_result = cursor.fetchone()
        
        if not device_result:
            conn.close()
            return None
        
        device_id = device_result[1]
        
        # Get recent location updates
        cursor.execute('''
            SELECT current_location, last_seen 
            FROM tourists 
            WHERE id = ?
        ''', (tourist_id,))
        
        tourist_result = cursor.fetchone()
        
        conn.close()
        
        if tourist_result and tourist_result[0]:
            location_data = json.loads(tourist_result[0])
        else:
            location_data = None
        
        return {
            'device_id': device_id,
            'battery_level': device_result[3],
            'signal_strength': device_result[4],
            'last_ping': device_result[5],
            'current_location': location_data,
            'last_seen': tourist_result[1] if tourist_result else None
        }
    
    def get_geofence_alerts(self, location, tourist_id):
        """Check if tourist is in restricted zone"""
        # This would integrate with actual geofencing data
        # For now, return mock geofence status
        
        restricted_zones = [
            {'lat': 26.1445, 'lng': 91.7362, 'radius': 100, 'type': 'high_risk'},
            {'lat': 26.1500, 'lng': 91.7400, 'radius': 200, 'type': 'medium_risk'}
        ]
        
        for zone in restricted_zones:
            distance = self._calculate_distance(
                location['latitude'], location['longitude'],
                zone['lat'], zone['lng']
            )
            
            if distance <= zone['radius']:
                return {
                    'in_restricted_zone': True,
                    'zone_type': zone['type'],
                    'distance': distance,
                    'alert_level': 'high' if zone['type'] == 'high_risk' else 'medium'
                }
        
        return {'in_restricted_zone': False}
    
    def _calculate_distance(self, lat1, lng1, lat2, lng2):
        """Calculate distance between two points in meters"""
        from math import radians, cos, sin, asin, sqrt
        
        # Convert to radians
        lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371000  # Earth's radius in meters
        
        return c * r
