"""
Consent management for SafeYatri privacy compliance
"""
import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class ConsentManager:
    """Manages tourist consent and privacy preferences"""
    
    CONSENT_TYPES = {
        'face_matching': 'Face matching for identification',
        'location_tracking': 'Real-time location tracking',
        'data_retention': 'Data retention for security purposes',
        'emergency_contact': 'Emergency contact notification',
        'analytics': 'Anonymous analytics and reporting'
    }
    
    def __init__(self, db_path: str = "consent_database.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize consent database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Tourist consent table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tourist_consent (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tourist_id TEXT NOT NULL,
                consent_type TEXT NOT NULL,
                consent_given BOOLEAN NOT NULL,
                consent_text TEXT,
                consent_version TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                user_agent TEXT,
                UNIQUE(tourist_id, consent_type)
            )
        ''')
        
        # Data retention policies table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS retention_policies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data_type TEXT NOT NULL,
                retention_days INTEGER NOT NULL,
                auto_delete BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert default retention policies
        cursor.execute('''
            INSERT OR IGNORE INTO retention_policies (data_type, retention_days, auto_delete)
            VALUES 
                ('video_evidence', 30, TRUE),
                ('location_data', 90, TRUE),
                ('alert_data', 365, FALSE),
                ('audit_logs', 2555, FALSE)  -- 7 years
        ''')
        
        conn.commit()
        conn.close()
    
    def record_consent(self, tourist_id: str, consent_type: str, 
                      consent_given: bool, consent_text: str = None,
                      ip_address: str = None, user_agent: str = None) -> bool:
        """Record tourist consent"""
        if consent_type not in self.CONSENT_TYPES:
            logger.error(f"Invalid consent type: {consent_type}")
            return False
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Insert or update consent record
            cursor.execute('''
                INSERT OR REPLACE INTO tourist_consent 
                (tourist_id, consent_type, consent_given, consent_text, 
                 consent_version, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (tourist_id, consent_type, consent_given, consent_text,
                  '1.0', ip_address, user_agent))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Consent recorded for tourist {tourist_id}: {consent_type} = {consent_given}")
            return True
            
        except Exception as e:
            logger.error(f"Error recording consent: {e}")
            return False
    
    def get_consent_status(self, tourist_id: str, consent_type: str) -> Optional[bool]:
        """Get consent status for specific type"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT consent_given FROM tourist_consent 
                WHERE tourist_id = ? AND consent_type = ?
                ORDER BY timestamp DESC LIMIT 1
            ''', (tourist_id, consent_type))
            
            result = cursor.fetchone()
            conn.close()
            
            return result[0] if result else None
            
        except Exception as e:
            logger.error(f"Error getting consent status: {e}")
            return None
    
    def get_all_consent(self, tourist_id: str) -> Dict[str, bool]:
        """Get all consent statuses for tourist"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT consent_type, consent_given FROM tourist_consent 
                WHERE tourist_id = ?
                ORDER BY timestamp DESC
            ''', (tourist_id,))
            
            results = cursor.fetchall()
            conn.close()
            
            consent_dict = {}
            for consent_type, consent_given in results:
                consent_dict[consent_type] = consent_given
            
            return consent_dict
            
        except Exception as e:
            logger.error(f"Error getting all consent: {e}")
            return {}
    
    def create_consent_form(self, tourist_id: str) -> Dict:
        """Create consent form for tourist"""
        consent_form = {
            'tourist_id': tourist_id,
            'consent_types': {},
            'required_consents': ['face_matching', 'location_tracking'],
            'optional_consents': ['data_retention', 'emergency_contact', 'analytics']
        }
        
        for consent_type, description in self.CONSENT_TYPES.items():
            consent_form['consent_types'][consent_type] = {
                'description': description,
                'required': consent_type in consent_form['required_consents'],
                'current_status': self.get_consent_status(tourist_id, consent_type)
            }
        
        return consent_form
    
    def process_consent_form(self, tourist_id: str, consent_data: Dict,
                           ip_address: str = None, user_agent: str = None) -> Dict:
        """Process consent form submission"""
        results = {
            'success': True,
            'consent_recorded': [],
            'consent_updated': [],
            'errors': []
        }
        
        for consent_type, consent_given in consent_data.items():
            if consent_type not in self.CONSENT_TYPES:
                results['errors'].append(f"Invalid consent type: {consent_type}")
                continue
            
            try:
                # Record consent
                success = self.record_consent(
                    tourist_id, consent_type, consent_given,
                    ip_address=ip_address, user_agent=user_agent
                )
                
                if success:
                    results['consent_recorded'].append(consent_type)
                else:
                    results['errors'].append(f"Failed to record consent for {consent_type}")
                    
            except Exception as e:
                results['errors'].append(f"Error processing {consent_type}: {str(e)}")
        
        results['success'] = len(results['errors']) == 0
        return results
    
    def get_retention_policy(self, data_type: str) -> Optional[Dict]:
        """Get retention policy for data type"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT retention_days, auto_delete FROM retention_policies 
                WHERE data_type = ?
            ''', (data_type,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return {
                    'data_type': data_type,
                    'retention_days': result[0],
                    'auto_delete': bool(result[1])
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting retention policy: {e}")
            return None
    
    def should_delete_data(self, data_type: str, created_at: str) -> bool:
        """Check if data should be deleted based on retention policy"""
        policy = self.get_retention_policy(data_type)
        if not policy or not policy['auto_delete']:
            return False
        
        try:
            created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            retention_days = policy['retention_days']
            expiry_date = created_date + timedelta(days=retention_days)
            
            return datetime.now() > expiry_date
            
        except Exception as e:
            logger.error(f"Error checking data deletion: {e}")
            return False
    
    def get_consent_statistics(self) -> Dict:
        """Get consent statistics for reporting"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get consent counts by type
            cursor.execute('''
                SELECT consent_type, 
                       SUM(CASE WHEN consent_given = 1 THEN 1 ELSE 0 END) as given_count,
                       COUNT(*) as total_count
                FROM tourist_consent 
                GROUP BY consent_type
            ''')
            
            consent_stats = {}
            for consent_type, given_count, total_count in cursor.fetchall():
                consent_stats[consent_type] = {
                    'given': given_count,
                    'total': total_count,
                    'percentage': (given_count / total_count * 100) if total_count > 0 else 0
                }
            
            conn.close()
            return consent_stats
            
        except Exception as e:
            logger.error(f"Error getting consent statistics: {e}")
            return {}
    
    def export_consent_data(self, tourist_id: str = None) -> List[Dict]:
        """Export consent data for audit purposes"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if tourist_id:
                cursor.execute('''
                    SELECT tourist_id, consent_type, consent_given, consent_text,
                           timestamp, ip_address, user_agent
                    FROM tourist_consent WHERE tourist_id = ?
                    ORDER BY timestamp DESC
                ''', (tourist_id,))
            else:
                cursor.execute('''
                    SELECT tourist_id, consent_type, consent_given, consent_text,
                           timestamp, ip_address, user_agent
                    FROM tourist_consent 
                    ORDER BY timestamp DESC
                ''')
            
            results = cursor.fetchall()
            conn.close()
            
            export_data = []
            for row in results:
                export_data.append({
                    'tourist_id': row[0],
                    'consent_type': row[1],
                    'consent_given': bool(row[2]),
                    'consent_text': row[3],
                    'timestamp': row[4],
                    'ip_address': row[5],
                    'user_agent': row[6]
                })
            
            return export_data
            
        except Exception as e:
            logger.error(f"Error exporting consent data: {e}")
            return []
