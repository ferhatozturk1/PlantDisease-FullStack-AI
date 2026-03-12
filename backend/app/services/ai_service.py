import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model
from app.core.config import MODEL_PATH, IMAGE_SIZE

# ---------------------------------------------------------------------------
# GÜVENİLİRLİK EŞİĞİ
# Modelin tahmini bu değerin altındaysa hastalık adı yerine
# kullanıcıya açıklayıcı bir uyarı döndürülür.
# ---------------------------------------------------------------------------
CONFIDENCE_THRESHOLD = 0.60  # %60

# ---------------------------------------------------------------------------
# CLASS NAMES — Model eğitim sırasına göre tam ve doğru sınıf listesi (0–40)
# ---------------------------------------------------------------------------
CLASS_NAMES = [
    "apple_leaf", "apple_rust_leaf", "apple_scab_leaf", "bell_pepper_leaf",
    "bell_pepper_leaf_spot", "blueberry_leaf", "cherry_leaf", "corn_gray_leaf_spot",
    "corn_leaf_blight", "corn_rust_leaf", "grape_leaf", "grape_leaf_black_rot",
    "peach_leaf", "pepper_bell_bacterial_spot", "pepper_bell_healthy",
    "potato_early_blight", "potato_healthy", "potato_late_blight",
    "potato_leaf_early_blight", "potato_leaf_late_blight", "raspberry_leaf",
    "soyabean_leaf", "squash_powdery_mildew_leaf", "strawberry_leaf",
    "tomato_bacterial_spot", "tomato_early_blight", "tomato_early_blight_leaf",
    "tomato_healthy", "tomato_late_blight", "tomato_leaf",
    "tomato_leaf_bacterial_spot", "tomato_leaf_late_blight", "tomato_leaf_mold",
    "tomato_leaf_mosaic_virus", "tomato_leaf_yellow_virus", "tomato_mold_leaf",
    "tomato_septoria_leaf_spot", "tomato_spider_mites_two_spotted_spider_mite",
    "tomato_target_spot", "tomato_tomato_mosaic_virus", "tomato_tomato_yellowleaf_curl_virus"
]

