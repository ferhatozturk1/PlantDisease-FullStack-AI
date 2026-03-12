import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [userToken, setUserToken] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [isGuest, setIsGuest] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Uygulama açılınca token'ı AsyncStorage'dan oku
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const email = await AsyncStorage.getItem('userEmail');
                const guest = await AsyncStorage.getItem('isGuest');

                if (token) {
                    setUserToken(token);
                    setUserEmail(email);
                } else if (guest === 'true') {
                    setIsGuest(true);
                }
            } catch (e) {
                console.warn('Session restore error:', e);
            } finally {
                setIsLoading(false);
            }
        };
        restoreSession();
    }, []);

    const login = async (email, password) => {
        const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
        const { access_token } = response.data;

        await AsyncStorage.setItem('userToken', access_token);
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.removeItem('isGuest');

        setUserToken(access_token);
        setUserEmail(email);
        setIsGuest(false);
    };

    const register = async (email, password) => {
        const response = await axios.post(`${API_BASE}/auth/register`, { email, password });
        const { access_token } = response.data;

        await AsyncStorage.setItem('userToken', access_token);
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.removeItem('isGuest');

        setUserToken(access_token);
        setUserEmail(email);
        setIsGuest(false);
    };

    const logout = async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userEmail');
        await AsyncStorage.removeItem('isGuest');

        setUserToken(null);
        setUserEmail(null);
        setIsGuest(false);
    };

    const continueAsGuest = async () => {
        await AsyncStorage.setItem('isGuest', 'true');
        await AsyncStorage.removeItem('userToken');
        setIsGuest(true);
        setUserToken(null);
    };

    return (
        <AuthContext.Provider value={{
            userToken,
            userEmail,
            isGuest,
            isLoading,
            login,
            register,
            logout,
            continueAsGuest,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
