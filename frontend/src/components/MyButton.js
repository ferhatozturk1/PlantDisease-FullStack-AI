import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';

/**
 * MyButton — Reusable buton bileşeni
 * variant: 'primary' (yeşil) | 'secondary' (gri) | 'text' (sadece metin)
 */
export default function MyButton({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
}) {
    const getButtonStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondaryButton;
            case 'text':
                return styles.textButton;
            default:
                return styles.primaryButton;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'text':
                return styles.textButtonText;
            default:
                return styles.buttonText;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.base, getButtonStyle(), disabled && styles.disabled, style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading
                ? <ActivityIndicator color={COLORS.TEXT_WHITE} size="small" />
                : <Text style={getTextStyle()}>{title}</Text>
            }
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 5,
    },
    primaryButton: {
        backgroundColor: COLORS.PRIMARY_GREEN,
    },
    secondaryButton: {
        backgroundColor: COLORS.SECONDARY_GRAY_BUTTON,
    },
    textButton: {
        backgroundColor: 'transparent',
        paddingVertical: 8,
    },
    buttonText: {
        color: COLORS.TEXT_WHITE,
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    textButtonText: {
        color: COLORS.TEXT_MEDIUM,
        fontSize: 14,
        fontWeight: '400',
    },
    disabled: {
        opacity: 0.5,
    },
});
