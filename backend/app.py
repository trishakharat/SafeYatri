# Enable eventlet for better WebSocket support
# eventlet is a high-performance networking library that allows for non-blocking I/O operations
import eventlet
eventlet.monkey_patch()  # Patch Python's standard library for non-blocking operations

# Import necessary libraries
# Web framework and utilities
from flask import Flask, render_template, Response, jsonify, request, g  # Core Flask functionality
from flask_socketio import SocketIO, emit  # WebSocket support for real-time communication
import cv2  # OpenCV for video processing and computer vision
import numpy as np  # Numerical computing for array operations
from detection.model import ViolenceModel  # Custom violence detection model
from detection.alert_manager import (  # Alert handling utilities
    send_email_with_attachment,  # Function to send email alerts with video evidence
    categorize_alert,  # Function to categorize detected threats
    create_detection_details  # Function to create detailed alert information
)
import threading  # For concurrent operations and thread safety
import time  # Time-related functions for cooldowns and timestamps
from collections import deque  # Efficient queue implementation for frame buffering
import os  # Operating system interface for file and environment operations
from dotenv import load_dotenv  # Environment variable management
from datetime import datetime  # Date and time utilities for timestamps
import logging  # Logging functionality for debugging and monitoring
from werkzeug.utils import secure_filename  # For secure file upload handling
import sqlite3  # Database for tourist data
import hashlib  # For digital ID generation
import uuid  # For unique identifiers
import requests  # For IoT device communication
import base64  # For image encoding
from functools import wraps  # For decorators
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from api_docs import api_docs_bp

# Authentication imports
from auth.routes import auth_bp
from auth.middleware import AuthMiddleware, get_current_user, get_current_user_id
from auth.models import AuthManager
from auth.jwt_manager import JWTManager

# Workflow imports
from workflow.alert_workflow import AlertWorkflow
from privacy.face_blur import FaceBlurProcessor, PrivacyManager
from privacy.consent_manager import ConsentManager

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask application with WebSocket support
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'safeyatri-secret-key')
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Prometheus metrics
ALERTS_TOTAL = Counter('alerts_total', 'Total number of alerts emitted', ['type'])
ALERT_PROCESSING_TIME_MS = Histogram('alert_processing_time_ms', 'Alert processing time in milliseconds')
WEBSOCKET_LATENCY_MS = Histogram('websocket_latency_ms', 'WebSocket emit latency in milliseconds')
DETECTION_CONFIDENCE_AVG = Histogram('detection_confidence', 'Detection confidence distribution', buckets=[i/10 for i in range(0, 11)])

# Initialize authentication and core managers
auth_manager = AuthManager()
jwt_manager = JWTManager()
auth_middleware = AuthMiddleware(jwt_manager, auth_manager)

# Initialize workflow and privacy components
alert_workflow = AlertWorkflow()
face_processor = FaceBlurProcessor()
privacy_manager = PrivacyManager()
consent_manager = ConsentManager()

