import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView,
    StatusBar, TouchableOpacity, Alert, KeyboardAvoidingView,
    Platform, ScrollView,
} from 'react-native';
import { COLORS } from '../constants/colors';
import MyButton from '../components/MyButton';
import MyInput from '../components/MyInput';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert('Hata', 'Email ve şifre gereklidir.');
            return;
        }
        setLoading(true);
        try {
            await login(email.trim(), password);
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Giriş başarısız. Bilgilerinizi kontrol edin.';
            Alert.alert('Giriş Hatası', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_WHITE} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Başlık */}
                    <Text style={styles.title}>Giriş Yap</Text>

                    {/* Form */}
                    <View style={styles.form}>
                        <MyInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="ornek@email.com"
                            keyboardType="email-address"
                        />

                        <MyInput
                            label="Şifre"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry
                        />

                        <View style={styles.buttonWrapper}>
                            <MyButton
                                title="Giriş Yap"
                                onPress={handleLogin}
                                loading={loading}
                                disabled={loading}
                            />
                        </View>

                        {/* Alt link */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Register')}
                            style={styles.linkRow}
                        >
                            <Text style={styles.linkText}>
                                Hesabın yok mu?{' '}
                                <Text style={styles.linkHighlight}>Kayıt Ol</Text>
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backRow}
                        >
                            <Text style={styles.backText}>← Geri Dön</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND_WHITE,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingTop: 60,
        paddingBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.TEXT_DARK,
        marginBottom: 36,
    },
    form: {
        width: '100%',
    },
    buttonWrapper: {
        marginTop: 8,
    },
    linkRow: {
        alignItems: 'center',
        marginTop: 20,
    },
    linkText: {
        fontSize: 14,
        color: COLORS.TEXT_MEDIUM,
    },
    linkHighlight: {
        color: COLORS.PRIMARY_GREEN,
        fontWeight: '600',
    },
    backRow: {
        alignItems: 'center',
        marginTop: 12,
    },
    backText: {
        fontSize: 14,
        color: COLORS.TEXT_LIGHT,
    },
});
