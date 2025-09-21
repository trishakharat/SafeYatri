import cv2
import numpy as np
import os
import torch
from ultralytics import YOLO

class ViolenceModel:
    def __init__(self):
        # Load YOLOv8-Pose ONNX model
        model_path = os.path.join("detection", "yolov8n-pose.onnx")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file missing at: {model_path}")
        
        self.pose_model = cv2.dnn.readNetFromONNX(model_path)
        
        # Load YOLOv8 for weapon detection
        self.weapon_model = YOLO('yolov8n.pt')
        print("✅ ViolenceModel initialized (CPU Mode)")

        # Detection setups
        self.blood_lower = np.array([160, 100, 100])
        self.blood_upper = np.array([180, 255, 255])
        
        # Violence detection thresholds
        self.pose_threshold = 0.65
        self.weapon_threshold = 0.5
        self.blood_threshold = 5000
        
        # Pose analysis parameters
        self.aggressive_pose_threshold = 0.7
        self.pose_history = []
        self.history_size = 10

    def detect_pose(self, frame):
        try:
            blob = cv2.dnn.blobFromImage(
                frame, scalefactor=1/255.0, size=(640, 640),
                swapRB=True, crop=False
            )
            self.pose_model.setInput(blob)
            outputs = self.pose_model.forward()
            
            # Check for aggressive poses
            has_pose = np.any(outputs[0][:, 4] > self.pose_threshold)
            
            # Analyze pose for violence indicators
            if has_pose:
                # Extract keypoints
                keypoints = outputs[0][0, :, :5]  # First person's keypoints
                
                # Calculate pose aggression score
                aggression_score = self._calculate_aggression_score(keypoints)
                
                # Add to history
                self.pose_history.append(aggression_score)
                if len(self.pose_history) > self.history_size:
                    self.pose_history.pop(0)
                
                # Check if recent poses indicate violence
                avg_aggression = sum(self.pose_history) / len(self.pose_history)
                return avg_aggression > self.aggressive_pose_threshold
            
            return False
        except Exception as e:
            print(f"[POSE ERROR] {str(e)}")
            return False

    def _calculate_aggression_score(self, keypoints):
        """Calculate how aggressive a pose is based on keypoint positions"""
        try:
            # This is a simplified version - in a real system, you'd use more sophisticated pose analysis
            # For example, checking if arms are raised, if there's a fighting stance, etc.
            
            # Check if arms are raised (keypoints 5 and 6 are shoulders, 7 and 8 are elbows)
            if keypoints[5][4] > self.pose_threshold and keypoints[6][4] > self.pose_threshold:
                # If elbows are above shoulders, arms are raised
                if keypoints[7][1] < keypoints[5][1] or keypoints[8][1] < keypoints[6][1]:
                    return 0.8
            
            # Check for fighting stance (legs spread)
            if keypoints[11][4] > self.pose_threshold and keypoints[12][4] > self.pose_threshold:
                # If ankles are far apart horizontally
                if abs(keypoints[11][0] - keypoints[12][0]) > 100:
                    return 0.7
            
            return 0.3  # Default score for a detected pose
        except:
            return 0.5  # Default if calculation fails

    def detect_weapon(self, frame):
        try:
            # Use YOLOv8 for weapon detection
            results = self.weapon_model(frame, classes=[0, 67, 73])  # person, cell phone, laptop
            
            # Check for weapons in the results
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    # Check if confidence is above threshold
                    if box.conf > self.weapon_threshold:
                        # Check if it's a weapon-like object
                        cls = int(box.cls)
                        # Class 0 is person, 67 is cell phone, 73 is laptop
                        # We're looking for objects that could be weapons
                        if cls in [67, 73]:  # These could be used as weapons
                            return True
            
            return False
        except Exception as e:
            print(f"[WEAPON ERROR] {str(e)}")
            return False

    def detect_blood(self, frame):
        try:
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            mask = cv2.inRange(hsv, self.blood_lower, self.blood_upper)
            return cv2.countNonZero(mask) > self.blood_threshold
        except Exception as e:
            print(f"[BLOOD ERROR] {str(e)}")
            return False

    def predict(self, frame):
        pose = self.detect_pose(frame)
        weapon = self.detect_weapon(frame)
        blood = self.detect_blood(frame)
        
        # Add visual indicators to frame for debugging
        if pose or weapon or blood:
            cv2.putText(frame, f"Pose: {pose}", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(frame, f"Weapon: {weapon}", (10, 60), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(frame, f"Blood: {blood}", (10, 90), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        return (pose, weapon, blood)