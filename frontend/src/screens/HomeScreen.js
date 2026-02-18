import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity, Image,
    ActivityIndicator, ScrollView, Alert, SafeAreaView, StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { predictPlantDisease } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import MyButton from '../components/MyButton';

export default function HomeScreen({ navigation }) {
    const { userEmail, isGuest, logout } = useAuth();
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('İzin Gerekli', 'Galeriye erişim izni gereklidir!');
                return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
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
            Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_WHITE} />

            {/* Top Bar */}
            <View style={styles.topBar}>
                <View style={styles.topBarLeft}>
                    <Text style={styles.topBarLogo}>🌿</Text>
                    <Text style={styles.topBarTitle}>PlantGuard AI</Text>
                </View>
                <View style={styles.topBarRight}>
                    {!isGuest && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('History')}
                            style={styles.historyBtn}
                        >
                            <Text style={styles.historyBtnText}>Geçmiş</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Çıkış</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Kullanıcı bilgisi */}
                <View style={styles.userBadge}>
                    <Text style={styles.userBadgeText}>
                        {isGuest ? '👤 Misafir Mod' : `👋 ${userEmail?.split('@')[0]}`}
                    </Text>
                    {isGuest && (
                        <Text style={styles.guestNote}>Analizler kaydedilmiyor</Text>
                    )}
                </View>

                {/* Resim önizleme */}
                {selectedImage ? (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: selectedImage }} style={styles.image} />
                    </View>
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderIcon}>🌱</Text>
                        <Text style={styles.placeholderText}>Analiz için bir bitki fotoğrafı seçin</Text>
                    </View>
                )}

                {/* Butonlar */}
                <View style={styles.buttonContainer}>
                    <MyButton title="📷 Fotoğraf Seç" onPress={pickImage} />
                    {selectedImage && (
                        <MyButton
                            title={loading ? 'Analiz Ediliyor...' : '🔍 Analiz Et'}
                            onPress={analyzePlant}
                            loading={loading}
                            disabled={loading}
                            variant="primary"
                            style={styles.analyzeBtn}
                        />
                    )}
                </View>

                {/* Yükleniyor */}
                {loading && (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={COLORS.PRIMARY_GREEN} />
                        <Text style={styles.loadingText}>Yapay zeka analiz ediyor...</Text>
                    </View>
                )}

                {/* Sonuç */}
                {result && !loading && (
                    <View style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <Text style={styles.resultCheckmark}>✅</Text>
                            <Text style={styles.resultDisease}>{result.disease}</Text>
                        </View>
                        <View style={styles.resultDivider} />
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Hastalık Adı</Text>
                            <Text style={styles.resultValue}>{result.disease}</Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Güven Oranı</Text>
                            <Text style={[styles.resultValue, styles.confidenceText]}>
                                %{result.confidence}
                            </Text>
                        </View>
                        {result.saved && (
                            <Text style={styles.savedNote}>📊 Geçmişe kaydedildi</Text>
                        )}
                    </View>
                )}

                {/* Arama kutusu görünümü (dekoratif) */}
                {!selectedImage && (
                    <View style={styles.searchBox}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <Text style={styles.searchText}>Yüklenen fotoğrafı analiz edin...</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.BACKGROUND_WHITE },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER_LIGHT,
        backgroundColor: COLORS.BACKGROUND_WHITE,
    },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    topBarLogo: { fontSize: 22 },
    topBarTitle: { fontSize: 17, fontWeight: '700', color: COLORS.PRIMARY_GREEN },
    topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    historyBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.PRIMARY_GREEN,
    },
    historyBtnText: { color: COLORS.PRIMARY_GREEN, fontSize: 13, fontWeight: '600' },
    logoutBtn: { paddingHorizontal: 8, paddingVertical: 6 },
    logoutText: { color: COLORS.TEXT_MEDIUM, fontSize: 13 },
    container: {
        flexGrow: 1,
        backgroundColor: COLORS.BACKGROUND_WHITE,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    userBadge: {
        backgroundColor: COLORS.BACKGROUND_LIGHT,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 20,
    },
    userBadgeText: { fontSize: 14, fontWeight: '600', color: COLORS.TEXT_DARK },
    guestNote: { fontSize: 12, color: COLORS.TEXT_LIGHT, marginTop: 2 },
    imageContainer: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.BORDER_LIGHT,
    },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    imagePlaceholder: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: 12,
        backgroundColor: COLORS.BACKGROUND_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.BORDER_LIGHT,
        borderStyle: 'dashed',
    },
    placeholderIcon: { fontSize: 48, marginBottom: 12 },
    placeholderText: { fontSize: 14, color: COLORS.TEXT_LIGHT, textAlign: 'center' },
    buttonContainer: { gap: 10, marginBottom: 16 },
    analyzeBtn: { backgroundColor: COLORS.PRIMARY_GREEN_DARK },
    loadingBox: { alignItems: 'center', paddingVertical: 24 },
    loadingText: { marginTop: 10, fontSize: 14, color: COLORS.TEXT_MEDIUM },
    resultCard: {
        backgroundColor: COLORS.BACKGROUND_WHITE,
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: COLORS.BORDER_LIGHT,
        shadowColor: COLORS.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    resultCheckmark: { fontSize: 20 },
    resultDisease: { fontSize: 16, fontWeight: '700', color: COLORS.PRIMARY_GREEN, flex: 1 },
    resultDivider: { height: 1, backgroundColor: COLORS.BORDER_LIGHT, marginBottom: 12 },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    resultLabel: { fontSize: 13, color: COLORS.TEXT_MEDIUM },
    resultValue: { fontSize: 14, fontWeight: '600', color: COLORS.TEXT_DARK },
    confidenceText: { color: COLORS.PRIMARY_GREEN, fontSize: 16 },
    savedNote: { marginTop: 12, fontSize: 12, color: COLORS.TEXT_MEDIUM, textAlign: 'center' },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.BACKGROUND_LIGHT,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginTop: 16,
        gap: 8,
    },
    searchIcon: { fontSize: 16 },
    searchText: { fontSize: 14, color: COLORS.TEXT_LIGHT },
});
