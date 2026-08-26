/**
 * Reusable Avatar Component
 * Renders profile image with graceful initials or icon fallback.
 * Safely handles cross-platform URI compatibility (remote HTTPS, data URIs, local files).
 */

import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  borderColor?: string;
  style?: ViewStyle;
}

const SIZE_MAP: Record<AvatarSize, { dimension: number; fontSize: number; iconSize: number }> = {
  sm: { dimension: 32, fontSize: 12, iconSize: 16 },
  md: { dimension: 48, fontSize: 16, iconSize: 24 },
  lg: { dimension: 64, fontSize: 22, iconSize: 32 },
  xl: { dimension: 96, fontSize: 32, iconSize: 48 },
};

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  borderColor = colors.primary,
  style,
}) => {
  const { dimension, fontSize, iconSize } = SIZE_MAP[size];
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    setImageError(false);
  }, [uri]);

  const cleanUri = uri?.trim() || null;

  // On Web, local native file:/// URIs cannot be resolved by the browser security sandbox
  const isInvalidWebFileUri = Platform.OS === 'web' && Boolean(cleanUri?.startsWith('file://'));
  const shouldRenderImage = Boolean(cleanUri && !imageError && !isInvalidWebFileUri);

  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : null;

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          borderColor,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={name ? `${name}'s profile avatar` : 'Profile avatar'}
    >
      {shouldRenderImage ? (
        <Image
          source={{ uri: cleanUri! }}
          style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : initials ? (
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      ) : (
        <Ionicons name="person" size={iconSize} color={colors.primary} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: colors.primary,
    fontWeight: '800',
  },
});
