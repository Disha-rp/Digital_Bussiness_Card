/**
 * Reusable QR Code View Component Shell
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import QRCodeSVG from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';

export interface QRCodeViewProps {
  value?: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  logoUrl?: string;
  style?: ViewStyle;
  placeholderText?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 180,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  logoUrl,
  style,
  placeholderText = 'QR code will appear here',
}) => {
  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.qrBox,
          {
            width: size + 24,
            height: size + 24,
            backgroundColor,
          },
        ]}
      >
        {value ? (
          <QRCodeSVG
            value={value}
            size={size}
            color={color}
            backgroundColor={backgroundColor}
            logo={logoUrl ? { uri: logoUrl } : undefined}
            logoSize={size * 0.22}
            logoBackgroundColor={backgroundColor}
            logoMargin={2}
            logoBorderRadius={borderRadius.sm}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="qr-code-outline" size={48} color={colors.textMuted} />
            <Text style={styles.placeholderText}>{placeholderText}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
