from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io
from app.services.ai_service import predict_disease

router = APIRouter()

@router.post("/predict")
async def predict_plant_disease(file: UploadFile = File(...)):
    """
    Endpoint to predict plant disease from uploaded image
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image file
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Get prediction
        result = predict_disease(image)
        
        return {
            "success": True,
            "data": {
                "disease": result["disease"],
                "confidence": result["confidence"]
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
