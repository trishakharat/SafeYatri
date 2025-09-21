"""
User and Role models for SafeYatri authentication system
"""
import sqlite3
import hashlib
import secrets
import pyotp
import qrcode
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import json

class User:
    """User model with role-based access control"""
    
    ROLES = {
        'admin': ['read', 'write', 'delete', 'audit', 'forensics'],
        'dispatcher': ['read', 'write', 'dispatch'],
        'police': ['read', 'write'],
        'tourism_officer': ['read', 'write'],
        'auditor': ['read', 'audit']
    }
    
    def __init__(self, user_id: str, username: str, email: str, role: str, 
                 is_active: bool = True, totp_secret: str = None, 
                 created_at: str = None, last_login: str = None):
        self.user_id = user_id
        self.username = username
        self.email = email
        self.role = role
        self.is_active = is_active
        self.totp_secret = totp_secret
        self.created_at = created_at or datetime.now().isoformat()
        self.last_login = last_login
        
    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission"""
        return permission in self.ROLES.get(self.role, [])
    
    def can_access_forensics(self) -> bool:
        """Check if user can access forensics (unblurred faces)"""
        return self.has_permission('forensics')
    
    def to_dict(self) -> Dict:
        """Convert user to dictionary"""
        return {
            'user_id': self.user_id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at,
            'last_login': self.last_login
        }

class AuthManager:
    """Authentication and authorization manager"""
    
    def __init__(self, db_path: str = "auth_database.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize authentication database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                totp_secret TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')
        
        # Sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        ''')
        
        # Refresh tokens table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                token_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_revoked BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        ''')
        
        # Audit log table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                action TEXT NOT NULL,
                resource_type TEXT,
                resource_id TEXT,
                ip_address TEXT,
                user_agent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                details TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        
        # Create default admin user
        self.create_default_admin()
    
    def create_default_admin(self):
        """Create default admin user if none exists"""
        try:
            admin_user = self.get_user_by_username('admin')
            if admin_user is None:
                self.create_user(
                    username='admin',
                    email='admin@safeyatri.gov.in',
                    password='SafeYatri@2024',
                    role='admin'
                )
                print("✅ Default admin user created (username: admin, password: SafeYatri@2024)")
        except Exception as e:
            print(f"Error creating default admin: {e}")
    
    def hash_password(self, password: str) -> str:
        """Hash password using SHA-256 with salt"""
        salt = secrets.token_hex(16)
        hash_obj = hashlib.sha256()
        hash_obj.update((password + salt).encode())
        return f"{salt}:{hash_obj.hexdigest()}"
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        try:
            salt, hash_value = password_hash.split(':')
            hash_obj = hashlib.sha256()
            hash_obj.update((password + salt).encode())
            return hash_obj.hexdigest() == hash_value
        except:
            return False
    
    def create_user(self, username: str, email: str, password: str, role: str) -> str:
        """Create new user"""
        if role not in User.ROLES:
            raise ValueError(f"Invalid role: {role}")
        
        user_id = f"user_{secrets.token_hex(8)}"
        password_hash = self.hash_password(password)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO users (user_id, username, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, username, email, password_hash, role))
        
        conn.commit()
        conn.close()
        
        return user_id
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id, username, email, role, is_active, totp_secret, 
                   created_at, last_login
            FROM users WHERE username = ?
        ''', (username,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return User(*result)
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id, username, email, role, is_active, totp_secret,
                   created_at, last_login
            FROM users WHERE user_id = ?
        ''', (user_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return User(*result)
        return None
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate user with username and password"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id, username, email, password_hash, role, is_active, 
                   totp_secret, created_at, last_login
            FROM users WHERE username = ? AND is_active = TRUE
        ''', (username,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result and self.verify_password(password, result[3]):
            # Update last login
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE users SET last_login = ? WHERE user_id = ?
            ''', (datetime.now().isoformat(), result[0]))
            conn.commit()
            conn.close()
            
            return User(*result[:3] + result[4:])
        return None
    
    def setup_totp(self, user_id: str) -> tuple:
        """Setup TOTP for user"""
        secret = pyotp.random_base32()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users SET totp_secret = ? WHERE user_id = ?
        ''', (secret, user_id))
        
        conn.commit()
        conn.close()
        
        # Generate QR code
        user = self.get_user_by_id(user_id)
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name="SafeYatri"
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        return secret, qr
    
    def verify_totp(self, user_id: str, token: str) -> bool:
        """Verify TOTP token"""
        user = self.get_user_by_id(user_id)
        if not user or not user.totp_secret:
            return False
        
        totp = pyotp.TOTP(user.totp_secret)
        return totp.verify(token, valid_window=1)
    
    def log_audit_event(self, user_id: str, action: str, resource_type: str = None, 
                        resource_id: str = None, ip_address: str = None, 
                        user_agent: str = None, details: str = None):
        """Log audit event"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO audit_log (user_id, action, resource_type, resource_id,
                                 ip_address, user_agent, details)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, action, resource_type, resource_id, ip_address, user_agent, details))
        
        conn.commit()
        conn.close()
    
    def get_audit_logs(self, user_id: str = None, limit: int = 100) -> List[Dict]:
        """Get audit logs"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if user_id:
            cursor.execute('''
                SELECT user_id, action, resource_type, resource_id, ip_address,
                       user_agent, timestamp, details
                FROM audit_log WHERE user_id = ?
                ORDER BY timestamp DESC LIMIT ?
            ''', (user_id, limit))
        else:
            cursor.execute('''
                SELECT user_id, action, resource_type, resource_id, ip_address,
                       user_agent, timestamp, details
                FROM audit_log
                ORDER BY timestamp DESC LIMIT ?
            ''', (limit,))
        
        results = cursor.fetchall()
        conn.close()
        
        logs = []
        for result in results:
            logs.append({
                'user_id': result[0],
                'action': result[1],
                'resource_type': result[2],
                'resource_id': result[3],
                'ip_address': result[4],
                'user_agent': result[5],
                'timestamp': result[6],
                'details': result[7]
            })
        
        return logs
