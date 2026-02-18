import React from 'react';
import {
    View, Text, StyleSheet, SafeAreaView,
    StatusBar, Image,
} from 'react-native';
import { COLORS } from '../constants/colors';
import MyButton from '../components/MyButton';
import { useAuth } from '../context/AuthContext';

export default function WelcomeScreen({ navigation }) {
    const { continueAsGuest } = useAuth();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_WHITE} />

            {/* Logo & Başlık */}
            <View style={styles.logoSection}>
                <View style={styles.logoCircle}>
                    {/* Yaprak ikonu */}
                    <Text style={styles.logoIcon}>🌿</Text>
                </View>
                <Text style={styles.appName}>PlantGuard AI</Text>
            </View>

            {/* Butonlar */}
            <View style={styles.buttonSection}>
                <MyButton
                    title="Giriş Yap"
                    variant="primary"
                    onPress={() => navigation.navigate('Login')}
                />

                <MyButton
                    title="Hesap Oluştur"
                    variant="secondary"
                    onPress={() => navigation.navigate('Register')}
                />

                <MyButton
                    title="Misafir Olarak Devam Et"
                    variant="text"
                    onPress={continueAsGuest}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND_WHITE,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 80,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.BACKGROUND_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    logoIcon: {
        fontSize: 52,
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.PRIMARY_GREEN,
        letterSpacing: 0.5,
    },
    buttonSection: {
        width: '100%',
        alignItems: 'center',
    },
});
