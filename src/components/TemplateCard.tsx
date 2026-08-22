/**
 * Reusable Template Preview Card Shell
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardTemplate } from '../models/template';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';

export interface TemplateCardProps {
  template: CardTemplate;
  isSelected?: boolean;
  onSelect: (template: CardTemplate) => void;
  style?: ViewStyle;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected = false,
  onSelect,
  style,
}) => {
  const { style: templateStyle } = template;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onSelect(template)}
      style={[
        styles.container,
        {
          borderColor: isSelected ? colors.primary : colors.border,
          backgroundColor: isSelected ? colors.surfaceElevated : colors.surface,
        },
        style,
      ]}
    >
      {/* Visual Palette Preview Bar */}
      <View
        style={[
          styles.previewBar,
          {
            backgroundColor: templateStyle.cardBackground,
            borderColor: templateStyle.borderColor,
          },
        ]}
      >
        <View style={styles.colorPills}>
          {templateStyle.gradientColors.slice(0, 3).map((color, index) => (
            <View
              key={index}
              style={[styles.colorPill, { backgroundColor: color }]}
            />
          ))}
        </View>
        <View
          style={[
            styles.accentDot,
            { backgroundColor: templateStyle.accentColor },
          ]}
        />
      </View>

      <View style={styles.infoRow}>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.name,
              isSelected && { color: colors.primaryLight },
            ]}
          >
            {template.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {template.description}
          </Text>
        </View>

        <View style={styles.checkboxSlot}>
          <Ionicons
            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={isSelected ? colors.primary : colors.textMuted}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewBar: {
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  colorPills: {
    flexDirection: 'row',
    gap: 6,
  },
  colorPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  accentDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  checkboxSlot: {
    marginLeft: spacing.xs,
  },
});
