import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
    const { continueAsGuest } = useAuth();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a3a2a" />

            {/* Header / Logo */}
            <View style={styles.heroSection}>
                <View style={styles.logoCircle}>
                    <Text style={styles.logoEmoji}>🌿</Text>
                </View>
                <Text style={styles.appName}>PlantGuard AI</Text>
                <Text style={styles.tagline}>Bitkilerinizi Koruyun</Text>
                <Text style={styles.subtitle}>
                    Yapay zeka ile anında bitki hastalığı tespiti
                </Text>
            </View>

            {/* Feature Pills */}
            <View style={styles.featuresRow}>
                {['🔬 AI Analiz', '⚡ Anlık Sonuç', '📊 Geçmiş'].map((f) => (
                    <View key={f} style={styles.featurePill}>
                        <Text style={styles.featureText}>{f}</Text>
                    </View>
                ))}
            </View>

            {/* Buttons */}
            <View style={styles.buttonSection}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.primaryButtonText}>🔑 Giriş Yap</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('Register')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.secondaryButtonText}>✨ Hesap Oluştur</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.guestButton}
                    onPress={continueAsGuest}
                    activeOpacity={0.85}
                >
                    <Text style={styles.guestButtonText}>👤 Misafir Olarak Devam Et</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.footerNote}>
                Misafir modunda geçmişiniz kaydedilmez
            </Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d2318',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 40,
        paddingHorizontal: 24,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    logoCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#1e4d30',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
    },
    logoEmoji: {
        fontSize: 54,
    },
    appName: {
        fontSize: 36,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '600',
        marginTop: 4,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 15,
        color: '#8aab96',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
        maxWidth: 280,
    },
    featuresRow: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    featurePill: {
        backgroundColor: '#1e4d30',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2d6b42',
    },
    featureText: {
        color: '#a8d5b5',
        fontSize: 13,
        fontWeight: '600',
    },
    buttonSection: {
        width: '100%',
        maxWidth: 380,
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    secondaryButtonText: {
        color: '#4CAF50',
        fontSize: 17,
        fontWeight: '700',
    },
    guestButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    guestButtonText: {
        color: '#6b8f7a',
        fontSize: 15,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    footerNote: {
        color: '#4a6b58',
        fontSize: 12,
        textAlign: 'center',
    },
});
