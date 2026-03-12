# 🌿 Plant Disease Detection - Proje Açıklaması

Bu döküman, projenin tüm dosyalarını ve nasıl çalıştığını detaylı olarak açıklar.

---

## 📂 Proje Yapısı

```
PlantDisease-FullStack-AI/
├── backend/          # Python FastAPI sunucusu
└── frontend/         # React Native mobil uygulama
```

---

# 🔧 BACKEND (Sunucu Tarafı)

Backend, Python ile yazılmış bir API sunucusudur. Resim alır, AI modeli ile analiz eder ve sonucu döndürür.

## 📁 Backend Klasör Yapısı

```
backend/
├── main.py                           # Ana sunucu dosyası
├── requirements.txt                  # Python paketleri listesi
└── app/
    ├── __init__.py                   # Python paketi işaretleyici
    ├── core/
    │   ├── __init__.py
    │   └── config.py                 # Ayarlar ve sabitler
    ├── api/
    │   ├── __init__.py
    │   └── diagnosis.py              # API endpoint'leri
    └── services/
        ├── __init__.py
        ├── ai_service.py             # AI model servisi
        └── models/
            └── model.h5              # Eğitilmiş AI modeli (bizim eklememiz gerekiyor)
```

---

## 📄 Backend Dosyaları Detaylı Açıklama

### 1. `requirements.txt`
**Ne işe yarar?** Python'da hangi kütüphanelerin kurulması gerektiğini belirtir.

```txt
fastapi==0.115.0        # Web framework (API oluşturmak için)
uvicorn==0.32.0         # ASGI sunucusu (FastAPI'yi çalıştırır)
tensorflow==2.20.0      # AI/ML kütüphanesi (model çalıştırır)
pillow==11.0.0          # Resim işleme kütüphanesi
python-multipart==0.0.12 # Dosya upload için
numpy==2.2.0            # Sayısal işlemler için
```

**Nasıl kullanılır?**
```bash
pip install -r requirements.txt
```

---

### 2. `backend/app/core/config.py`
**Ne işe yarar?** Projedeki sabit değerleri ve ayarları tutar.

```python
import os
from pathlib import Path

# Proje ana dizini
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Model dosyasının yolu
MODEL_PATH = os.path.join(BASE_DIR, "app", "services", "models", "model.h5")

# API bilgileri
API_TITLE = "Plant Disease Detection API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "AI-powered plant disease detection system"

# Resim boyutu (model 224x224 bekliyor)
IMAGE_SIZE = (224, 224)
```

**Neden var?** 
- Değerleri tek yerden yönetmek için
- Kod tekrarını önlemek için
- Değişiklik yapmayı kolaylaştırmak için

---

### 3. `backend/app/services/ai_service.py`
**Ne işe yarar?** AI modelini yükler ve tahmin yapar. En önemli dosyalardan biri!

#### 🔹 Model Yükleme (Singleton Pattern)
```python
model = None  # Global değişken

def load_ai_model():
    global model
    if model is None:  # Sadece bir kez yükle
        model = load_model(MODEL_PATH)
    return model
```

**Neden Singleton?** Model çok büyük (100+ MB). Her istekte yeniden yüklemek çok yavaş olur. Bir kez yükleyip hafızada tutuyoruz.

#### 🔹 Resim Ön İşleme
```python
def preprocess_image(image: Image.Image) -> np.ndarray:
    # 1. Boyutlandır (224x224)
    image = image.resize(IMAGE_SIZE)
    
    # 2. RGB formatına çevir
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # 3. Numpy array'e çevir
    img_array = np.array(image)
    
    # 4. Normalize et (0-1 arasına çek)
    img_array = img_array / 255.0
    
    # 5. Boyut ekle (1, 224, 224, 3)
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array
```

**Neden bu adımlar?**
- Model 224x224 boyutunda resim bekliyor
- Piksel değerleri 0-255 arası, model 0-1 arası bekliyor
- Model batch (grup) şeklinde çalışır, bu yüzden boyut ekliyoruz

#### 🔹 Tahmin Yapma
```python
def predict_disease(image: Image.Image) -> dict:
    # Model yüklü mü kontrol et
    if model is None:
        load_ai_model()
    
    # Resmi hazırla
    processed_image = preprocess_image(image)
    
    # Tahmin yap
    predictions = model.predict(processed_image)
    
    # En yüksek olasılıklı sınıfı bul
    predicted_class_idx = np.argmax(predictions[0])
    confidence = float(predictions[0][predicted_class_idx])
    
    # Sınıf ismini al
    class_name = class_names[predicted_class_idx]
    
    return {
        "disease": class_name,
        "confidence": round(confidence * 100, 2)
    }
```

**class_names listesi:** Model 25 farklı hastalığı tanıyor (Elma, Mısır, Üzüm, Patates, Domates hastalıkları).

---

### 4. `backend/app/api/diagnosis.py`
**Ne işe yarar?** API endpoint'ini tanımlar. Frontend buraya istek atar.

