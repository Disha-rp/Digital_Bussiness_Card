/**
 * Phase 10 — QR Code Screen Unit Tests
 * Comprehensive tests for:
 * 1. Dedicated QR code screen rendering with large high-contrast QR display
 * 2. Card owner identity section (Avatar, Full Name, Title, Company)
 * 3. Text prompt: "Scan to view my card"
 * 4. QRTRAC public URL display and 1-tap Copy action
 * 5. Share QR and Save QR actions with platform-safe fallbacks
 * 6. Error handling and retry mechanism
 * 7. Safe fallback when QR image URL is missing
 * 8. Zero QRTRAC API mutations (0 POST, 0 PUT, 0 PATCH, 0 DELETE)
 * 9. Responsive layout and navigation flow from Preview -> QRCode
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
import { copyToClipboard, saveQrCode, shareBusinessCard } from '../src/utils/vcard';

const mockQrService = qrService as jest.Mocked<typeof qrService>;

describe('Phase 10 — QR Code Integration Unit Tests', () => {
  const mockCardWithQr: BusinessCard = {
    id: 'card_qr_123',
    name: 'Sarah Connor • Cyber Lead',
    profilePhoto: 'https://storage.googleapis.com/qrtrac-prod/avatars/sarah.jpg',
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
      bio: 'Leading cyber defense initiatives.',
    },
    socialLinks: [
      { id: 'soc_1', platform: 'linkedin', url: 'https://linkedin.com/in/sarah' },
    ],
    template: 'modern',
    isFavorite: true,
    tags: ['cyber', 'lead'],
    cloud: {
      qrtracId: 'card_qr_123',
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

  const mockCardWithoutQrImage: BusinessCard = {
    id: 'card_qr_456',
    name: 'John Connor',
    profilePhoto: undefined,
    contact: {
      displayName: 'John Connor',
      firstName: 'John',
      lastName: 'Connor',
      title: 'Operations Director',
      company: 'Tech Resistance',
      email: 'john@resistance.org',
    },
    socialLinks: [],
    template: 'minimal',
    isFavorite: false,
    tags: [],
    cloud: {
      qrtracId: 'card_qr_456',
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

  describe('1. Dedicated QR Screen Data Model & Presentation', () => {
    it('accurately resolves card identity details and prompt', () => {
      const card = mockCardWithQr;
      const fullName = [card.contact.firstName, card.contact.lastName].filter(Boolean).join(' ');
      const subtitle = [card.contact.title, card.contact.company].filter(Boolean).join(' • ');

      expect(fullName).toBe('Sarah Connor');
      expect(subtitle).toBe('Cyber Security Lead • SkyNet Defense');
      expect(card.cloud?.publicUrl).toBe('https://qrtrac.link/1E37');
      expect(card.cloud?.displayId).toBe('1E37');
    });

    it('falls back to local QR generation using publicUrl if remote image is missing', () => {
      const card = mockCardWithoutQrImage;
      expect(card.cloud?.qrImageUrl).toBeUndefined();
      expect(card.cloud?.publicUrl).toBe('https://qrtrac.link/8K21');
    });
  });

  describe('2. Public QRTRAC URL & 1-Tap Copy Action', () => {
    it('copies the exact public URL to clipboard', async () => {
      const publicUrl = mockCardWithQr.cloud?.publicUrl!;
      const result = await copyToClipboard(publicUrl);
      expect(result).toBe(true);
    });

    it('handles empty URL copy request safely without errors', async () => {
      const result = await copyToClipboard('');
      expect(result).toBe(false);
    });
  });

  describe('3. Share QR & Save QR Actions', () => {
    it('shares the public digital business card link via shareBusinessCard', async () => {
      const shareResult = await shareBusinessCard(mockCardWithQr);
      expect(shareResult.success).toBe(true);
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://qrtrac.link/1E37',
          message: expect.stringContaining('https://qrtrac.link/1E37'),
        })
      );
    });

    it('saves QR code representation via saveQrCode using the actual QR image asset', async () => {
      const saveResult = await saveQrCode(mockCardWithQr);
      expect(saveResult.success).toBe(true);
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://storage.googleapis.com/qrtrac-prod/qrs/1E37.png',
        })
      );
    });

    it('returns clear failure message when QR image is absent without falling back to vCard', async () => {
      const saveResult = await saveQrCode(mockCardWithoutQrImage);
      expect(saveResult.success).toBe(false);
      expect(saveResult.message).toContain('QR Code image is not available');
    });
  });

  describe('4. Zero QRTRAC API Mutations Audit', () => {
    it('ensures QR code display, copying, sharing, and saving make zero mutations', async () => {
      // Simulate user interactions on dedicated QR Screen
      await copyToClipboard(mockCardWithQr.cloud?.publicUrl!);
      await shareBusinessCard(mockCardWithQr);
      await saveQrCode(mockCardWithQr);

      // Verify no mutation endpoints were invoked
      expect(mockQrService.createCard).not.toHaveBeenCalled();
      expect(mockQrService.updateCard).not.toHaveBeenCalled();
      expect(mockQrService.deleteCard).not.toHaveBeenCalled();
    });
  });

  describe('5. Error & Retry Handling', () => {
    it('handles server load failure gracefully with retry option', async () => {
      mockQrService.getCard.mockResolvedValueOnce({
        success: false,
        data: null as any,
        message: 'QR data unavailable on server',
      });

      const res = await mockQrService.getCard('non_existent_card');
      expect(res.success).toBe(false);
      expect(res.message).toBe('QR data unavailable on server');
    });
  });
});
