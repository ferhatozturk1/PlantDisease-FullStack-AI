from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from PIL import Image
import io
from typing import Optional
from sqlalchemy.orm import Session

from app.services.ai_service import predict_disease
from app.core.security import get_current_user_or_guest, get_current_user_required
from app.database import get_db
from app.models import Diagnosis, User

router = APIRouter()


@router.post("/predict")
async def predict_plant_disease(
    file: UploadFile = File(...),
    user: Optional[User] = Depends(get_current_user_or_guest),
    db: Session = Depends(get_db),
):
    """
    Bitki hastalığı tespiti.
    - Giriş yapmış kullanıcı → sonuç DB'ye kaydedilir
    - Misafir → sonuç döndürülür, kaydedilmez
    """
    try:
        # Dosya tipi kontrolü
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Dosya bir resim olmalıdır.")

        # Resmi oku ve tahmin yap
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        result = predict_disease(image)

        disease_name = result["disease"]
        confidence = result["confidence"]

        # Giriş yapmış kullanıcıysa DB'ye kaydet
        if user is not None:
            diagnosis = Diagnosis(
                user_id=user.id,
                image_filename=file.filename,
                disease_name=disease_name,
                confidence_score=float(confidence),
            )
            db.add(diagnosis)
            db.commit()
            db.refresh(diagnosis)
            saved = True
            diagnosis_id = diagnosis.id
        else:
            saved = False
            diagnosis_id = None

        return {
            "success": True,
            "data": {
                "disease": disease_name,
                "confidence": confidence,
            },
            "saved": saved,
            "diagnosis_id": diagnosis_id,
            "is_guest": user is None,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tahmin başarısız: {str(e)}")


@router.get("/history")
async def get_history(
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    """Giriş yapmış kullanıcının geçmiş teşhislerini döndürür."""
    diagnoses = (
        db.query(Diagnosis)
        .filter(Diagnosis.user_id == user.id)
        .order_by(Diagnosis.created_at.desc())
        .limit(50)
        .all()
    )

    return {
        "success": True,
        "data": [
            {
                "id": d.id,
                "disease_name": d.disease_name,
                "confidence_score": d.confidence_score,
                "image_filename": d.image_filename,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in diagnoses
        ],
        "total": len(diagnoses),
    }
