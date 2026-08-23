/**
 * Reusable QR Code View Component
 * Supports:
 * 1. Remote SVG QR images via react-native-svg SvgUri (e.g. QRTRAC hosted SVGs)
 * 2. Remote raster QR images via React Native Image (PNG/JPG/WebP)
 * 3. Dynamic client-side vector QR generation via react-native-qrcode-svg for publicUrl/value
 * 4. Graceful automatic fallback to QRCodeSVG if remote asset fails to load
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
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

  const cleanImageUrl = imageUrl?.trim() || null;
  const isSvg = Boolean(cleanImageUrl && (cleanImageUrl.endsWith('.svg') || cleanImageUrl.includes('.svg?')));
  const isRasterImage = Boolean(
    cleanImageUrl &&
      (cleanImageUrl.endsWith('.png') ||
        cleanImageUrl.endsWith('.jpg') ||
        cleanImageUrl.endsWith('.jpeg') ||
        cleanImageUrl.endsWith('.webp'))
  );

  const shouldTryRemoteImage = Boolean(cleanImageUrl && !imageError);

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
        {shouldTryRemoteImage && isSvg ? (
          <SvgUri
            uri={cleanImageUrl!}
            width={size}
            height={size}
            onError={() => setImageError(true)}
          />
        ) : shouldTryRemoteImage && isRasterImage ? (
          <Image
            source={{ uri: cleanImageUrl! }}
            style={{ width: size, height: size }}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : shouldTryRemoteImage ? (
          // Default remote image attempt if extension is unknown
          <Image
            source={{ uri: cleanImageUrl! }}
            style={{ width: size, height: size }}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : value ? (
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
