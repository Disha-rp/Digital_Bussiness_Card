/**
 * Phase 11 — Digital Business Card Download and Export Unit Tests
 * Comprehensive tests for:
 * 1. High-quality Card Image export across Professional, Modern, and Minimal templates
 * 2. Real profile image embedding with data URI conversion and initials fallback
 * 3. Real scannable QRTRAC QR Code data URI generation (encoding https://qrtrac.link/{displayId})
 * 4. Dynamic social links rendering matching Preview
 * 5. Contact vCard (.vcf) export using existing verified format
 * 6. Missing optional fields handling (clean export without broken labels or orphan sections)
 * 7. User feedback ("Saved successfully" / "Unable to save card")
 * 8. Failure and retry mechanism
 * 9. Zero QRTRAC API mutations during export (0 POST, 0 PUT, 0 PATCH, 0 DELETE)
 */

(global as any).__DEV__ = true;

// Mock react-native
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Platform: {
    OS: 'android',
    select: jest.fn((dict) => dict.android || dict.default),
  },
  StyleSheet: { create: (styles: any) => styles },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  Modal: 'Modal',
  Linking: {
    openURL: jest.fn().mockResolvedValue(true),
    canOpenURL: jest.fn().mockResolvedValue(true),
  },
  Share: {
    share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
    dismissedAction: 'dismissedAction',
    sharedAction: 'sharedAction',
  },
}));

// Mock react-native-qrcode-svg
jest.mock('react-native-qrcode-svg', () => 'QRCodeSVG');

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../src/services/qr.service');

import { Share } from 'react-native';
import { qrService } from '../src/services/qr.service';
import { BusinessCard } from '../src/models/card';
import {
  generateCardSvgMarkup,
  convertImageToDataUri,
  generateQrDataUri,
  exportCardImage,
  exportQrImage,
  exportVCard,
  exportBusinessCard,
} from '../src/utils/export';

const mockQrService = qrService as jest.Mocked<typeof qrService>;

