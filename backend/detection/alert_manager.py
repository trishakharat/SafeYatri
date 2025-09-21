import smtplib
import os
import cv2
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
import tempfile
from dotenv import load_dotenv
import json

load_dotenv()

# Email Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465

def send_email_with_attachment(frame, alert_type, is_video=False, video_frames=None, detection_details=None):
    try:
        msg = MIMEMultipart()
        msg['From'] = os.getenv("EMAIL_SENDER")
        msg['To'] = os.getenv("EMAIL_RECEIVER")
        msg['Subject'] = f"🚨 SafeWatch Alert: {alert_type} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

        # Email body with HTML formatting
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .alert {{ 
                    background-color: #f8d7da; 
                    border-left: 5px solid #dc3545; 
                    padding: 15px; 
                    margin-bottom: 20px; 
                }}
                .details {{ 
                    background-color: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 5px; 
                }}
                .timestamp {{ color: #6c757d; }}
            </style>
        </head>
        <body>
            <div class="alert">
                <h2>🚨 SafeWatch Alert: {alert_type}</h2>
                <p class="timestamp">Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="details">
                <h3>Detection Details:</h3>
                <ul>
                    <li><strong>Alert Type:</strong> {alert_type}</li>
                    <li><strong>Confidence:</strong> {detection_details.get('confidence', 'N/A')}%</li>
                    <li><strong>Location:</strong> {detection_details.get('location', 'Unknown')}</li>
                    <li><strong>Duration:</strong> {detection_details.get('duration', 'N/A')} seconds</li>
                </ul>
            </div>
            
            <p>This is an automated alert from SafeWatch AI. Please review the attached evidence.</p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, 'html'))

        if is_video and video_frames:
            # Save temporary video
            temp_path = os.path.join(tempfile.gettempdir(), f"evidence_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4")
            out = cv2.VideoWriter(temp_path, 
                                 cv2.VideoWriter_fourcc(*'mp4v'), 
                                 10, 
                                 (video_frames[0].shape[1], video_frames[0].shape[0]))
            for f in video_frames:
                out.write(f)
            out.release()

            # Attach video
            with open(temp_path, 'rb') as f:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f'attachment; filename="evidence.mp4"')
                msg.attach(part)
            os.remove(temp_path)
        else:
            # Attach image
            _, buffer = cv2.imencode('.jpg', frame)
            img_part = MIMEImage(buffer.tobytes())
            img_part.add_header('Content-Disposition', 'attachment', filename="evidence.jpg")
            msg.attach(img_part)
            
            # Also attach a JSON file with detection details
            if detection_details:
                json_part = MIMEText(json.dumps(detection_details, indent=2), 'plain')
                json_part.add_header('Content-Disposition', 'attachment', filename="detection_details.json")
                msg.attach(json_part)

        # Send email
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(os.getenv("EMAIL_SENDER"), os.getenv("EMAIL_PASSWORD"))
            server.send_message(msg)
        print(f"✅ Alert sent with {'video' if is_video else 'image'} evidence")

    except Exception as e:
        print(f"❌ Failed to send alert: {str(e)}")

def categorize_alert(pose, weapon, blood):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if all([pose, weapon, blood]):
        return "CRITICAL: Violence with Weapon and Blood"
    elif pose and weapon:
        return "WEAPON: Weapon Detected with Aggressive Pose"
    elif pose:
        return "FIGHT: Violent Pose Detected"
    elif weapon:
        return "WEAPON: Weapon Detected"
    elif blood:
        return "BLOOD: Blood Detected"
    return None

def create_detection_details(pose, weapon, blood, confidence=85, location="Webcam Feed"):
    """Create detailed detection information for alerts"""
    details = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "location": location,
        "confidence": confidence,
        "duration": 1.0,  # Default duration in seconds
        "detections": {
            "pose": pose,
            "weapon": weapon,
            "blood": blood
        }
    }
    
    # Calculate confidence based on detections
    if all([pose, weapon, blood]):
        details["confidence"] = 95
    elif pose and weapon:
        details["confidence"] = 90
    elif pose or weapon or blood:
        details["confidence"] = 85
        
    return details