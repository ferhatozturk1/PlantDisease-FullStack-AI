import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Model configuration
MODEL_PATH = os.path.join(BASE_DIR, "app", "services", "models", "model.keras")

# API configuration
API_TITLE = "Plant Disease Detection API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "AI-powered plant disease detection system"

# Image configuration
IMAGE_SIZE = (224, 224)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/plantdisease")

# JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-key-in-production-please")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24 saat
