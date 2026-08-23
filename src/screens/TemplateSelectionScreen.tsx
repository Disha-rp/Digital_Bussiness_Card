/**
 * Template Selection Screen
 * Visual theme selection for creating or updating a digital business card.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootNavigationProp, RouteProps } from '../types/navigation';
import { CARD_TEMPLATE_LIST } from '../theme/templates';
import { colors, theme } from '../theme';

export const TemplateSelectionScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<RouteProps<'TemplateSelection'>>();
  const cardTitle = route.params?.cardTitle || 'My Card';
  const cardId = route.params?.cardId;

  const [selectedTemplate, setSelectedTemplate] = useState('modern_minimal');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} testID="template-back-btn">
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Template</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionHeader}>Select Visual Style</Text>
        <Text style={styles.sectionSub}>Choose theme for {cardTitle}</Text>

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
              >
                <View style={styles.templateInfo}>
                  <Text style={[styles.templateName, isSelected && { color: tmpl.style.accentColor }]}>
                    {tmpl.name}
                  </Text>
                  <Text style={styles.templateDesc}>{tmpl.description}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={tmpl.style.accentColor} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('EditCard', {
              cardId,
              cardTitle,
              templateId: selectedTemplate,
            })
          }
          testID="continue-edit-btn"
        >
          <Text style={styles.buttonText}>Continue to Card Details</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  templateList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    padding: theme.spacing.md,
  },
  templateCardActive: {
    backgroundColor: colors.surfaceElevated,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  templateDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
    fontSize: 14,
    fontWeight: '600',
  },
});
