import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, SafeAreaView,
    ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar,
} from 'react-native';
import { getHistory } from '../services/api';
import { COLORS } from '../constants/colors';

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
            setError('Geçmiş yüklenemedi.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const getConfidenceColor = (score) => {
        if (score >= 80) return COLORS.SUCCESS;
        if (score >= 60) return COLORS.WARNING;
        return COLORS.ERROR;
    };

    const formatDate = (isoStr) => {
        if (!isoStr) return '';
        return new Date(isoStr).toLocaleDateString('tr-TR', {
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
                <Text style={styles.confidenceLabel}>Güven Oranı</Text>
                <Text style={[styles.confidenceValue, { color: getConfidenceColor(item.confidence_score) }]}>
                    %{Math.round(item.confidence_score)}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND_WHITE} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Geri</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Geçmiş Analizler</Text>
                <View style={{ width: 50 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.PRIMARY_GREEN} />
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
                    <Text style={styles.emptyIcon}>🌱</Text>
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
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchHistory(); }}
                            tintColor={COLORS.PRIMARY_GREEN}
                        />
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
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND_WHITE },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER_LIGHT,
    },
    backBtn: { color: COLORS.PRIMARY_GREEN, fontSize: 15, fontWeight: '600' },
    title: { fontSize: 17, fontWeight: '700', color: COLORS.TEXT_DARK },
    list: { padding: 16, gap: 12 },
    totalText: { color: COLORS.TEXT_LIGHT, fontSize: 13, marginBottom: 8 },
    card: {
        backgroundColor: COLORS.BACKGROUND_WHITE,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.BORDER_LIGHT,
        shadowColor: COLORS.SHADOW,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    indexBadge: {
        backgroundColor: COLORS.PRIMARY_GREEN_LIGHT,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
    },
    indexText: { color: COLORS.PRIMARY_GREEN_DARK, fontSize: 12, fontWeight: '700' },
    dateText: { color: COLORS.TEXT_LIGHT, fontSize: 12 },
    diseaseName: { fontSize: 16, fontWeight: '700', color: COLORS.TEXT_DARK, marginBottom: 8 },
    confidenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    confidenceLabel: { color: COLORS.TEXT_MEDIUM, fontSize: 13 },
    confidenceValue: { fontSize: 16, fontWeight: '700' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    errorText: { color: COLORS.ERROR, fontSize: 15, textAlign: 'center', marginBottom: 16 },
    retryBtn: {
        backgroundColor: COLORS.PRIMARY_GREEN,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: { color: COLORS.TEXT_WHITE, fontWeight: '700' },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyText: { color: COLORS.TEXT_DARK, fontSize: 17, fontWeight: '600' },
    emptySubtext: { color: COLORS.TEXT_LIGHT, fontSize: 14, marginTop: 6 },
});