# ---------------------------------------------------------------------------
# DISEASE INFO — Türkçe isim + tedavi önerisi + sağlık durumu (41 sınıf)
# ---------------------------------------------------------------------------
DISEASE_INFO = {
    # -- ELMA (Apple) --
    "apple_leaf": {
        "name": "Elma — Sağlıklı 🍎",
        "treatment": "Bitkiniz harika görünüyor! Mevcut bakım rutininize devam edin.",
        "is_healthy": True,
    },
    "apple_rust_leaf": {
        "name": "Elma — Pas Hastalığı",
        "treatment": "Turuncu lekelere karşı ilkbahar başında propiconazole içerikli fungisit uygulayın.",
        "is_healthy": False,
    },
    "apple_scab_leaf": {
        "name": "Elma — Karaleke",
        "treatment": "Dökülen yaprakları temizleyin. Tomurcuklar kabarmadan %2'lik Bordo Bulamacı uygulayın.",
        "is_healthy": False,
    },

    # -- BİBER (Bell Pepper) --
    "bell_pepper_leaf": {
        "name": "Biber — Sağlıklı 🫑",
        "treatment": "Bitkileriniz sağlıklı! Düzenli sulamaya devam edin.",
        "is_healthy": True,
    },
    "bell_pepper_leaf_spot": {
        "name": "Biber — Yaprak Lekesi",
        "treatment": "Bakır bazlı ilaçlarla ilaçlama yapın. Sularken yapraklara su değdirmeyin.",
        "is_healthy": False,
    },
    "pepper_bell_bacterial_spot": {
        "name": "Biber — Bakteriyel Leke",
        "treatment": "Hemen bakır oksiklorür uygulayın ve hastalıklı yaprakları uzaklaştırın.",
        "is_healthy": False,
    },
    "pepper_bell_healthy": {
        "name": "Biber — Sağlıklı 🫑",
        "treatment": "Bitkileriniz sağlıklı! Düzenli sulamaya devam edin.",
        "is_healthy": True,
    },

    # -- YABAN MERSİNİ (Blueberry) --
    "blueberry_leaf": {
        "name": "Yaban Mersini — Sağlıklı 🫐",
        "treatment": "Mükemmel! Toprak pH'ını asidik tutmaya devam edin.",
        "is_healthy": True,
    },

    # -- KİRAZ (Cherry) --
    "cherry_leaf": {
        "name": "Kiraz — Sağlıklı 🍒",
        "treatment": "Ağacınız sağlıklı görünüyor. Budama ve iyi hava sirkülasyonu sağlayın.",
        "is_healthy": True,
    },

    # -- MISIR (Corn) --
    "corn_gray_leaf_spot": {
        "name": "Mısır — Gri Yaprak Lekesi",
        "treatment": "Strobilurin veya triazol içerikli fungisit uygulayın. Ekim nöbeti yapın.",
        "is_healthy": False,
    },
    "corn_leaf_blight": {
        "name": "Mısır — Yaprak Yanıklığı",
        "treatment": "Dayanıklı çeşitler seçin. Şiddetli vakalarda fungisit uygulayın.",
        "is_healthy": False,
    },
    "corn_rust_leaf": {
        "name": "Mısır — Pas Hastalığı",
        "treatment": "Propiconazole içerikli fungisit ile erken dönemde ilaçlama yapın.",
        "is_healthy": False,
    },

    # -- ÜZÜM (Grape) --
    "grape_leaf": {
        "name": "Üzüm — Sağlıklı 🍇",
        "treatment": "Bağınız sağlıklı! Hava dolaşımını koruyun ve düzenli budama yapın.",
        "is_healthy": True,
    },
    "grape_leaf_black_rot": {
        "name": "Üzüm — Kara Çürüklük",
        "treatment": "Mancozeb ya da captan içerikli fungisit uygulayın. Dökülen meyveleri ve yaprakları toplayın.",
        "is_healthy": False,
    },

    # -- ŞEFTALI (Peach) --
    "peach_leaf": {
        "name": "Şeftali — Sağlıklı 🍑",
        "treatment": "Ağacınız sağlıklı! Sonbahar ve ilkbaharda bakır bazlı sprey uygulayın.",
        "is_healthy": True,
    },

    # -- PATATES (Potato) --
    "potato_early_blight": {
        "name": "Patates — Erken Yanıklık",
        "treatment": "Ekim nöbeti uygulayın. Chlorothalonil içerikli fungisit kullanın.",
        "is_healthy": False,
    },
    "potato_healthy": {
        "name": "Patates — Sağlıklı 🥔",
        "treatment": "Bitkiniz sağlıklı! İyi drenaj ve uygun sulama ile koruyun.",
        "is_healthy": True,
    },
    "potato_late_blight": {
        "name": "Patates — Geç Yanıklık",
        "treatment": "Hızla yayılan bir hastalıktır. Hemen metalaxyl içeren fungisit ile müdahale edin.",
        "is_healthy": False,
    },
    "potato_leaf_early_blight": {
        "name": "Patates — Erken Yanıklık (Yaprak)",
        "treatment": "Ekim nöbeti uygulayın. Chlorothalonil içerikli fungisit kullanın.",
        "is_healthy": False,
    },
    "potato_leaf_late_blight": {
        "name": "Patates — Geç Yanıklık (Yaprak)",
        "treatment": "Hızla yayılan bir hastalıktır. Hemen metalaxyl içeren fungisit ile müdahale edin.",
        "is_healthy": False,
    },

    # -- AHUDUDU (Raspberry) --
    "raspberry_leaf": {
        "name": "Ahududu — Sağlıklı 🍓",
        "treatment": "Bitkileriniz sağlıklı! Kesim sonrası iyi hava sirkülasyonu sağlayın.",
        "is_healthy": True,
    },

    # -- SOYA FASULYESİ (Soybean) --
    "soyabean_leaf": {
        "name": "Soya Fasulyesi — Sağlıklı 🌱",
        "treatment": "Soya fasulyeniz gayet sağlıklı! Ekim nöbetine devam edin.",
        "is_healthy": True,
    },

    # -- KABAK (Squash) --
    "squash_powdery_mildew_leaf": {
        "name": "Kabak — Külleme Hastalığı",
        "treatment": "Kükürt bazlı fungisit veya potasyum bikarbonat spreyi uygulayın. Bitki sıklığını azaltın.",
        "is_healthy": False,
    },

    # -- ÇİLEK (Strawberry) --
    "strawberry_leaf": {
        "name": "Çilek — Sağlıklı 🍓",
        "treatment": "Bitkileriniz sağlıklı! Toprak üstü örtüsü ile nemlilik kontrol edin.",
        "is_healthy": True,
    },

    # -- DOMATES (Tomato) --
    "tomato_bacterial_spot": {
        "name": "Domates — Bakteriyel Leke",
        "treatment": "Bakır bazlı bakterisit kullanın. Damla sulama tercih edin.",
        "is_healthy": False,
    },
    "tomato_early_blight": {
        "name": "Domates — Erken Yanıklık",
        "treatment": "Mancozeb içerikli fungisit ile 7–14 günde bir ilaçlayın. Alt yaprakları temizleyin.",
        "is_healthy": False,
    },
    "tomato_early_blight_leaf": {
        "name": "Domates — Erken Yanıklık (Yaprak)",
        "treatment": "Mancozeb içerikli fungisit ile 7–14 günde bir ilaçlayın. Alt yaprakları temizleyin.",
        "is_healthy": False,
    },
    "tomato_healthy": {
        "name": "Domates — Sağlıklı 🍅",
        "treatment": "Domatesleriniz gayet sağlıklı! Bakım rutininize devam edin.",
        "is_healthy": True,
    },
    "tomato_late_blight": {
        "name": "Domates — Geç Yanıklık",
        "treatment": "ACİL: Metalaxyl içeren fungisit uygulayın. Hastalıklı bitkileri sökün.",
        "is_healthy": False,
    },
    "tomato_leaf": {
        "name": "Domates — Sağlıklı 🍅",
        "treatment": "Domates yaprağınız sağlıklı görünüyor.",
        "is_healthy": True,
    },
    "tomato_leaf_bacterial_spot": {
        "name": "Domates — Bakteriyel Leke (Yaprak)",
        "treatment": "Bakır bazlı bakterisit kullanın. Damla sulama tercih edin.",
        "is_healthy": False,
    },
    "tomato_leaf_late_blight": {
        "name": "Domates — Geç Yanıklık (Yaprak)",
        "treatment": "ACİL: Metalaxyl içeren fungisit uygulayın. Hastalıklı bitkileri sökün.",
        "is_healthy": False,
    },
    "tomato_leaf_mold": {
        "name": "Domates — Yaprak Küfü",
        "treatment": "Sera hava sirkülasyonunu artırın. Klorotalonil veya bakır fungisit uygulayın.",
        "is_healthy": False,
    },
    "tomato_leaf_mosaic_virus": {
        "name": "Domates — Mozaik Virüsü (Yaprak)",
        "treatment": "Virüslü bitkileri hemen söküp imha edin. Yaprak bitleri ve yeşil sinekleri kontrol altına alın.",
        "is_healthy": False,
    },
    "tomato_leaf_yellow_virus": {
        "name": "Domates — Sarı Yaprak Kıvırcıklık Virüsü",
        "treatment": "Beyazsinekleri kontrol edin (sarı yapışkan tuzak). Enfekteli bitkileri söküp imha edin.",
        "is_healthy": False,
    },
    "tomato_mold_leaf": {
        "name": "Domates — Küflü Yaprak",
        "treatment": "Nem oranını düşürün ve hava sirkülasyonunu artırın. Uygun fungisit uygulayın.",
        "is_healthy": False,
    },
    "tomato_septoria_leaf_spot": {
        "name": "Domates — Septoria Yaprak Lekesi",
        "treatment": "Chlorothalonil veya bakır bazlı fungisit kullanın. Yere temas eden yaprakları kesin.",
        "is_healthy": False,
    },
    "tomato_spider_mites_two_spotted_spider_mite": {
        "name": "Domates — İki Noktalı Kırmızı Örümcek",
        "treatment": "Akarisit (mitisit) uygulayın. Bitkileri düzenli olarak suyla yıkayın.",
        "is_healthy": False,
    },
    "tomato_target_spot": {
        "name": "Domates — Hedef Nokta Hastalığı",
        "treatment": "Azoxystrobin veya chlorothalonil içerikli fungisit uygulayın.",
        "is_healthy": False,
    },
    "tomato_tomato_mosaic_virus": {
        "name": "Domates — Domates Mozaik Virüsü",
        "treatment": "Hastalıklı bitkileri derhal kaldırın. Ağaç çalışmalarında aletleri sterilize edin.",
        "is_healthy": False,
    },
    "tomato_tomato_yellowleaf_curl_virus": {
        "name": "Domates — Sarı Yaprak Kıvırcıklık Virüsü",
        "treatment": "Beyazsinekleri kontrol edin (imidacloprid vb.). Dayanıklı çeşitler tercih edin.",
        "is_healthy": False,
    },
}

