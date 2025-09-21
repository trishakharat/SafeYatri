"""
Authentication middleware for SafeYatri
"""
from functools import wraps
from flask import request, jsonify, g
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

class AuthMiddleware:
    """Authentication middleware for route protection"""
    
    def __init__(self, jwt_manager, auth_manager):
        self.jwt_manager = jwt_manager
        self.auth_manager = auth_manager
    
    def require_auth(self, permissions: List[str] = None):
        """Decorator to require authentication and specific permissions"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # Get token from Authorization header
                auth_header = request.headers.get('Authorization')
                if not auth_header or not auth_header.startswith('Bearer '):
                    return jsonify({'error': 'Missing or invalid authorization header'}), 401
                
                token = auth_header.split(' ')[1]
                
                # Verify token
                payload = self.jwt_manager.verify_token(token)
                if not payload:
                    return jsonify({'error': 'Invalid or expired token'}), 401
                
                # Check if it's an access token
                if not self.jwt_manager.is_access_token(token):
                    return jsonify({'error': 'Invalid token type'}), 401
                
                # Get user info
                user_id = payload.get('user_id')
                user = self.auth_manager.get_user_by_id(user_id)
                
                if not user or not user.is_active:
                    return jsonify({'error': 'User not found or inactive'}), 401
                
                # Check permissions
                if permissions:
                    user_permissions = self.jwt_manager.get_permissions(token)
                    if not any(perm in user_permissions for perm in permissions):
                        return jsonify({'error': 'Insufficient permissions'}), 403
                
                # Store user info in g for use in route
                g.current_user = user
                g.user_id = user_id
                g.user_role = user.role
                g.user_permissions = self.jwt_manager.get_permissions(token)
                
                # Log access
                self.auth_manager.log_audit_event(
                    user_id=user_id,
                    action='api_access',
                    resource_type='endpoint',
                    resource_id=request.endpoint,
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get('User-Agent'),
                    details=f"Accessed {request.method} {request.path}"
                )
                
                return f(*args, **kwargs)
            return decorated_function
        return decorator
    
    def require_forensics_access(self):
        """Decorator to require forensics access (unblurred faces)"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # First check basic auth
                auth_result = self.require_auth(['forensics'])(f)(*args, **kwargs)
                if isinstance(auth_result, tuple) and auth_result[1] in [401, 403]:
                    return auth_result
                
                # Log forensics access
                self.auth_manager.log_audit_event(
                    user_id=g.user_id,
                    action='forensics_access',
                    resource_type='evidence',
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get('User-Agent'),
                    details='Accessed unblurred evidence - requires forensics permission'
                )
                
                return f(*args, **kwargs)
            return decorated_function
        return decorator
    
    def rate_limit(self, max_requests: int = 100, window_minutes: int = 15):
        """Simple rate limiting decorator"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # Simple rate limiting based on IP
                # In production, use Redis or similar
                ip = request.remote_addr
                # For demo, we'll just log the request
                logger.info(f"Rate limit check for IP {ip} on {request.endpoint}")
                return f(*args, **kwargs)
            return decorated_function
        return decorator

def get_current_user():
    """Get current authenticated user"""
    return getattr(g, 'current_user', None)

def get_current_user_id():
    """Get current user ID"""
    return getattr(g, 'user_id', None)

def get_current_user_role():
    """Get current user role"""
    return getattr(g, 'user_role', None)

def get_current_user_permissions():
    """Get current user permissions"""
    return getattr(g, 'user_permissions', [])
