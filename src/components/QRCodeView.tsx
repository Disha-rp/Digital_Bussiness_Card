/**
 * Reusable QR Code View Component
 * Renders crisp, scannable QR codes locally via react-native-qrcode-svg (QRCodeSVG)
 * using the card's dynamic publicUrl.
 * Does NOT use SvgUri for remote SVG assets.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import QRCodeSVG from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';

export interface QRCodeViewProps {
  value?: string;
  imageUrl?: string | null;
  size?: number;
  color?: string;
  backgroundColor?: string;
  logoUrl?: string;
  style?: ViewStyle;
  placeholderText?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  imageUrl,
  size = 180,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  logoUrl,
  style,
  placeholderText = 'QR code will appear here',
}) => {
  const [imageError, setImageError] = useState<boolean>(false);

  const cleanValue = value?.trim();
  const cleanImageUrl = imageUrl?.trim() || null;

  // Check if imageUrl is a supported raster bitmap (PNG/JPG/WebP), excluding SVGs
  const isRasterImage = Boolean(
    cleanImageUrl &&
      !cleanImageUrl.endsWith('.svg') &&
      !cleanImageUrl.includes('.svg?') &&
      (cleanImageUrl.endsWith('.png') ||
        cleanImageUrl.endsWith('.jpg') ||
        cleanImageUrl.endsWith('.jpeg') ||
        cleanImageUrl.endsWith('.webp'))
  );

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
        {cleanValue ? (
          // Primary Renderer: Always generate locally using QRCodeSVG with real publicUrl
          <QRCodeSVG
            value={cleanValue}
            size={size}
            color={color}
            backgroundColor={backgroundColor}
            logo={logoUrl ? { uri: logoUrl } : undefined}
            logoSize={size * 0.22}
            logoBackgroundColor={backgroundColor}
            logoMargin={2}
            logoBorderRadius={borderRadius.sm}
          />
        ) : isRasterImage && !imageError ? (
          // Secondary fallback: Raster bitmap if value is absent
          <Image
            source={{ uri: cleanImageUrl! }}
            style={{ width: size, height: size }}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : (
          // Controlled Empty State
          <View style={styles.placeholderContainer}>
            <Ionicons name="qr-code-outline" size={40} color={colors.textMuted} />
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
