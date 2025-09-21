"""
Authentication routes for SafeYatri
"""
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import secrets
import logging
from .models import AuthManager
from .jwt_manager import JWTManager
from .middleware import AuthMiddleware

logger = logging.getLogger(__name__)

# Create Blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Initialize managers
auth_manager = AuthManager()
jwt_manager = JWTManager()
auth_middleware = AuthMiddleware(jwt_manager, auth_manager)

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        # Authenticate user
        user = auth_manager.authenticate_user(username, password)
        if not user:
            auth_manager.log_audit_event(
                user_id=None,
                action='login_failed',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                details=f"Failed login attempt for username: {username}"
            )
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate tokens
        permissions = auth_manager.ROLES.get(user.role, [])
        access_token = jwt_manager.generate_access_token(user.user_id, user.role, permissions)
        refresh_token = jwt_manager.generate_refresh_token(user.user_id)
        
        # Log successful login
        auth_manager.log_audit_event(
            user_id=user.user_id,
            action='login_success',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            details=f"Successful login for user: {username}"
        )
        
        response_data = {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': 900,  # 15 minutes
            'user': {
                'user_id': user.user_id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'permissions': permissions
            }
        }
        
        # Check if 2FA is required for dispatcher
        if user.role == 'dispatcher' and not user.totp_secret:
            response_data['requires_2fa_setup'] = True
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token"""
    try:
        data = request.get_json()
        refresh_token = data.get('refresh_token')
        
        if not refresh_token:
            return jsonify({'error': 'Refresh token required'}), 400
        
        # Verify refresh token
        payload = jwt_manager.verify_token(refresh_token)
        if not payload or not jwt_manager.is_refresh_token(refresh_token):
            return jsonify({'error': 'Invalid refresh token'}), 401
        
        user_id = payload.get('user_id')
        user = auth_manager.get_user_by_id(user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        # Generate new access token
        permissions = auth_manager.ROLES.get(user.role, [])
        access_token = jwt_manager.generate_access_token(user.user_id, user.role, permissions)
        
        return jsonify({
            'access_token': access_token,
            'token_type': 'Bearer',
            'expires_in': 900
        })
        
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/logout', methods=['POST'])
@auth_middleware.require_auth()
def logout():
    """User logout endpoint"""
    try:
        # In a production system, you would revoke the refresh token
        # For demo, we'll just log the logout
        auth_manager.log_audit_event(
            user_id=g.user_id,
            action='logout',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            details="User logged out"
        )
        
        return jsonify({'message': 'Logged out successfully'})
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/setup-2fa', methods=['POST'])
@auth_middleware.require_auth(['write'])
def setup_2fa():
    """Setup 2FA for user"""
    try:
        user_id = g.user_id
        
        # Generate TOTP secret and QR code
        secret, qr_code = auth_manager.setup_totp(user_id)
        
        # Generate QR code as base64
        import io
        import base64
        from PIL import Image
        
        qr_img = qr_code.make_image(fill_color="black", back_color="white")
        img_buffer = io.BytesIO()
        qr_img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        qr_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        auth_manager.log_audit_event(
            user_id=user_id,
            action='2fa_setup',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            details="2FA setup initiated"
        )
        
        return jsonify({
            'secret': secret,
            'qr_code': f"data:image/png;base64,{qr_base64}",
            'message': 'Scan QR code with authenticator app'
        })
        
    except Exception as e:
        logger.error(f"2FA setup error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/verify-2fa', methods=['POST'])
@auth_middleware.require_auth(['write'])
def verify_2fa():
    """Verify 2FA token"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': '2FA token required'}), 400
        
        user_id = g.user_id
        
        # Verify TOTP token
        if auth_manager.verify_totp(user_id, token):
            auth_manager.log_audit_event(
                user_id=user_id,
                action='2fa_verified',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                details="2FA token verified successfully"
            )
            return jsonify({'message': '2FA verified successfully'})
        else:
            auth_manager.log_audit_event(
                user_id=user_id,
                action='2fa_failed',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                details="2FA token verification failed"
            )
            return jsonify({'error': 'Invalid 2FA token'}), 401
        
    except Exception as e:
        logger.error(f"2FA verification error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/me', methods=['GET'])
@auth_middleware.require_auth()
def get_current_user_info():
    """Get current user information"""
    try:
        user = g.current_user
        return jsonify({
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'permissions': g.user_permissions,
            'has_2fa': bool(user.totp_secret),
            'created_at': user.created_at,
            'last_login': user.last_login
        })
        
    except Exception as e:
        logger.error(f"Get user info error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/audit-logs', methods=['GET'])
@auth_middleware.require_auth(['audit'])
def get_audit_logs():
    """Get audit logs (auditor role only)"""
    try:
        limit = request.args.get('limit', 100, type=int)
        user_id = request.args.get('user_id')
        
        logs = auth_manager.get_audit_logs(user_id, limit)
        
        return jsonify({
            'logs': logs,
            'count': len(logs)
        })
        
    except Exception as e:
        logger.error(f"Get audit logs error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/create-user', methods=['POST'])
@auth_middleware.require_auth(['write'])
def create_user():
    """Create new user (admin only)"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')
        
        if not all([username, email, password, role]):
            return jsonify({'error': 'All fields required'}), 400
        
        if role not in auth_manager.ROLES:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Check if user already exists
        if auth_manager.get_user_by_username(username):
            return jsonify({'error': 'Username already exists'}), 409
        
        user_id = auth_manager.create_user(username, email, password, role)
        
        auth_manager.log_audit_event(
            user_id=g.user_id,
            action='user_created',
            resource_type='user',
            resource_id=user_id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            details=f"Created user: {username} with role: {role}"
        )
        
        return jsonify({
            'message': 'User created successfully',
            'user_id': user_id
        })
        
    except Exception as e:
        logger.error(f"Create user error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
