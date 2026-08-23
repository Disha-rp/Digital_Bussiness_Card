/**
 * Preview Screen
 * Renders live digital business card presentation for the selected QRTRAC card.
 * Resolves card dynamically via route.params.cardId and CardContext.
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
import { CARD_TEMPLATES } from '../theme/templates';
import { colors, theme } from '../theme';
import { Avatar, ErrorState, LoadingIndicator, QRCodeView } from '../components';

export const PreviewScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<RouteProps<'Preview'>>();
  const { cards, selectedCard } = useCards();

  const cardId = route.params?.cardId;
  const [resolvedCard, setResolvedCard] = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resolveCardData = async () => {
      setLoading(true);
      setError(null);

      // 1. Try finding in memory cards list
      if (cardId) {
        const found = cards.find((c) => c.id === cardId);
        if (found) {
          if (isMounted) {
            setResolvedCard(found);
            setLoading(false);
          }
          return;
        }
      }

      // 2. Try selectedCard from context if matches
      if (selectedCard && (!cardId || selectedCard.id === cardId)) {
        if (isMounted) {
          setResolvedCard(selectedCard);
          setLoading(false);
        }
        return;
      }

      // 3. If cardId provided but not in memory, fetch from QRTRAC API
      if (cardId) {
        try {
          const res = await qrService.getCard(cardId);
          if (isMounted) {
            if (res.success && res.data) {
              setResolvedCard(res.data);
            } else {
              setError(res.message || 'Card could not be loaded.');
            }
            setLoading(false);
          }
        } catch {
          if (isMounted) {
            setError('Failed to load card from server.');
            setLoading(false);
          }
        }
        return;
      }

      // 4. No cardId provided and no cards in memory
      if (isMounted) {
        setError('Card could not be loaded.');
        setLoading(false);
      }
    };

    resolveCardData();

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
  const templateConfig = CARD_TEMPLATES[card.template] || CARD_TEMPLATES.modern_minimal;
  const fullName = [card.contact.firstName, card.contact.lastName].filter(Boolean).join(' ') || card.name;
  const publicUrl =
    card.cloud?.publicUrl ||
    (card.cloud?.displayId ? `https://qr.qrtrac.com/${card.cloud.displayId}` : undefined);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} testID="preview-back-btn">
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Card Preview</Text>
        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={() =>
            navigation.navigate('EditCard', {
              cardId: card.id,
              cardTitle: card.name,
              templateId: card.template,
            })
          }
        >
          <Ionicons name="create-outline" size={20} color={colors.primaryLight} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>Live Card Presentation</Text>
        <Text style={styles.sectionSub}>Dynamic QRTRAC Digital Business Card</Text>

        {/* Card Presentation Shell */}
        <View style={[styles.previewBox, { borderColor: templateConfig.style.borderColor }]}>
          {/* Header with Avatar & Details */}
          <View style={styles.cardTop}>
            <Avatar
              uri={card.profilePhoto}
              name={fullName}
              size="lg"
              borderColor={templateConfig.style.accentColor}
              style={styles.avatar}
            />

            <View style={styles.cardDetails}>
              <Text style={styles.cardName} numberOfLines={2}>
                {fullName}
              </Text>
              {card.contact.title ? (
                <Text style={[styles.cardRole, { color: templateConfig.style.accentColor }]} numberOfLines={1}>
                  {card.contact.title}
                </Text>
              ) : null}
              {card.contact.company ? (
                <Text style={styles.cardCompany} numberOfLines={1}>
                  {card.contact.company}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Contact Details List */}
          <View style={styles.contactSection}>
            {card.contact.email ? (
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {card.contact.email}
                </Text>
              </View>
            ) : null}

            {card.contact.phoneMobile ? (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {card.contact.phoneMobile}
                </Text>
              </View>
            ) : null}

            {card.contact.website ? (
              <View style={styles.contactRow}>
                <Ionicons name="globe-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {card.contact.website}
                </Text>
              </View>
            ) : null}
          </View>

          {/* QR Code Presentation Box */}
          <View style={styles.qrSection}>
            <QRCodeView
              imageUrl={card.cloud?.qrImageUrl}
              value={publicUrl || (card.cloud?.displayId ? `https://qrtrac.link/${card.cloud.displayId}` : `https://qrtrac.me/${card.id}`)}
              size={140}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          </View>

          {/* Meta Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Template: {templateConfig.name}</Text>
            </View>
            {card.cloud?.displayId ? (
              <View style={[styles.badge, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
                <Text style={[styles.badgeText, { color: colors.secondary }]}>
                  /{card.cloud.displayId}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Share Action */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('Share', {
              cardId: card.id,
              cardTitle: fullName,
              previewUrl: publicUrl,
            })
          }
          testID="proceed-to-share-btn"
        >
          <Text style={styles.buttonText}>Proceed to Share</Text>
          <Ionicons name="share-social-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
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
  editHeaderBtn: {
    padding: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
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
    paddingBottom: theme.spacing.xxl,
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
  previewBox: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    marginRight: theme.spacing.md,
  },
  cardDetails: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardRole: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  cardCompany: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactSection: {
    gap: 6,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: theme.spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  hostedQrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: theme.borderRadius.md,
  },
  hostedQrImage: {
    width: 140,
    height: 140,
  },
  qrCaption: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  badgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
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
