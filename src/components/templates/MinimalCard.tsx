/**
 * Template 3 — Minimal Digital Business Card (LIGHT MINIMALIST)
 * Pure light minimalist presentation layout with crisp white background,
 * sharp charcoal typography, generous whitespace, clean contact rows,
 * subtle monochrome social links, and minimalist QR presentation.
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

export const MinimalCard: React.FC<CardPresentationProps> = ({
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

  const subtitleParts = [card.contact.title, card.contact.company].filter(Boolean);
  const subtitle = subtitleParts.join(' • ');

  const hasPhone = Boolean(card.contact.phoneMobile || card.contact.phoneWork);
  const hasEmail = Boolean(card.contact.email);
  const hasWebsite = Boolean(card.contact.website);
  const hasSocials = Boolean(card.socialLinks && card.socialLinks.length > 0);

  return (
    <View style={[styles.container, style]} testID="template-minimal-card">
      {/* Header Profile Section */}
      <View style={styles.headerSection}>
        <Avatar
          uri={card.profilePhoto}
          name={fullName}
          size="lg"
          borderColor="#E5E7EB"
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={2}>
            {fullName}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Bio (if available) */}
      {card.contact.bio ? (
        <View style={styles.bioContainer}>
          <Text style={styles.bioText} numberOfLines={3}>
            {card.contact.bio}
          </Text>
        </View>
      ) : null}

      {/* Divider */}
      {(hasPhone || hasEmail || hasWebsite) && <View style={styles.divider} />}

      {/* Clean Stacked Contact List */}
      <View style={styles.contactList}>
        {hasPhone && (
          <TouchableOpacity
            style={styles.contactRow}
            onPress={handleCall}
            activeOpacity={0.7}
            testID="action-call"
          >
            <View style={styles.iconBox}>
              <Ionicons name="call-outline" size={15} color="#4B5563" />
            </View>
            <Text style={styles.contactValue} numberOfLines={1}>
              {card.contact.phoneMobile || card.contact.phoneWork}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        {hasEmail && (
          <TouchableOpacity
            style={styles.contactRow}
            onPress={handleEmail}
            activeOpacity={0.7}
            testID="action-email"
          >
            <View style={styles.iconBox}>
              <Ionicons name="mail-outline" size={15} color="#4B5563" />
            </View>
            <Text style={styles.contactValue} numberOfLines={1}>
              {card.contact.email}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        {hasWebsite && (
          <TouchableOpacity
            style={styles.contactRow}
            onPress={handleWebsite}
            activeOpacity={0.7}
            testID="action-website"
          >
            <View style={styles.iconBox}>
              <Ionicons name="globe-outline" size={15} color="#4B5563" />
            </View>
            <Text style={styles.contactValue} numberOfLines={1}>
              {card.contact.website}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Social Links Bar */}
      {hasSocials && (
        <View style={styles.socialContainer}>
          <View style={styles.divider} />
          <View style={styles.socialRow}>
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
                  <Ionicons name={iconName as any} size={16} color="#374151" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* QR Code Presentation Box */}
      {showQr && (
        <View style={styles.qrContainer}>
          <View style={styles.divider} />
          <View style={styles.qrWrapper}>
            <QRCodeView
              imageUrl={card.cloud?.qrImageUrl}
              value={
                publicUrl ||
                (card.cloud?.displayId
                  ? `https://qrtrac.link/${card.cloud.displayId}`
                  : `https://qrtrac.me/${card.id}`)
              }
              size={130}
              backgroundColor="#FFFFFF"
              color="#111827"
            />
          </View>
          {card.cloud?.displayId ? (
            <Text style={styles.slugText}>
              qrtrac.link/{card.cloud.displayId}
            </Text>
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
    borderColor: '#E5E7EB',
    padding: spacing.lg,
    ...shadows.sm,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 3,
    lineHeight: 18,
    fontWeight: '500',
  },
  bioContainer: {
    marginTop: spacing.sm + 2,
    paddingTop: spacing.xs,
  },
  bioText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: spacing.sm + 2,
  },
  contactList: {
    gap: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: borderRadius.md,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconBox: {
    width: 24,
    alignItems: 'center',
    marginRight: 6,
  },
  contactValue: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  socialContainer: {
    marginTop: 0,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  socialButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrWrapper: {
    padding: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  slugText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});