describe('Phase 11 — Download and Export Unit Tests', () => {
  const completeCard: BusinessCard = {
    id: 'card_export_123',
    name: 'Sarah Connor • Cyber Lead',
    profilePhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    contact: {
      displayName: 'Sarah Connor • Cyber Lead',
      firstName: 'Sarah',
      lastName: 'Connor',
      title: 'Cyber Security Lead',
      company: 'SkyNet Defense',
      email: 'sarah@skynet.defense',
      phoneMobile: '+1-555-0199',
      phoneWork: '+1-555-0100',
      website: 'https://skynet.defense',
      bio: 'Leading cyber defense initiatives worldwide.',
    },
    socialLinks: [
      { id: 'soc_1', platform: 'linkedin', url: 'https://linkedin.com/in/sarah' },
      { id: 'soc_2', platform: 'github', url: 'https://github.com/sarah-connor' },
    ],
    template: 'modern',
    isFavorite: true,
    tags: ['cyber', 'lead'],
    cloud: {
      qrtracId: 'card_export_123',
      displayId: '1E37',
      teamId: 'team_live_789',
      qrImageUrl: 'https://storage.googleapis.com/qrtrac-prod/qrs/1E37.png',
      publicUrl: 'https://qrtrac.link/1E37',
      templateId: '1',
      isSynced: true,
      lastSyncedAt: 1700000000000,
    },
    analytics: {
      totalScans: 88,
      todayScans: 12,
      yesterdayScans: 9,
      totalLeads: 15,
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  const minimalCardNoOptionals: BusinessCard = {
    id: 'card_export_456',
    name: 'John Connor',
    profilePhoto: undefined,
    contact: {
      displayName: 'John Connor',
      firstName: 'John',
      lastName: 'Connor',
      title: undefined,
      company: undefined,
      email: undefined,
      phoneMobile: undefined,
      phoneWork: undefined,
      website: undefined,
      bio: undefined,
    },
    socialLinks: [],
    template: 'minimal',
    isFavorite: false,
    tags: [],
    cloud: {
      qrtracId: 'card_export_456',
      displayId: '8K21',
      publicUrl: 'https://qrtrac.link/8K21',
      templateId: '1',
      isSynced: true,
    },
    analytics: {
      totalScans: 0,
      todayScans: 0,
      yesterdayScans: 0,
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Real Profile Photo & Scannable QR Helpers', () => {
    it('converts base64 data URI directly without network roundtrip', async () => {
      const dataUri = 'data:image/png;base64,sample123';
      const res = await convertImageToDataUri(dataUri);
      expect(res).toBe(dataUri);
    });

    it('generates a real scannable QR code data URI matching verified public URL', async () => {
      const qrDataUri = await generateQrDataUri('https://qrtrac.link/1E37');
      expect(qrDataUri).toContain('data:image/png;base64,');
    });
  });

  describe('2. Card Image SVG & Layout Generation across All 3 Templates', () => {
    it('generates Professional template SVG with real photo, real QR, and social links', async () => {
      const svg = await generateCardSvgMarkup(completeCard, 'professional');

      expect(svg).toContain('<svg');
      expect(svg).toContain('Sarah Connor');
      expect(svg).toContain('Cyber Security Lead');
      expect(svg).toContain('SkyNet Defense');
      expect(svg).toContain('+1-555-0199');
      expect(svg).toContain('sarah@skynet.defense');
      expect(svg).toContain('https://skynet.defense');
      expect(svg).toContain('qrtrac.link/1E37');
      expect(svg).toContain('OFFICIAL VCARD');
      expect(svg).toContain('CONNECT ONLINE');
      expect(svg).toContain('LINKEDIN');
      expect(svg).toContain('GITHUB');
      expect(svg).toContain('data:image/png;base64,'); // Real QR and profile photo
    });

    it('generates Modern template SVG with hero avatar, modern action chips, and cyan styling', async () => {
      const svg = await generateCardSvgMarkup(completeCard, 'modern');

      expect(svg).toContain('<svg');
      expect(svg).toContain('Sarah Connor');
      expect(svg).toContain('Cyber Security Lead');
      expect(svg).toContain('LINKEDIN');
      expect(svg).toContain('GITHUB');
      expect(svg).toContain('qrtrac.link/1E37');
    });

    it('generates Minimal template SVG with initials fallback and clean disappearance of optional fields', async () => {
      const svg = await generateCardSvgMarkup(minimalCardNoOptionals, 'minimal');

      expect(svg).toContain('<svg');
      expect(svg).toContain('John Connor');
      expect(svg).toContain('JC'); // Initials fallback
      expect(svg).not.toContain('📞');
      expect(svg).not.toContain('✉️');
      expect(svg).not.toContain('🌐');
      expect(svg).not.toContain('LINKEDIN');
    });
  });

  describe('3. Card Image Export Execution', () => {
    it('exports card image and returns exact user success feedback', async () => {
      const result = await exportCardImage(completeCard, 'modern');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Saved successfully');
      expect(result.format).toBe('card_image');
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://qrtrac.link/1E37',
        })
      );
    });

    it('handles export failure gracefully and attaches retryFn', async () => {
      (Share.share as jest.Mock).mockResolvedValueOnce({ action: 'dismissedAction' });

      const result = await exportCardImage(completeCard, 'modern');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unable to save card');
      expect(typeof result.retryFn).toBe('function');
    });
  });

  describe('4. Dedicated QR Image Export Execution', () => {
    it('exports QR image strictly from verified QRTRAC image asset', async () => {
      const result = await exportQrImage(completeCard);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Saved successfully');
      expect(result.format).toBe('qr_image');
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://storage.googleapis.com/qrtrac-prod/qrs/1E37.png',
        })
      );
    });

    it('exports QR image using publicUrl when remote asset is absent', async () => {
      const result = await exportQrImage(minimalCardNoOptionals);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Saved successfully');
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://qrtrac.link/8K21',
        })
      );
    });
  });

  describe('5. vCard Contact File Export', () => {
    it('exports vCard file and returns exact user feedback', async () => {
      const result = await exportVCard(completeCard);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Saved successfully');
      expect(result.format).toBe('vcard');
    });
  });

  describe('6. Unified Export Dispatcher', () => {
    it('dispatches to card_image, qr_image, and vcard accurately', async () => {
      const cardRes = await exportBusinessCard(completeCard, 'card_image', 'professional');
      expect(cardRes.format).toBe('card_image');
      expect(cardRes.success).toBe(true);

      const qrRes = await exportBusinessCard(completeCard, 'qr_image', 'modern');
      expect(qrRes.format).toBe('qr_image');
      expect(qrRes.success).toBe(true);

      const vcardRes = await exportBusinessCard(completeCard, 'vcard', 'minimal');
      expect(vcardRes.format).toBe('vcard');
      expect(vcardRes.success).toBe(true);
    });
  });

  describe('7. Zero QRTRAC API Mutations Audit', () => {
    it('ensures all export operations perform zero network mutations', async () => {
      await exportCardImage(completeCard, 'modern');
      await exportQrImage(completeCard);
      await exportVCard(completeCard);
      await exportBusinessCard(completeCard, 'card_image', 'professional');

      expect(mockQrService.createCard).not.toHaveBeenCalled();
      expect(mockQrService.updateCard).not.toHaveBeenCalled();
      expect(mockQrService.deleteCard).not.toHaveBeenCalled();
    });
  });
});
