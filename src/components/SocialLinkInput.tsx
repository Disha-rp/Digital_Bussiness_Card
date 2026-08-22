/**
 * Reusable Social Link Input Component Shell
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SocialLink, SOCIAL_PLATFORMS, SocialPlatform } from '../models/social';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';

export interface SocialLinkInputProps {
  value: SocialLink;
  onChange: (updated: SocialLink) => void;
  onRemove?: () => void;
  style?: ViewStyle;
}

export const SocialLinkInput: React.FC<SocialLinkInputProps> = ({
  value,
  onChange,
  onRemove,
  style,
}) => {
  const currentConfig =
    SOCIAL_PLATFORMS.find((p) => p.platform === value.platform) ||
    SOCIAL_PLATFORMS[0];

  const handlePlatformChange = (platform: SocialPlatform) => {
    onChange({
      ...value,
      platform,
    });
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        <View style={styles.platformBadge}>
          <Ionicons
            name={currentConfig.iconName as any}
            size={16}
            color={currentConfig.color}
          />
          <Text style={styles.platformName}>{currentConfig.name}</Text>
        </View>

        {onRemove && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={onRemove}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={currentConfig.placeholder}
          placeholderTextColor={colors.textMuted}
          value={value.url}
          onChangeText={(url) => onChange({ ...value, url })}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  platformName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  removeBtn: {
    padding: 4,
  },
  inputContainer: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  input: {
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
  },
});
