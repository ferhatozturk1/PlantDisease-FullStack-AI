import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
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
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
                <Text style={styles.title}>🌿 Giriş Yap</Text>
                <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ornek@email.com"
                        placeholderTextColor="#5a7a6a"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Text style={styles.label}>Şifre</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#5a7a6a"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>Giriş Yap</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.linkText}>
                            Hesabın yok mu? <Text style={styles.link}>Kayıt Ol</Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>← Geri Dön</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d2318' },
    inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
    title: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 6 },
    subtitle: { fontSize: 15, color: '#8aab96', marginBottom: 32 },
    form: { gap: 12 },
    label: { fontSize: 13, color: '#a8d5b5', fontWeight: '600', marginBottom: -4 },
    input: {
        backgroundColor: '#1a3a2a',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#2d6b42',
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    linkText: { color: '#8aab96', textAlign: 'center', marginTop: 16, fontSize: 14 },
    link: { color: '#4CAF50', fontWeight: '700' },
    backText: { color: '#4a6b58', textAlign: 'center', marginTop: 8, fontSize: 14 },
});
