/**
 * Share Screen
 * Dynamic sharing presentation for the selected QRTRAC card.
 * Resolves card via route.params.cardId and CardContext.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootNavigationProp, RouteProps } from '../types/navigation';
import { useCards } from '../store';
import { qrService } from '../services/qr.service';
import { BusinessCard } from '../models/card';
import { colors, theme } from '../theme';
import { ErrorState, LoadingIndicator, QRCodeView } from '../components';

export const ShareScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<RouteProps<'Share'>>();
  const { cards, selectedCard } = useCards();

  const cardId = route.params?.cardId;
  const [resolvedCard, setResolvedCard] = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resolveCard = async () => {
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
          }
        } catch {
          // handled below
        }
      }

      if (isMounted) {
        if (target) {
          setResolvedCard(target);
        } else {
          setError('Card could not be loaded.');
        }
        setLoading(false);
      }
    };

    resolveCard();

    return () => {
      isMounted = false;
    };
  }, [cardId, cards, selectedCard]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Card</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <LoadingIndicator message="Loading sharing details..." />
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
          <Text style={styles.headerTitle}>Share Card</Text>
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
  const fullName = [card.contact.firstName, card.contact.lastName].filter(Boolean).join(' ') || card.name;
  const publicUrl =
    card.cloud?.publicUrl ||
    (card.cloud?.displayId ? `https://qrtrac.link/${card.cloud.displayId}` : undefined) ||
    route.params?.previewUrl;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} testID="share-back-btn">
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Card</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-done-circle" size={52} color={colors.success} />
        </View>

        <Text style={styles.sectionHeader}>Ready to Distribute</Text>
        <Text style={styles.sectionSub}>Share digital business card for {fullName}</Text>

        <View style={styles.shareCard}>
          <Text style={styles.cardTitle}>{fullName}</Text>
          {card.contact.title ? <Text style={styles.cardRole}>{card.contact.title}</Text> : null}
          {card.contact.company ? <Text style={styles.cardCompany}>{card.contact.company}</Text> : null}

          {/* QR Code Presentation */}
          <View style={styles.qrContainer}>
            <QRCodeView
              imageUrl={card.cloud?.qrImageUrl}
              value={publicUrl || (card.cloud?.displayId ? `https://qrtrac.link/${card.cloud.displayId}` : `https://qrtrac.me/${card.id}`)}
              size={130}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          </View>

          {publicUrl ? (
            <View style={styles.urlBadge}>
              <Ionicons name="link" size={14} color={colors.secondary} style={{ marginRight: 6 }} />
              <Text style={styles.urlText} numberOfLines={1}>
                {publicUrl}
              </Text>
            </View>
          ) : null}

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
          testID="return-to-mycards-btn"
        >
          <Ionicons name="home-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.buttonText}>Return to My Cards</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  content: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    paddingBottom: theme.spacing.xxl,
  },
  successIcon: {
    marginBottom: theme.spacing.xs,
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
    marginTop: 2,
    marginBottom: theme.spacing.lg,
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
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  cardRole: {
    fontSize: 13,
    color: colors.primaryLight,
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  cardCompany: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  qrContainer: {
    marginVertical: theme.spacing.md,
    alignItems: 'center',
  },
  hostedQrBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: theme.borderRadius.md,
  },
  qrImage: {
    width: 130,
    height: 130,
  },
  urlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.sm,
    maxWidth: '90%',
  },
  urlText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
  },
  mockActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
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