```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io
from app.services.ai_service import predict_disease

router = APIRouter()

@router.post("/predict")
async def predict_plant_disease(file: UploadFile = File(...)):
    try:
        # 1. Dosya tipini kontrol et
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Dosya resim olmalı")
        
        # 2. Resmi oku
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # 3. Tahmin yap
        result = predict_disease(image)
        
        # 4. Sonucu döndür
        return {
            "success": True,
            "data": {
                "disease": result["disease"],
                "confidence": result["confidence"]
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hata: {str(e)}")
```

**Endpoint:** `POST /api/predict`
- **Giriş:** Resim dosyası (multipart/form-data)
- **Çıkış:** JSON `{"success": true, "data": {"disease": "...", "confidence": 95.5}}`

---

### 5. `backend/main.py`
**Ne işe yarar?** Sunucuyu başlatır ve her şeyi bir araya getirir.

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import diagnosis
from app.services.ai_service import load_ai_model

# FastAPI uygulaması oluştur
app = FastAPI(
    title="Plant Disease Detection API",
    version="1.0.0"
)

# CORS ekle (Frontend'in bağlanabilmesi için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tüm kaynaklara izin ver
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ı ekle
app.include_router(diagnosis.router, prefix="/api", tags=["Diagnosis"])

# Başlangıçta model yükle
@app.on_event("startup")
async def startup_event():
    load_ai_model()

# Ana sayfa
@app.get("/")
async def root():
    return {"message": "Plant Disease Detection API", "status": "running"}
```

**CORS nedir?** Cross-Origin Resource Sharing. Frontend farklı bir portta çalıştığı için buna izin vermemiz gerekiyor.

**Nasıl çalıştırılır?**
```bash
cd backend
python main.py
```
Sunucu `http://0.0.0.0:8000` adresinde başlar.

---

# 📱 FRONTEND (Mobil Uygulama)

Frontend, React Native ile yazılmış bir mobil uygulamadır. Expo kullanarak kolayca test edilebilir.

## 📁 Frontend Klasör Yapısı

```
frontend/
├── App.js                    # Ana uygulama dosyası
├── app.json                  # Expo konfigürasyonu
├── package.json              # NPM paketleri
└── src/
    └── services/
        └── api.js            # Backend ile iletişim
```

---

## 📄 Frontend Dosyaları Detaylı Açıklama

### 1. `package.json`
**Ne işe yarar?** Node.js projesi için gerekli paketleri listeler.

```json
{
  "name": "plant-disease-detection",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",      // Expo'yu başlat
    "android": "expo start --android",
    "ios": "expo start --ios"
  },
  "dependencies": {
    "expo": "~54.0.0",          // Expo framework
    "react": "19.1.0",          // React kütüphanesi
    "react-native": "0.81.5",   // React Native
    "axios": "^1.6.5",          // HTTP istekleri için
    "expo-image-picker": "~17.0.10"  // Resim seçmek için
  }
}
```

**Nasıl kullanılır?**
```bash
npm install  # Paketleri kur
npm start    # Uygulamayı başlat
```

---

### 2. `app.json`
**Ne işe yarar?** Expo uygulamasının ayarlarını tutar.

```json
{
  "expo": {
    "name": "Plant Disease Detection",
    "slug": "plant-disease-detection",
    "version": "1.0.0",
    "orientation": "portrait",      // Sadece dikey mod
    "platforms": ["ios", "android"], // Desteklenen platformlar
    "ios": {
      "supportsTablet": true        // iPad desteği
    },
    "android": {
      "package": "com.plantdisease.app"  // Android paket adı
    }
  }
}
```

---

### 3. `frontend/src/services/api.js`
**Ne işe yarar?** Backend ile iletişim kurar.

```javascript
import axios from 'axios';

// Backend adresi (BİLGİSAYARINIZIN IP ADRESİ)
const API_URL = 'http://192.168.1.143:8000';

export const predictPlantDisease = async (imageUri) => {
  try {
    // FormData oluştur
    const formData = new FormData();
    
    // Dosya adını al
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // Resmi ekle
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: type,
    });
    
    // POST isteği gönder
    const response = await axios.post(`${API_URL}/api/predict`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,  // 30 saniye timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('API Hatası:', error);
    throw error;
  }
};
```

**Önemli:** `API_URL`'i kendi IP adresinizle değiştirmelisiniz!

**IP adresinizi bulmak için:**
```bash
ipconfig  # Windows
```
IPv4 Address'i kullanın (örn: 192.168.1.143)

---

### 4. `frontend/App.js`
**Ne işe yarar?** Uygulamanın ana ekranı. Kullanıcı arayüzü burada.

#### 🔹 State Yönetimi
```javascript
const [selectedImage, setSelectedImage] = useState(null);  // Seçilen resim
const [loading, setLoading] = useState(false);             // Yükleniyor mu?
const [result, setResult] = useState(null);                // Sonuç
```

#### 🔹 Resim Seçme
```javascript
const pickImage = async () => {
  // 1. İzin iste
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (permissionResult.granted === false) {
    Alert.alert('İzin Gerekli', 'Galeriye erişim izni gereklidir!');
    return;
  }

  // 2. Resim seçiciyi aç
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  // 3. Seçilen resmi kaydet
  if (!result.canceled) {
    setSelectedImage(result.assets[0].uri);
    setResult(null);
  }
};
```

