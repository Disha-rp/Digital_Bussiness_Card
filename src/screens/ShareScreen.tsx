/**
 * Share Screen (Phase 1 Placeholder)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootNavigationProp, RouteProps } from '../types/navigation';
import { colors, theme } from '../theme';

export const ShareScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<RouteProps<'Share'>>();
  const cardTitle = route.params?.cardTitle || 'Alex Morgan';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Card</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-done-circle" size={56} color={colors.success} />
        </View>

        <Text style={styles.sectionHeader}>Card Ready to Distribute</Text>
        <Text style={styles.sectionSub}>Navigation Flow Step 7: Final Sharing Destination</Text>

        <View style={styles.shareCard}>
          <Text style={styles.cardTitle}>{cardTitle}</Text>
          <Text style={styles.cardInfo}>
            In later phases, this screen will provide native QR code image downloads, vCard .vcf
            exports, and direct OS share sheet integrations.
          </Text>

          <View style={styles.mockActions}>
            <View style={styles.mockBtn}>
              <Ionicons name="qr-code-outline" size={18} color={colors.primaryLight} />
              <Text style={styles.mockBtnText}>QR Sticker</Text>
            </View>
            <View style={styles.mockBtn}>
              <Ionicons name="download-outline" size={18} color={colors.secondaryLight} />
              <Text style={styles.mockBtnText}>vCard File</Text>
            </View>
            <View style={styles.mockBtn}>
              <Ionicons name="share-social-outline" size={18} color={colors.accent} />
              <Text style={styles.mockBtnText}>Share Link</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MyCards')}
        >
          <Ionicons name="home-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.buttonText}>Return to My Cards</Text>
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
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  shareCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  cardInfo: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  mockActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mockBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.surfaceElevated,
  },
  mockBtnText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