# ---------------------------------------------------------------------------
# Singleton: model yalnızca bir kez yüklenir
# ---------------------------------------------------------------------------
model = None


def load_ai_model():
    """Load the trained model (called once at startup)."""
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
    Preprocess the image for model prediction.

    The EfficientNetB0 model has a built-in Rescaling(1/255) layer,
    so we feed raw 0–255 float32 values.
    DO NOT divide by 255 here — that would cause double normalization.
    """
    image = image.resize(IMAGE_SIZE)
    if image.mode != "RGB":
        image = image.convert("RGB")
    # Ham piksel değerleri (0-255) — model içindeki Rescaling katmanı /255 yapar
    img_array = np.array(image, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)  # (1, H, W, 3)
    return img_array


def predict_disease(image: Image.Image) -> dict:
    """
    Predict plant disease from image.

    Returns a dict with:
      - disease:       raw class name (str)
      - turkish_name:  human-readable Turkish name (str)
      - treatment:     treatment recommendation in Turkish (str)
      - confidence:    prediction confidence as percentage (float)
      - is_healthy:    whether the plant is healthy (bool)
    """
    global model
    if model is None:
        load_ai_model()

    processed_image = preprocess_image(image)
    predictions = model.predict(processed_image, verbose=0)

    predicted_class_idx = int(np.argmax(predictions[0]))
    confidence = float(predictions[0][predicted_class_idx])

    # --- Güvenilirlik eşiği kontrolü ---
    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "disease": "low_confidence",
            "turkish_name": "Yaprak Algılanamadı ⚠️",
            "treatment": (
                "Lütfen yaprağı daha yakından ve net çekin. "
                "Yaprak algılanamadı."
            ),
            "confidence": round(confidence * 100, 2),
            "is_healthy": False,
        }

    raw_name = (
        CLASS_NAMES[predicted_class_idx]
        if predicted_class_idx < len(CLASS_NAMES)
        else f"Class_{predicted_class_idx}"
    )

    info = DISEASE_INFO.get(raw_name)
    if info:
        turkish_name = info["name"]
        treatment = info["treatment"]
        is_healthy = info["is_healthy"]
    else:
        # Fallback: convert raw class name to a readable string
        turkish_name = raw_name.replace("___", " — ").replace("_", " ").title()
        treatment = "Bu hastalık için öneri veritabanımızda bulunamadı."
        is_healthy = "healthy" in raw_name.lower()

    return {
        "disease": raw_name,
        "turkish_name": turkish_name,
        "treatment": treatment,
        "confidence": round(confidence * 100, 2),
        "is_healthy": is_healthy,
    }
