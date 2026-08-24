/**
 * Template Selection Screen
 * Visual theme selection for creating or editing a digital business card.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootNavigationProp, RouteProps } from '../types/navigation';
import { CARD_TEMPLATE_LIST } from '../theme/templates';
import { CardTemplateId } from '../models/template';
import { colors, theme } from '../theme';

export const TemplateSelectionScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<RouteProps<'TemplateSelection'>>();
  const cardTitle = route.params?.cardTitle || 'Digital Business Card';
  const cardId = route.params?.cardId;
  const isCreateMode = route.params?.mode === 'create' || !cardId;

  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplateId>('modern');

  const handleContinue = () => {
    if (isCreateMode) {
      navigation.navigate('CreateCard', {
        templateId: selectedTemplate,
      });
    } else {
      navigation.navigate('EditCard', {
        cardId,
        cardTitle,
        templateId: selectedTemplate,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} testID="template-back-btn">
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Template</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>Select Visual Style</Text>
        <Text style={styles.sectionSub}>
          {isCreateMode
            ? 'Step 1 of 2: Choose a presentation theme for your new card'
            : `Update theme for ${cardTitle}`}
        </Text>

        <View style={styles.templateList}>
          {CARD_TEMPLATE_LIST.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <TouchableOpacity
                key={tmpl.id}
                style={[
                  styles.templateCard,
                  isSelected && styles.templateCardActive,
                  { borderColor: isSelected ? tmpl.style.accentColor : colors.border },
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedTemplate(tmpl.id)}
                testID={`template-card-${tmpl.id}`}
              >
                <View
                  style={[
                    styles.colorAccentBar,
                    { backgroundColor: tmpl.style.accentColor },
                  ]}
                />
                <View style={styles.templateInfo}>
                  <Text style={[styles.templateName, isSelected && { color: tmpl.style.accentColor }]}>
                    {tmpl.name}
                  </Text>
                  <Text style={styles.templateDesc}>{tmpl.description}</Text>
                  <View style={styles.tagRow}>
                    {tmpl.tags.map((tag) => (
                      <View key={tag} style={styles.tagBadge}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={24} color={tmpl.style.accentColor} />
                ) : (
                  <View style={styles.unselectedRadio} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={handleContinue}
          testID="continue-to-form-btn"
        >
          <Text style={styles.buttonText}>
            {isCreateMode ? 'Continue to Card Details' : 'Apply to Card'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: theme.spacing.lg,
  },
  templateList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateCardActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  colorAccentBar: {
    width: 5,
    height: '100%',
    borderRadius: 3,
    marginRight: theme.spacing.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  templateDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tagBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  unselectedRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
