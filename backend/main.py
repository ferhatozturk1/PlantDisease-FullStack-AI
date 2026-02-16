from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import diagnosis
from app.services.ai_service import load_ai_model
from app.core.config import API_TITLE, API_VERSION, API_DESCRIPTION

# Initialize FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION
)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(diagnosis.router, prefix="/api", tags=["Diagnosis"])

# Startup event: Load model once
@app.on_event("startup")
async def startup_event():
    """Load the AI model on startup"""
    load_ai_model()

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Plant Disease Detection API",
        "status": "running",
        "version": API_VERSION
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
