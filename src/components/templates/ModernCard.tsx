/**
 * Template 2 — Modern Digital Business Card (LIGHT MODERN)
 * Dynamic light technology presentation layout with large centered hero avatar,
 * electric cyan/sky accents, rounded contact chips, and integrated elevated QR box.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../Avatar';
import { QRCodeView } from '../QRCodeView';
import { SOCIAL_PLATFORMS } from '../../models/social';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/borderRadius';
import { shadows } from '../../theme/shadows';
import { CardPresentationProps } from './CardTemplate';

export const ModernCard: React.FC<CardPresentationProps> = ({
  card,
  showQr = true,
  onActionPress,
  style,
}) => {
  const fullName =
    [card.contact.firstName, card.contact.lastName].filter(Boolean).join(' ') ||
    card.name;

  const publicUrl =
    card.cloud?.publicUrl ||
    (card.cloud?.displayId
      ? `https://qrtrac.link/${card.cloud.displayId}`
      : undefined);

  const handleCall = () => {
    const phone = card.contact.phoneMobile || card.contact.phoneWork;
    if (phone) {
      if (onActionPress) onActionPress('call', phone);
      else Linking.openURL(`tel:${phone}`);
    }
  };

  const handleEmail = () => {
    if (card.contact.email) {
      if (onActionPress) onActionPress('email', card.contact.email);
      else Linking.openURL(`mailto:${card.contact.email}`);
    }
  };

  const handleWebsite = () => {
    if (card.contact.website) {
      if (onActionPress) onActionPress('website', card.contact.website);
      else {
        const url = /^https?:\/\//i.test(card.contact.website)
          ? card.contact.website
          : `https://${card.contact.website}`;
        Linking.openURL(url);
      }
    }
  };

  const handleSocial = (url: string) => {
    if (onActionPress) onActionPress('social', url);
    else Linking.openURL(url);
  };

  const hasPhone = Boolean(card.contact.phoneMobile || card.contact.phoneWork);
  const hasEmail = Boolean(card.contact.email);
  const hasWebsite = Boolean(card.contact.website);
  const hasSocials = Boolean(card.socialLinks && card.socialLinks.length > 0);

  return (
    <View style={[styles.container, style]} testID="template-modern-card">
      {/* Centered Hero Avatar with Cyan Ring */}
      <View style={styles.heroSection}>
        <View style={styles.avatarRing}>
          <Avatar
            uri={card.profilePhoto}
            name={fullName}
            size="xl"
            borderColor="#0EA5E9"
          />
        </View>

        {/* Name & Dynamic Identity */}
        <Text style={styles.name} numberOfLines={2}>
          {fullName}
        </Text>

        {card.contact.company ? (
          <View style={styles.companyPill}>
            <Ionicons name="sparkles" size={11} color="#0284C7" style={{ marginRight: 4 }} />
            <Text style={styles.companyPillText} numberOfLines={1}>
              {card.contact.company}
            </Text>
          </View>
        ) : null}

        {card.contact.title ? (
          <Text style={styles.designation} numberOfLines={1}>
            {card.contact.title}
          </Text>
        ) : null}
      </View>

      {/* Bio Card (if available) */}
      {card.contact.bio ? (
        <View style={styles.bioCard}>
          <Text style={styles.bioText} numberOfLines={3}>
            {card.contact.bio}
          </Text>
        </View>
      ) : null}

      {/* Compact Action Chips */}
      {(hasPhone || hasEmail || hasWebsite) && (
        <View style={styles.actionChipsRow}>
          {hasPhone && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={handleCall}
              activeOpacity={0.8}
              testID="action-call"
            >
              <View style={styles.chipIconBox}>
                <Ionicons name="call" size={14} color="#0284C7" />
              </View>
              <Text style={styles.actionChipText}>Call</Text>
            </TouchableOpacity>
          )}

          {hasEmail && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={handleEmail}
              activeOpacity={0.8}
              testID="action-email"
            >
              <View style={styles.chipIconBox}>
                <Ionicons name="mail" size={14} color="#0284C7" />
              </View>
              <Text style={styles.actionChipText}>Email</Text>
            </TouchableOpacity>
          )}

          {hasWebsite && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={handleWebsite}
              activeOpacity={0.8}
              testID="action-website"
            >
              <View style={styles.chipIconBox}>
                <Ionicons name="globe" size={14} color="#0284C7" />
              </View>
              <Text style={styles.actionChipText}>Website</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Modern Social Links Row */}
      {hasSocials && (
        <View style={styles.socialBar}>
          {card.socialLinks.map((link) => {
            const platformConfig = SOCIAL_PLATFORMS.find(
              (p) => p.platform === link.platform
            );
            const iconName = platformConfig?.iconName || 'link-outline';

            return (
              <TouchableOpacity
                key={link.id || link.url}
                style={styles.socialButton}
                onPress={() => handleSocial(link.url)}
                activeOpacity={0.7}
                testID={`social-link-${link.platform}`}
              >
                <Ionicons name={iconName as any} size={16} color="#0284C7" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Elevated QR Card */}
      {showQr && (
        <View style={styles.qrCard}>
          <View style={styles.qrWrapper}>
            <QRCodeView
              imageUrl={card.cloud?.qrImageUrl}
              value={
                publicUrl ||
                (card.cloud?.displayId
                  ? `https://qrtrac.link/${card.cloud.displayId}`
                  : `https://qrtrac.me/${card.id}`)
              }
              size={135}
              backgroundColor="#FFFFFF"
              color="#0F172A"
            />
          </View>
          {card.cloud?.displayId ? (
            <View style={styles.slugPill}>
              <Ionicons name="finger-print-outline" size={12} color="#0284C7" style={{ marginRight: 4 }} />
              <Text style={styles.slugText}>qrtrac.link/{card.cloud.displayId}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xxl,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
    width: '100%',
  },
  avatarRing: {
    padding: 3,
    borderRadius: borderRadius.full,
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#38BDF8',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  companyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 6,
    marginBottom: 4,
  },
  companyPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.2,
  },
  designation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
    textAlign: 'center',
  },
  bioCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    marginBottom: spacing.md,
    width: '100%',
  },
  bioText: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 17,
    textAlign: 'center',
  },
  actionChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 6,
    ...shadows.sm,
  },
  chipIconBox: {
    width: 20,
    alignItems: 'center',
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  socialBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  qrWrapper: {
    padding: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.xs + 2,
    ...shadows.sm,
  },
  slugPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  slugText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
});
