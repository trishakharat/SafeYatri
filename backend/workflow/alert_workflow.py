"""
Human-in-the-loop alert workflow for SafeYatri
"""
import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class AlertStatus(Enum):
    """Alert status enumeration"""
    PENDING = "pending"
    REVIEWING = "reviewing"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    ESCALATED = "escalated"
    RESOLVED = "resolved"

class AlertPriority(Enum):
    """Alert priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertWorkflow:
    """Human-in-the-loop alert workflow management"""
    
    def __init__(self, db_path: str = "workflow_database.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize workflow database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Alert workflow table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alert_workflow (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_id TEXT UNIQUE NOT NULL,
                tourist_id TEXT NOT NULL,
                alert_type TEXT NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                location TEXT,
                evidence_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                assigned_to TEXT,
                reviewed_by TEXT,
                reviewed_at TIMESTAMP,
                confidence_score REAL,
                dispatch_decision TEXT,
                dispatch_notes TEXT,
                escalation_reason TEXT,
                resolution_notes TEXT,
                auto_escalate_at TIMESTAMP
            )
        ''')
        
        # Dispatcher inbox table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dispatcher_inbox (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_id TEXT NOT NULL,
                dispatcher_id TEXT NOT NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                reviewed_at TIMESTAMP,
                FOREIGN KEY (alert_id) REFERENCES alert_workflow (alert_id)
            )
        ''')
        
        # Alert evidence table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alert_evidence (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_id TEXT NOT NULL,
                evidence_type TEXT NOT NULL,
                evidence_path TEXT NOT NULL,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (alert_id) REFERENCES alert_workflow (alert_id)
            )
        ''')
        
        # Workflow configuration table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS workflow_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                config_key TEXT UNIQUE NOT NULL,
                config_value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert default workflow configuration
        cursor.execute('''
            INSERT OR IGNORE INTO workflow_config (config_key, config_value)
            VALUES 
                ('auto_escalate_minutes', '5'),
                ('max_pending_alerts', '10'),
                ('dispatcher_rotation', 'true'),
                ('evidence_retention_days', '30')
        ''')
        
        conn.commit()
        conn.close()
    
    def create_alert(self, tourist_id: str, alert_type: str, location: Dict,
                    evidence_path: str = None, priority: str = "medium",
                    auto_escalate_minutes: int = 5) -> str:
        """Create new alert in workflow"""
        alert_id = f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{tourist_id[:8]}"
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Calculate auto-escalate time
            auto_escalate_at = datetime.now() + timedelta(minutes=auto_escalate_minutes)
            
            cursor.execute('''
                INSERT INTO alert_workflow 
                (alert_id, tourist_id, alert_type, priority, status, location,
                 evidence_path, auto_escalate_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (alert_id, tourist_id, alert_type, priority, AlertStatus.PENDING.value,
                  json.dumps(location), evidence_path, auto_escalate_at.isoformat()))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Alert created: {alert_id} for tourist {tourist_id}")
            return alert_id
            
        except Exception as e:
            logger.error(f"Error creating alert: {e}")
            return None
    
    def assign_to_dispatcher(self, alert_id: str, dispatcher_id: str) -> bool:
        """Assign alert to dispatcher"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Update alert status
            cursor.execute('''
                UPDATE alert_workflow 
                SET status = ?, assigned_to = ?
                WHERE alert_id = ?
            ''', (AlertStatus.REVIEWING.value, dispatcher_id, alert_id))
            
            # Add to dispatcher inbox
            cursor.execute('''
                INSERT INTO dispatcher_inbox (alert_id, dispatcher_id, status)
                VALUES (?, ?, ?)
            ''', (alert_id, dispatcher_id, 'assigned'))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Alert {alert_id} assigned to dispatcher {dispatcher_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error assigning alert: {e}")
            return False
    
    def get_dispatcher_inbox(self, dispatcher_id: str) -> List[Dict]:
        """Get dispatcher's inbox"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT aw.alert_id, aw.tourist_id, aw.alert_type, aw.priority,
                       aw.status, aw.location, aw.evidence_path, aw.created_at,
                       aw.auto_escalate_at, di.assigned_at
                FROM alert_workflow aw
                JOIN dispatcher_inbox di ON aw.alert_id = di.alert_id
                WHERE di.dispatcher_id = ? AND di.status IN ('assigned', 'pending')
                ORDER BY aw.created_at DESC
            ''', (dispatcher_id,))
            
            results = cursor.fetchall()
            conn.close()
            
            alerts = []
            for row in results:
                alerts.append({
                    'alert_id': row[0],
                    'tourist_id': row[1],
                    'alert_type': row[2],
                    'priority': row[3],
                    'status': row[4],
                    'location': json.loads(row[5]) if row[5] else {},
                    'evidence_path': row[6],
                    'created_at': row[7],
                    'auto_escalate_at': row[8],
                    'assigned_at': row[9],
                    'time_remaining': self._calculate_time_remaining(row[8])
                })
            
            return alerts
            
        except Exception as e:
            logger.error(f"Error getting dispatcher inbox: {e}")
            return []
    
    def _calculate_time_remaining(self, auto_escalate_at: str) -> int:
        """Calculate time remaining until auto-escalation (minutes)"""
        try:
            escalate_time = datetime.fromisoformat(auto_escalate_at)
            remaining = escalate_time - datetime.now()
            return max(0, int(remaining.total_seconds() / 60))
        except:
            return 0
    
    def review_alert(self, alert_id: str, dispatcher_id: str, 
                    confidence_score: float, decision: str, 
                    notes: str = None) -> bool:
        """Review alert and make dispatch decision"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Update alert workflow
            cursor.execute('''
                UPDATE alert_workflow 
                SET status = ?, reviewed_by = ?, reviewed_at = ?,
                    confidence_score = ?, dispatch_decision = ?, dispatch_notes = ?
                WHERE alert_id = ?
            ''', (decision, dispatcher_id, datetime.now().isoformat(),
                  confidence_score, decision, notes, alert_id))
            
            # Update dispatcher inbox
            cursor.execute('''
                UPDATE dispatcher_inbox 
                SET status = ?, reviewed_at = ?
                WHERE alert_id = ? AND dispatcher_id = ?
            ''', ('reviewed', datetime.now().isoformat(), alert_id, dispatcher_id))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Alert {alert_id} reviewed by {dispatcher_id}: {decision}")
            return True
            
        except Exception as e:
            logger.error(f"Error reviewing alert: {e}")
            return False
    
    def escalate_alert(self, alert_id: str, escalation_reason: str) -> bool:
        """Escalate alert to higher authority"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE alert_workflow 
                SET status = ?, escalation_reason = ?
                WHERE alert_id = ?
            ''', (AlertStatus.ESCALATED.value, escalation_reason, alert_id))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Alert {alert_id} escalated: {escalation_reason}")
            return True
            
        except Exception as e:
            logger.error(f"Error escalating alert: {e}")
            return False
    
    def resolve_alert(self, alert_id: str, resolution_notes: str) -> bool:
        """Resolve alert"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE alert_workflow 
                SET status = ?, resolution_notes = ?
                WHERE alert_id = ?
            ''', (AlertStatus.RESOLVED.value, resolution_notes, alert_id))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Alert {alert_id} resolved")
            return True
            
        except Exception as e:
            logger.error(f"Error resolving alert: {e}")
            return False
    
    def get_alert_details(self, alert_id: str) -> Optional[Dict]:
        """Get detailed alert information"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM alert_workflow WHERE alert_id = ?
            ''', (alert_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return {
                    'id': result[0],
                    'alert_id': result[1],
                    'tourist_id': result[2],
                    'alert_type': result[3],
                    'priority': result[4],
                    'status': result[5],
                    'location': json.loads(result[6]) if result[6] else {},
                    'evidence_path': result[7],
                    'created_at': result[8],
                    'assigned_to': result[9],
                    'reviewed_by': result[10],
                    'reviewed_at': result[11],
                    'confidence_score': result[12],
                    'dispatch_decision': result[13],
                    'dispatch_notes': result[14],
                    'escalation_reason': result[15],
                    'resolution_notes': result[16],
                    'auto_escalate_at': result[17]
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting alert details: {e}")
            return None
    
    def get_workflow_statistics(self) -> Dict:
        """Get workflow statistics"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get status counts
            cursor.execute('''
                SELECT status, COUNT(*) FROM alert_workflow 
                WHERE created_at > datetime('now', '-24 hours')
                GROUP BY status
            ''')
            
            status_counts = dict(cursor.fetchall())
            
            # Get priority distribution
            cursor.execute('''
                SELECT priority, COUNT(*) FROM alert_workflow 
                WHERE created_at > datetime('now', '-24 hours')
                GROUP BY priority
            ''')
            
            priority_counts = dict(cursor.fetchall())
            
            # Get average response time
            cursor.execute('''
                SELECT AVG(
                    (julianday(reviewed_at) - julianday(created_at)) * 24 * 60
                ) as avg_response_minutes
                FROM alert_workflow 
                WHERE reviewed_at IS NOT NULL 
                AND created_at > datetime('now', '-24 hours')
            ''')
            
            avg_response = cursor.fetchone()[0] or 0
            
            conn.close()
            
            return {
                'status_counts': status_counts,
                'priority_counts': priority_counts,
                'avg_response_minutes': round(avg_response, 2),
                'total_alerts_24h': sum(status_counts.values())
            }
            
        except Exception as e:
            logger.error(f"Error getting workflow statistics: {e}")
            return {}
    
    def check_auto_escalation(self) -> List[str]:
        """Check for alerts that need auto-escalation"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT alert_id FROM alert_workflow 
                WHERE status = ? AND auto_escalate_at <= ?
            ''', (AlertStatus.PENDING.value, datetime.now().isoformat()))
            
            results = cursor.fetchall()
            conn.close()
            
            alert_ids = [row[0] for row in results]
            
            # Auto-escalate these alerts
            for alert_id in alert_ids:
                self.escalate_alert(alert_id, "Auto-escalated due to timeout")
            
            return alert_ids
            
        except Exception as e:
            logger.error(f"Error checking auto-escalation: {e}")
            return []
