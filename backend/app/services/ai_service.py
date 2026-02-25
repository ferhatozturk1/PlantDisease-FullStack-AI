import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess
from app.core.config import MODEL_PATH, IMAGE_SIZE

# Singleton Pattern: Load model only once at startup
model = None

def load_ai_model():
    """Load the trained model (called once at startup)"""
    global model
    if model is None:
        import os
        if not os.path.exists(MODEL_PATH):
            print(f"[WARNING] Model dosyasi bulunamadi: {MODEL_PATH}")
            print("[WARNING] /api/predict endpoint'i calismaycak. Model dosyasini ekleyin.")
            return None
        print(f"Loading model from {MODEL_PATH}...")
        model = load_model(MODEL_PATH)
        print("[OK] Model loaded successfully!")
    return model

def preprocess_image(image: Image.Image) -> np.ndarray:
    """
    Preprocess the image for EfficientNet model prediction
    - Resize to 224x224
    - Convert to RGB
    - Convert to numpy array (float32, 0-255 range)
    - Apply EfficientNet preprocess_input (scales to [-1, 1])
    - Expand dimensions to (1, 224, 224, 3)
    """
    # Resize image
    image = image.resize(IMAGE_SIZE)

    # Convert to RGB if needed (RGBA, grayscale vb. için)
    if image.mode != 'RGB':
        image = image.convert('RGB')

    # Convert to numpy array - float32 olarak tut, normalize ETME
    img_array = np.array(image, dtype=np.float32)

    # EfficientNet'in beklediği preprocess_input uygula (0-255 → [-1, 1])
    img_array = efficientnet_preprocess(img_array)

    # Expand dimensions to match model input shape: (1, 224, 224, 3)
    img_array = np.expand_dims(img_array, axis=0)

    return img_array

def predict_disease(image: Image.Image) -> dict:
    """
    Predict plant disease from image
    Returns: dict with class_name and confidence
    """
    # Ensure model is loaded
    if model is None:
        load_ai_model()
    
    # Preprocess image
    processed_image = preprocess_image(image)
    
    # Make prediction
    predictions = model.predict(processed_image)    
    
    print("HAM TAHMİN DİZİSİ:", predictions[0])


    # Get the predicted class index and confidence
    predicted_class_idx = np.argmax(predictions[0])
    confidence = float(predictions[0][predicted_class_idx])
    
    # Class names mapping - 41 classes (PlantVillage extended dataset)
    # IMPORTANT: This order must match the folder order used during training (usually alphabetical)
    # If predictions seem wrong, verify this list matches your training data's class_indices
    class_names = [
       "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_", "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot", "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy",
    "Wheat___Septoria", "Wheat___Yellow_Rust", "Wheat___healthy",
    ]
    
    # Get class name
    class_name = class_names[predicted_class_idx] if predicted_class_idx < len(class_names) else f"Class_{predicted_class_idx}"
    
    return {
        "disease": class_name,
        "confidence": round(confidence * 100, 2)
    }
