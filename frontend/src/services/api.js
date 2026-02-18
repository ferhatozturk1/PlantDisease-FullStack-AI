import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:8000';

// Axios instance
const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
});

// Her istekte token varsa Authorization header ekle
api.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        // ignore
    }
    return config;
});

// Bitki hastalığı tespiti
export const predictPlantDisease = async (imageUri) => {
    const formData = new FormData();

    // Web ve native için farklı format
    if (typeof imageUri === 'string' && imageUri.startsWith('data:')) {
        // Web: base64
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('file', blob, 'plant.jpg');
    } else {
        // Native
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'plant.jpg',
        });
    }

    const response = await api.post('/api/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response;
};

// Geçmiş teşhisler
export const getHistory = async () => {
    const response = await api.get('/api/history');
    return response;
};

export default api;
