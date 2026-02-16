import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { predictPlantDisease } from './src/services/api';

export default function App() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // Pick image from gallery
    const pickImage = async () => {
        try {
            // Request permission
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert('İzin Gerekli', 'Galeriye erişim izni gereklidir!');
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0].uri);
                setResult(null);
            }
        } catch (error) {
            console.error('Resim seçme hatası:', error);
            Alert.alert('Hata', 'Resim seçilemedi');
        }
    };

    // Analyze plant disease
    const analyzePlant = async () => {
        if (!selectedImage) {
            Alert.alert('Resim Yok', 'Lütfen önce bir resim seçin');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await predictPlantDisease(selectedImage);

            if (response.success) {
                setResult(response.data);
            } else {
                Alert.alert('Hata', 'Resim analiz edilemedi');
            }
        } catch (error) {
            console.error('Analiz hatası:', error);
            Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı. Backend çalıştığından emin olun.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>🌿 Bitki Hastalığı Tespiti</Text>

            {/* Image Preview */}
            {selectedImage && (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: selectedImage }} style={styles.image} />
                </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={pickImage}>
                    <Text style={styles.buttonText}>📷 Resim Seç</Text>
                </TouchableOpacity>

                {selectedImage && (
                    <TouchableOpacity
                        style={[styles.button, styles.analyzeButton]}
                        onPress={analyzePlant}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Analiz Ediliyor...' : '🔍 Bitkiyi Analiz Et'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Loading Spinner */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Bitki analiz ediliyor...</Text>
                </View>
            )}

            {/* Result Display */}
            {result && !loading && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultTitle}>📊 Analiz Sonucu</Text>

                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Hastalık:</Text>
                        <Text style={styles.resultValue}>{result.disease}</Text>
                    </View>

                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Güven:</Text>
                        <Text style={styles.confidenceValue}>%{result.confidence}</Text>
                    </View>
                </View>
            )}

            {/* Instructions */}
            {!selectedImage && (
                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsText}>
                        👆 Galerinizden bir bitki fotoğrafı seçmek için "Resim Seç" butonuna dokunun
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        paddingVertical: 50,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 30,
        textAlign: 'center',
    },
    imageContainer: {
        width: '100%',
        maxWidth: 400,
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 400,
        gap: 15,
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    analyzeButton: {
        backgroundColor: '#2196F3',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    loadingContainer: {
        marginTop: 30,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    resultContainer: {
        width: '100%',
        maxWidth: 400,
        marginTop: 30,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    resultTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    resultCard: {
        marginBottom: 15,
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    resultLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    resultValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    confidenceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    instructionsContainer: {
        marginTop: 30,
        padding: 20,
        backgroundColor: '#E3F2FD',
        borderRadius: 10,
        maxWidth: 400,
    },
    instructionsText: {
        fontSize: 16,
        color: '#1976D2',
        textAlign: 'center',
        lineHeight: 24,
    },
});
