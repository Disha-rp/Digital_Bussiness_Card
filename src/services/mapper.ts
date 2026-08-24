/**
 * BusinessCard and QRTRAC API Bidirectional Data Mapper
 * Isolates QRTRAC API response envelopes and request schemas from the UI.
 * Ensures bidirectional compatibility between local presentation models and
 * QRTRAC's public landing page renderer (templateId 1-4, contactInformation, professionalDetails).
 */

import { BusinessCard, CardEditorDraft } from '../models/card';
import { CardTemplateId } from '../models/template';
import { SocialLink } from '../models/social';
import {
  QrTracQr,
  CreateQrRequest,
  UpdateQrRequest,
  QrTracScanOverviewItem,
  QrTracContactInformationItem,
} from '../types/qrtrac';

/**
 * Maps local UI template identifiers to verified QRTRAC public web renderer template IDs (1-4).
 * 1: Standard Modern / Clean layout (buildTemplate1)
 * 2: Border Accent layout (buildTemplate2)
 * 3: Banner Header layout (buildTemplate3)
 * 4: Executive Summary layout (buildTemplate4)
 */
export const mapToQrTracTemplateId = (template?: string): number => {
  switch (template) {
    case 'modern_minimal':
      return 1;
    case 'vibrant_glass':
      return 2;
    case 'creative_designer':
      return 3;
    case 'corporate_executive':
      return 4;
    case 'minimal_mono':
      return 1;
    default:
      return 1;
  }
};

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
      profilePhoto:
        meta.profileImage ||
        meta.profileImageUrl ||
        (qr as any).profilePhotoUrl ||
        (qr as any).imgUrls?.[0]?.url ||
        meta.image ||
        undefined,
      contact: {
        firstName: qr.firstName || undefined,
        lastName: qr.lastName || undefined,
        displayName,
        title: qr.designation || qr.professionalDetails?.designation || undefined,
        company: qr.company || qr.professionalDetails?.company || undefined,
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
        templateId: qr.templateId !== undefined ? String(qr.templateId) : undefined,
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
   * Maps a BusinessCard or CardEditorDraft into a verified QRTRAC CreateQrRequest payload.
   * Embeds templateId (1-4), structured professionalDetails, contactInformation, and themeSettings
   * required by QRTRAC's public web renderer, while maintaining full backward-compatibility with flat root fields.
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

    // Determine verified QRTRAC numeric templateId (1-4)
    const numericTemplateId =
      typeof qrtracTemplateId === 'number'
        ? qrtracTemplateId
        : typeof qrtracTemplateId === 'string' && !isNaN(Number(qrtracTemplateId))
        ? Number(qrtracTemplateId)
        : mapToQrTracTemplateId(template);

    // Build structured contactInformation array for QRTRAC public web renderer
    const contactInformation: QrTracContactInformationItem[] = [];
    if (mobile?.trim()) {
      contactInformation.push({
        type: 'Phone',
        phoneNumber: {
          countryCode: '',
          phoneNumber: mobile.trim(),
          phoneType: 'Mobile',
        },
      });
    }
    if (landline?.trim()) {
      contactInformation.push({
        type: 'Phone',
        phoneNumber: {
          countryCode: '',
          phoneNumber: landline.trim(),
          phoneType: 'Work',
        },
      });
    }
    if (email?.trim()) {
      contactInformation.push({
        type: 'Email',
        email: {
          email: email.trim(),
          emailType: 'Work',
        },
      });
    }
    if (website?.trim()) {
      contactInformation.push({
        type: 'Website',
        website: {
          website: website.trim(),
          title: 'Website',
        },
      });
    }
    if (addressParts.length > 0) {
      contactInformation.push({
        type: 'Address',
        address: {
          street: street?.trim(),
          city: city?.trim(),
          state: state?.trim(),
          postalCode: postalCode?.trim(),
          country: country?.trim(),
        },
      });
    }

    // Determine theme accent color
    const themeColorMap: Record<string, string> = {
      modern_minimal: '#3B82F6',
      vibrant_glass: '#8B5CF6',
      creative_designer: '#EC4899',
      corporate_executive: '#1E293B',
      minimal_mono: '#18181B',
    };
    const backgroundColor = themeColorMap[template] || '#3B82F6';

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
      templateId: String(numericTemplateId),
      professionalDetails: {
        company: company?.trim() || undefined,
        designation: designation?.trim() || undefined,
      },
      contactInformation,
      themeSettings: {
        backgroundColor,
        hideSaveButton: false,
      },
      tags: tags || [],
      metadata: {
        cardTheme: template,
        profileImage: profilePhoto || null,
        socialLinks: socialLinks || [],
      },
    };
  },

  /**
   * Maps a partial draft or BusinessCard into a complete verified QRTRAC UpdateQrRequest payload
   * for the follow-up PUT publication step, setting numeric templateId (1-4), frameId: 0, and baseUrl
   * to trigger QRTRAC's edge cache publication worker (refreshedAt).
   */
  toUpdateQrRequest(draft: Partial<CardEditorDraft> | BusinessCard): UpdateQrRequest {
    const baseRequest = CardMapper.toCreateQrRequest(draft as any);
    const template = 'template' in draft ? draft.template : draft.template;
    const numericTemplateId = mapToQrTracTemplateId(template);

    return {
      ...baseRequest,
      templateId: numericTemplateId, // Number 1-4 for public edge renderer
      frameId: 0,
      baseUrl: 'https://qrtrac.link/',
    };
  },
};
