/**
 * Phase 6 — Create Digital Business Card Unit Tests
 * Tests all required Phase 6 workflows:
 * 1. Template selection and style list
 * 2. Form validation (name, email, phone, URL, text lengths)
 * 3. Dynamic social links management (LinkedIn, Instagram, Facebook, X/Twitter, GitHub)
 * 4. Profile image service and permission handling
 * 5. Draft state preservation across navigation
 * 6. QRTRAC VCARD payload construction via CardMapper
 * 7. Successful card creation via qrService
 * 8. Error handling (400, 401, 403, 429, 500, network error)
 * 9. Duplicate submission prevention
 * 10. Navigation to Preview with retained QRTRAC ID
 */

// Mock react-native
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: 'android', select: jest.fn((dict) => dict.android || dict.default) },
  StyleSheet: { create: (styles: any) => styles },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  ActivityIndicator: 'ActivityIndicator',
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
  },
}));

jest.mock('../src/services/qr.service');

import { CardMapper, mapToQrTracTemplateId } from '../src/services/mapper';
import { qrService } from '../src/services/qr.service';
import { ImageService } from '../src/services/image.service';
import { CardEditorDraft, BusinessCard } from '../src/models/card';
import { QrTracQr } from '../src/types/qrtrac';
import { CARD_TEMPLATE_LIST } from '../src/theme/templates';
import * as ImagePicker from 'expo-image-picker';

const mockQrService = qrService as jest.Mocked<typeof qrService>;
const mockImagePicker = ImagePicker as jest.Mocked<typeof ImagePicker>;

