#!/usr/bin/env python3
"""
SafeYatri Demo Script
Demonstrates the complete tourist safety monitoring workflow
"""

import requests
import json
import time
import random
from datetime import datetime
import sys

class SafeYatriDemo:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.tourist_id = None
        
    def login(self, username="admin", password="SafeYatri@2024"):
        """Login to SafeYatri system"""
        print("🔐 Logging in to SafeYatri...")
        
        response = self.session.post(f"{self.base_url}/api/auth/login", json={
            "username": username,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data['access_token']
            self.session.headers.update({
                'Authorization': f'Bearer {self.access_token}'
            })
            print(f"✅ Logged in as {data['user']['username']} ({data['user']['role']})")
            return True
        else:
            print(f"❌ Login failed: {response.text}")
            return False
    
    def register_tourist(self):
        """Register a new tourist"""
        print("\n👤 Registering new tourist...")
        
        tourist_data = {
            "name": "Demo Tourist",
            "passport_number": f"P{random.randint(100000, 999999)}",
            "nationality": "Indian",
            "emergency_contact": "+91-9876543210",
            "trip_itinerary": "Guwahati -> Shillong -> Cherrapunji"
        }
        
        response = self.session.post(f"{self.base_url}/api/tourists/register", json=tourist_data)
        
        if response.status_code == 200:
            data = response.json()
            self.tourist_id = data['tourist_id']
            print(f"✅ Tourist registered: {data['tourist_id']}")
            print(f"   Name: {data['name']}")
            print(f"   Digital ID: {data['digital_id']}")
            return True
        else:
            print(f"❌ Tourist registration failed: {response.text}")
            return False
    
    def setup_consent(self):
        """Setup tourist consent"""
        print("\n📋 Setting up tourist consent...")
        
        consent_data = {
            "face_matching": True,
            "location_tracking": True,
            "data_retention": True,
            "emergency_contact": True,
            "analytics": False
        }
        
        response = self.session.post(f"{self.base_url}/api/privacy/consent/{self.tourist_id}", json=consent_data)
        
        if response.status_code == 200:
            print("✅ Consent preferences set")
            return True
        else:
            print(f"❌ Consent setup failed: {response.text}")
            return False
    
    def register_iot_device(self):
        """Register IoT device for tourist"""
        print("\n📱 Registering IoT device...")
        
        device_data = {
            "tourist_id": self.tourist_id,
            "device_type": "smart_band"
        }
        
        response = self.session.post(f"{self.base_url}/api/iot/register", json=device_data)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ IoT device registered: {data['device_id']}")
            return True
        else:
            print(f"❌ IoT device registration failed: {response.text}")
            return False
    
    def simulate_violence_alert(self):
        """Simulate violence detection alert"""
        print("\n🚨 Simulating violence detection...")
        
        # This would normally be triggered by the CCTV system
        # For demo, we'll simulate the alert creation
        alert_data = {
            "tourist_id": self.tourist_id,
            "alert_type": "violence_detected",
            "location": {
                "latitude": 26.1445,
                "longitude": 91.7362,
                "zone": "cctv_zone_1"
            },
            "violence_types": ["aggressive_pose", "weapon_detected"],
            "severity": "high",
            "confidence": 0.85
        }
        
        print("⚠️  VIOLENCE DETECTED!")
        print(f"   Tourist: {self.tourist_id}")
        print(f"   Location: {alert_data['location']['zone']}")
        print(f"   Types: {', '.join(alert_data['violence_types'])}")
        print(f"   Confidence: {alert_data['confidence']*100:.1f}%")
        
        return True
    
    def check_dispatcher_inbox(self):
        """Check dispatcher inbox for alerts"""
        print("\n📥 Checking dispatcher inbox...")
        
        response = self.session.get(f"{self.base_url}/api/workflow/dispatcher-inbox")
        
        if response.status_code == 200:
            data = response.json()
            alerts = data.get('alerts', [])
            print(f"📊 Found {len(alerts)} alerts in dispatcher inbox")
            
            for alert in alerts:
                print(f"   Alert {alert['alert_id']}: {alert['alert_type']} - {alert['priority']}")
            
            return alerts
        else:
            print(f"❌ Failed to get dispatcher inbox: {response.text}")
            return []
    
    def review_alert(self, alert_id):
        """Review and make decision on alert"""
        print(f"\n👮 Reviewing alert {alert_id}...")
        
        # Simulate dispatcher review
        decision_data = {
            "confidence_score": 0.85,
            "decision": "confirmed",
            "notes": "High confidence violence detection. Dispatching emergency response."
        }
        
        response = self.session.post(f"{self.base_url}/api/workflow/alert/{alert_id}/review", json=decision_data)
        
        if response.status_code == 200:
            print("✅ Alert reviewed and confirmed for dispatch")
            return True
        else:
            print(f"❌ Alert review failed: {response.text}")
            return False
    
    def get_dashboard_stats(self):
        """Get dashboard statistics"""
        print("\n📊 Getting dashboard statistics...")
        
        response = self.session.get(f"{self.base_url}/api/dashboard/stats")
        
        if response.status_code == 200:
            data = response.json()
            print("📈 Dashboard Statistics:")
            print(f"   Active Tourists: {data.get('active_tourists', 0)}")
            print(f"   Active Alerts: {data.get('active_alerts', 0)}")
            print(f"   IoT Devices: {data.get('iot_devices', 0)}")
            return data
        else:
            print(f"❌ Failed to get dashboard stats: {response.text}")
            return None
    
    def get_audit_logs(self):
        """Get audit logs"""
        print("\n📋 Getting audit logs...")
        
        response = self.session.get(f"{self.base_url}/api/auth/audit-logs")
        
        if response.status_code == 200:
            data = response.json()
            logs = data.get('logs', [])
            print(f"📝 Found {len(logs)} audit log entries")
            
            for log in logs[:5]:  # Show last 5 entries
                print(f"   {log['timestamp']}: {log['action']} by {log['user_id']}")
            
            return logs
        else:
            print(f"❌ Failed to get audit logs: {response.text}")
            return []
    
    def run_complete_demo(self):
        """Run complete demo scenario"""
        print("🎬 Starting SafeYatri Demo Scenario")
        print("=" * 50)
        
        # Step 1: Login
        if not self.login():
            return False
        
        # Step 2: Register tourist
        if not self.register_tourist():
            return False
        
        # Step 3: Setup consent
        if not self.setup_consent():
            return False
        
        # Step 4: Register IoT device
        if not self.register_iot_device():
            return False
        
        # Step 5: Simulate violence detection
        self.simulate_violence_alert()
        
        # Step 6: Check dashboard stats
        self.get_dashboard_stats()
        
        # Step 7: Check dispatcher inbox
        alerts = self.check_dispatcher_inbox()
        
        # Step 8: Review alert (if any)
        if alerts:
            alert_id = alerts[0]['alert_id']
            self.review_alert(alert_id)
        
        # Step 9: Get audit logs
        self.get_audit_logs()
        
        print("\n🎉 Demo completed successfully!")
        print("=" * 50)
        print("🔗 Access points:")
        print(f"   Main Website: {self.base_url}")
        print(f"   Dashboard: {self.base_url}/dashboard")
        print(f"   Dispatcher: {self.base_url}/dispatcher")
        print(f"   API Docs: {self.base_url}/api/docs")
        
        return True

def main():
    """Main demo function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='SafeYatri Demo Script')
    parser.add_argument('--url', default='http://localhost:5000', help='Base URL for SafeYatri API')
    parser.add_argument('--username', default='admin', help='Username for login')
    parser.add_argument('--password', default='SafeYatri@2024', help='Password for login')
    
    args = parser.parse_args()
    
    demo = SafeYatriDemo(args.url)
    
    try:
        success = demo.run_complete_demo()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Demo interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Demo failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
