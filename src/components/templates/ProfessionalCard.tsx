/**
 * Template 1 — Professional Digital Business Card (LIGHT CORPORATE)
 * Premium light corporate executive presentation layout with clean white background,
 * dark navy typography, corporate blue/gold accents, structured contact action buttons,
 * social links, and scannable QR section.
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

export const ProfessionalCard: React.FC<CardPresentationProps> = ({
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
    <View style={[styles.container, style]} testID="template-professional-card">
      {/* Top Corporate Accent Bar */}
      <View style={styles.topAccentBar} />

      {/* Header Profile Section */}
      <View style={styles.headerRow}>
        <Avatar
          uri={card.profilePhoto}
          name={fullName}
          size="lg"
          borderColor="#1E3A8A"
          style={styles.avatar}
        />
        <View style={styles.identityContainer}>
          <View style={styles.corporateBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#1D4ED8" style={{ marginRight: 4 }} />
            <Text style={styles.corporateBadgeText}>OFFICIAL VCARD</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {fullName}
          </Text>
          {card.contact.title ? (
            <Text style={styles.designation} numberOfLines={1}>
              {card.contact.title}
            </Text>
          ) : null}
          {card.contact.company ? (
            <View style={styles.companyRow}>
              <Ionicons name="business-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.company} numberOfLines={1}>
                {card.contact.company}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Bio / Summary (if available) */}
      {card.contact.bio ? (
        <View style={styles.bioBox}>
          <Text style={styles.bioText} numberOfLines={3}>
            {card.contact.bio}
          </Text>
        </View>
      ) : null}

      {/* Corporate Action Buttons Grid */}
      {(hasPhone || hasEmail || hasWebsite) && (
        <View style={styles.actionGrid}>
          {hasPhone && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCall}
              activeOpacity={0.8}
              testID="action-call"
            >
              <Ionicons name="call" size={16} color="#1E3A8A" />
              <Text style={styles.actionButtonText} numberOfLines={1}>
                {card.contact.phoneMobile || card.contact.phoneWork}
              </Text>
            </TouchableOpacity>
          )}

          {hasEmail && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEmail}
              activeOpacity={0.8}
              testID="action-email"
            >
              <Ionicons name="mail" size={16} color="#1E3A8A" />
              <Text style={styles.actionButtonText} numberOfLines={1}>
                {card.contact.email}
              </Text>
            </TouchableOpacity>
          )}

          {hasWebsite && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonFull]}
              onPress={handleWebsite}
              activeOpacity={0.8}
              testID="action-website"
            >
              <Ionicons name="globe" size={16} color="#1E3A8A" />
              <Text style={styles.actionButtonText} numberOfLines={1}>
                {card.contact.website}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Social Links Row */}
      {hasSocials && (
        <View style={styles.socialContainer}>
          <Text style={styles.sectionLabel}>Connect Online</Text>
          <View style={styles.socialIconsRow}>
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
                  <Ionicons name={iconName as any} size={18} color="#334155" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* QR Code Presentation Box */}
      {showQr && (
        <View style={styles.qrContainer}>
          <View style={styles.qrDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.qrDividerText}>SCAN TO CONNECT</Text>
            <View style={styles.dividerLine} />
          </View>
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
            <View style={styles.slugBadge}>
              <Ionicons name="link-outline" size={12} color="#1D4ED8" style={{ marginRight: 4 }} />
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
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    padding: spacing.lg,
    ...shadows.md,
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: '#1E3A8A',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  avatar: {
    marginRight: spacing.md,
  },
  identityContainer: {
    flex: 1,
  },
  corporateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  corporateBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  designation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 2,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  company: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  bioBox: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#1E3A8A',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.xs,
    marginBottom: spacing.md,
  },
  bioText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    fontStyle: 'italic',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    gap: 6,
  },
  actionButtonFull: {
    minWidth: '100%',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  socialContainer: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  socialIconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  qrDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  qrDividerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 1.2,
    paddingHorizontal: spacing.sm,
  },
  qrWrapper: {
    padding: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  slugBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: spacing.sm,
  },
  slugText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
});
