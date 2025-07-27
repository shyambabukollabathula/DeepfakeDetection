"""
Simplified deepfake detector for deployment without heavy ML dependencies
"""
import random
import time

def detect_deepfake(image_path):
    """
    Simplified detection function that returns random results
    Replace this with actual model inference when you have trained weights
    """
    # Simulate processing time
    time.sleep(0.5)
    
    # Return random results for demo purposes
    is_deepfake = random.choice([0, 1])
    confidence = random.uniform(0.6, 0.95)
    
    return is_deepfake, confidence