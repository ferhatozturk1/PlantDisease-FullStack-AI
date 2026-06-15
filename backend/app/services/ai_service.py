import numpy as np
from PIL import Image
import tensorflow as tf
from app.core.config import MODEL_PATH, IMAGE_SIZE

# ---------------------------------------------------------------------------
# GÜVENİLİRLİK EŞİĞİ
# Modelin tahmini bu değerin altındaysa hastalık adı yerine
# kullanıcıya açıklayıcı bir uyarı döndürülür.
# ---------------------------------------------------------------------------
CONFIDENCE_THRESHOLD = 0.60  # %60

# ---------------------------------------------------------------------------
# CLASS NAMES — PlantVillage 38 sınıf (alfabetik sıra, model eğitim sırası)
# ---------------------------------------------------------------------------
CLASS_NAMES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

# ---------------------------------------------------------------------------
# DISEASE INFO — Türkçe isim + tedavi önerisi + sağlık durumu (38 sınıf)
# ---------------------------------------------------------------------------
DISEASE_INFO = {
    # -- ELMA (Apple) --
    "Apple___Apple_scab": {
        "name": "Elma — Karaleke",
        "treatment": "Dökülen yaprakları temizleyin. Tomurcuklar kabarmadan %2'lik Bordo Bulamacı uygulayın.",
        "is_healthy": False,
    },
    "Apple___Black_rot": {
        "name": "Elma — Kara Çürüklük",
        "treatment": "Enfekteli meyve ve dalları budayın. Captan veya myclobutanil içerikli fungisit uygulayın.",
        "is_healthy": False,
    },
    "Apple___Cedar_apple_rust": {
        "name": "Elma — Pas Hastalığı",
        "treatment": "Turuncu lekelere karşı ilkbahar başında propiconazole içerikli fungisit uygulayın.",
        "is_healthy": False,
    },
    "Apple___healthy": {
        "name": "Elma — Sağlıklı 🍎",
        "treatment": "Bitkiniz harika görünüyor! Mevcut bakım rutininize devam edin.",
        "is_healthy": True,
    },

    # -- YABAN MERSİNİ (Blueberry) --
    "Blueberry___healthy": {
        "name": "Yaban Mersini — Sağlıklı 🫐",
        "treatment": "Mükemmel! Toprak pH'ını asidik tutmaya devam edin.",
        "is_healthy": True,
    },

    # -- KİRAZ (Cherry) --
    "Cherry_(including_sour)___Powdery_mildew": {
        "name": "Kiraz — Külleme Hastalığı",
        "treatment": "Kükürt bazlı fungisit uygulayın. Hava sirkülasyonunu artırın.",
        "is_healthy": False,
    },
    "Cherry_(including_sour)___healthy": {
        "name": "Kiraz — Sağlıklı 🍒",
        "treatment": "Ağacınız sağlıklı görünüyor. Budama ve iyi hava sirkülasyonu sağlayın.",
        "is_healthy": True,
    },

    # -- MISIR (Corn) --
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "name": "Mısır — Gri Yaprak Lekesi",
        "treatment": "Strobilurin veya triazol içerikli fungisit uygulayın. Ekim nöbeti yapın.",
        "is_healthy": False,
    },
    "Corn_(maize)___Common_rust_": {
        "name": "Mısır — Pas Hastalığı",
        "treatment": "Propiconazole içerikli fungisit ile erken dönemde ilaçlama yapın.",
        "is_healthy": False,
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "name": "Mısır — Yaprak Yanıklığı",
        "treatment": "Dayanıklı çeşitler seçin. Şiddetli vakalarda fungisit uygulayın.",
        "is_healthy": False,
    },
    "Corn_(maize)___healthy": {
        "name": "Mısır — Sağlıklı 🌽",
        "treatment": "Mısırınız sağlıklı! Düzenli gübreleme ve sulamaya devam edin.",
        "is_healthy": True,
    },

    # -- ÜZÜM (Grape) --
    "Grape___Black_rot": {
        "name": "Üzüm — Kara Çürüklük",
        "treatment": "Mancozeb ya da captan içerikli fungisit uygulayın. Dökülen meyveleri ve yaprakları toplayın.",
        "is_healthy": False,
    },
    "Grape___Esca_(Black_Measles)": {
        "name": "Üzüm — Esca (Kara Kızamık)",
        "treatment": "Enfekteli dalları budayın. Yara yerlerine koruyucu macun uygulayın.",
        "is_healthy": False,
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "name": "Üzüm — Yaprak Yanıklığı",
        "treatment": "Bakır bazlı fungisit uygulayın. Hava sirkülasyonunu artırın.",
        "is_healthy": False,
    },
    "Grape___healthy": {
        "name": "Üzüm — Sağlıklı 🍇",
        "treatment": "Bağınız sağlıklı! Hava dolaşımını koruyun ve düzenli budama yapın.",
        "is_healthy": True,
    },

    # -- PORTAKAL (Orange) --
    "Orange___Haunglongbing_(Citrus_greening)": {
        "name": "Portakal — Huanglongbing (Yeşillenme)",
        "treatment": "Psyllid böceklerini kontrol edin. Enfekteli ağaçları sökün. Bölge tarım müdürlüğüne bildirin.",
        "is_healthy": False,
    },

    # -- ŞEFTALİ (Peach) --
    "Peach___Bacterial_spot": {
        "name": "Şeftali — Bakteriyel Leke",
        "treatment": "Bakır bazlı bakterisit ile sonbaharda ilaçlama yapın. Dayanıklı çeşitler tercih edin.",
        "is_healthy": False,
    },
    "Peach___healthy": {
        "name": "Şeftali — Sağlıklı 🍑",
        "treatment": "Ağacınız sağlıklı! Sonbahar ve ilkbaharda bakır bazlı sprey uygulayın.",
        "is_healthy": True,
    },

    # -- BİBER (Pepper) --
    "Pepper,_bell___Bacterial_spot": {
        "name": "Biber — Bakteriyel Leke",
        "treatment": "Hemen bakır oksiklorür uygulayın ve hastalıklı yaprakları uzaklaştırın.",
        "is_healthy": False,
    },
    "Pepper,_bell___healthy": {
        "name": "Biber — Sağlıklı 🫑",
        "treatment": "Bitkileriniz sağlıklı! Düzenli sulamaya devam edin.",
        "is_healthy": True,
    },

    # -- PATATES (Potato) --
    "Potato___Early_blight": {
        "name": "Patates — Erken Yanıklık",
        "treatment": "Ekim nöbeti uygulayın. Chlorothalonil içerikli fungisit kullanın.",
        "is_healthy": False,
    },
    "Potato___Late_blight": {
        "name": "Patates — Geç Yanıklık",
        "treatment": "Hızla yayılan bir hastalıktır. Hemen metalaxyl içeren fungisit ile müdahale edin.",
        "is_healthy": False,
    },
    "Potato___healthy": {
        "name": "Patates — Sağlıklı 🥔",
        "treatment": "Bitkiniz sağlıklı! İyi drenaj ve uygun sulama ile koruyun.",
        "is_healthy": True,
    },

    # -- AHUDUDU (Raspberry) --
    "Raspberry___healthy": {
        "name": "Ahududu — Sağlıklı 🍓",
        "treatment": "Bitkileriniz sağlıklı! Kesim sonrası iyi hava sirkülasyonu sağlayın.",
        "is_healthy": True,
    },

    # -- SOYA FASULYESİ (Soybean) --
    "Soybean___healthy": {
        "name": "Soya Fasulyesi — Sağlıklı 🌱",
        "treatment": "Soya fasulyeniz gayet sağlıklı! Ekim nöbetine devam edin.",
        "is_healthy": True,
    },

    # -- KABAK (Squash) --
    "Squash___Powdery_mildew": {
        "name": "Kabak — Külleme Hastalığı",
        "treatment": "Kükürt bazlı fungisit veya potasyum bikarbonat spreyi uygulayın. Bitki sıklığını azaltın.",
        "is_healthy": False,
    },

    # -- ÇİLEK (Strawberry) --
    "Strawberry___Leaf_scorch": {
        "name": "Çilek — Yaprak Yanığı",
        "treatment": "Enfekteli yaprakları temizleyin. Bakır bazlı fungisit uygulayın.",
        "is_healthy": False,
    },
    "Strawberry___healthy": {
        "name": "Çilek — Sağlıklı 🍓",
        "treatment": "Bitkileriniz sağlıklı! Toprak üstü örtüsü ile nemlilik kontrol edin.",
        "is_healthy": True,
    },

    # -- DOMATES (Tomato) --
    "Tomato___Bacterial_spot": {
        "name": "Domates — Bakteriyel Leke",
        "treatment": "Bakır bazlı bakterisit kullanın. Damla sulama tercih edin.",
        "is_healthy": False,
    },
    "Tomato___Early_blight": {
        "name": "Domates — Erken Yanıklık",
        "treatment": "Mancozeb içerikli fungisit ile 7-14 günde bir ilaçlayın. Alt yaprakları temizleyin.",
        "is_healthy": False,
    },
    "Tomato___Late_blight": {
        "name": "Domates — Geç Yanıklık",
        "treatment": "ACİL: Metalaxyl içeren fungisit uygulayın. Hastalıklı bitkileri sökün.",
        "is_healthy": False,
    },
    "Tomato___Leaf_Mold": {
        "name": "Domates — Yaprak Küfü",
        "treatment": "Sera hava sirkülasyonunu artırın. Klorotalonil veya bakır fungisit uygulayın.",
        "is_healthy": False,
    },
    "Tomato___Septoria_leaf_spot": {
        "name": "Domates — Septoria Yaprak Lekesi",
        "treatment": "Chlorothalonil veya bakır bazlı fungisit kullanın. Yere temas eden yaprakları kesin.",
        "is_healthy": False,
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "name": "Domates — İki Noktalı Kırmızı Örümcek",
        "treatment": "Akarisit (mitisit) uygulayın. Bitkileri düzenli olarak suyla yıkayın.",
        "is_healthy": False,
    },
    "Tomato___Target_Spot": {
        "name": "Domates — Hedef Nokta Hastalığı",
        "treatment": "Azoxystrobin veya chlorothalonil içerikli fungisit uygulayın.",
        "is_healthy": False,
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "name": "Domates — Sarı Yaprak Kıvırcıklık Virüsü",
        "treatment": "Beyazsinekleri kontrol edin (imidacloprid vb.). Dayanıklı çeşitler tercih edin.",
        "is_healthy": False,
    },
    "Tomato___Tomato_mosaic_virus": {
        "name": "Domates — Domates Mozaik Virüsü",
        "treatment": "Hastalıklı bitkileri derhal kaldırın. Aletleri sterilize edin.",
        "is_healthy": False,
    },
    "Tomato___healthy": {
        "name": "Domates — Sağlıklı 🍅",
        "treatment": "Domatesleriniz gayet sağlıklı! Bakım rutininize devam edin.",
        "is_healthy": True,
    },
}