# Register authentication blueprint
app.register_blueprint(auth_bp)
app.register_blueprint(api_docs_bp)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Application state management class
class AppState:
    """
    Manages the application's state including camera, detection status,
    and various monitoring statistics.
    """
    def __init__(self):
        # Camera and detection state
        self.camera = None  # OpenCV camera object
        self.is_detecting = False  # Flag for active detection status
        self.evidence_buffer = deque(maxlen=150)  # Buffer for recent frames (5 seconds at 30fps)
        self.last_alert_time = 0  # Timestamp of last alert for cooldown
        
        # Monitoring statistics
        self.detection_stats = {
            'total_detections': 0,  # Total number of detections
            'false_positives': 0,   # Number of false positive alerts
            'alert_history': [],    # History of all alerts
            'uptime': time.time(),  # Application start time
            'camera_status': 'offline'  # Current camera status
        }
        
        # Recording state
        self.recording = False  # Flag for active recording
        self.current_recording = None  # Current recording session
        self.zones = []  # List of monitoring zones
        
        # Video upload state
        self.uploaded_video = None  # Path to uploaded video
        self.is_processing_upload = False  # Flag for video processing status
        
        # Thread synchronization
        self._lock = threading.Lock()  # Lock for thread-safe camera operations

    def get_camera(self):
        """
        Thread-safe camera initialization and access.
        Returns initialized camera object or None if initialization fails.
        """
        with self._lock:  # Ensure thread safety for camera operations
            if self.camera is None or not self.camera.isOpened():
                try:
                    # Release existing camera if any
                    if self.camera is not None:
                        self.camera.release()
                    
                    # Initialize new camera
                    self.camera = cv2.VideoCapture(0)
                    if not self.camera.isOpened():
                        raise Exception("Could not open camera")
                    
                    # Configure camera settings for optimal performance
                    self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)  # Set resolution width
                    self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)  # Set resolution height
                    self.camera.set(cv2.CAP_PROP_FPS, 30)  # Set frame rate
                    
                    # Update camera status
                    self.detection_stats['camera_status'] = 'online'
                    logger.info("Camera initialized successfully")
                    
                except Exception as e:
                    logger.error(f"Camera initialization error: {str(e)}")
                    self.detection_stats['camera_status'] = 'error'
                    return None
            return self.camera

    def release_camera(self):
        """Thread-safe camera release"""
        with self._lock:
            if self.camera is not None:
                self.camera.release()
                self.camera = None
                self.detection_stats['camera_status'] = 'offline'

# Create global application state instance
app_state = AppState()
ALERT_COOLDOWN = 60  # Minimum time between alerts (seconds)

# Initialize the tourist detection and IoT management systems
try:
    # Ensure the detection directory exists
    os.makedirs("detection", exist_ok=True)
    
    # Import tourist detection and IoT management
    from detection.tourist_model import TouristDetectionModel
    from detection.iot_manager import IoTDeviceManager
    
    # Initialize tourist detection model
    tourist_model = TouristDetectionModel()
    logger.info("Tourist detection model initialized")
    
    # Initialize IoT device manager
    iot_manager = IoTDeviceManager()
    logger.info("IoT device manager initialized")
    
    # Initialize mock violence detection model for demonstration
    class MockViolenceModel:
        """
        Mock implementation of violence detection model for demonstration.
        In production, this would be replaced with a real ML model.
        """
        def predict(self, frame):
            """
            Simulates violence detection using basic motion detection.
            
            Args:
                frame: Video frame to analyze
                
            Returns:
                tuple: (motion_detected, weapon_detected, blood_detected)
            """
            # Convert frame to grayscale for motion detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # Apply Gaussian blur to reduce noise
            gray = cv2.GaussianBlur(gray, (21, 21), 0)
            
            # Detect significant changes in the frame
            if hasattr(self, 'prev_frame'):
                # Calculate absolute difference between current and previous frame
                diff = cv2.absdiff(self.prev_frame, gray)
                # Apply threshold to identify significant changes
                thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)[1]
                # Dilate thresholded image to fill in holes
                thresh = cv2.dilate(thresh, None, iterations=2)
                # Consider motion detected if enough pixels have changed
                motion = cv2.countNonZero(thresh) > 1000
            else:
                motion = False
            
            # Store current frame for next comparison
            self.prev_frame = gray
            return motion, False, False  # Return mock detection results (pose, weapon, blood)
    
    # Initialize the violence detection model
    model = MockViolenceModel()
    logger.info("Violence detection model initialized for demo")
    
except Exception as e:
    logger.error(f"Error initializing models: {str(e)}")
    model = None
    tourist_model = None
    iot_manager = None

