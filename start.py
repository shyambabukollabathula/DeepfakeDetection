#!/usr/bin/env python3
"""
Start script for Railway deployment
"""
import os
import sys

if __name__ == "__main__":
    import uvicorn
    from deepfake_detection.app.main import app
    
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)