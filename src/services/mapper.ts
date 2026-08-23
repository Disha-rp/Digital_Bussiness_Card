/**
 * BusinessCard and QRTRAC API Bidirectional Data Mapper
 * Isolates QRTRAC API response envelopes and request schemas from the UI.
 */

import { BusinessCard, CardEditorDraft } from '../models/card';
import { CardTemplateId } from '../models/template';
import { SocialLink } from '../models/social';
import {
  QrTracQr,
  CreateQrRequest,
  UpdateQrRequest,
  QrTracScanOverviewItem,
} from '../types/qrtrac';

export const CardMapper = {
  /**
   * Maps a QRTRAC API Qr entity to an internal BusinessCard domain model
   */
  toBusinessCard(
    qr: QrTracQr,
    analyticsOverview?: QrTracScanOverviewItem
  ): BusinessCard {
    const meta = (qr.metadata || {}) as Record<string, any>;

    // Derive display name from first/last name, card title, or fallback
    const fullName = [qr.firstName, qr.lastName].filter(Boolean).join(' ').trim();
    const displayName = fullName || qr.name || 'Untitled Card';

    // Map social links from metadata safely
    const socialLinks: SocialLink[] = [];
    if (meta.socialLinks && typeof meta.socialLinks === 'object') {
      if (Array.isArray(meta.socialLinks)) {
        socialLinks.push(...meta.socialLinks);
      } else {
        Object.entries(meta.socialLinks).forEach(([platform, url]) => {
          if (typeof url === 'string' && url.trim()) {
            socialLinks.push({
              id: `social_${platform}_${Date.now()}`,
              platform: platform as any,
              url: url.trim(),
            });
          }
        });
      }
    }

    // Map theme with fallback
    const validTemplates: CardTemplateId[] = [
      'modern_minimal',
      'corporate_executive',
      'vibrant_glass',
    ];
    const template: CardTemplateId = validTemplates.includes(meta.cardTheme)
      ? meta.cardTheme
      : 'modern_minimal';

    return {
      id: qr.id,
      name: displayName,
      profilePhoto: meta.profileImage || meta.profileImageUrl || undefined,
      contact: {
        firstName: qr.firstName || undefined,
        lastName: qr.lastName || undefined,
        displayName,
        title: qr.designation || undefined,
        company: qr.company || undefined,
        email: qr.email || undefined,
        phoneMobile: qr.mobile || undefined,
        phoneWork: qr.landline || undefined,
        phoneFax: qr.fax || undefined,
        website: qr.website || undefined,
        address: {
          formattedAddress: qr.address || undefined,
          street: qr.street || undefined,
          city: qr.city || undefined,
          state: qr.state || undefined,
          postalCode: qr.postalCode || undefined,
          country: qr.country || undefined,
        },
        bio: qr.bio || undefined,
      },
      socialLinks,
      template,
      isFavorite: Boolean(meta.isFavorite),
      tags: qr.tags || [],
      cloud: {
        qrtracId: qr.id,
        displayId: qr.displayId,
        teamId: qr.teamId,
        qrImageUrl: qr.qrImageUrl,
        qrImageHash: qr.qrImageHash,
        publicUrl:
          qr.qrRedirectUrl ||
          (qr.displayId ? `${(qr.baseUrl || 'https://qrtrac.link').replace(/\/+$/, '')}/${qr.displayId}` : undefined),
        templateId: (qr as any).templateId || undefined,
        batchId: qr.batchId,
        isSynced: true,
        lastSyncedAt: Date.now(),
      },
      analytics: {
        totalScans: analyticsOverview?.totalScans || 0,
        todayScans: analyticsOverview?.todayScans || 0,
        yesterdayScans: analyticsOverview?.yesterdayScans || 0,
        totalLeads: analyticsOverview?.totalLeadsCount || 0,
        lastScannedAt: analyticsOverview?.updatedAt,
      },
      createdAt: qr.createdAt || Date.now(),
      updatedAt: qr.updatedAt || Date.now(),
    };
  },

  /**
   * Maps a BusinessCard or CardEditorDraft into a verified QRTRAC CreateQrRequest payload
   */
  toCreateQrRequest(draft: CardEditorDraft | BusinessCard): CreateQrRequest {
    const isDraft = 'firstName' in draft;

    const firstName = isDraft ? draft.firstName : draft.contact.firstName;
    const lastName = isDraft ? draft.lastName : draft.contact.lastName;
    const company = isDraft ? draft.company : draft.contact.company;
    const designation = isDraft ? draft.designation : draft.contact.title;
    const email = isDraft ? draft.email : draft.contact.email;
    const mobile = isDraft ? draft.phoneMobile : draft.contact.phoneMobile;
    const landline = isDraft ? draft.phoneWork : draft.contact.phoneWork;
    const website = isDraft ? draft.website : draft.contact.website;
    const street = isDraft ? draft.street : draft.contact.address?.street;
    const city = isDraft ? draft.city : draft.contact.address?.city;
    const state = isDraft ? draft.state : draft.contact.address?.state;
    const postalCode = isDraft ? draft.postalCode : draft.contact.address?.postalCode;
    const country = isDraft ? draft.country : draft.contact.address?.country;
    const bio = isDraft ? draft.bio : draft.contact.bio;
    const displayId = isDraft ? draft.displayId : draft.cloud?.displayId;
    const profilePhoto = isDraft ? draft.profilePhoto : draft.profilePhoto;
    const template = isDraft ? draft.template : draft.template;
    const qrtracTemplateId = isDraft ? draft.qrtracTemplateId : draft.cloud?.templateId;
    const tags = isDraft ? draft.tags : draft.tags;
    const socialLinks = isDraft ? draft.socialLinks : draft.socialLinks;

    const formattedName =
      [firstName, lastName].filter(Boolean).join(' ').trim() ||
      draft.name ||
      'Business Card';

    // Format address string
    const addressParts = [street, city, state, postalCode, country].filter(Boolean);
    const address = addressParts.join(', ');

    return {
      name: formattedName,
      qrType: 'VCARD',
      firstName: firstName?.trim() || undefined,
      lastName: lastName?.trim() || undefined,
      company: company?.trim() || undefined,
      designation: designation?.trim() || undefined,
      email: email?.trim() || undefined,
      mobile: mobile?.trim() || undefined,
      landline: landline?.trim() || undefined,
      website: website?.trim() || undefined,
      address: address || undefined,
      street: street?.trim() || undefined,
      city: city?.trim() || undefined,
      state: state?.trim() || undefined,
      postalCode: postalCode?.trim() || undefined,
      country: country?.trim() || undefined,
      bio: bio?.trim() || undefined,
      displayId: displayId?.trim() || undefined,
      templateId: qrtracTemplateId || undefined,
      tags: tags || [],
      metadata: {
        cardTheme: template,
        profileImage: profilePhoto || null,
        socialLinks: socialLinks || [],
      },
    };
  },

  /**
   * Maps a partial draft or BusinessCard into a verified QRTRAC UpdateQrRequest payload
   */
  toUpdateQrRequest(draft: Partial<CardEditorDraft> | BusinessCard): UpdateQrRequest {
    return CardMapper.toCreateQrRequest(draft as any);
  },
};
