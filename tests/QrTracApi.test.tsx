/**
 * QRTRAC API Integration & Service Unit Tests
 * Uses mocked HTTP responses to verify request formatting, response normalization,
 * error handling, pagination, and data mapping.
 */

import { ApiClient } from '../src/api/client';
import { QrService } from '../src/services/qr.service';
import { CardMapper } from '../src/services/mapper';
import { QrTracQr } from '../src/types/qrtrac';
import { CardEditorDraft } from '../src/models/card';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('QRTRAC API Client & Service Layer', () => {
  let client: ApiClient;
  let service: QrService;

  const mockCredentials = {
    teamId: 'team_test_123',
    clientId: 'cli_test_456',
    clientSecret: 'sec_test_789',
    baseUrl: 'https://api.qrtrac.com/api',
  };

  const sampleQrResponse: QrTracQr = {
    id: 'qr_abc123',
    name: 'Alex Morgan • Tech Lead',
    qrType: 'VCARD',
    teamId: 'team_test_123',
    firstName: 'Alex',
    lastName: 'Morgan',
    company: 'TechCorp Solutions',
    designation: 'Principal Architect',
    email: 'alex@techcorp.io',
    mobile: '+1-555-0199',
    landline: '+1-555-0100',
    website: 'https://alexmorgan.io',
    address: '100 Innovation Way, San Francisco, CA',
    street: '100 Innovation Way',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'USA',
    bio: 'Lead architect building enterprise solutions',
    displayId: 'alex-morgan',
    qrRedirectUrl: 'https://qr.qrtrac.com/alex-morgan',
    qrImageUrl: 'https://storage.qrtrac.com/qrs/qr_abc123.png',
    qrImageHash: 'hash_998877',
    metadata: {
      cardTheme: 'corporate_executive',
      profileImage: 'https://example.com/alex.jpg',
      socialLinks: [
        { id: '1', platform: 'linkedin', url: 'https://linkedin.com/in/alexmorgan' },
      ],
    },
    tags: ['lead', 'executive'],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    client = new ApiClient({ baseUrl: 'https://api.qrtrac.com/api', maxRetries: 0 });
    client.setCredentials(mockCredentials);
    service = new QrService(client);
  });

  describe('1. Successful List Operation & Pagination', () => {
    it('fetches paginated QR list and maps them to BusinessCards', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: async () =>
          JSON.stringify({
            success: true,
            data: {
              qrs: [sampleQrResponse],
              totalCount: 1,
              page: 1,
              limit: 10,
            },
          }),
      });

      const result = await service.listCards('team_test_123', {
        page: 1,
        limit: 10,
        search: 'Alex',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.qrtrac.com/api/qrs-api/v2/teams/?page=1&limit=10&search=Alex&sortBy=createdAt&sortOrder=desc',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'x-request-team-id': 'team_test_123',
            'x-request-client-id': 'cli_test_456',
            'x-request-client-secret': 'sec_test_789',
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].id).toBe('qr_abc123');
      expect(result.data.items[0].contact.displayName).toBe('Alex Morgan');
      expect(result.data.items[0].template).toBe('corporate_executive');
      expect(result.data.meta.totalCount).toBe(1);
      expect(result.data.meta.totalPages).toBe(1);
    });
  });

  describe('2. Successful Get Operation', () => {
    it('retrieves single card by ID and maps response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            success: true,
            data: sampleQrResponse,
          }),
      });

      const result = await service.getCard('qr_abc123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.qrtrac.com/api/qrs-api/qr_abc123',
        expect.objectContaining({ method: 'GET' })
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('qr_abc123');
      expect(result.data.contact.email).toBe('alex@techcorp.io');
    });
  });

  describe('3. Successful Create (VCARD) Operation', () => {
    it('creates a new VCARD QR and serializes request correctly', async () => {
      const draft: CardEditorDraft = {
        name: 'Sarah Chen',
        firstName: 'Sarah',
        lastName: 'Chen',
        designation: 'Head of Growth',
        company: 'Apex Labs',
        email: 'sarah@apexlabs.com',
        phoneMobile: '+1-555-0999',
        phoneWork: '',
        website: 'https://apexlabs.com',
        street: '500 Market St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'USA',
        bio: 'Growth strategist',
        notes: '',
        profilePhoto: 'https://example.com/sarah.jpg',
        template: 'vibrant_glass',
        displayId: 'sarah-growth',
        tags: ['growth'],
        socialLinks: [
          { id: '2', platform: 'twitter', url: 'https://twitter.com/sarahchen' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            success: true,
            data: {
              ...sampleQrResponse,
              id: 'qr_created_789',
              name: 'Sarah Chen',
              firstName: 'Sarah',
              lastName: 'Chen',
              designation: 'Head of Growth',
              company: 'Apex Labs',
              displayId: 'sarah-growth',
            },
          }),
      });

      const result = await service.createCard(draft);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.qrtrac.com/api/qrs-api',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"qrType":"VCARD"'),
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('qr_created_789');
      expect(result.data.contact.company).toBe('Apex Labs');
    });
  });

  describe('4. Successful Update Operation', () => {
    it('sends PUT update request with updated payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            success: true,
            data: {
              ...sampleQrResponse,
              designation: 'VP of Engineering',
            },
          }),
      });

      const result = await service.updateCard('qr_abc123', {
        name: 'Alex Morgan',
        firstName: 'Alex',
        lastName: 'Morgan',
        designation: 'VP of Engineering',
        company: 'TechCorp Solutions',
        phoneMobile: '+1-555-0199',
        phoneWork: '',
        email: 'alex@techcorp.io',
        website: 'https://alexmorgan.io',
        street: '100 Innovation Way',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
        bio: 'Lead architect building enterprise solutions',
        notes: '',
        template: 'modern_minimal',
        displayId: 'alex-morgan',
        tags: [],
        socialLinks: [],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.qrtrac.com/api/qrs-api/qr_abc123',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"designation":"VP of Engineering"'),
        })
      );

      expect(result.success).toBe(true);
      expect(result.data.contact.title).toBe('VP of Engineering');
    });
  });

  describe('5. Successful Delete Operation', () => {
    it('sends DELETE request to soft-delete QR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            success: true,
            message: 'QR deleted successfully.',
          }),
      });

      const result = await service.deleteCard('qr_abc123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.qrtrac.com/api/qrs-api/qr_abc123',
        expect.objectContaining({ method: 'DELETE' })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('6. Slug Availability Check', () => {
    it('queries GET /qrs-api/availability/{id} without requiring auth headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            success: true,
            data: 'available',
            message: 'displayId is available.',
          }),
      });

      const result = await service.checkDisplayIdAvailability('new-slug-2026');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.qrtrac.com/api/qrs-api/availability/new-slug-2026',
        expect.objectContaining({ method: 'GET' })
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('available');
    });
  });

  describe('7. Error Handling & Normalization', () => {
    it('handles 400 Validation Error (e.g. duplicate slug)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            success: false,
            message: 'displayId already exists!',
          }),
      });

      const result = await service.createCard({
        name: 'Duplicate Card',
        firstName: 'Test',
        lastName: 'User',
        designation: '',
        company: '',
        email: '',
        phoneMobile: '',
        phoneWork: '',
        website: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        bio: '',
        notes: '',
        template: 'modern_minimal',
        displayId: 'taken-slug',
        tags: [],
        socialLinks: [],
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('VALIDATION_ERROR');
      expect(result.error?.statusCode).toBe(400);
      expect(result.error?.message).toContain('already taken');
    });

    it('handles 401 Unauthorized Error (invalid credentials)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            success: false,
            message: 'Invalid client credentials',
          }),
      });

      const result = await service.getCard('qr_abc123');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('AUTHENTICATION_ERROR');
      expect(result.error?.statusCode).toBe(401);
      expect(result.error?.message).toContain('Invalid API credentials');
    });

    it('handles 403 Forbidden Error (plan upgrade needed)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            success: false,
            message: 'Upgrade to Business Plus required',
          }),
      });

      const result = await service.getTemplates();

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('FORBIDDEN_ERROR');
      expect(result.error?.statusCode).toBe(403);
      expect(result.error?.message).toContain('Permission denied');
    });

    it('handles 429 Rate Limit Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '1700000060',
        }),
        text: async () =>
          JSON.stringify({
            success: false,
            message: 'Rate limit exceeded',
          }),
      });

      const result = await service.listCards('team_test_123');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('RATE_LIMIT_ERROR');
      expect(result.error?.statusCode).toBe(429);
      expect(result.error?.isRetryable).toBe(true);
      expect(result.error?.retryAfterSeconds).toBe(5);
    });

    it('handles 500 Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            success: false,
            message: 'Internal Server Error',
          }),
      });

      const result = await service.getCard('qr_abc123');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('SERVER_ERROR');
      expect(result.error?.statusCode).toBe(500);
      expect(result.error?.message).toContain('server is temporarily unavailable');
    });

    it('handles Network Failure / Connection Error', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await service.getCard('qr_abc123');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('NETWORK_ERROR');
      expect(result.error?.message).toContain('Network unavailable');
    });
  });

  describe('8. BusinessCard Bidirectional Data Mapper', () => {
    it('maps QRTRAC Qr with VCARD fields to BusinessCard model', () => {
      const card = CardMapper.toBusinessCard(sampleQrResponse);

      expect(card.id).toBe('qr_abc123');
      expect(card.name).toBe('Alex Morgan');
      expect(card.contact.firstName).toBe('Alex');
      expect(card.contact.lastName).toBe('Morgan');
      expect(card.contact.company).toBe('TechCorp Solutions');
      expect(card.contact.title).toBe('Principal Architect');
      expect(card.contact.email).toBe('alex@techcorp.io');
      expect(card.contact.phoneMobile).toBe('+1-555-0199');
      expect(card.contact.address?.city).toBe('San Francisco');
      expect(card.contact.address?.country).toBe('USA');
      expect(card.template).toBe('corporate_executive');
      expect(card.cloud.qrtracId).toBe('qr_abc123');
      expect(card.cloud.displayId).toBe('alex-morgan');
      expect(card.cloud.qrImageUrl).toBe('https://storage.qrtrac.com/qrs/qr_abc123.png');
      expect(card.socialLinks).toHaveLength(1);
      expect(card.socialLinks[0].platform).toBe('linkedin');
    });

    it('maps CardEditorDraft to QRTRAC CreateQrRequest payload', () => {
      const draft: CardEditorDraft = {
        name: 'Elena Rostova',
        firstName: 'Elena',
        lastName: 'Rostova',
        designation: 'Chief Technology Officer',
        company: 'Aether Dynamics',
        email: 'elena@aether.ai',
        phoneMobile: '+1-555-8822',
        phoneWork: '',
        website: 'https://aether.ai',
        street: '750 Battery St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94111',
        country: 'USA',
        bio: 'Pioneering edge AI architecture',
        notes: '',
        profilePhoto: 'https://example.com/elena.png',
        template: 'modern_minimal',
        displayId: 'elena-cto',
        tags: ['executive'],
        socialLinks: [
          { id: '10', platform: 'github', url: 'https://github.com/elena-ai' },
        ],
      };

      const request = CardMapper.toCreateQrRequest(draft);

      expect(request.name).toBe('Elena Rostova');
      expect(request.qrType).toBe('VCARD');
      expect(request.firstName).toBe('Elena');
      expect(request.lastName).toBe('Rostova');
      expect(request.designation).toBe('Chief Technology Officer');
      expect(request.company).toBe('Aether Dynamics');
      expect(request.email).toBe('elena@aether.ai');
      expect(request.mobile).toBe('+1-555-8822');
      expect(request.address).toBe('750 Battery St, San Francisco, CA, 94111, USA');
      expect(request.displayId).toBe('elena-cto');
      expect(request.metadata?.cardTheme).toBe('modern_minimal');
      expect(request.metadata?.profileImage).toBe('https://example.com/elena.png');
      expect((request.metadata?.socialLinks as any[])[0].url).toBe('https://github.com/elena-ai');
    });
  });
});
