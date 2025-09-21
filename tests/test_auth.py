"""
Unit tests for SafeYatri authentication system
"""

import pytest
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from auth.models import AuthManager, User
from auth.jwt_manager import JWTManager
from auth.middleware import AuthMiddleware
import tempfile
import json

class TestAuthManager:
    """Test cases for AuthManager"""
    
    @pytest.fixture
    def auth_manager(self):
        """Create temporary auth manager for testing"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
            db_path = tmp.name
        manager = AuthManager(db_path)
        yield manager
        os.unlink(db_path)
    
    def test_create_user(self, auth_manager):
        """Test user creation"""
        user_id = auth_manager.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            role="dispatcher"
        )
        
        assert user_id is not None
        assert len(user_id) > 0
        
        # Verify user exists
        user = auth_manager.get_user_by_username("testuser")
        assert user is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.role == "dispatcher"
    
    def test_authenticate_user(self, auth_manager):
        """Test user authentication"""
        # Create user
        auth_manager.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            role="dispatcher"
        )
        
        # Test valid credentials
        user = auth_manager.authenticate_user("testuser", "testpass123")
        assert user is not None
        assert user.username == "testuser"
        
        # Test invalid credentials
        user = auth_manager.authenticate_user("testuser", "wrongpass")
        assert user is None
    
    def test_hash_password(self, auth_manager):
        """Test password hashing"""
        password = "testpass123"
        hashed = auth_manager.hash_password(password)
        
        assert hashed != password
        assert ":" in hashed  # Should contain salt:hash format
        
        # Test password verification
        assert auth_manager.verify_password(password, hashed) == True
        assert auth_manager.verify_password("wrongpass", hashed) == False
    
    def test_setup_totp(self, auth_manager):
        """Test TOTP setup"""
        # Create user
        user_id = auth_manager.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            role="dispatcher"
        )
        
        # Setup TOTP
        secret, qr_code = auth_manager.setup_totp(user_id)
        
        assert secret is not None
        assert len(secret) == 32  # Base32 secret length
        assert qr_code is not None
        
        # Verify TOTP verification
        import pyotp
        totp = pyotp.TOTP(secret)
        token = totp.now()
        
        assert auth_manager.verify_totp(user_id, token) == True
        assert auth_manager.verify_totp(user_id, "000000") == False
    
    def test_audit_logging(self, auth_manager):
        """Test audit logging"""
        user_id = "test_user_123"
        
        # Log audit event
        auth_manager.log_audit_event(
            user_id=user_id,
            action="test_action",
            resource_type="test_resource",
            resource_id="test_id",
            ip_address="127.0.0.1",
            user_agent="test_agent",
            details="test details"
        )
        
        # Get audit logs
        logs = auth_manager.get_audit_logs(user_id, limit=10)
        
        assert len(logs) == 1
        assert logs[0]['user_id'] == user_id
        assert logs[0]['action'] == "test_action"
        assert logs[0]['resource_type'] == "test_resource"

class TestJWTManager:
    """Test cases for JWTManager"""
    
    @pytest.fixture
    def jwt_manager(self):
        """Create JWT manager for testing"""
        return JWTManager("test-secret-key")
    
    def test_generate_access_token(self, jwt_manager):
        """Test access token generation"""
        user_id = "test_user_123"
        role = "dispatcher"
        permissions = ["read", "write"]
        
        token = jwt_manager.generate_access_token(user_id, role, permissions)
        
        assert token is not None
        assert len(token) > 0
        
        # Verify token
        payload = jwt_manager.verify_token(token)
        assert payload is not None
        assert payload['user_id'] == user_id
        assert payload['role'] == role
        assert payload['permissions'] == permissions
        assert payload['type'] == 'access'
    
    def test_generate_refresh_token(self, jwt_manager):
        """Test refresh token generation"""
        user_id = "test_user_123"
        
        token = jwt_manager.generate_refresh_token(user_id)
        
        assert token is not None
        assert len(token) > 0
        
        # Verify token
        payload = jwt_manager.verify_token(token)
        assert payload is not None
        assert payload['user_id'] == user_id
        assert payload['type'] == 'refresh'
    
    def test_token_verification(self, jwt_manager):
        """Test token verification"""
        user_id = "test_user_123"
        role = "dispatcher"
        permissions = ["read", "write"]
        
        # Generate token
        token = jwt_manager.generate_access_token(user_id, role, permissions)
        
        # Verify valid token
        payload = jwt_manager.verify_token(token)
        assert payload is not None
        assert payload['user_id'] == user_id
        
        # Test invalid token
        invalid_payload = jwt_manager.verify_token("invalid.token.here")
        assert invalid_payload is None
    
    def test_permission_checking(self, jwt_manager):
        """Test permission checking"""
        user_id = "test_user_123"
        role = "dispatcher"
        permissions = ["read", "write", "dispatch"]
        
        token = jwt_manager.generate_access_token(user_id, role, permissions)
        
        # Test valid permissions
        assert jwt_manager.has_permission(token, "read") == True
        assert jwt_manager.has_permission(token, "write") == True
        assert jwt_manager.has_permission(token, "dispatch") == True
        
        # Test invalid permissions
        assert jwt_manager.has_permission(token, "admin") == False
        assert jwt_manager.has_permission(token, "delete") == False

class TestUser:
    """Test cases for User model"""
    
    def test_user_creation(self):
        """Test user object creation"""
        user = User(
            user_id="test_123",
            username="testuser",
            email="test@example.com",
            role="dispatcher",
            is_active=True
        )
        
        assert user.user_id == "test_123"
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.role == "dispatcher"
        assert user.is_active == True
    
    def test_permission_checking(self):
        """Test user permission checking"""
        user = User(
            user_id="test_123",
            username="testuser",
            email="test@example.com",
            role="dispatcher"
        )
        
        # Test valid permissions
        assert user.has_permission("read") == True
        assert user.has_permission("write") == True
        assert user.has_permission("dispatch") == True
        
        # Test invalid permissions
        assert user.has_permission("admin") == False
        assert user.has_permission("delete") == False
    
    def test_forensics_access(self):
        """Test forensics access checking"""
        # Admin should have forensics access
        admin_user = User(
            user_id="admin_123",
            username="admin",
            email="admin@example.com",
            role="admin"
        )
        assert admin_user.can_access_forensics() == True
        
        # Dispatcher should not have forensics access
        dispatcher_user = User(
            user_id="disp_123",
            username="dispatcher",
            email="disp@example.com",
            role="dispatcher"
        )
        assert dispatcher_user.can_access_forensics() == False
    
    def test_to_dict(self):
        """Test user to dictionary conversion"""
        user = User(
            user_id="test_123",
            username="testuser",
            email="test@example.com",
            role="dispatcher",
            is_active=True,
            created_at="2024-01-01T00:00:00",
            last_login="2024-01-01T12:00:00"
        )
        
        user_dict = user.to_dict()
        
        assert user_dict['user_id'] == "test_123"
        assert user_dict['username'] == "testuser"
        assert user_dict['email'] == "test@example.com"
        assert user_dict['role'] == "dispatcher"
        assert user_dict['is_active'] == True
        assert user_dict['created_at'] == "2024-01-01T00:00:00"
        assert user_dict['last_login'] == "2024-01-01T12:00:00"

if __name__ == "__main__":
    pytest.main([__file__])
