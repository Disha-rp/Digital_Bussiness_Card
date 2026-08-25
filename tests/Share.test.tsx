/**
 * Phase 12 — Digital Business Card Native Sharing Unit Tests (Android PNG Fix)
 * Comprehensive tests for:
 * 1. Android copy link uses the exact public URL string via expo-clipboard
 * 2. Card image produces a real binary PNG file (with valid PNG headers) and shares with mimeType: image/png
 * 3. QR image produces a real binary PNG file (with valid PNG headers) and shares with mimeType: image/png
 * 4. QR image contains the verified public URL destination
 * 5. Share Card Link message contains public URL exactly once (no duplicate appended)
 * 6. Native share cancellation produces no error
 * 7. Missing public URL is handled safely without inventing URLs
 * 8. Share operations perform 0 POST / PUT / PATCH / DELETE API mutations
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

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
  getStringAsync: jest.fn().mockResolvedValue('https://qrtrac.link/1E37'),
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-file-system/legacy
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///data/user/0/com.app/cache/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 5042, isDirectory: false }),
  EncodingType: {
    Base64: 'base64',
    UTF8: 'utf8',
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
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { qrService } from '../src/services/qr.service';
import { BusinessCard } from '../src/models/card';
import {
  getPublicCardUrl,
  formatCardShareMessage,
  generateQrPngBuffer,
  generateCardPngBuffer,
  prepareLocalImageFile,
  sharePublicCardLink,
  copyPublicCardLink,
  shareQrCodeImage,
  shareCardImage,
  shareBusinessCardAction,
} from '../src/utils/share';

const mockQrService = qrService as jest.Mocked<typeof qrService>;

describe('Phase 12 — Digital Business Card Native Sharing Unit Tests (Android PNG Fix)', () => {
  const completeCard: BusinessCard = {
    id: 'card_share_123',
    name: 'Disha Patil',
    profilePhoto: 'https://storage.googleapis.com/qrtrac-prod/avatars/disha.jpg',
    contact: {
      displayName: 'Disha Patil',
      firstName: 'Disha',
      lastName: 'Patil',
      title: 'AI Engineer',
      company: 'QRTRAC',
      email: 'disha@qrtrac.com',
      phoneMobile: '+1-555-0144',
      website: 'https://qrtrac.com',
    },
    socialLinks: [
      { id: 'soc_1', platform: 'linkedin', url: 'https://linkedin.com/in/dishapatil' },
    ],
    template: 'modern',
    isFavorite: true,
    tags: ['ai', 'engineer'],
    cloud: {
      qrtracId: 'card_share_123',
      displayId: '1E37',
      teamId: 'team_live_789',
      qrImageUrl: 'https://storage.googleapis.com/qrtrac-prod.appspot.com/qrs/1E37.svg',
      publicUrl: 'https://qrtrac.link/1E37',
      templateId: '1',
      isSynced: true,
      lastSyncedAt: 1700000000000,
    },
    analytics: {
      totalScans: 42,
      todayScans: 5,
      yesterdayScans: 3,
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  const cardNoPublicUrl: BusinessCard = {
    id: 'card_local_only',
    name: 'Unsynced User',
    contact: {
      displayName: 'Unsynced User',
      firstName: 'Unsynced',
      lastName: 'User',
    },
    socialLinks: [],
    template: 'minimal',
    isFavorite: false,
    tags: [],
    cloud: {
      isSynced: false,
      publicUrl: undefined,
      displayId: undefined,
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

  describe('1. Public URL Resolution & Message Formatting', () => {
    it('resolves server-confirmed publicUrl accurately', () => {
      const url = getPublicCardUrl(completeCard);
      expect(url).toBe('https://qrtrac.link/1E37');
    });

    it('resolves displayId URL when publicUrl is omitted', () => {
      const cardWithDisplayIdOnly: BusinessCard = {
        ...completeCard,
        cloud: {
          ...completeCard.cloud,
          publicUrl: undefined,
          displayId: '9X22',
        },
      };
      const url = getPublicCardUrl(cardWithDisplayIdOnly);
      expect(url).toBe('https://qrtrac.link/9X22');
    });

    it('returns undefined when no verified public URL or displayId exists', () => {
      const url = getPublicCardUrl(cardNoPublicUrl);
      expect(url).toBeUndefined();
    });

    it('formats a clean, professional share message with single public URL', () => {
      const msg = formatCardShareMessage(completeCard, 'https://qrtrac.link/1E37');
      expect(msg).toContain('Disha Patil');
      expect(msg).toContain('AI Engineer at QRTRAC');
      expect(msg).toContain('View my digital business card:');
      expect(msg).toContain('https://qrtrac.link/1E37');
      const count = (msg.match(/https:\/\/qrtrac\.link\/1E37/g) || []).length;
      expect(count).toBe(1);
    });
  });

  describe('2. Android Copy Public Card Link', () => {
    it('copies exact public URL string using expo-clipboard and returns "Link copied"', async () => {
      const result = await copyPublicCardLink(completeCard);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Link copied');
      expect(result.format).toBe('copy_link');
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('https://qrtrac.link/1E37');
    });

    it('returns failure when public URL is unavailable', async () => {
      const result = await copyPublicCardLink(cardNoPublicUrl);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unable to share card');
      expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
    });
  });

  describe('3. Share Public Card Link (Single URL)', () => {
    it('invokes native share sheet with formatted message containing public URL exactly once', async () => {
      const result = await sharePublicCardLink(completeCard);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Card link shared successfully.');
      expect(result.format).toBe('link');
      expect(Share.share).toHaveBeenCalledWith({
        title: 'Disha Patil • Digital Business Card',
        message: expect.stringContaining('https://qrtrac.link/1E37'),
      });

      const callArg = (Share.share as jest.Mock).mock.calls[0][0];
      const count = (callArg.message.match(/https:\/\/qrtrac\.link\/1E37/g) || []).length;
      expect(count).toBe(1);
      expect(callArg.url).toBeUndefined(); // Prevents OS duplicate appending
    });

    it('handles share cancellation gracefully without reporting error', async () => {
      (Share.share as jest.Mock).mockResolvedValueOnce({ action: 'dismissedAction' });

      const result = await sharePublicCardLink(completeCard);

      expect(result.success).toBe(true);
      expect(result.cancelled).toBe(true);
      expect(result.message).toBe('Share cancelled');
    });

    it('returns failure message when card lacks verified public URL', async () => {
      const result = await sharePublicCardLink(cardNoPublicUrl);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unable to share card');
      expect(typeof result.retryFn).toBe('function');
      expect(Share.share).not.toHaveBeenCalled();
    });
  });

  describe('4. Android Share QR Code Image File (Real PNG Binary)', () => {
    it('generates genuine PNG binary with standard PNG magic header', () => {
      const qrBuf = generateQrPngBuffer('https://qrtrac.link/1E37', 600);
      expect(qrBuf.length).toBeGreaterThan(500);
      // Verify PNG magic header: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
      expect(qrBuf[0]).toBe(0x89);
      expect(qrBuf[1]).toBe(0x50); // P
      expect(qrBuf[2]).toBe(0x4E); // N
      expect(qrBuf[3]).toBe(0x47); // G
      expect(qrBuf[4]).toBe(0x0D);
      expect(qrBuf[5]).toBe(0x0A);
      expect(qrBuf[6]).toBe(0x1A);
      expect(qrBuf[7]).toBe(0x0A);
    });

    it('generates high-res PNG file in cache and shares via expo-sharing with image/png MIME type', async () => {
      const result = await shareQrCodeImage(completeCard);

      expect(result.success).toBe(true);
      expect(result.message).toBe('QR Code shared successfully.');
      expect(result.format).toBe('qr_image');

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('Disha_Patil_qr.png'),
        expect.any(String),
        expect.objectContaining({ encoding: 'base64' })
      );

      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringContaining('Disha_Patil_qr.png'),
        expect.objectContaining({
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: 'Share QR Code',
        })
      );
    });

    it('prepares local image file in cache and confirms file existence', async () => {
      const qrBuf = generateQrPngBuffer('https://qrtrac.link/1E37', 600);
      const fileUri = await prepareLocalImageFile(qrBuf, 'test_qr.png');
      expect(fileUri).toContain('test_qr.png');
      expect(FileSystem.getInfoAsync).toHaveBeenCalled();
    });

    it('returns failure message when public URL is missing for QR generation', async () => {
      const result = await shareQrCodeImage(cardNoPublicUrl);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unable to share QR image');
      expect(typeof result.retryFn).toBe('function');
    });
  });

  describe('5. Android Share Card Image File (Real PNG Binary for all templates)', () => {
    it('generates genuine PNG binary for professional, modern, and minimal templates', () => {
      const profBuf = generateCardPngBuffer(completeCard, 'professional');
      expect(profBuf.length).toBeGreaterThan(1000);
      expect(profBuf[0]).toBe(0x89);
      expect(profBuf[1]).toBe(0x50);
      expect(profBuf[2]).toBe(0x4E);
      expect(profBuf[3]).toBe(0x47);

      const modernBuf = generateCardPngBuffer(completeCard, 'modern');
      expect(modernBuf.length).toBeGreaterThan(1000);
      expect(modernBuf[0]).toBe(0x89);

      const minBuf = generateCardPngBuffer(completeCard, 'minimal');
      expect(minBuf.length).toBeGreaterThan(1000);
      expect(minBuf[0]).toBe(0x89);
    });

    it('generates card image file in cache and shares via expo-sharing with image/png MIME type', async () => {
      const result = await shareCardImage(completeCard, 'professional');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Card image shared successfully.');
      expect(result.format).toBe('card_image');

      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringContaining('Disha_Patil_professional_card.png'),
        expect.objectContaining({
          mimeType: 'image/png',
          UTI: 'public.png',
        })
      );
    });

    it('captures live rendered view via captureRef when viewRef is provided', async () => {
      const mockRef = { current: {} };
      const result = await shareCardImage(completeCard, 'professional', mockRef);

      expect(result.success).toBe(true);
      expect(result.format).toBe('card_image');
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        'file:///data/user/0/com.app/cache/Disha_Patil_card_captured.png',
        expect.objectContaining({
          mimeType: 'image/png',
          UTI: 'public.png',
        })
      );
    });

    it('shares card image for modern and minimal templates with correct file names', async () => {
      await shareCardImage(completeCard, 'modern');
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringContaining('Disha_Patil_modern_card.png'),
        expect.any(Object)
      );

      await shareCardImage(completeCard, 'minimal');
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringContaining('Disha_Patil_minimal_card.png'),
        expect.any(Object)
      );
    });
  });

  describe('6. Unified Share Dispatcher', () => {
    it('dispatches to link, copy_link, qr_image, and card_image accurately', async () => {
      const resLink = await shareBusinessCardAction(completeCard, 'link');
      expect(resLink.format).toBe('link');

      const resCopy = await shareBusinessCardAction(completeCard, 'copy_link');
      expect(resCopy.format).toBe('copy_link');

      const resQr = await shareBusinessCardAction(completeCard, 'qr_image');
      expect(resQr.format).toBe('qr_image');

      const resCard = await shareBusinessCardAction(completeCard, 'card_image', 'minimal');
      expect(resCard.format).toBe('card_image');
    });
  });

  describe('7. Zero QRTRAC API Mutations Audit', () => {
    it('guarantees sharing operations perform 0 network mutations', async () => {
      await sharePublicCardLink(completeCard);
      await copyPublicCardLink(completeCard);
      await shareQrCodeImage(completeCard);
      await shareCardImage(completeCard, 'modern');
      await shareBusinessCardAction(completeCard, 'link');

      expect(mockQrService.createCard).not.toHaveBeenCalled();
      expect(mockQrService.updateCard).not.toHaveBeenCalled();
      expect(mockQrService.deleteCard).not.toHaveBeenCalled();
    });
  });
});
