import os
import time
import json
import random
from datetime import datetime
import requests

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000").rstrip("/")
CAMERA_ID = os.getenv("CAMERA_ID", "demo_camera_001")
CAMERA_URL = os.getenv("CAMERA_URL")  # optional; for future RTSP/mJPEG integration
SLEEP_SECONDS = int(os.getenv("DETECTION_INTERVAL", "12"))


def random_location():
    # Delhi-ish coordinates (rough), jittered for demo
    base_lat, base_lng = 28.6139, 77.2090
    return {
        "latitude": base_lat + (random.random() - 0.5) * 0.01,
        "longitude": base_lng + (random.random() - 0.5) * 0.01,
    }


def make_detection_event():
    severity = random.choice(["low", "medium", "high", "critical"])  # demo severity
    confidence = round(random.uniform(0.6, 0.95), 2)
    event = {
        "type": "violence_detected",
        "severity": severity,
        "confidence": confidence,
        "location": random_location(),
        "camera_id": CAMERA_ID,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    return event


def post_event(event: dict):
    url = f"{BACKEND_URL}/api/inference/webhook"
    try:
        resp = requests.post(url, json=event, timeout=5)
        if resp.ok:
            print(f"[inference_service] posted alert: {event['type']} conf={event['confidence']} sev={event['severity']}")
        else:
            print(f"[inference_service] backend responded {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[inference_service] error posting event: {e}")


def main():
    print("[inference_service] starting demo inference publisher")
    print(f"[inference_service] backend: {BACKEND_URL}")
    if CAMERA_URL:
        print(f"[inference_service] camera url: {CAMERA_URL}")
    while True:
        event = make_detection_event()
        post_event(event)
        time.sleep(SLEEP_SECONDS)


if __name__ == "__main__":
    main()
