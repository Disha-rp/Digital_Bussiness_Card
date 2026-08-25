/**
 * Share Modal Component (Phase 12)
 * Clean Light UI modal presenting all native sharing capabilities:
 * 1. Share Card Link (Native Share Sheet)
 * 2. Copy Link ("Link copied" instant feedback)
 * 3. Share Card Image (Active presentation template)
 * 4. Share QR Code (Scannable QR image)
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
import { ShareFormat, ShareResult } from '../utils/share';

export interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShare: (format: ShareFormat) => Promise<ShareResult>;
  publicUrl?: string;
  templateName?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  onShare,
  publicUrl,
  templateName = 'Modern',
}) => {
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<ShareResult | null>(null);
  const [activeFormat, setActiveFormat] = useState<ShareFormat>('link');

  const handleTriggerShare = async (format: ShareFormat) => {
    setActiveFormat(format);
    setIsSharing(true);
    setLastResult(null);

    try {
      const result = await onShare(format);
      setIsSharing(false);

      if (result.cancelled) {
        // Normal user cancellation: dismiss modal smoothly without error
        onClose();
        return;
      }

      setLastResult(result);
      if (result.success) {
        setTimeout(() => {
          onClose();
          setLastResult(null);
        }, 1500);
      }
    } catch {
      setIsSharing(false);
      setLastResult({
        success: false,
        message: 'Unable to share card',
        format,
        retryFn: () => onShare(format),
      });
    }
  };

  const handleRetry = () => {
    if (lastResult?.retryFn) {
      handleTriggerShare(activeFormat);
    } else {
      handleTriggerShare(activeFormat);
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
              <Text style={styles.modalTitle}>Share Business Card</Text>
              <Text style={styles.modalSubtitle}>
                {publicUrl ? publicUrl.replace(/^https?:\/\//, '') : 'Choose sharing method'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              testID="close-share-modal-btn"
              accessibilityLabel="Close share options"
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Feedback Banner */}
          {lastResult && !lastResult.cancelled ? (
            <View
              style={[
                styles.feedbackBanner,
                lastResult.success ? styles.successBanner : styles.errorBanner,
              ]}
              testID="share-feedback-banner"
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
                  testID="share-retry-btn"
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Share Options */}
          <View style={styles.optionsList}>
            {/* Option 1: Share Card Link */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleTriggerShare('link')}
              disabled={isSharing}
              activeOpacity={0.7}
              testID="share-option-link"
              accessibilityLabel="Share Public Card Link"
            >
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="share-social-outline" size={22} color="#16A34A" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Share Card Link</Text>
                <Text style={styles.optionDesc}>
                  Open native share sheet (WhatsApp, Email, Messages)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Option 2: Copy Link */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleTriggerShare('copy_link')}
              disabled={isSharing}
              activeOpacity={0.7}
              testID="share-option-copy-link"
              accessibilityLabel="Copy Public Link"
            >
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="copy-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Copy Link</Text>
                <Text style={styles.optionDesc}>
                  Copy verified public card link to clipboard
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Option 3: Share Card Image */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleTriggerShare('card_image')}
              disabled={isSharing}
              activeOpacity={0.7}
              testID="share-option-card-image"
              accessibilityLabel="Share Card Image"
            >
              <View style={[styles.iconBox, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="image-outline" size={22} color="#7C3AED" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Share Card Image</Text>
                <Text style={styles.optionDesc}>
                  Share full visual card ({templateName} template)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Option 4: Share QR Image */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleTriggerShare('qr_image')}
              disabled={isSharing}
              activeOpacity={0.7}
              testID="share-option-qr-image"
              accessibilityLabel="Share QR Code Image"
            >
              <View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="qr-code-outline" size={22} color="#D97706" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Share QR Code</Text>
                <Text style={styles.optionDesc}>
                  Share scannable QR code image
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {isSharing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Preparing share...</Text>
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
