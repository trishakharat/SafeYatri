"""
Face blur and privacy protection for SafeYatri
"""
import cv2
import numpy as np
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class FaceBlurProcessor:
    """Face blur and privacy protection processor"""
    
    def __init__(self):
        """Initialize face detection model"""
        try:
            # Load OpenCV face detection model
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            logger.info("Face detection model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading face detection model: {e}")
            self.face_cascade = None
    
    def detect_faces(self, frame: np.ndarray) -> list:
        """Detect faces in frame"""
        if self.face_cascade is None:
            return []
        
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            return faces
        except Exception as e:
            logger.error(f"Error detecting faces: {e}")
            return []
    
    def blur_faces(self, frame: np.ndarray, faces: list, blur_strength: int = 15) -> np.ndarray:
        """Blur detected faces in frame"""
        if not faces:
            return frame
        
        blurred_frame = frame.copy()
        
        for (x, y, w, h) in faces:
            # Extract face region
            face_region = blurred_frame[y:y+h, x:x+w]
            
            # Apply Gaussian blur
            blurred_face = cv2.GaussianBlur(face_region, (blur_strength, blur_strength), 0)
            
            # Replace face region with blurred version
            blurred_frame[y:y+h, x:x+w] = blurred_face
        
        return blurred_frame
    
    def pixelate_faces(self, frame: np.ndarray, faces: list, pixel_size: int = 20) -> np.ndarray:
        """Pixelate detected faces in frame"""
        if not faces:
            return frame
        
        pixelated_frame = frame.copy()
        
        for (x, y, w, h) in faces:
            # Extract face region
            face_region = pixelated_frame[y:y+h, x:x+w]
            
            # Resize down and up to create pixelation effect
            small = cv2.resize(face_region, (w//pixel_size, h//pixel_size))
            pixelated = cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST)
            
            # Replace face region with pixelated version
            pixelated_frame[y:y+h, x:x+w] = pixelated
        
        return pixelated_frame
    
    def blackout_faces(self, frame: np.ndarray, faces: list) -> np.ndarray:
        """Black out detected faces in frame"""
        if not faces:
            return frame
        
        blackout_frame = frame.copy()
        
        for (x, y, w, h) in faces:
            # Draw black rectangle over face
            cv2.rectangle(blackout_frame, (x, y), (x+w, y+h), (0, 0, 0), -1)
        
        return blackout_frame
    
    def process_frame(self, frame: np.ndarray, method: str = 'blur', 
                     consent_required: bool = True, has_consent: bool = False) -> Tuple[np.ndarray, list]:
        """
        Process frame for privacy protection
        
        Args:
            frame: Input frame
            method: Privacy method ('blur', 'pixelate', 'blackout')
            consent_required: Whether consent is required for face matching
            has_consent: Whether tourist has given consent
            
        Returns:
            Tuple of (processed_frame, face_regions)
        """
        # Detect faces
        faces = self.detect_faces(frame)
        
        if not faces:
            return frame, []
        
        # If consent is required and not given, apply privacy protection
        if consent_required and not has_consent:
            if method == 'blur':
                processed_frame = self.blur_faces(frame, faces)
            elif method == 'pixelate':
                processed_frame = self.pixelate_faces(frame, faces)
            elif method == 'blackout':
                processed_frame = self.blackout_faces(frame, faces)
            else:
                processed_frame = self.blur_faces(frame, faces)  # Default to blur
        else:
            # No privacy protection needed
            processed_frame = frame
        
        return processed_frame, faces
    
    def add_privacy_overlay(self, frame: np.ndarray, faces: list, 
                           privacy_applied: bool = True) -> np.ndarray:
        """Add privacy overlay indicators"""
        overlay_frame = frame.copy()
        
        for (x, y, w, h) in faces:
            if privacy_applied:
                # Green border for privacy protected
                cv2.rectangle(overlay_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                cv2.putText(overlay_frame, "PRIVACY PROTECTED", 
                           (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            else:
                # Red border for unblurred (requires forensics access)
                cv2.rectangle(overlay_frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
                cv2.putText(overlay_frame, "FORENSICS ACCESS", 
                           (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        
        return overlay_frame

class PrivacyManager:
    """Privacy and consent management"""
    
    def __init__(self, db_path: str = "privacy_database.db"):
        self.db_path = db_path
        self.face_processor = FaceBlurProcessor()
        self.init_database()
    
    def init_database(self):
        """Initialize privacy database"""
        import sqlite3
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Consent records table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS consent_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tourist_id TEXT NOT NULL,
                consent_type TEXT NOT NULL,
                consent_given BOOLEAN NOT NULL,
                consent_text TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                user_agent TEXT
            )
        ''')
        
        # Privacy settings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS privacy_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_name TEXT UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert default privacy settings
        cursor.execute('''
            INSERT OR IGNORE INTO privacy_settings (setting_name, setting_value)
            VALUES 
                ('default_blur_method', 'blur'),
                ('retention_days', '30'),
                ('require_consent', 'true'),
                ('forensics_audit', 'true')
        ''')
        
        conn.commit()
        conn.close()
    
    def record_consent(self, tourist_id: str, consent_type: str, 
                      consent_given: bool, consent_text: str = None,
                      ip_address: str = None, user_agent: str = None):
        """Record tourist consent"""
        import sqlite3
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO consent_records (tourist_id, consent_type, consent_given,
                                       consent_text, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (tourist_id, consent_type, consent_given, consent_text, ip_address, user_agent))
        
        conn.commit()
        conn.close()
    
    def get_consent_status(self, tourist_id: str, consent_type: str = 'face_matching') -> bool:
        """Get consent status for tourist"""
        import sqlite3
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT consent_given FROM consent_records 
            WHERE tourist_id = ? AND consent_type = ?
            ORDER BY timestamp DESC LIMIT 1
        ''', (tourist_id, consent_type))
        
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result else False
    
    def process_evidence_frame(self, frame: np.ndarray, tourist_id: str, 
                             user_has_forensics: bool = False) -> Tuple[np.ndarray, dict]:
        """
        Process evidence frame with privacy protection
        
        Args:
            frame: Input frame
            tourist_id: Tourist ID
            user_has_forensics: Whether user has forensics access
            
        Returns:
            Tuple of (processed_frame, metadata)
        """
        # Check consent status
        has_consent = self.get_consent_status(tourist_id, 'face_matching')
        
        # Process frame
        processed_frame, faces = self.face_processor.process_frame(
            frame, 
            method='blur',
            consent_required=True,
            has_consent=has_consent and user_has_forensics
        )
        
        # Add privacy overlay
        processed_frame = self.face_processor.add_privacy_overlay(
            processed_frame, faces, privacy_applied=not (has_consent and user_has_forensics)
        )
        
        metadata = {
            'faces_detected': len(faces),
            'privacy_applied': not (has_consent and user_has_forensics),
            'consent_status': has_consent,
            'forensics_access': user_has_forensics,
            'face_regions': faces.tolist() if len(faces) > 0 else []
        }
        
        return processed_frame, metadata