#### 🔹 Analiz Yapma
```javascript
const analyzePlant = async () => {
  if (!selectedImage) {
    Alert.alert('Resim Yok', 'Lütfen önce bir resim seçin');
    return;
  }

  setLoading(true);
  setResult(null);

  try {
    // Backend'e istek at
    const response = await predictPlantDisease(selectedImage);

    if (response.success) {
      setResult(response.data);  // Sonucu göster
    } else {
      Alert.alert('Hata', 'Resim analiz edilemedi');
    }
  } catch (error) {
    Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı');
  } finally {
    setLoading(false);
  }
};
```

#### 🔹 Kullanıcı Arayüzü
```javascript
return (
  <ScrollView>
    {/* Başlık */}
    <Text style={styles.title}>🌿 Bitki Hastalığı Tespiti</Text>

    {/* Resim Önizleme */}
    {selectedImage && (
      <Image source={{ uri: selectedImage }} style={styles.image} />
    )}

    {/* Butonlar */}
    <TouchableOpacity onPress={pickImage}>
      <Text>📷 Resim Seç</Text>
    </TouchableOpacity>

    {selectedImage && (
      <TouchableOpacity onPress={analyzePlant}>
        <Text>🔍 Bitkiyi Analiz Et</Text>
      </TouchableOpacity>
    )}

    {/* Yükleniyor Göstergesi */}
    {loading && <ActivityIndicator size="large" color="#4CAF50" />}

    {/* Sonuç */}
    {result && (
      <View>
        <Text>Hastalık: {result.disease}</Text>
        <Text>Güven: %{result.confidence}</Text>
      </View>
    )}
  </ScrollView>
);
```

---

## 🔄 Sistem Nasıl Çalışıyor? (Akış Diyagramı)

```
1. Kullanıcı uygulamayı açar
   ↓
2. "Resim Seç" butonuna basar
   ↓
3. Galeriden bir bitki fotoğrafı seçer
   ↓
4. Seçilen resim ekranda gösterilir
   ↓
5. "Bitkiyi Analiz Et" butonuna basar
   ↓
6. Frontend resmi Backend'e gönderir (HTTP POST)
   ↓
7. Backend resmi alır
   ↓
8. Backend resmi ön işler (224x224, normalize)
   ↓
9. AI modeli resmi analiz eder
   ↓
10. Model hastalık ve güven oranı döndürür
    ↓
11. Backend sonucu JSON olarak Frontend'e gönderir
    ↓
12. Frontend sonucu ekranda gösterir
```

---

## 🚀 Projeyi Çalıştırma Adımları

### 1. Backend'i Başlat
```bash
cd backend
pip install -r requirements.txt
# model.h5 dosyasını backend/app/services/models/ klasörüne koy
python main.py
```

### 2. Frontend'i Başlat
```bash
cd frontend
npm install
# src/services/api.js'de API_URL'i düzenle
npx expo start
```

### 3. Telefonda Aç
- Expo Go uygulamasını indir
- QR kodu tara
- Uygulamayı kullan!

---

## 🎯 Önemli Noktalar

### Backend
- ✅ Model sadece bir kez yüklenir (hız için)
- ✅ CORS açık (Frontend bağlanabilir)
- ✅ Resimler otomatik ön işlenir
- ✅ 25 farklı hastalık tanınır

### Frontend
- ✅ Expo ile kolay test
- ✅ Resim seçme ve önizleme
- ✅ Yükleniyor göstergesi
- ✅ Hata yönetimi
- ✅ Türkçe arayüz

---

## 📊 Veri Akışı

```
[Kullanıcı] 
    ↓ (Resim seçer)
[App.js - pickImage()]
    ↓ (Resim URI'si)
[App.js - analyzePlant()]
    ↓ (HTTP POST)
[api.js - predictPlantDisease()]
    ↓ (FormData)
[Backend - diagnosis.py]
    ↓ (Image object)
[ai_service.py - predict_disease()]
    ↓ (Preprocessed array)
[TensorFlow Model]
    ↓ (Predictions)
[ai_service.py]
    ↓ (JSON response)
[Backend]
    ↓ (HTTP response)
[Frontend]
    ↓ (Ekranda göster)
[Kullanıcı]
```

---

## 🔐 Güvenlik Notları

- Backend tüm kaynaklara açık (`allow_origins=["*"]`)
- Üretimde bu kapatılmalı!
- Sadece belirli IP'lere izin verilmeli
- API key eklenebilir

---

## 🎨 Stil ve Tasarım

App.js'de `StyleSheet.create()` ile stiller tanımlanmış:
- Yeşil tema (#4CAF50, #2E7D32)
- Mavi aksiyon butonu (#2196F3)
- Gölgeler ve yuvarlatılmış köşeler
- Responsive tasarım (maxWidth: 400)

---

Bu döküman projenin tüm detaylarını içeriyor. Herhangi bir kısım hakkında daha fazla soru sorabilirsiniz! 🌿
