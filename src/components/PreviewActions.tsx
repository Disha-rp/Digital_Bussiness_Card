/**
 * Preview Actions Component (Phase 9)
 * Separated interactive action bar for the Preview screen.
 * Provides accessible, labeled action controls for:
 * - Edit Card
 * - Share Card Link
 * - Download vCard (.vcf)
 * - Enlarged QR Code View
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';
import { shadows } from '../theme/shadows';

export interface PreviewActionsProps {
  onEdit: () => void;
  onShare: () => void;
  onDownload: () => void;
  onShowQr: () => void;
  hasQr?: boolean;
  style?: ViewStyle;
}

export const PreviewActions: React.FC<PreviewActionsProps> = ({
  onEdit,
  onShare,
  onDownload,
  onShowQr,
  hasQr = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]} testID="preview-actions-bar">
      {/* Edit Action */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onEdit}
        activeOpacity={0.7}
        testID="preview-action-edit"
        accessibilityLabel="Edit Card"
        accessibilityRole="button"
      >
        <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </View>
        <Text style={styles.actionLabel}>Edit</Text>
      </TouchableOpacity>

      {/* Share Action */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onShare}
        activeOpacity={0.7}
        testID="preview-action-share"
        accessibilityLabel="Share Card"
        accessibilityRole="button"
      >
        <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="share-social-outline" size={20} color="#16A34A" />
        </View>
        <Text style={styles.actionLabel}>Share</Text>
      </TouchableOpacity>

      {/* Download vCard Action */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onDownload}
        activeOpacity={0.7}
        testID="preview-action-download"
        accessibilityLabel="Download vCard"
        accessibilityRole="button"
      >
        <View style={[styles.iconCircle, { backgroundColor: '#F5F3FF' }]}>
          <Ionicons name="download-outline" size={20} color="#7C3AED" />
        </View>
        <Text style={styles.actionLabel}>Save vCard</Text>
      </TouchableOpacity>

      {/* Enlarged QR Code Action */}
      {hasQr ? (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onShowQr}
          activeOpacity={0.7}
          testID="preview-action-qr"
          accessibilityLabel="View QR Code"
          accessibilityRole="button"
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FFFBEB' }]}>
            <Ionicons name="qr-code-outline" size={20} color="#D97706" />
          </View>
          <Text style={styles.actionLabel}>QR Code</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
