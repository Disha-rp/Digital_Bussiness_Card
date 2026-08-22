/**
 * Reusable Business Card List Item Component
 * Renders contact details, QR preview, template badge, and quick actions (Preview, Edit, Share, Open).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BusinessCard } from '../models/card';
import { CARD_TEMPLATES } from '../theme/templates';
import { colors, theme } from '../theme';
import { Card } from './Card';
import { Avatar } from './Avatar';

export interface BusinessCardItemProps {
  card: BusinessCard;
  onOpen: (cardId: string) => void;
  onPreview: (cardId: string) => void;
  onEdit: (cardId: string) => void;
  onShare: (cardId: string) => void;
}

export const BusinessCardItem: React.FC<BusinessCardItemProps> = ({
  card,
  onOpen,
  onPreview,
  onEdit,
  onShare,
}) => {
  const templateConfig = CARD_TEMPLATES[card.template] || CARD_TEMPLATES.modern_minimal;
  const fullName = [card.contact.firstName, card.contact.lastName].filter(Boolean).join(' ') || card.name;
  const formattedDate = card.updatedAt
    ? new Date(card.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <Card style={styles.container} variant="elevated" onPress={() => onOpen(card.id)}>
      {/* Top Row: Avatar, Identity, and QR Preview */}
      <View style={styles.topRow}>
        <Avatar
          uri={card.profilePhoto}
          name={fullName}
          size="md"
          borderColor={templateConfig.style.accentColor}
          style={styles.avatar}
        />

        <View style={styles.identityContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName}
          </Text>

          {card.contact.title ? (
            <Text style={styles.title} numberOfLines={1}>
              {card.contact.title}
            </Text>
          ) : null}

          {card.contact.company ? (
            <Text style={styles.company} numberOfLines={1}>
              {card.contact.company}
            </Text>
          ) : null}
        </View>

        {/* QR Preview Thumbnail */}
        <View style={styles.qrThumbnailContainer}>
          {card.cloud?.qrImageUrl ? (
            <Image
              source={{ uri: card.cloud.qrImageUrl }}
              style={styles.qrThumbnail}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={24} color={colors.primaryLight} />
            </View>
          )}
        </View>
      </View>

      {/* Middle Row: Meta Badges */}
      <View style={styles.metaRow}>
        {/* Template Theme Badge */}
        <View style={[styles.badge, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
          <Ionicons name="color-palette-outline" size={12} color={colors.primaryLight} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: colors.primaryLight }]}>
            {templateConfig.name}
          </Text>
        </View>

        {/* Display ID / Slug Badge */}
        {card.cloud?.displayId ? (
          <View style={[styles.badge, { backgroundColor: 'rgba(6, 182, 212, 0.12)' }]}>
            <Ionicons name="link-outline" size={12} color={colors.secondary} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: colors.secondary }]}>
              /{card.cloud.displayId}
            </Text>
          </View>
        ) : null}

        {/* Updated Timestamp */}
        <Text style={styles.dateText}>Updated {formattedDate}</Text>
      </View>

      {/* Bottom Row: Quick Actions */}
      <View style={styles.actionsRow}>
        {/* Preview Action */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onPreview(card.id)}
          activeOpacity={0.7}
          testID={`preview-btn-${card.id}`}
        >
          <Ionicons name="eye-outline" size={16} color={colors.textSecondary} style={styles.actionIcon} />
          <Text style={styles.actionText}>Preview</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        {/* Edit Action */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onEdit(card.id)}
          activeOpacity={0.7}
          testID={`edit-btn-${card.id}`}
        >
          <Ionicons name="create-outline" size={16} color={colors.textSecondary} style={styles.actionIcon} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        {/* Share Action */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onShare(card.id)}
          activeOpacity={0.7}
          testID={`share-btn-${card.id}`}
        >
          <Ionicons name="share-social-outline" size={16} color={colors.primaryLight} style={styles.actionIcon} />
          <Text style={[styles.actionText, { color: colors.primaryLight, fontWeight: '600' }]}>
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: theme.spacing.md,
  },
  identityContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primaryLight,
    marginBottom: 2,
  },
  company: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  qrThumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginLeft: theme.spacing.sm,
  },
  qrThumbnail: {
    width: 44,
    height: 44,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
});
