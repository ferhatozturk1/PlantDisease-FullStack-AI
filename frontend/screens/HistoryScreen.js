import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, SafeAreaView,
    ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { getHistory } from '../src/services/api';

export default function HistoryScreen({ navigation }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchHistory = useCallback(async () => {
        try {
            setError(null);
            const response = await getHistory();
            setHistory(response.data.data || []);
        } catch (err) {
            setError('Geçmiş yüklenemedi. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const getConfidenceColor = (score) => {
        if (score >= 80) return '#4CAF50';
        if (score >= 60) return '#FF9800';
        return '#f44336';
    };

    const formatDate = (isoStr) => {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        return d.toLocaleDateString('tr-TR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.indexBadge}>
                    <Text style={styles.indexText}>#{index + 1}</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>
            <Text style={styles.diseaseName}>{item.disease_name}</Text>
            <View style={styles.confidenceRow}>
                <Text style={styles.confidenceLabel}>Güven Skoru:</Text>
                <Text style={[styles.confidenceValue, { color: getConfidenceColor(item.confidence_score) }]}>
                    %{Math.round(item.confidence_score)}
                </Text>
            </View>
            {item.image_filename && (
                <Text style={styles.filename}>📁 {item.image_filename}</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Geri</Text>
                </TouchableOpacity>
                <Text style={styles.title}>📊 Geçmiş Analizler</Text>
                <View style={{ width: 60 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Yükleniyor...</Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchHistory}>
                        <Text style={styles.retryText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            ) : history.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyEmoji}>🌱</Text>
                    <Text style={styles.emptyText}>Henüz analiz geçmişiniz yok.</Text>
                    <Text style={styles.emptySubtext}>İlk analizinizi yapın!</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />
                    }
                    ListHeaderComponent={
                        <Text style={styles.totalText}>Toplam {history.length} analiz</Text>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d2318' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: '#1a3a2a', borderBottomWidth: 1, borderBottomColor: '#2d6b42',
    },
    backBtn: { padding: 4 },
    backBtnText: { color: '#4CAF50', fontSize: 15, fontWeight: '600' },
    title: { fontSize: 18, fontWeight: '700', color: '#fff' },
    list: { padding: 16, gap: 12 },
    totalText: { color: '#6b8f7a', fontSize: 13, marginBottom: 8 },
    card: {
        backgroundColor: '#1a3a2a', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#2d6b42',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    indexBadge: {
        backgroundColor: '#2d6b42', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    indexText: { color: '#a8d5b5', fontSize: 12, fontWeight: '700' },
    dateText: { color: '#6b8f7a', fontSize: 12 },
    diseaseName: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 8 },
    confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    confidenceLabel: { color: '#8aab96', fontSize: 13 },
    confidenceValue: { fontSize: 16, fontWeight: '700' },
    filename: { color: '#4a6b58', fontSize: 11, marginTop: 8 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    loadingText: { color: '#8aab96', marginTop: 12, fontSize: 15 },
    errorText: { color: '#f44336', fontSize: 15, textAlign: 'center', marginBottom: 16 },
    retryBtn: {
        backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
    },
    retryText: { color: '#fff', fontWeight: '700' },
    emptyEmoji: { fontSize: 60, marginBottom: 16 },
    emptyText: { color: '#8aab96', fontSize: 17, fontWeight: '600' },
    emptySubtext: { color: '#4a6b58', fontSize: 14, marginTop: 6 },
});
