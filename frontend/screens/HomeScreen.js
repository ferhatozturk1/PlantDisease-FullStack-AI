import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity, Image,
    ActivityIndicator, ScrollView, Alert, SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { predictPlantDisease } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';

export default function HomeScreen({ navigation }) {
    const { userEmail, isGuest, logout } = useAuth();
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('İzin Gerekli', 'Galeriye erişim izni gereklidir!');
                return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                base64: false,
            });
            if (!res.canceled) {
                setSelectedImage(res.assets[0].uri);
                setResult(null);
            }
        } catch (error) {
            Alert.alert('Hata', 'Resim seçilemedi');
        }
    };

    const analyzePlant = async () => {
        if (!selectedImage) {
            Alert.alert('Resim Yok', 'Lütfen önce bir resim seçin');
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const response = await predictPlantDisease(selectedImage);
            if (response.data.success) {
                setResult({ ...response.data.data, saved: response.data.saved });
            } else {
                Alert.alert('Hata', 'Resim analiz edilemedi');
            }
        } catch (error) {
            Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı. Backend çalıştığından emin olun.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.greeting}>
                        {isGuest ? '👤 Misafir' : `👋 ${userEmail?.split('@')[0]}`}
                    </Text>
                    {isGuest && <Text style={styles.guestNote}>Geçmiş kaydedilmiyor</Text>}
                </View>
                <View style={styles.topBarActions}>
                    {!isGuest && (
                        <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.historyBtn}>
                            <Text style={styles.historyBtnText}>📊 Geçmiş</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>{isGuest ? 'Çıkış' : '🚪'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>🌿 Bitki Hastalığı Tespiti</Text>

                {selectedImage && (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: selectedImage }} style={styles.image} />
                    </View>
                )}

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

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingText}>Bitki analiz ediliyor...</Text>
                    </View>
                )}

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
                        {result.saved && (
                            <Text style={styles.savedNote}>✅ Geçmişe kaydedildi</Text>
                        )}
                    </View>
                )}

                {!selectedImage && (
                    <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsText}>
                            👆 Galerinizden bir bitki fotoğrafı seçmek için "Resim Seç" butonuna dokunun
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0d2318' },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#1a3a2a',
        borderBottomWidth: 1,
        borderBottomColor: '#2d6b42',
    },
    greeting: { fontSize: 16, fontWeight: '700', color: '#fff' },
    guestNote: { fontSize: 11, color: '#6b8f7a', marginTop: 2 },
    topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    historyBtn: {
        backgroundColor: '#2d6b42',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    historyBtnText: { color: '#a8d5b5', fontSize: 13, fontWeight: '600' },
    logoutBtn: { padding: 6 },
    logoutText: { color: '#6b8f7a', fontSize: 14 },
    container: {
        flexGrow: 1,
        backgroundColor: '#0d2318',
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    title: { fontSize: 26, fontWeight: 'bold', color: '#a8d5b5', marginBottom: 24, textAlign: 'center' },
    imageContainer: {
        width: '100%', maxWidth: 400, aspectRatio: 1,
        backgroundColor: '#1a3a2a', borderRadius: 15, overflow: 'hidden',
        marginBottom: 20, borderWidth: 1, borderColor: '#2d6b42',
    },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    buttonContainer: { width: '100%', maxWidth: 400, gap: 12 },
    button: {
        backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 30,
        borderRadius: 12, alignItems: 'center', elevation: 3,
    },
    analyzeButton: { backgroundColor: '#2196F3' },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
    loadingContainer: { marginTop: 30, alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 15, color: '#8aab96' },
    resultContainer: {
        width: '100%', maxWidth: 400, marginTop: 24,
        backgroundColor: '#1a3a2a', borderRadius: 15, padding: 20,
        borderWidth: 1, borderColor: '#2d6b42',
    },
    resultTitle: { fontSize: 20, fontWeight: 'bold', color: '#a8d5b5', marginBottom: 14, textAlign: 'center' },
    resultCard: {
        marginBottom: 12, padding: 14, backgroundColor: '#0d2318',
        borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#4CAF50',
    },
    resultLabel: { fontSize: 13, color: '#6b8f7a', marginBottom: 4 },
    resultValue: { fontSize: 17, fontWeight: '600', color: '#fff' },
    confidenceValue: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50' },
    savedNote: { color: '#4CAF50', textAlign: 'center', marginTop: 8, fontSize: 13 },
    instructionsContainer: {
        marginTop: 30, padding: 20, backgroundColor: '#1a3a2a',
        borderRadius: 12, maxWidth: 400, borderWidth: 1, borderColor: '#2d6b42',
    },
    instructionsText: { fontSize: 15, color: '#8aab96', textAlign: 'center', lineHeight: 22 },
});
