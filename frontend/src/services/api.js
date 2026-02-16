import axios from 'axios';

// CRITICAL: Replace this with your computer's local IP address
// To find your IP on Windows: Open CMD and type "ipconfig"
// Look for "IPv4 Address" under your active network adapter
// Example: http://192.168.1.35:8000
const API_URL = 'http://192.168.1.143:8000';

/**
 * Send image to backend for plant disease prediction
 * @param {string} imageUri - URI of the selected image
 * @returns {Promise} - Prediction result
 */
export const predictPlantDisease = async (imageUri) => {
    try {
        // Create FormData
        const formData = new FormData();

        // Extract filename from URI
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // Append image to FormData
        formData.append('file', {
            uri: imageUri,
            name: filename,
            type: type,
        });

        // Send POST request
        const response = await axios.post(`${API_URL}/api/predict`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000, // 30 seconds timeout
        });

        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export default {
    predictPlantDisease,
};
