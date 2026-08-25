/**
 * Export Modal Component (Phase 11)
 * Interactive modal presenting all available export options:
 * 1. Save Card Image (PNG)
 * 2. Save QR Code (PNG/SVG)
 * 3. Save Contact (vCard .vcf)
 * Includes immediate feedback ("Saved successfully" / "Unable to save card" + Retry).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';
import { shadows } from '../theme/shadows';
import { ExportFormat, ExportResult } from '../utils/export';

export interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => Promise<ExportResult>;
  templateName?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onClose,
  onExport,
  templateName = 'Modern',
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<ExportResult | null>(null);
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('card_image');

  const handleTriggerExport = async (format: ExportFormat) => {
    setActiveFormat(format);
    setIsExporting(true);
    setLastResult(null);

    try {
      const result = await onExport(format);
      setIsExporting(false);
      setLastResult(result);
      if (result.success) {
        setTimeout(() => {
          onClose();
          setLastResult(null);
        }, 1800);
      }
    } catch {
      setIsExporting(false);
      setLastResult({
        success: false,
        message: 'Unable to save card',
        format,
        retryFn: () => onExport(format),
      });
    }
  };

  const handleRetry = () => {
    if (lastResult?.retryFn) {
      handleTriggerExport(activeFormat);
    } else {
      handleTriggerExport(activeFormat);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Download & Export</Text>
              <Text style={styles.modalSubtitle}>
                Choose export format ({templateName} template)
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              testID="close-export-modal-btn"
              accessibilityLabel="Close export options"
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Feedback Banner */}
          {lastResult ? (
            <View
              style={[
                styles.feedbackBanner,
                lastResult.success ? styles.successBanner : styles.errorBanner,
              ]}
              testID="export-feedback-banner"
            >
              <Ionicons
                name={lastResult.success ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={lastResult.success ? '#16A34A' : colors.error}
              />
              <Text
                style={[
                  styles.feedbackText,
                  { color: lastResult.success ? '#16A34A' : colors.error },
                ]}
              >
                {lastResult.message}
              </Text>
              {!lastResult.success ? (
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={handleRetry}
                  activeOpacity={0.7}
                  testID="export-retry-btn"
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Export Options */}
          <View style={styles.optionsList}>
            {/* Option 1: Card Image */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleTriggerExport('card_image')}
              disabled={isExporting}
              activeOpacity={0.7}
              testID="export-option-card-image"
              accessibilityLabel="Save Card Image"
            >
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="image-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Save Card Image (PNG)</Text>
                <Text style={styles.optionDesc}>
                  High-res image of {templateName} presentation
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Option 2: QR Code Image */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleTriggerExport('qr_image')}
              disabled={isExporting}
              activeOpacity={0.7}
              testID="export-option-qr-image"
              accessibilityLabel="Save QR Image"
            >
              <View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="qr-code-outline" size={22} color="#D97706" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Save QR Image (PNG/SVG)</Text>
                <Text style={styles.optionDesc}>
                  Scannable code linking to public card
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Option 3: vCard File */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleTriggerExport('vcard')}
              disabled={isExporting}
              activeOpacity={0.7}
              testID="export-option-vcard"
              accessibilityLabel="Save Contact vCard"
            >
              <View style={[styles.iconBox, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="person-add-outline" size={22} color="#7C3AED" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Save Contact (vCard .vcf)</Text>
                <Text style={styles.optionDesc}>
                  Universal contact file for phone address books
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {isExporting ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Generating export file...</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  successBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  optionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