# ---------------------------------------------------------------------------
# Singleton: model yalnızca bir kez yüklenir
# ---------------------------------------------------------------------------
model = None


def _load_weights_from_h5(mdl, weights_path: str):
    """
    Load weights from model.weights.h5 using h5py.

    The h5 file uses generic layer names (conv2d, batch_normalization, etc.)
    while our Keras 3 EfficientNetB0 model uses descriptive names
    (stem_conv, stem_bn, etc.).  We map them using layer-type counters:
    each Conv2D, BatchNormalization, and DepthwiseConv2D is numbered
    in creation order.
    """
    import h5py

    with h5py.File(weights_path, "r") as f:
        func_layers = f["layers/functional/layers"]

        def _generic_name(prefix: str, idx: int) -> str:
            return prefix if idx == 0 else f"{prefix}_{idx}"

        def _read_vars(group_path):
            grp = f[group_path]
            vars_grp = grp.get("vars")
            if vars_grp is None or len(vars_grp) == 0:
                return []
            keys = sorted(vars_grp.keys(), key=int)
            return [np.array(vars_grp[k]) for k in keys]

        # ---- EfficientNetB0 sub-model (inside layers/functional/layers) ----
        conv2d_idx = 0
        bn_idx = 0
        dw_idx = 0

        for layer in mdl.layers:
            layer_cls = type(layer).__name__

            if layer_cls == "Normalization":
                h5_name = "normalization"
                path = f"layers/functional/layers/{h5_name}"
                weights = _read_vars(path)
                if weights:
                    layer.set_weights(weights)

            elif layer_cls == "Conv2D":
                h5_name = _generic_name("conv2d", conv2d_idx)
                path = f"layers/functional/layers/{h5_name}"
                weights = _read_vars(path)
                if weights:
                    layer.set_weights(weights)
                conv2d_idx += 1

            elif layer_cls == "BatchNormalization":
                h5_name = _generic_name("batch_normalization", bn_idx)
                path = f"layers/functional/layers/{h5_name}"
                weights = _read_vars(path)
                if weights:
                    layer.set_weights(weights)
                bn_idx += 1

            elif layer_cls == "DepthwiseConv2D":
                h5_name = _generic_name("depthwise_conv2d", dw_idx)
                path = f"layers/functional/layers/{h5_name}"
                weights = _read_vars(path)
                if weights:
                    layer.set_weights(weights)
                dw_idx += 1

            elif layer_cls == "Dense":
                # Top-level dense layer
                path = "layers/dense"
                weights = _read_vars(path)
                if weights:
                    layer.set_weights(weights)


