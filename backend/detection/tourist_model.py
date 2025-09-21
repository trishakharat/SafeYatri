import cv2
import numpy as np
import os
import json
import sqlite3
from datetime import datetime
import hashlib
import uuid

class TouristDetectionModel:
    def __init__(self):
        """Initialize the tourist detection model with digital ID capabilities"""
        self.db_path = "tourist_database.db"
        self.init_database()
        
        # Load YOLOv8 for person detection
        try:
            from ultralytics import YOLO
            self.person_model = YOLO('yolov8n.pt')
            print("✅ Tourist Detection Model initialized")
        except Exception as e:
            print(f"❌ Error loading YOLO model: {e}")
            self.person_model = None
        
        # Tourist tracking parameters
        self.tourist_tracking = {}
        self.detection_threshold = 0.5
        self.tourist_id_counter = 0
        
        # Safety zones and risk levels
        self.safety_zones = {
            'high_risk': {'color': (0, 0, 255), 'threshold': 0.8},
            'medium_risk': {'color': (0, 165, 255), 'threshold': 0.6},
            'low_risk': {'color': (0, 255, 0), 'threshold': 0.4}
        }
        
        # IoT device tracking
        self.iot_devices = {}
        self.device_locations = {}
        
    def init_database(self):
        """Initialize SQLite database for tourist data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tourists table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tourists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                digital_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                nationality TEXT,
                passport_number TEXT,
                phone TEXT,
                emergency_contact TEXT,
                itinerary TEXT,
                entry_date TIMESTAMP,
                exit_date TIMESTAMP,
                safety_score REAL DEFAULT 0.5,
                current_location TEXT,
                last_seen TIMESTAMP,
                status TEXT DEFAULT 'active'
            )
        ''')
        
        # Create alerts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tourist_id INTEGER,
                alert_type TEXT NOT NULL,
                location TEXT,
                severity TEXT,
                timestamp TIMESTAMP,
                description TEXT,
                resolved BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (tourist_id) REFERENCES tourists (id)
            )
        ''')
        
        # Create IoT devices table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS iot_devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT UNIQUE NOT NULL,
                tourist_id INTEGER,
                battery_level INTEGER,
                signal_strength INTEGER,
                last_ping TIMESTAMP,
                status TEXT DEFAULT 'active',
                FOREIGN KEY (tourist_id) REFERENCES tourists (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def generate_digital_id(self, tourist_data):
        """Generate blockchain-based digital ID for tourist"""
        # Create hash from tourist data
        data_string = f"{tourist_data['name']}{tourist_data['passport_number']}{datetime.now().isoformat()}"
        hash_object = hashlib.sha256(data_string.encode())
        digital_id = hash_object.hexdigest()[:16]  # First 16 characters
        
        # Store in database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO tourists (digital_id, name, nationality, passport_number, phone, 
                                emergency_contact, itinerary, entry_date, safety_score, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            digital_id,
            tourist_data['name'],
            tourist_data.get('nationality', ''),
            tourist_data.get('passport_number', ''),
            tourist_data.get('phone', ''),
            tourist_data.get('emergency_contact', ''),
            json.dumps(tourist_data.get('itinerary', [])),
            datetime.now().isoformat(),
            tourist_data.get('safety_score', 0.5),
            'active'
        ))
        
        conn.commit()
        conn.close()
        
        return digital_id
    
    def detect_tourists(self, frame, region_id=None):
        """Detect tourists in the frame and return their information with region-specific monitoring"""
        if self.person_model is None:
            return []
        
        try:
            # Run person detection
            results = self.person_model(frame, classes=[0])  # Class 0 is person
            
            detected_tourists = []
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    if box.conf > self.detection_threshold:
                        # Extract bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        
                        # Create tourist detection entry
                        tourist_detection = {
                            'bbox': [int(x1), int(y1), int(x2), int(y2)],
                            'confidence': float(box.conf),
                            'timestamp': datetime.now().isoformat(),
                            'location': self.get_location_from_frame(frame, x1, y1, x2, y2),
                            'region_id': region_id or 'default_region'
                        }
                        
                        # Try to match with existing tourists
                        matched_tourist = self.match_tourist(tourist_detection)
                        if matched_tourist:
                            tourist_detection['tourist_id'] = matched_tourist['digital_id']
                            tourist_detection['name'] = matched_tourist['name']
                            tourist_detection['safety_score'] = matched_tourist['safety_score']
                            tourist_detection['nationality'] = matched_tourist.get('nationality', 'Unknown')
                            tourist_detection['emergency_contact'] = matched_tourist.get('emergency_contact', '')
                        else:
                            # Create new tourist entry
                            tourist_detection['tourist_id'] = self.create_anonymous_tourist()
                            tourist_detection['name'] = f"Tourist_{self.tourist_id_counter}"
                            tourist_detection['safety_score'] = 0.5
                            tourist_detection['nationality'] = 'Unknown'
                            tourist_detection['emergency_contact'] = ''
                        
                        detected_tourists.append(tourist_detection)
            
            return detected_tourists
            
        except Exception as e:
            print(f"Error in tourist detection: {e}")
            return []
    
    def match_tourist(self, detection):
        """Match detected person with existing tourist records"""
        # This is a simplified matching - in reality, you'd use face recognition
        # or other biometric matching techniques
        
        # For now, return None to create new entries
        return None
    
    def create_anonymous_tourist(self):
        """Create anonymous tourist entry for detected person"""
        digital_id = f"TOURIST_{uuid.uuid4().hex[:8]}"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO tourists (digital_id, name, entry_date, safety_score, status)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            digital_id,
            f"Tourist_{self.tourist_id_counter}",
            datetime.now().isoformat(),
            0.5,  # Default safety score
            'active'
        ))
        
        conn.commit()
        conn.close()
        
        self.tourist_id_counter += 1
        return digital_id
    
    def get_location_from_frame(self, frame, x1, y1, x2, y2):
        """Determine location based on frame coordinates and camera position"""
        # This would integrate with GPS coordinates and camera positioning
        # For now, return a mock location
        return {
            'latitude': 26.1445 + (np.random.random() - 0.5) * 0.01,
            'longitude': 91.7362 + (np.random.random() - 0.5) * 0.01,
            'zone': 'tourist_area'
        }
    
    def update_tourist_location(self, tourist_id, location):
        """Update tourist's current location"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE tourists 
            SET current_location = ?, last_seen = ?
            WHERE digital_id = ?
        ''', (
            json.dumps(location),
            datetime.now().isoformat(),
            tourist_id
        ))
        
        conn.commit()
        conn.close()
    
    def check_safety_zones(self, location):
        """Check if location is in a high-risk zone"""
        # This would integrate with actual geofencing data
        # For now, return mock risk assessment
        risk_levels = ['low_risk', 'medium_risk', 'high_risk']
        return np.random.choice(risk_levels, p=[0.6, 0.3, 0.1])
    
    def update_safety_score(self, tourist_id, behavior_data):
        """Update tourist's safety score based on behavior"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get current safety score
        cursor.execute('SELECT safety_score FROM tourists WHERE digital_id = ?', (tourist_id,))
        result = cursor.fetchone()
        
        if result:
            current_score = result[0]
            # Adjust score based on behavior (simplified)
            new_score = max(0.0, min(1.0, current_score + behavior_data.get('score_adjustment', 0)))
            
            cursor.execute('''
                UPDATE tourists SET safety_score = ? WHERE digital_id = ?
            ''', (new_score, tourist_id))
            
            conn.commit()
        
        conn.close()
    
    def create_alert(self, tourist_id, alert_type, location, severity='medium'):
        """Create alert for tourist safety issue"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO alerts (tourist_id, alert_type, location, severity, timestamp, description)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            tourist_id,
            alert_type,
            json.dumps(location),
            severity,
            datetime.now().isoformat(),
            f"Tourist safety alert: {alert_type}"
        ))
        
        conn.commit()
        conn.close()
    
    def get_tourist_data(self, tourist_id):
        """Get tourist information by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM tourists WHERE digital_id = ?', (tourist_id,))
        result = cursor.fetchone()
        
        conn.close()
        
        if result:
            return {
                'id': result[0],
                'digital_id': result[1],
                'name': result[2],
                'nationality': result[3],
                'passport_number': result[4],
                'phone': result[5],
                'emergency_contact': result[6],
                'itinerary': json.loads(result[7]) if result[7] else [],
                'entry_date': result[8],
                'exit_date': result[9],
                'safety_score': result[10],
                'current_location': json.loads(result[11]) if result[11] else None,
                'last_seen': result[12],
                'status': result[13]
            }
        return None
    
    def get_all_tourists(self):
        """Get all active tourists"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM tourists WHERE status = "active"')
        results = cursor.fetchall()
        
        tourists = []
        for result in results:
            tourists.append({
                'id': result[0],
                'digital_id': result[1],
                'name': result[2],
                'nationality': result[3],
                'safety_score': result[10],
                'current_location': json.loads(result[11]) if result[11] else None,
                'last_seen': result[12]
            })
        
        conn.close()
        return tourists
    
    def get_recent_alerts(self, limit=10):
        """Get recent alerts"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT a.*, t.name, t.digital_id 
            FROM alerts a 
            JOIN tourists t ON a.tourist_id = t.id 
            ORDER BY a.timestamp DESC 
            LIMIT ?
        ''', (limit,))
        
        results = cursor.fetchall()
        alerts = []
        
        for result in results:
            alerts.append({
                'id': result[0],
                'tourist_id': result[1],
                'alert_type': result[2],
                'location': json.loads(result[3]) if result[3] else None,
                'severity': result[4],
                'timestamp': result[5],
                'description': result[6],
                'resolved': result[7],
                'tourist_name': result[8],
                'digital_id': result[9]
            })
        
        conn.close()
        return alerts
    
    def detect_violence_around_tourists(self, frame, detected_tourists, violence_model):
        """Detect violence in regions where tourists are present"""
        violence_alerts = []
        
        try:
            # Run violence detection on the entire frame
            pose, weapon, blood = violence_model.predict(frame)
            
            if pose or weapon or blood:
                # Violence detected - check if tourists are in the area
                for tourist in detected_tourists:
                    # Create violence alert for this tourist
                    alert_data = {
                        'tourist_id': tourist['tourist_id'],
                        'tourist_name': tourist['name'],
                        'alert_type': 'violence_detected',
                        'severity': 'high',
                        'location': tourist['location'],
                        'region_id': tourist.get('region_id', 'unknown'),
                        'violence_types': []
                    }
                    
                    # Determine violence types
                    if pose:
                        alert_data['violence_types'].append('aggressive_pose')
                    if weapon:
                        alert_data['violence_types'].append('weapon_detected')
                    if blood:
                        alert_data['violence_types'].append('blood_detected')
                    
                    # Create alert in database
                    self.create_alert(
                        tourist['tourist_id'],
                        'violence_detected',
                        tourist['location'],
                        'high'
                    )
                    
                    violence_alerts.append(alert_data)
            
            return violence_alerts
            
        except Exception as e:
            print(f"Error in violence detection around tourists: {e}")
            return []
    
    def get_region_statistics(self, region_id):
        """Get statistics for a specific region"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get tourist count in region
        cursor.execute('''
            SELECT COUNT(*) FROM tourists 
            WHERE current_location LIKE ? AND status = 'active'
        ''', (f'%{region_id}%',))
        tourist_count = cursor.fetchone()[0]
        
        # Get recent alerts in region
        cursor.execute('''
            SELECT COUNT(*) FROM alerts a
            JOIN tourists t ON a.tourist_id = t.id
            WHERE t.current_location LIKE ? AND a.timestamp > datetime('now', '-1 hour')
        ''', (f'%{region_id}%',))
        recent_alerts = cursor.fetchone()[0]
        
        # Get average safety score in region
        cursor.execute('''
            SELECT AVG(safety_score) FROM tourists 
            WHERE current_location LIKE ? AND status = 'active'
        ''', (f'%{region_id}%',))
        avg_safety = cursor.fetchone()[0] or 0.5
        
        conn.close()
        
        return {
            'region_id': region_id,
            'tourist_count': tourist_count,
            'recent_alerts': recent_alerts,
            'avg_safety_score': avg_safety,
            'risk_level': 'high' if recent_alerts > 2 else 'medium' if recent_alerts > 0 else 'low'
        }