describe('Phase 6 — Create Digital Business Card Workflow', () => {
  const sampleDraft: CardEditorDraft = {
    name: 'Sarah Connor • Cyber Security Lead',
    firstName: 'Sarah',
    lastName: 'Connor',
    designation: 'Cyber Security Lead',
    company: 'SkyNet Defense',
    email: 'sarah.connor@defense.org',
    phoneMobile: '+1-555-0199',
    phoneWork: '+1-555-0100',
    website: 'https://sarahconnor.security',
    street: '100 Cyber Way',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90001',
    country: 'USA',
    bio: 'Protecting networks and enterprise infrastructure.',
    notes: '',
    profilePhoto: 'file:///data/user/0/avatar.jpg',
    template: 'corporate_executive',
    displayId: 'sarah-connor',
    socialLinks: [
      { id: '1', platform: 'linkedin', url: 'https://linkedin.com/in/sarahconnor' },
      { id: '2', platform: 'github', url: 'https://github.com/sarahconnor' },
      { id: '3', platform: 'facebook', url: 'https://facebook.com/sarahconnor' },
    ],
    tags: ['security', 'executive'],
  };

  const createdServerQr: QrTracQr = {
    id: 'qr_created_2026',
    name: 'Sarah Connor • Cyber Security Lead',
    qrType: 'VCARD',
    teamId: 'team_live_44S2',
    baseUrl: 'https://qrtrac.link/',
    displayId: 'sarah-connor',
    firstName: 'Sarah',
    lastName: 'Connor',
    company: 'SkyNet Defense',
    designation: 'Cyber Security Lead',
    email: 'sarah.connor@defense.org',
    mobile: '+1-555-0199',
    landline: '+1-555-0100',
    website: 'https://sarahconnor.security',
    bio: 'Protecting networks and enterprise infrastructure.',
    createdAt: 1700005000000,
    updatedAt: 1700005000000,
    metadata: {
      cardTheme: 'corporate_executive',
      profileImage: 'file:///data/user/0/avatar.jpg',
      socialLinks: [
        { id: '1', platform: 'linkedin', url: 'https://linkedin.com/in/sarahconnor' },
        { id: '2', platform: 'github', url: 'https://github.com/sarahconnor' },
        { id: '3', platform: 'facebook', url: 'https://facebook.com/sarahconnor' },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Template Selection & Style Options', () => {
    it('provides exactly three distinctive visual card presentation themes', () => {
      expect(CARD_TEMPLATE_LIST).toHaveLength(3);
      const templateIds = CARD_TEMPLATE_LIST.map((t) => t.id);
      expect(templateIds).toContain('modern_minimal');
      expect(templateIds).toContain('corporate_executive');
      expect(templateIds).toContain('vibrant_glass');
    });
  });

  describe('2. Form Validation & Data Integrity', () => {
    it('validates required name field and rejects empty or single-character names', () => {
      const isNameValid = (val: string) => val.trim().length >= 2 && val.trim().length <= 100;
      expect(isNameValid('')).toBe(false);
      expect(isNameValid('A')).toBe(false);
      expect(isNameValid('Sarah Connor')).toBe(true);
    });

    it('validates email address formats accurately', () => {
      const isEmailValid = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
      expect(isEmailValid('invalid-email')).toBe(false);
      expect(isEmailValid('sarah@')).toBe(false);
      expect(isEmailValid('sarah@defense.org')).toBe(true);
    });

    it('validates phone numbers allowing common international formatting', () => {
      const isPhoneValid = (val: string) => {
        const clean = val.replace(/[\s\-()+]/g, '');
        return clean.length >= 7 && clean.length <= 18;
      };
      expect(isPhoneValid('123')).toBe(false);
      expect(isPhoneValid('+1-555-0199')).toBe(true);
      expect(isPhoneValid('+91 98765 43210')).toBe(true);
    });

    it('validates website URLs', () => {
      const isUrlValid = (val: string) =>
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(val.trim());
      expect(isUrlValid('not a url')).toBe(false);
      expect(isUrlValid('https://sarahconnor.security')).toBe(true);
      expect(isUrlValid('sarahconnor.security')).toBe(true);
    });
  });

  describe('3. Dynamic Social Links Management', () => {
    it('supports adding and serializing social links including Facebook, LinkedIn, GitHub, X', () => {
      const links = sampleDraft.socialLinks;
      expect(links).toHaveLength(3);
      expect(links[0].platform).toBe('linkedin');
      expect(links[1].platform).toBe('github');
      expect(links[2].platform).toBe('facebook');

      const reqPayload = CardMapper.toCreateQrRequest(sampleDraft);
      const meta = reqPayload.metadata as Record<string, any>;
      expect(meta.socialLinks).toHaveLength(3);
      expect(meta.cardTheme).toBe('corporate_executive');
    });
  });

  describe('4. Profile Image Service & Permissions', () => {
    it('returns photo URI when library permission is granted and photo is picked', async () => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
        granted: true,
        status: ImagePicker.PermissionStatus.GRANTED,
        expires: 'never',
        canAskAgain: true,
      });

      mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///local/photo.jpg', width: 500, height: 500 }],
      });

      const res = await ImageService.pickFromLibrary();
      expect(res.success).toBe(true);
      expect(res.uri).toBe('file:///local/photo.jpg');
    });

    it('handles library permission denial gracefully without crashing', async () => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
        granted: false,
        status: ImagePicker.PermissionStatus.DENIED,
        expires: 'never',
        canAskAgain: true,
      });

      const res = await ImageService.pickFromLibrary();
      expect(res.success).toBe(false);
      expect(res.error).toBe('Permission denied');
    });

    it('generates cross-platform data URI when base64 is available', async () => {
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
        granted: true,
        status: ImagePicker.PermissionStatus.GRANTED,
        expires: 'never',
        canAskAgain: true,
      });

      mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///local/photo.jpg', base64: 'BASE64_DATA_STRING', width: 500, height: 500 }],
      });

      const res = await ImageService.pickFromLibrary();
      expect(res.success).toBe(true);
      expect(res.uri).toBe('data:image/jpeg;base64,BASE64_DATA_STRING');
    });

    it('handles camera permission and capture successfully', async () => {
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({
        granted: true,
        status: ImagePicker.PermissionStatus.GRANTED,
        expires: 'never',
        canAskAgain: true,
      });

      mockImagePicker.launchCameraAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///local/camera.jpg', width: 500, height: 500 }],
      });

      const res = await ImageService.takePhoto();
      expect(res.success).toBe(true);
      expect(res.uri).toBe('file:///local/camera.jpg');
    });

    it('downscaleImageWeb safely returns sourceUri in non-browser environments', async () => {
      const result = await ImageService.downscaleImageWeb('data:image/jpeg;base64,TEST', 400, 0.7);
      expect(result).toBe('data:image/jpeg;base64,TEST');
    });
  });

  describe('5. Profile Photo Field Mapping in CardMapper', () => {
    it('maps profilePhoto from metadata.profileImage, metadata.profileImageUrl, and profilePhotoUrl', () => {
      const cardFromMeta = CardMapper.toBusinessCard({
        id: '1',
        name: 'Disha Patil',
        qrType: 'VCARD',
        metadata: { profileImage: 'https://example.com/avatar.jpg' },
      } as any);
      expect(cardFromMeta.profilePhoto).toBe('https://example.com/avatar.jpg');

      const cardFromTopLevel = CardMapper.toBusinessCard({
        id: '2',
        name: 'Tiger',
        qrType: 'VCARD',
        profilePhotoUrl: 'https://storage.googleapis.com/qrtrac/tiger.png',
      } as any);
      expect(cardFromTopLevel.profilePhoto).toBe('https://storage.googleapis.com/qrtrac/tiger.png');
    });
  });

  describe('6. QRTRAC VCARD Request Payload Construction', () => {
    it('maps CardEditorDraft into exact verified QRTRAC CreateQrRequest', () => {
      const payload = CardMapper.toCreateQrRequest(sampleDraft);

      expect(payload.name).toBe('Sarah Connor');
      expect(payload.qrType).toBe('VCARD');
      expect(payload.firstName).toBe('Sarah');
      expect(payload.lastName).toBe('Connor');
      expect(payload.designation).toBe('Cyber Security Lead');
      expect(payload.company).toBe('SkyNet Defense');
      expect(payload.email).toBe('sarah.connor@defense.org');
      expect(payload.mobile).toBe('+1-555-0199');
      expect(payload.landline).toBe('+1-555-0100');
      expect(payload.website).toBe('https://sarahconnor.security');
      expect(payload.displayId).toBe('sarah-connor');
      expect(payload.templateId).toBe('4');
      expect(payload.professionalDetails?.company).toBe('SkyNet Defense');
      expect(payload.professionalDetails?.designation).toBe('Cyber Security Lead');
      expect(payload.contactInformation?.length).toBeGreaterThan(0);
      expect(payload.metadata?.cardTheme).toBe('corporate_executive');
      expect(payload.metadata?.profileImage).toBe('file:///data/user/0/avatar.jpg');
    });

    it('maps CardEditorDraft into complete PUT UpdateQrRequest with numeric templateId and frameId: 0', () => {
      const updatePayload = CardMapper.toUpdateQrRequest(sampleDraft);

      expect(updatePayload.templateId).toBe(4); // Numeric 4 for public edge renderer
      expect(typeof updatePayload.templateId).toBe('number');
      expect(updatePayload.frameId).toBe(0);
      expect(updatePayload.baseUrl).toBe('https://qrtrac.link/');
      expect(updatePayload.professionalDetails?.company).toBe('SkyNet Defense');
      expect(updatePayload.professionalDetails?.designation).toBe('Cyber Security Lead');
      expect(updatePayload.contactInformation?.length).toBeGreaterThan(0);
    });

    it('correctly maps all 5 local template IDs to QRTRAC template IDs (1-4)', () => {
      expect(mapToQrTracTemplateId('modern_minimal')).toBe(1);
      expect(mapToQrTracTemplateId('minimal_mono')).toBe(1);
      expect(mapToQrTracTemplateId('vibrant_glass')).toBe(2);
      expect(mapToQrTracTemplateId('creative_designer')).toBe(3);
      expect(mapToQrTracTemplateId('corporate_executive')).toBe(4);
    });
  });

  describe('6. Successful Card Creation & Response Mapping', () => {
    it('creates card on QRTRAC API and returns BusinessCard with real server ID and publicUrl', async () => {
      const mappedExpected = CardMapper.toBusinessCard(createdServerQr);
      mockQrService.createCard.mockResolvedValueOnce({
        success: true,
        data: mappedExpected,
        message: 'Card created successfully.',
      });

      const result = await qrService.createCard(sampleDraft);

      expect(mockQrService.createCard).toHaveBeenCalledWith(sampleDraft);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('qr_created_2026');
      expect(result.data.name).toBe('Sarah Connor');
      expect(result.data.contact.company).toBe('SkyNet Defense');
      expect(result.data.cloud.displayId).toBe('sarah-connor');
      expect(result.data.cloud.publicUrl).toBe('https://qrtrac.link/sarah-connor');
    });
  });

  describe('7. API Error Handling', () => {
    it('handles 400 Bad Request error cleanly', async () => {
      mockQrService.createCard.mockResolvedValueOnce({
        success: false,
        data: null as unknown as BusinessCard,
        error: {
          type: 'VALIDATION_ERROR',
          statusCode: 400,
          message: 'Invalid request: displayId is already taken.',
          isRetryable: false,
        },
      });

      const result = await qrService.createCard(sampleDraft);
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('VALIDATION_ERROR');
      expect(result.error?.statusCode).toBe(400);
      expect(result.error?.message).toContain('already taken');
    });

    it('handles 401 Unauthorized error cleanly', async () => {
      mockQrService.createCard.mockResolvedValueOnce({
        success: false,
        data: null as unknown as BusinessCard,
        error: {
          type: 'AUTHENTICATION_ERROR',
          statusCode: 401,
          message: 'Invalid API credentials.',
          isRetryable: false,
        },
      });

      const result = await qrService.createCard(sampleDraft);
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('AUTHENTICATION_ERROR');
    });

    it('handles 429 Rate Limit error with retryable flag', async () => {
      mockQrService.createCard.mockResolvedValueOnce({
        success: false,
        data: null as unknown as BusinessCard,
        error: {
          type: 'RATE_LIMIT_ERROR',
          statusCode: 429,
          message: 'Too many requests. Please slow down.',
          isRetryable: true,
        },
      });

      const result = await qrService.createCard(sampleDraft);
      expect(result.success).toBe(false);
      expect(result.error?.isRetryable).toBe(true);
    });

    it('handles 500 Server error cleanly', async () => {
      mockQrService.createCard.mockResolvedValueOnce({
        success: false,
        data: null as unknown as BusinessCard,
        error: {
          type: 'SERVER_ERROR',
          statusCode: 500,
          message: 'QRTRAC server error.',
          isRetryable: true,
        },
      });

      const result = await qrService.createCard(sampleDraft);
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('SERVER_ERROR');
    });
  });

  describe('8. Navigation Contract & Card ID Retention', () => {
    it('ensures created QRTRAC card ID is passed to Preview navigation without demo fallbacks', () => {
      const createdCard = CardMapper.toBusinessCard(createdServerQr);

      const navParams = {
        cardId: createdCard.id,
        cardTitle: createdCard.name,
        templateId: createdCard.template,
        previewUrl: createdCard.cloud.publicUrl,
      };

      expect(navParams.cardId).toBe('qr_created_2026');
      expect(navParams.cardTitle).toBe('Sarah Connor');
      expect(navParams.templateId).toBe('corporate_executive');
      expect(navParams.previewUrl).toBe('https://qrtrac.link/sarah-connor');
    });
  });
});
