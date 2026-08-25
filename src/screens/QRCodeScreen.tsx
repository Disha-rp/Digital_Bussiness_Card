/**
 * QR Code Screen (Phase 10)
 * Dedicated, production-ready Digital Business Card QR Presentation Screen.
 * Features:
 * 1. Large, scannable QR code display representing the verified QRTRAC public card
 * 2. Card owner identity section (Avatar, Full Name, Title, Company)
 * 3. Text prompt: "Scan to view my card"
 * 4. Scannable public QRTRAC URL with 1-tap Copy action
 * 5. Share QR and Save QR actions with platform-safe fallbacks and user feedback
 * 6. Dynamic resolution from QRTRAC API / local store (0 mutations)
 * 7. Fully responsive across 360x640, 375x667, 412x915, 430x932
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootNavigationProp, RouteProps } from '../types/navigation';
import { useCards } from '../store';
import { qrService } from '../services/qr.service';
import { BusinessCard } from '../models/card';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';
import { shadows } from '../theme/shadows';
import {
  Avatar,
  ErrorState,
  LoadingIndicator,
  QRCodeView,
} from '../components';
import {
  shareBusinessCard,
  saveQrCode,
  copyToClipboard,
} from '../utils/vcard';

export const QRCodeScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<RouteProps<'QRCode'>>();
  const { cards, selectedCard } = useCards();

  const cardId = route.params?.cardId;

  const [resolvedCard, setResolvedCard] = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Resolve card from context or QRTRAC API
  const resolveCard = useCallback(async () => {
    setLoading(true);
    setError(null);

    let target: BusinessCard | null = null;

    if (cardId) {
      target = cards.find((c) => c.id === cardId) || null;
    }

    if (!target && selectedCard && (!cardId || selectedCard.id === cardId)) {
      target = selectedCard;
    }

    if (!target && cardId) {
      try {
        const res = await qrService.getCard(cardId);
        if (res.success && res.data) {
          target = res.data;
        } else {
          setError(res.message || 'Failed to load card details from server.');
        }
      } catch {
        setError('Network error while loading QR details.');
      }
    }

    if (target) {
      setResolvedCard(target);
    } else if (!error) {
      setError('Card could not be found.');
    }
    setLoading(false);
  }, [cardId, cards, selectedCard, error]);

  useEffect(() => {
    resolveCard();
  }, [cardId]);

  // Action handlers
  const handleCopyUrl = useCallback(async () => {
    if (!resolvedCard) return;
    const publicUrl =
      resolvedCard.cloud?.publicUrl ||
      (resolvedCard.cloud?.displayId
        ? `https://qrtrac.link/${resolvedCard.cloud.displayId}`
        : `https://qrtrac.me/${resolvedCard.id}`);

    const copied = await copyToClipboard(publicUrl);
    if (copied) {
      setToastMessage('Link copied to clipboard!');
      if (Platform.OS !== 'web') {
        Alert.alert('Link Copied', publicUrl);
      }
    }
  }, [resolvedCard]);

  const handleShareQr = useCallback(async () => {
    if (!resolvedCard) return;
    const res = await shareBusinessCard(resolvedCard);
    if (res.message) {
      setToastMessage(res.message);
      if (Platform.OS !== 'web') {
        Alert.alert('Share Card', res.message);
      }
    }
  }, [resolvedCard]);

  const handleSaveQr = useCallback(async () => {
    if (!resolvedCard) return;
    const res = await saveQrCode(resolvedCard);
    if (res.message) {
      setToastMessage(res.message);
      if (Platform.OS !== 'web') {
        Alert.alert('Save QR', res.message);
      }
    }
  }, [resolvedCard]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            testID="qr-screen-back-btn"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Code</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <LoadingIndicator message="Loading QR code..." />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !resolvedCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            testID="qr-screen-back-btn"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Code</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <ErrorState
            title="QR Code Unavailable"
            message={error || 'Could not load QR code.'}
            retryTitle="Retry"
            onRetry={resolveCard}
          />
        </View>
      </SafeAreaView>
    );
  }

  const card = resolvedCard;
  const fullName =
    [card.contact.firstName, card.contact.lastName].filter(Boolean).join(' ') ||
    card.name ||
    'Digital Business Card';

  const subtitle = [card.contact.title, card.contact.company].filter(Boolean).join(' • ');

  const publicUrl =
    card.cloud?.publicUrl ||
    (card.cloud?.displayId
      ? `https://qrtrac.link/${card.cloud.displayId}`
      : `https://qrtrac.me/${card.id}`);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          testID="qr-screen-back-btn"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Card QR</Text>
        <TouchableOpacity
          style={styles.previewHeaderBtn}
          onPress={() =>
            navigation.navigate('Preview', {
              cardId: card.id,
              cardTitle: card.name,
              templateId: card.template,
            })
          }
          testID="qr-screen-preview-btn"
          accessibilityLabel="View Card Preview"
        >
          <Ionicons name="eye-outline" size={18} color={colors.primary} />
          <Text style={styles.previewHeaderBtnText}>Preview</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Toast Notification */}
      {toastMessage ? (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main QR Presentation Card */}
        <View style={styles.qrCardContainer}>
          {/* Card Owner Identity Header */}
          <View style={styles.ownerHeader}>
            <Avatar
              uri={card.profilePhoto}
              name={fullName}
              size="lg"
              borderColor={colors.primary}
              style={styles.avatar}
            />
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName} numberOfLines={2}>
                {fullName}
              </Text>
              {subtitle ? (
                <Text style={styles.ownerSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Prompt Banner */}
          <View style={styles.scanPromptBox}>
            <Ionicons name="scan-outline" size={16} color={colors.primary} />
            <Text style={styles.scanPromptText}>Scan to view my card</Text>
          </View>

          {/* Large High-Contrast QR Code Display */}
          <View style={styles.qrDisplayBox}>
            <QRCodeView
              imageUrl={card.cloud?.qrImageUrl}
              value={publicUrl}
              size={230}
              backgroundColor="#FFFFFF"
              color="#0F172A"
            />
          </View>

          {/* Public QRTRAC URL Badge with 1-Tap Copy */}
          {publicUrl ? (
            <View style={styles.publicUrlBox}>
              <View style={styles.urlTextContainer}>
                <Ionicons name="link-outline" size={14} color={colors.primary} />
                <Text style={styles.publicUrlText} numberOfLines={1}>
                  {publicUrl}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleCopyUrl}
                activeOpacity={0.7}
                testID="copy-qr-url-btn"
                accessibilityLabel="Copy public card link"
              >
                <Ionicons name="copy-outline" size={14} color={colors.primary} />
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Direct Scan Instruction */}
          <Text style={styles.instructionText}>
            Point any smartphone camera at this code. No app installation required.
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryShareBtn}
            onPress={handleShareQr}
            activeOpacity={0.8}
            testID="share-qr-btn"
            accessibilityLabel="Share digital business card QR"
          >
            <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryShareBtnText}>Share QR Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondarySaveBtn}
            onPress={handleSaveQr}
            activeOpacity={0.7}
            testID="save-qr-btn"
            accessibilityLabel="Save or export QR code"
          >
            <Ionicons name="download-outline" size={18} color={colors.primary} />
            <Text style={styles.secondarySaveBtnText}>Save QR Code</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 8,
    borderRadius: borderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  previewHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 4,
  },
  previewHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  toastBanner: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 999,
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...shadows.lg,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    alignItems: 'center',
  },
  qrCardContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: spacing.md,
  },
  avatar: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  ownerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  scanPromptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    gap: 6,
    marginBottom: spacing.lg,
  },
  scanPromptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  qrDisplayBox: {
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  publicUrlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.lg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: spacing.md,
    gap: 8,
  },
  urlTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  publicUrlText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  instructionText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.sm,
  },
  primaryShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    gap: 8,
    ...shadows.md,
  },
  primaryShareBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondarySaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 13,
    borderRadius: borderRadius.lg,
    gap: 8,
    ...shadows.sm,
  },
  secondarySaveBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