def load_ai_model():
    """
    Load the trained model using model.weights.h5.
    Builds EfficientNetB0 architecture, then loads weights via custom h5 mapper.
    """
    global model
    if model is None:
        import os

        if not os.path.exists(MODEL_PATH):
            print(f"[WARNING] Agirlik dosyasi bulunamadi: {MODEL_PATH}")
            print("[WARNING] /api/predict endpoint'i calismayacak.")
            return None

        num_classes = len(CLASS_NAMES)  # 38
        print(f"[INFO] Model mimarisi olusturuluyor (EfficientNetB0 + Dense({num_classes}))...")

        base_model = tf.keras.applications.EfficientNetB0(
            include_top=False,
            weights=None,
            input_shape=(224, 224, 3),
        )
        x = tf.keras.layers.GlobalAveragePooling2D()(base_model.output)
        x = tf.keras.layers.Dropout(0.5)(x)
        outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)
        model = tf.keras.Model(base_model.input, outputs)

        print(f"[INFO] Agirliklar yukleniyor: {MODEL_PATH}")
        _load_weights_from_h5(model, MODEL_PATH)
        print("[OK] Model basariyla yuklendi!")
    return model


def preprocess_image(image: Image.Image) -> np.ndarray:
    """
    Preprocess the image for model prediction.

    The EfficientNetB0 model has built-in preprocessing layers
    (Rescaling + Normalization), so we feed raw 0-255 float32 values.
    DO NOT divide by 255 here.
    """
    image = image.resize(IMAGE_SIZE)
    if image.mode != "RGB":
        image = image.convert("RGB")
    # Ham piksel degerleri (0-255) — model icindeki katmanlar normalizasyon yapar
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

    # --- Guvenilirlik esigi kontrolu ---
    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "disease": "low_confidence",
            "turkish_name": "Yaprak Algilanamadi",
            "treatment": (
                "Lutfen yapragi daha yakindan ve net cekin. "
                "Yaprak algilanamadi."
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
        turkish_name = raw_name.replace("___", " - ").replace("_", " ").title()
        treatment = "Bu hastalik icin oneri veritabanimizda bulunamadi."
        is_healthy = "healthy" in raw_name.lower()

    return {
        "disease": raw_name,
        "turkish_name": turkish_name,
        "treatment": treatment,
        "confidence": round(confidence * 100, 2),
        "is_healthy": is_healthy,
    }
