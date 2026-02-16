import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Model configuration
MODEL_PATH = os.path.join(BASE_DIR, "app", "services", "models", "model.h5")

# API configuration
API_TITLE = "Plant Disease Detection API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "AI-powered plant disease detection system"

# Image configuration
IMAGE_SIZE = (224, 224)
