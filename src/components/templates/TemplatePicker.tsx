/**
 * Reusable Template Picker Component — Light Theme
 * Provides an interactive visual template switcher with light preview cards,
 * template names, descriptions, and active blue selection states.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardTemplateId } from '../../models/template';
import { CARD_TEMPLATE_LIST } from '../../theme/templates';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/borderRadius';
import { shadows } from '../../theme/shadows';

export interface TemplatePickerProps {
  selectedTemplate: CardTemplateId;
  onSelectTemplate: (templateId: CardTemplateId) => void;
  style?: ViewStyle;
  compact?: boolean;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  selectedTemplate,
  onSelectTemplate,
  style,
  compact = false,
}) => {
  // Normalize selected template to one of the 3 primary templates
  const normalizeTemplateId = (id: CardTemplateId): CardTemplateId => {
    if (id === 'corporate_executive' || id === 'professional') return 'professional';
    if (id === 'minimal_mono' || id === 'minimal') return 'minimal';
    return 'modern';
  };

  const currentNormalized = normalizeTemplateId(selectedTemplate);

  return (
    <View style={[styles.container, style]} testID="template-picker">
      <Text style={styles.pickerHeader}>CHOOSE PRESENTATION THEME</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CARD_TEMPLATE_LIST.map((tmpl) => {
          const isSelected = currentNormalized === tmpl.id;
          const accentColor = isSelected ? colors.primary : tmpl.style.accentColor;

          if (compact) {
            return (
              <TouchableOpacity
                key={tmpl.id}
                style={[
                  styles.compactChip,
                  isSelected && styles.compactChipSelected,
                ]}
                onPress={() => onSelectTemplate(tmpl.id)}
                activeOpacity={0.7}
                testID={`template-picker-chip-${tmpl.id}`}
              >
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: tmpl.style.accentColor },
                  ]}
                />
                <Text
                  style={[
                    styles.compactChipText,
                    isSelected && styles.compactChipTextSelected,
                  ]}
                >
                  {tmpl.name}
                </Text>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tmpl.id}
              style={[
                styles.cardOption,
                tmpl.id === 'modern' && styles.cardOptionModern,
                tmpl.id === 'minimal' && styles.cardOptionMinimal,
                isSelected && styles.cardOptionSelected,
              ]}
              onPress={() => onSelectTemplate(tmpl.id)}
              activeOpacity={0.8}
              testID={`template-picker-card-${tmpl.id}`}
            >
              {/* Top Style Tag & Color Indicators */}
              <View style={styles.topRow}>
                <View style={styles.colorPillsRow}>
                  {tmpl.id === 'professional' ? (
                    <>
                      <View style={[styles.miniPill, { backgroundColor: '#1E3A8A' }]} />
                      <View style={[styles.miniPill, { backgroundColor: '#2563EB' }]} />
                      <View style={[styles.miniPill, { backgroundColor: '#F59E0B' }]} />
                    </>
                  ) : tmpl.id === 'modern' ? (
                    <>
                      <View style={[styles.miniPill, { backgroundColor: '#0284C7' }]} />
                      <View style={[styles.miniPill, { backgroundColor: '#0EA5E9' }]} />
                      <View style={[styles.miniPill, { backgroundColor: '#38BDF8' }]} />
                    </>
                  ) : (
                    <>
                      <View style={[styles.miniPill, { backgroundColor: '#111827' }]} />
                      <View style={[styles.miniPill, { backgroundColor: '#6B7280' }]} />
                      <View style={[styles.miniPill, { backgroundColor: '#CBD5E1' }]} />
                    </>
                  )}
                </View>
                <View
                  style={[
                    styles.themeTag,
                    isSelected && { backgroundColor: '#DBEAFE' },
                  ]}
                >
                  <Text
                    style={[
                      styles.themeTagText,
                      isSelected && { color: colors.primary },
                    ]}
                  >
                    {tmpl.id === 'professional'
                      ? 'CORPORATE'
                      : tmpl.id === 'modern'
                      ? 'DYNAMIC'
                      : 'MINIMAL'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardInfo}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isSelected && { color: colors.primary },
                    ]}
                  >
                    {tmpl.name}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  ) : (
                    <View style={styles.emptyRadio} />
                  )}
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {tmpl.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  pickerHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: spacing.xs + 2,
    paddingHorizontal: 2,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    gap: 8,
    ...shadows.sm,
  },
  compactChipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  compactChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  compactChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  cardOption: {
    width: 165,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    padding: spacing.sm + 2,
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  cardOptionModern: {
    backgroundColor: '#FAFCFF',
    borderColor: '#E0F2FE',
  },
  cardOptionMinimal: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  cardOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    ...shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  colorPillsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  themeTag: {
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: borderRadius.xs,
    backgroundColor: '#F1F5F9',
  },
  themeTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  miniPill: {
    width: 14,
    height: 6,
    borderRadius: 3,
  },
  cardInfo: {},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  emptyRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
});
