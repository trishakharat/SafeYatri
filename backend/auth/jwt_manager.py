"""
JWT token management for SafeYatri
"""
import jwt
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os

class JWTManager:
    """JWT token manager with secure token handling"""
    
    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or os.getenv('JWT_SECRET_KEY', secrets.token_hex(32))
        self.algorithm = 'HS256'
        self.access_token_expiry = timedelta(minutes=15)  # Short TTL
        self.refresh_token_expiry = timedelta(days=7)
    
    def generate_access_token(self, user_id: str, role: str, permissions: list) -> str:
        """Generate access token"""
        payload = {
            'user_id': user_id,
            'role': role,
            'permissions': permissions,
            'type': 'access',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + self.access_token_expiry
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def generate_refresh_token(self, user_id: str) -> str:
        """Generate refresh token"""
        payload = {
            'user_id': user_id,
            'type': 'refresh',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + self.refresh_token_expiry
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def is_access_token(self, token: str) -> bool:
        """Check if token is access token"""
        payload = self.verify_token(token)
        return payload and payload.get('type') == 'access'
    
    def is_refresh_token(self, token: str) -> bool:
        """Check if token is refresh token"""
        payload = self.verify_token(token)
        return payload and payload.get('type') == 'refresh'
    
    def get_user_id(self, token: str) -> Optional[str]:
        """Get user ID from token"""
        payload = self.verify_token(token)
        return payload.get('user_id') if payload else None
    
    def get_permissions(self, token: str) -> list:
        """Get permissions from token"""
        payload = self.verify_token(token)
        return payload.get('permissions', []) if payload else []
    
    def has_permission(self, token: str, permission: str) -> bool:
        """Check if token has specific permission"""
        permissions = self.get_permissions(token)
        return permission in permissions
