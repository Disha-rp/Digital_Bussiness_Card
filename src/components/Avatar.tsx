/**
 * Reusable Avatar Component Shell
 */

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
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

  const initials = name
    ? name
        .split(' ')
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
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }}
          resizeMode="cover"
        />
      ) : initials ? (
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      ) : (
        <Ionicons name="person" size={iconSize} color={colors.primaryLight} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
});
