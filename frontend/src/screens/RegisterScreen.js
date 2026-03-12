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

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email.trim() || !password || !confirm) {
            Alert.alert('Hata', 'Tüm alanları doldurun.');
            return;
        }
        if (password !== confirm) {
            Alert.alert('Hata', 'Şifreler eşleşmiyor.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
            return;
        }
        setLoading(true);
        try {
            await register(email.trim(), password);
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Kayıt başarısız. Lütfen tekrar deneyin.';
            Alert.alert('Kayıt Hatası', msg);
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
                    <Text style={styles.title}>Hesap Oluştur</Text>

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
                            placeholder="En az 6 karakter"
                            secureTextEntry
                        />
                        <MyInput
                            label="Şifre Tekrar"
                            value={confirm}
                            onChangeText={setConfirm}
                            placeholder="••••••••"
                            secureTextEntry
                        />

                        <View style={styles.buttonWrapper}>
                            <MyButton
                                title="Hesap Oluştur"
                                onPress={handleRegister}
                                loading={loading}
                                disabled={loading}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            style={styles.linkRow}
                        >
                            <Text style={styles.linkText}>
                                Zaten hesabın var mı?{' '}
                                <Text style={styles.linkHighlight}>Giriş Yap</Text>
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
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND_WHITE },
    keyboardView: { flex: 1 },
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
    form: { width: '100%' },
    buttonWrapper: { marginTop: 8 },
    linkRow: { alignItems: 'center', marginTop: 20 },
    linkText: { fontSize: 14, color: COLORS.TEXT_MEDIUM },
    linkHighlight: { color: COLORS.PRIMARY_GREEN, fontWeight: '600' },
    backRow: { alignItems: 'center', marginTop: 12 },
    backText: { fontSize: 14, color: COLORS.TEXT_LIGHT },
});