def process_frame(frame):
    """
    Process video frame for tourist detection, violence detection and visualization.
    
    Args:
        frame: Video frame to process
        
    Returns:
        processed_frame: Frame with detection results visualized
    """
    if model is None and tourist_model is None:
        return frame

    try:
        # Create a copy for drawing overlays
        display_frame = frame.copy()
        
        # Draw monitoring zones on the frame
        for idx, zone in enumerate(app_state.zones):
            # Draw rectangle for each monitoring zone
            cv2.rectangle(display_frame, 
                         (zone['x1'], zone['y1']), 
                         (zone['x2'], zone['y2']), 
                         (0, 255, 0), 2)  # Green rectangle with 2px thickness
            # Add zone label
            cv2.putText(display_frame, f"Zone {idx+1}", 
                       (zone['x1'], zone['y1']-10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # Perform tourist detection with region monitoring
        detected_tourists = []
        violence_alerts = []
        if tourist_model is not None:
            try:
                # Detect tourists in the frame
                detected_tourists = tourist_model.detect_tourists(frame, region_id='cctv_zone_1')
                
                # Draw tourist bounding boxes and IDs
                for tourist in detected_tourists:
                    bbox = tourist['bbox']
                    x1, y1, x2, y2 = bbox
                    
                    # Draw bounding box
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                    
                    # Draw tourist ID and safety score
                    tourist_id = tourist.get('tourist_id', 'Unknown')
                    safety_score = tourist.get('safety_score', 0.5)
                    tourist_name = tourist.get('name', 'Unknown')
                    
                    # Color based on safety score
                    color = (0, 255, 0) if safety_score > 0.7 else (0, 165, 255) if safety_score > 0.4 else (0, 0, 255)
                    
                    cv2.putText(display_frame, f"ID: {tourist_id[:8]}", 
                               (x1, y1-40), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                    cv2.putText(display_frame, f"Name: {tourist_name}", 
                               (x1, y1-25), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
                    cv2.putText(display_frame, f"Safety: {safety_score:.2f}", 
                               (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
                    
                    # Update tourist location
                    if 'location' in tourist:
                        tourist_model.update_tourist_location(tourist_id, tourist['location'])
                
                # Check for violence around detected tourists
                if detected_tourists and model is not None:
                    violence_alerts = tourist_model.detect_violence_around_tourists(frame, detected_tourists, model)
                    
                    # Process violence alerts
                    for alert in violence_alerts:
                        # Emit real-time alert to authorities
                        socketio.emit('tourist_violence_alert', {
                            'tourist_id': alert['tourist_id'],
                            'tourist_name': alert['tourist_name'],
                            'alert_type': alert['alert_type'],
                            'severity': alert['severity'],
                            'location': alert['location'],
                            'region_id': alert['region_id'],
                            'violence_types': alert['violence_types'],
                            'timestamp': datetime.now().isoformat()
                        })
                        
                        # Log the alert
                        logger.warning(f"VIOLENCE ALERT: {alert['tourist_name']} ({alert['tourist_id']}) in region {alert['region_id']} - {alert['violence_types']}")
                        
            except Exception as e:
                logger.error(f"Tourist detection error: {str(e)}")

        # Perform violence detection
        pose, weapon, blood = False, False, False
        if model is not None:
            try:
                pose, weapon, blood = model.predict(frame)
            except Exception as e:
                logger.error(f"Model prediction error: {str(e)}")
        
        # Update detection statistics if any threat detected
        if pose or weapon or blood:
            app_state.detection_stats['total_detections'] += 1
            
        # Create detailed detection report
        detection_details = create_detection_details(pose, weapon, blood)
        
        # Check for alerts with cooldown
        current_time = time.time()
        alert_type = categorize_alert(pose, weapon, blood)
        
        # Handle alert generation if needed
        if alert_type and (current_time - app_state.last_alert_time) > ALERT_COOLDOWN:
            app_state.last_alert_time = current_time
            
            # Record alert in history
            app_state.detection_stats['alert_history'].append({
                'type': alert_type,
                'timestamp': datetime.now().isoformat(),
                'details': detection_details
            })
            
            # Emit alert through WebSocket for real-time notification
            socketio.emit('alert', {
                'type': alert_type,
                'details': detection_details,
                'timestamp': detection_details['timestamp']
            })
            
            # Send email alert with evidence
            try:
                send_email_with_attachment(
                    frame=frame,
                    alert_type=alert_type,
                    is_video=True,
                    video_frames=list(app_state.evidence_buffer),
                    detection_details=detection_details
                )
            except Exception as e:
                logger.error(f"Email alert error: {str(e)}")
        
        # Add frame to evidence buffer for alert attachments
        app_state.evidence_buffer.append(frame.copy())
        
        # Draw detection results on frame
        if pose or weapon or blood:
            cv2.putText(display_frame, f"Motion Detected", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Add tourist count overlay
        if detected_tourists:
            cv2.putText(display_frame, f"Tourists: {len(detected_tourists)}", 
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Add status overlay
        cv2.putText(display_frame, 
                   f"Status: {'Recording' if app_state.recording else 'Monitoring'}", 
                   (10, display_frame.shape[0] - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        return display_frame
    
    except Exception as e:
        logger.error(f"Frame processing error: {str(e)}")
        return frame

def generate_frames():
    """
    Generator function that yields processed video frames for streaming.
    Uses multipart/x-mixed-replace format for continuous streaming.
    """
    while True:
        try:
            # Get camera instance
            camera = app_state.get_camera()
            if camera is None:
                time.sleep(1)  # Wait before retrying camera initialization
                continue
                
            # Read frame from camera
            success, frame = camera.read()
            if not success:
                logger.warning("Failed to read frame from camera")
                app_state.detection_stats['camera_status'] = 'error'
                app_state.release_camera()
                continue
                
            # Process frame if detection is active
            if app_state.is_detecting:
                processed_frame = process_frame(frame)
            else:
                processed_frame = frame
            
            # Encode frame for streaming
            ret, buffer = cv2.imencode('.jpg', processed_frame)
            if not ret:
                continue
                
            # Yield frame in multipart format
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            
            # Add small delay to prevent high CPU usage
            eventlet.sleep(0.01)
            
        except Exception as e:
            logger.error(f"Frame generation error: {str(e)}")
            eventlet.sleep(1)  # Wait before retrying on error
            continue

# Route handlers
@app.route('/')
def index():
    """Render landing page"""
    return render_template('landing.html')

@app.route('/login')
def login_page():
    """Render login page"""
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    """Render authority dashboard"""
    return render_template('dashboard.html')

@app.route('/dispatcher')
def dispatcher():
    """Render dispatcher dashboard"""
    return render_template('dispatcher.html')

@app.route('/video_feed')
def video_feed():
    """
    Stream video feed using multipart response.
    This enables real-time video streaming in the browser.
    """
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/stats')
def get_stats():
    """
    Get system statistics including detection counts and uptime.
    Returns JSON response with current statistics.
    """
    stats = app_state.detection_stats.copy()
    stats['uptime'] = time.time() - stats['uptime']  # Calculate current uptime
    return jsonify(stats)

@app.route('/api/zones', methods=['GET', 'POST'])
def manage_zones():
    """
    Manage monitoring zones.
    GET: Retrieve list of current monitoring zones
    POST: Add new monitoring zone
    """
    if request.method == 'POST':
        zone = request.json
        app_state.zones.append({
            'x1': zone['x1'],
            'y1': zone['y1'],
            'x2': zone['x2'],
            'y2': zone['y2']
        })
        return jsonify({'status': 'success'})
    return jsonify({'zones': app_state.zones})

# Socket event handlers
@socketio.on('connect')
def handle_connect():
    """
    Handle new client WebSocket connection.
    Sends initial status update to connected client.
    """
    logger.info('Client connected')
    emit('status', {
        'status': 'Connected',
        'camera_status': app_state.detection_stats['camera_status'],
        'is_detecting': app_state.is_detecting
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info('Client disconnected')

@socketio.on('start_detection')
def handle_start_detection():
    """
    Start violence detection process.
    Enables frame processing and alert generation.
    """
    app_state.is_detecting = True
    emit('status', {'status': 'Detection started'})
    logger.info("Detection started")

@socketio.on('stop_detection')
def handle_stop_detection():
    """
    Stop violence detection process.
    Disables frame processing and alert generation.
    """
    app_state.is_detecting = False
    emit('status', {'status': 'Detection stopped'})
    logger.info("Detection stopped")

@socketio.on('toggle_recording')
def handle_toggle_recording():
    """
    Toggle video recording state.
    Switches between recording and monitoring modes.
    """
    app_state.recording = not app_state.recording
    status = 'started' if app_state.recording else 'stopped'
    emit('status', {'status': f'Recording {status}'})
    logger.info(f"Recording {status}")

@socketio.on('mark_false_positive')
def handle_false_positive():
    """
    Mark last detection as false positive.
    Updates statistics for system accuracy monitoring.
    """
    app_state.detection_stats['false_positives'] += 1
    emit('status', {'status': 'False positive recorded'})

def cleanup():
    """
    Cleanup resources before shutdown.
    Ensures camera is properly released.
    """
    app_state.release_camera()
    logger.info("Cleanup completed")

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_uploaded_video(video_path):
    """
    Process an uploaded video file for violence detection.
    
    Args:
        video_path: Path to the uploaded video file
    """
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception("Could not open video file")

        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps

        # Initialize detection summary
        detection_summary = {
            'violence_detected': False,
            'types_detected': set(),  # Using a set to avoid duplicates
            'first_detection_time': None,
            'total_violent_segments': 0
        }
        
        # Process frames
        frame_number = 0
        consecutive_detections = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Process every 5th frame to improve performance
            if frame_number % 5 == 0:
                # Perform detection
                motion, weapon, blood = model.predict(frame)
                
                if motion or weapon or blood:
                    detection_summary['violence_detected'] = True
                    timestamp = frame_number / fps
                    
                    # Record first detection time if not already set
                    if detection_summary['first_detection_time'] is None:
                        detection_summary['first_detection_time'] = timestamp
                    
                    # Add detected types to the summary
                    if motion:
                        detection_summary['types_detected'].add('Aggressive Motion/Pose')
                    if weapon:
                        detection_summary['types_detected'].add('Weapon')
                    if blood:
                        detection_summary['types_detected'].add('Blood')
                    
                    consecutive_detections += 1
                else:
                    if consecutive_detections > 0:
                        detection_summary['total_violent_segments'] += 1
                        consecutive_detections = 0

            frame_number += 1

        cap.release()
        
        # Format the detection summary
        result = {
            'status': 'success',
            'violence_detected': detection_summary['violence_detected'],
            'summary': {
                'duration': f"{duration:.1f} seconds",
                'violence_types': list(detection_summary['types_detected']),
                'first_detection': f"{detection_summary['first_detection_time']:.1f} seconds" if detection_summary['first_detection_time'] is not None else None,
                'violent_segments': detection_summary['total_violent_segments']
            }
        }
        
        # Add a human-readable conclusion
        if detection_summary['violence_detected']:
            types_list = ', '.join(detection_summary['types_detected'])
            result['conclusion'] = f"Violence detected! Types identified: {types_list}"
        else:
            result['conclusion'] = "No violence detected in the video"
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return {
            'status': 'error',
            'message': str(e)
        }

@app.route('/upload', methods=['GET', 'POST'])
def upload_video():
    """Handle video file upload and processing"""
    if request.method == 'POST':
        # Check if a file was uploaded
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        file = request.files['video']
        
        # Check if a file was selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        try:
            # Secure the filename and save the file
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Process the video in a separate thread
            def process_video():
                app_state.is_processing_upload = True
                results = process_uploaded_video(filepath)
                app_state.is_processing_upload = False
                
                # Clean up the uploaded file
                try:
                    os.remove(filepath)
                except Exception as e:
                    logger.error(f"Error cleaning up video file: {str(e)}")
                
                # Emit results to connected clients
                socketio.emit('video_processing_complete', results)
            
            # Start processing in background
            thread = threading.Thread(target=process_video)
            thread.daemon = True
            thread.start()
            
            return jsonify({
                'message': 'Video upload successful',
                'status': 'processing'
            })
            
        except Exception as e:
            logger.error(f"Error handling video upload: {str(e)}")
            return jsonify({'error': str(e)}), 500
# SafeYatri Dashboard API endpoints
@app.route('/api/dashboard/stats')
@auth_middleware.require_auth(['read'])
def dashboard_stats():
    """Get dashboard statistics for authorities"""
    try:
        if tourist_model is None:
            return jsonify({
                'active_tourists': 0,
                'active_alerts': 0,
                'iot_devices': 0,
                'recent_alerts': []
            })
        
        # Get active tourists
        tourists = tourist_model.get_all_tourists()
        active_tourists = len(tourists)
        
        # Get recent alerts
        recent_alerts = tourist_model.get_recent_alerts(limit=5)
        active_alerts = len([alert for alert in recent_alerts if not alert.get('resolved', False)])
        
        # Get IoT devices
        iot_devices = 0
        if iot_manager is not None:
            devices = iot_manager.get_all_devices()
            iot_devices = len(devices)
        
        return jsonify({
            'active_tourists': active_tourists,
            'active_alerts': active_alerts,
            'iot_devices': iot_devices,
            'recent_alerts': recent_alerts
        })
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        return jsonify({
            'active_tourists': 0,
            'active_alerts': 0,
            'iot_devices': 0,
            'recent_alerts': []
        })

@app.route('/api/tourists')
@auth_middleware.require_auth(['read'])
def get_tourists():
    """Get all tourists data"""
    try:
        if tourist_model is None:
            return jsonify({'tourists': []})
        
        tourists = tourist_model.get_all_tourists()
        return jsonify({'tourists': tourists})
        
    except Exception as e:
        logger.error(f"Error getting tourists: {str(e)}")
        return jsonify({'tourists': []})

@app.route('/api/tourists/<tourist_id>')
def get_tourist_details(tourist_id):
    """Get specific tourist details"""
    try:
        if tourist_model is None:
            return jsonify({'error': 'Tourist model not available'}), 500
        
        tourist_data = tourist_model.get_tourist_data(tourist_id)
        if tourist_data is None:
            return jsonify({'error': 'Tourist not found'}), 404
        
        return jsonify(tourist_data)
        
    except Exception as e:
        logger.error(f"Error getting tourist details: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/iot/devices')
def get_iot_devices():
    """Get all IoT devices"""
    try:
        if iot_manager is None:
            return jsonify({'devices': []})
        
        devices = iot_manager.get_all_devices()
        return jsonify({'devices': devices})
        
    except Exception as e:
        logger.error(f"Error getting IoT devices: {str(e)}")
        return jsonify({'devices': []})

@app.route('/api/alerts')
def get_alerts():
    """Get all alerts"""
    try:
        if tourist_model is None:
            return jsonify({'alerts': []})
        
        alerts = tourist_model.get_recent_alerts(limit=50)
        return jsonify({'alerts': alerts})
        
    except Exception as e:
        logger.error(f"Error getting alerts: {str(e)}")
        return jsonify({'alerts': []})

@app.route('/api/tourists/register', methods=['POST'])
def register_tourist():
    """Register a new tourist"""
    try:
        if tourist_model is None:
            return jsonify({'error': 'Tourist model not available'}), 500
        
        data = request.json
        required_fields = ['name', 'passport_number']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Generate digital ID
        digital_id = tourist_model.generate_digital_id(data)
        
        return jsonify({
            'success': True,
            'digital_id': digital_id,
            'message': 'Tourist registered successfully'
        })
        
    except Exception as e:
        logger.error(f"Error registering tourist: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/iot/register', methods=['POST'])
def register_iot_device():
    """Register IoT device for tourist"""
    try:
        if iot_manager is None:
            return jsonify({'error': 'IoT manager not available'}), 500
        
        data = request.json
        tourist_id = data.get('tourist_id')
        device_type = data.get('device_type', 'smart_band')
        
        if not tourist_id:
            return jsonify({'error': 'Tourist ID required'}), 400
        
        device_id = iot_manager.register_device(tourist_id, device_type)
        
        return jsonify({
            'success': True,
            'device_id': device_id,
            'message': 'IoT device registered successfully'
        })
        
    except Exception as e:
        logger.error(f"Error registering IoT device: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/regions/<region_id>/stats')
def get_region_stats(region_id):
    """Get statistics for a specific region"""
    try:
        if tourist_model is None:
            return jsonify({'error': 'Tourist model not available'}), 500
        
        stats = tourist_model.get_region_statistics(region_id)
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Error getting region stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/regions/<region_id>/tourists')
def get_region_tourists(region_id):
    """Get tourists in a specific region"""
    try:
        if tourist_model is None:
            return jsonify({'tourists': []})
        
        # Get all tourists and filter by region
        all_tourists = tourist_model.get_all_tourists()
        region_tourists = [t for t in all_tourists if t.get('current_location', {}).get('zone') == region_id]
        
        return jsonify({'tourists': region_tourists})
        
    except Exception as e:
        logger.error(f"Error getting region tourists: {str(e)}")
        return jsonify({'tourists': []})

@app.route('/api/violence/alerts')
def get_violence_alerts():
    """Get recent violence alerts"""
    try:
        if tourist_model is None:
            return jsonify({'alerts': []})
        
        # Get alerts filtered by violence types
        all_alerts = tourist_model.get_recent_alerts(limit=20)
        violence_alerts = [alert for alert in all_alerts if 'violence' in alert.get('alert_type', '').lower()]
        
        return jsonify({'alerts': violence_alerts})
        
    except Exception as e:
        logger.error(f"Error getting violence alerts: {str(e)}")
        return jsonify({'alerts': []})

@app.route('/api/inference/webhook', methods=['POST'])
def inference_webhook():
    """Receive detection events from inference service and create alerts."""
    try:
        payload = request.get_json(force=True)
        alert_type = payload.get('type', 'violence_detected')
        severity = payload.get('severity', 'high')
        confidence = float(payload.get('confidence', 0.8))
        location = payload.get('location', {'latitude': None, 'longitude': None})
        camera_id = payload.get('camera_id', 'unknown_camera')
        timestamp = payload.get('timestamp', datetime.now().isoformat())

        # Observe confidence
        try:
            DETECTION_CONFIDENCE_AVG.observe(confidence)
        except Exception:
            pass

        # Persist a simple alert record via tourist_model (if available) with unknown tourist
        if tourist_model is not None:
            try:
                tourist_model.create_alert(
                    tourist_id=0,
                    alert_type=alert_type,
                    location=location,
                    severity=severity
                )
            except Exception as e:
                logger.error(f"Error persisting alert: {e}")

        # Emit to WebSocket inbox
        detection_details = {
            'timestamp': timestamp,
            'confidence': confidence,
            'camera_id': camera_id,
            'location': location,
            'severity': severity
        }
        t0 = time.time()
        socketio.emit('alert', {
            'type': alert_type,
            'details': detection_details,
            'timestamp': timestamp
        })
        t1 = time.time()
        ALERTS_TOTAL.labels(alert_type).inc()
        ALERT_PROCESSING_TIME_MS.observe(max(0.0, (t1 - t0) * 1000.0))

        return jsonify({'status': 'ok'})
    except Exception as e:
        logger.error(f"Inference webhook error: {str(e)}")
        return jsonify({'error': 'bad_request'}), 400

@app.route('/api/cctv/zones')
def get_cctv_zones():
    """Get CCTV monitoring zones"""
    try:
        zones = [
            {
                'zone_id': 'cctv_zone_1',
                'name': 'Main Tourist Area',
                'location': {'latitude': 26.1445, 'longitude': 91.7362},
                'status': 'active',
                'tourist_count': 0,
                'risk_level': 'low'
            },
            {
                'zone_id': 'cctv_zone_2', 
                'name': 'High-Risk Zone',
                'location': {'latitude': 26.1500, 'longitude': 91.7400},
                'status': 'active',
                'tourist_count': 0,
                'risk_level': 'high'
            }
        ]
        
        # Update with real data if available
        if tourist_model is not None:
            for zone in zones:
                stats = tourist_model.get_region_statistics(zone['zone_id'])
                zone['tourist_count'] = stats['tourist_count']
                zone['risk_level'] = stats['risk_level']
        
        return jsonify({'zones': zones})
        
    except Exception as e:
        logger.error(f"Error getting CCTV zones: {str(e)}")
        return jsonify({'zones': []})

# Workflow API endpoints
@app.route('/api/workflow/dispatcher-inbox')
@auth_middleware.require_auth(['read'])
def get_dispatcher_inbox():
    """Get dispatcher's inbox"""
    try:
        dispatcher_id = g.user_id
        alerts = alert_workflow.get_dispatcher_inbox(dispatcher_id)
        return jsonify({'alerts': alerts})
        
    except Exception as e:
        logger.error(f"Error getting dispatcher inbox: {str(e)}")
        return jsonify({'alerts': []})

@app.route('/api/workflow/alert/<alert_id>')
@auth_middleware.require_auth(['read'])
def get_alert_details(alert_id):
    """Get detailed alert information"""
    try:
        alert = alert_workflow.get_alert_details(alert_id)
        if alert:
            return jsonify(alert)
        else:
            return jsonify({'error': 'Alert not found'}), 404
            
    except Exception as e:
        logger.error(f"Error getting alert details: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/workflow/alert/<alert_id>/review', methods=['POST'])
@auth_middleware.require_auth(['write'])
def review_alert(alert_id):
    """Review alert and make dispatch decision"""
    try:
        data = request.get_json()
        dispatcher_id = g.user_id
        confidence_score = data.get('confidence_score', 0.5)
        decision = data.get('decision')
        notes = data.get('notes', '')
        
        if not decision:
            return jsonify({'error': 'Decision required'}), 400
        
        success = alert_workflow.review_alert(
            alert_id, dispatcher_id, confidence_score, decision, notes
        )
        
        if success:
            return jsonify({'message': 'Alert reviewed successfully'})
        else:
            return jsonify({'error': 'Failed to review alert'}), 500
            
    except Exception as e:
        logger.error(f"Error reviewing alert: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/workflow/statistics')
@auth_middleware.require_auth(['read'])
def get_workflow_statistics():
    """Get workflow statistics"""
    try:
        stats = alert_workflow.get_workflow_statistics()
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Error getting workflow statistics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Privacy and consent endpoints
@app.route('/api/privacy/consent/<tourist_id>', methods=['GET', 'POST'])
@auth_middleware.require_auth(['read'])
def manage_consent(tourist_id):
    """Get or update tourist consent"""
    try:
        if request.method == 'GET':
            consent_form = consent_manager.create_consent_form(tourist_id)
            return jsonify(consent_form)
        
        elif request.method == 'POST':
            data = request.get_json()
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent')
            
            result = consent_manager.process_consent_form(
                tourist_id, data, ip_address, user_agent
            )
            return jsonify(result)
            
    except Exception as e:
        logger.error(f"Error managing consent: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/privacy/evidence/<tourist_id>')
@auth_middleware.require_forensics_access()
def get_evidence_with_privacy(tourist_id):
    """Get evidence with privacy protection"""
    try:
        # This would typically load evidence from storage
        # For demo, we'll return a placeholder
        return jsonify({
            'tourist_id': tourist_id,
            'evidence_available': True,
            'privacy_applied': True,
            'forensics_access': True
        })
        
    except Exception as e:
        logger.error(f"Error getting evidence: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health')
def health_check():
    """Health check endpoint for Docker"""
    try:
        # Check database connection, camera status, etc.
        status = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'camera_status': app_state.detection_stats['camera_status'],
            'uptime': time.time() - app_state.detection_stats['uptime']
        }
        return jsonify(status), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

# Main entry point
if __name__ == '__main__':
    try:
        logger.info("Starting SafeYatri server...")
        logger.info("Access the application at http://localhost:5000")
        logger.info("Authority Dashboard: http://localhost:5000/dashboard")
        # Start the server with WebSocket support
        socketio.run(app, debug=True, host='0.0.0.0', port=5000)
    except Exception as e:
        logger.error(f"Server error: {str(e)}")
    finally:
        cleanup()