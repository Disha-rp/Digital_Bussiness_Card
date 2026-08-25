/**
 * Preview Screen (Phase 9)
 * Complete Digital Business Card Live Presentation Screen.
 * Features:
 * 1. Single presentation renderer via <CardTemplate /> (Professional, Modern, Minimal)
 * 2. Real-time in-memory template switching via <TemplatePicker /> (0 network mutations)
 * 3. Dynamic card resolution from QRTRAC API / local store
 * 4. Interactive contact links (phone dialer, mailto, website, social links) with safe fallbacks
 * 5. PreviewActions bar: Edit, Share, Download (.vcf), Enlarged QR Modal
 * 6. Zero QRTRAC API mutations during preview interactions
 * 7. Fully responsive across 360x640, 375x667, 412x915, 430x932
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
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
import { CardTemplateId } from '../models/template';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';
import { shadows } from '../theme/shadows';
import {
  ErrorState,
  LoadingIndicator,
  QRCodeView,
  CardTemplate,
  TemplatePicker,
  PreviewActions,
  ExportModal,
  ShareModal,
} from '../components';
import {
  downloadVCard,
  shareBusinessCard,
  openContactUrl,
  exportBusinessCard,
  ExportFormat,
  ExportResult,
  shareBusinessCardAction,
  ShareFormat,
  ShareResult,
  getPublicCardUrl,
} from '../utils';

export const PreviewScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<RouteProps<'Preview'>>();
  const { cards, selectedCard } = useCards();

  const cardId = route.params?.cardId;
  const initialTemplate = route.params?.templateId;

  const [resolvedCard, setResolvedCard] = useState<BusinessCard | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<CardTemplateId>(
    (initialTemplate as CardTemplateId) || 'modern'
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast notification
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // 1. Resolve latest card data from memory or server
  useEffect(() => {
    let isMounted = true;

    const resolveCardData = async () => {
      setLoading(true);
      setError(null);

      let found: BusinessCard | null = null;

      // 1. Try finding in context store
      if (cardId) {
        found = cards.find((c) => c.id === cardId) || null;
      }

      if (!found && selectedCard && (!cardId || selectedCard.id === cardId)) {
        found = selectedCard;
      }

      // 2. Fetch fresh from QRTRAC API if not found or if cardId provided
      if (cardId) {
        try {
          const res = await qrService.getCard(cardId);
          if (res.success && res.data) {
            found = res.data;
          }
        } catch {
          // Fallback to found
        }
      }

      if (isMounted) {
        if (found) {
          setResolvedCard(found);
          if (!initialTemplate && found.template) {
            setActiveTemplate(found.template);
          }
        } else {
          setError('Card could not be loaded.');
        }
        setLoading(false);
      }
    };

    resolveCardData();

    return () => {
      isMounted = false;
    };
  }, [cardId, cards, selectedCard, initialTemplate]);

  // 2. Handle interactive contact actions
  const handleActionPress = useCallback(
    async (action: 'call' | 'email' | 'website' | 'social', target?: string) => {
      if (!target) return;
      const opened = await openContactUrl(action, target);
      if (!opened) {
        const errorText = `Unable to open ${action} link: ${target}`;
        if (Platform.OS === 'web') {
          setToastMessage(errorText);
        } else {
          Alert.alert('Action Unavailable', errorText);
        }
      }
    },
    []
  );

  // 3. Preview Action Handlers
  const handleEditPress = useCallback(() => {
    if (!resolvedCard) return;
    navigation.navigate('EditCard', {
      cardId: resolvedCard.id,
      cardTitle: resolvedCard.name,
      templateId: activeTemplate,
    });
  }, [navigation, resolvedCard, activeTemplate]);

  const cardRef = React.useRef<View>(null);

  const handleSharePress = useCallback(() => {
    if (!resolvedCard) return;
    setShowShareModal(true);
  }, [resolvedCard]);

  const handlePerformShare = useCallback(
    async (format: ShareFormat): Promise<ShareResult> => {
      if (!resolvedCard) {
        return {
          success: false,
          message: 'Unable to share card',
          format,
        };
      }

      const result = await shareBusinessCardAction(resolvedCard, format, activeTemplate, cardRef);
      if (result.message && !result.cancelled) {
        setToastMessage(result.message);
      }
      return result;
    },
    [resolvedCard, activeTemplate]
  );

  const handleDownloadPress = useCallback(() => {
    if (!resolvedCard) return;
    setShowExportModal(true);
  }, [resolvedCard]);

  const handlePerformExport = useCallback(
    async (format: ExportFormat): Promise<ExportResult> => {
      if (!resolvedCard) {
        return {
          success: false,
          message: 'Unable to save card',
          format,
        };
      }

      const result = await exportBusinessCard(resolvedCard, format, activeTemplate);
      if (result.message) {
        setToastMessage(result.message);
      }
      return result;
    },
    [resolvedCard, activeTemplate]
  );

  const handleShowQrPress = useCallback(() => {
    if (!resolvedCard) return;
    navigation.navigate('QRCode', {
      cardId: resolvedCard.id,
      cardTitle: resolvedCard.name,
    });
  }, [navigation, resolvedCard]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Card Preview</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <LoadingIndicator message="Loading card preview..." />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !resolvedCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Card Preview</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <ErrorState
            title="Card Not Found"
            message={error || 'Card could not be loaded.'}
            retryTitle="Return to My Cards"
            onRetry={() => navigation.navigate('MyCards')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const card = resolvedCard;
  const publicUrl =
    card.cloud?.publicUrl ||
    (card.cloud?.displayId
      ? `https://qrtrac.link/${card.cloud.displayId}`
      : `https://qrtrac.me/${card.id}`);

  const hasQr = Boolean(
    card.cloud?.qrImageUrl || card.cloud?.displayId || card.cloud?.publicUrl || card.id
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          testID="preview-back-btn"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Card Preview</Text>
        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={handleEditPress}
          testID="preview-header-edit-btn"
          accessibilityLabel="Edit this card"
        >
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={styles.editHeaderBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Toast Notification */}
      {toastMessage ? (
        <View style={styles.toastBanner}>
          <Ionicons name="information-circle" size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeader}>Live Card Presentation</Text>
        <Text style={styles.sectionSub}>
          Real-time preview of how recipients see and interact with your digital business card.
        </Text>

        {/* Separated Preview Actions Bar */}
        <PreviewActions
          onEdit={handleEditPress}
          onShare={handleSharePress}
          onDownload={handleDownloadPress}
          onShowQr={handleShowQrPress}
          hasQr={hasQr}
          style={styles.actionsBar}
        />

        {/* Interactive Template Selector (0 API mutations) */}
        <TemplatePicker
          selectedTemplate={activeTemplate}
          onSelectTemplate={(tmpl) => setActiveTemplate(tmpl)}
          compact={false}
          style={styles.templatePickerSection}
        />

        {/* Modular Presentation Template Renderer */}
        <View ref={cardRef} collapsable={false} style={styles.cardTemplateWrapper}>
          <CardTemplate
            card={card}
            template={activeTemplate}
            showQr={true}
            onActionPress={handleActionPress}
          />
        </View>

        {/* Primary Bottom Action */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={handleSharePress}
          testID="proceed-to-share-btn"
          accessibilityLabel="Share digital business card"
        >
          <Text style={styles.buttonText}>Share Business Card</Text>
          <Ionicons
            name="share-social-outline"
            size={18}
            color="#FFFFFF"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </ScrollView>

      {/* Enlarged QR Code Modal */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan to Connect</Text>
              <TouchableOpacity
                onPress={() => setShowQrModal(false)}
                style={styles.modalCloseBtn}
                testID="close-qr-modal-btn"
                accessibilityLabel="Close QR view"
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Point any mobile camera at the QR code to instantly view and save this card.
            </Text>

            <View style={styles.enlargedQrContainer}>
              <QRCodeView
                imageUrl={card.cloud?.qrImageUrl}
                value={publicUrl}
                size={200}
                backgroundColor="#FFFFFF"
                color="#0F172A"
              />
            </View>

            {publicUrl ? (
              <View style={styles.urlDisplayBox}>
                <Ionicons name="globe-outline" size={14} color={colors.primary} />
                <Text style={styles.urlDisplayText} numberOfLines={1}>
                  {publicUrl}
                </Text>
              </View>
            ) : null}

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalShareBtn}
                onPress={() => {
                  setShowQrModal(false);
                  handleSharePress();
                }}
                activeOpacity={0.7}
                testID="modal-share-link-btn"
              >
                <Ionicons name="share-outline" size={16} color={colors.primary} />
                <Text style={styles.modalShareBtnText}>Share Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowQrModal(false)}
                activeOpacity={0.7}
                testID="modal-done-btn"
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Download & Export Modal */}
      {resolvedCard ? (
        <ExportModal
          visible={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handlePerformExport}
          templateName={activeTemplate.toUpperCase()}
        />
      ) : null}

      {/* Share Modal */}
      {resolvedCard ? (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          onShare={handlePerformShare}
          publicUrl={getPublicCardUrl(resolvedCard)}
          templateName={activeTemplate.toUpperCase()}
        />
      ) : null}
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
  editHeaderBtn: {
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
  editHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
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
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  actionsBar: {
    marginBottom: spacing.md,
  },
  templatePickerSection: {
    marginBottom: spacing.md,
  },
  cardTemplateWrapper: {
    marginBottom: spacing.lg,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 16,
  },
  enlargedQrContainer: {
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  urlDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: spacing.lg,
    maxWidth: '100%',
  },
  urlDisplayText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  modalActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  modalShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  modalShareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  modalDoneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  modalDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
