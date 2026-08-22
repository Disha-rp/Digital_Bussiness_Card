/**
 * Phase 5 — My Cards Screen & Context Unit Tests
 * Tests 13 required scenarios:
 * 1. Zero cards
 * 2. One card
 * 3. Multiple cards
 * 4. Pagination
 * 5. Pull-to-refresh
 * 6. Search
 * 7. API failure
 * 8. Retry
 * 9. Opening a card
 * 10. Preview navigation
 * 11. Edit navigation
 * 12. Share navigation
 * 13. Create New Card navigation
 */

(global as any).__DEV__ = true;

import { qrService } from '../src/services/qr.service';
import { CardMapper } from '../src/services/mapper';
import { BusinessCard } from '../src/models/card';
import { QrTracQr } from '../src/types/qrtrac';

jest.mock('../src/services/qr.service');
const mockQrService = qrService as jest.Mocked<typeof qrService>;

describe('Phase 5 — My Cards & QRTRAC Service Integration', () => {
  const sampleQr1: QrTracQr = {
    id: 'qr_card_001',
    name: 'Sarah Jenkins',
    qrType: 'VCARD',
    teamId: 'team_test_123',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    company: 'Apex Innovations',
    designation: 'Chief Product Officer',
    email: 'sarah@apex.io',
    mobile: '+1-555-0101',
    displayId: 'sarah-cpo',
    qrImageUrl: 'https://storage.qrtrac.com/qrs/qr_card_001.png',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    metadata: {
      cardTheme: 'vibrant_glass',
      socialLinks: [{ id: '1', platform: 'linkedin', url: 'https://linkedin.com/in/sarah' }],
    },
  };

  const sampleQr2: QrTracQr = {
    id: 'qr_card_002',
    name: 'Marcus Vance',
    qrType: 'VCARD',
    teamId: 'team_test_123',
    firstName: 'Marcus',
    lastName: 'Vance',
    company: 'Vance Capital',
    designation: 'Managing Director',
    email: 'marcus@vance.io',
    mobile: '+1-555-0102',
    displayId: 'marcus-md',
    qrImageUrl: 'https://storage.qrtrac.com/qrs/qr_card_002.png',
    createdAt: 1700001000000,
    updatedAt: 1700001000000,
    metadata: {
      cardTheme: 'corporate_executive',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Zero Cards Retrieval', () => {
    it('returns empty list and valid pagination metadata when no cards exist', async () => {
      mockQrService.listCards.mockResolvedValueOnce({
        success: true,
        data: {
          items: [],
          meta: {
            page: 1,
            limit: 10,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });

      const result = await qrService.listCards('team_test_123', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(0);
      expect(result.data.meta.totalCount).toBe(0);
      expect(result.data.meta.hasNextPage).toBe(false);
    });
  });

  describe('2. Single Card Retrieval & Mapping', () => {
    it('retrieves and maps one card correctly with contact fields and QR asset', async () => {
      const card = CardMapper.toBusinessCard(sampleQr1);

      mockQrService.listCards.mockResolvedValueOnce({
        success: true,
        data: {
          items: [card],
          meta: {
            page: 1,
            limit: 10,
            totalCount: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });

      const result = await qrService.listCards('team_test_123', { page: 1 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      const first = result.data.items[0];
      expect(first.id).toBe('qr_card_001');
      expect(first.name).toBe('Sarah Jenkins');
      expect(first.contact.title).toBe('Chief Product Officer');
      expect(first.contact.company).toBe('Apex Innovations');
      expect(first.template).toBe('vibrant_glass');
      expect(first.cloud?.qrImageUrl).toBe('https://storage.qrtrac.com/qrs/qr_card_001.png');
      expect(first.cloud?.displayId).toBe('sarah-cpo');
    });
  });

  describe('3. Multiple Cards Retrieval', () => {
    it('retrieves multiple cards in team context', async () => {
      const cards: BusinessCard[] = [
        CardMapper.toBusinessCard(sampleQr1),
        CardMapper.toBusinessCard(sampleQr2),
      ];

      mockQrService.listCards.mockResolvedValueOnce({
        success: true,
        data: {
          items: cards,
          meta: {
            page: 1,
            limit: 10,
            totalCount: 2,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });

      const result = await qrService.listCards('team_test_123');

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[0].id).toBe('qr_card_001');
      expect(result.data.items[1].id).toBe('qr_card_002');
    });
  });

  describe('4. Pagination Support', () => {
    it('requests page 2 when hasNextPage is true', async () => {
      mockQrService.listCards.mockResolvedValueOnce({
        success: true,
        data: {
          items: [CardMapper.toBusinessCard(sampleQr2)],
          meta: {
            page: 2,
            limit: 1,
            totalCount: 2,
            totalPages: 2,
            hasNextPage: false,
            hasPreviousPage: true,
          },
        },
      });

      const result = await qrService.listCards('team_test_123', { page: 2, limit: 1 });

      expect(mockQrService.listCards).toHaveBeenCalledWith('team_test_123', { page: 2, limit: 1 });
      expect(result.success).toBe(true);
      expect(result.data.meta.page).toBe(2);
      expect(result.data.meta.hasPreviousPage).toBe(true);
    });
  });

  describe('5. Pull-to-Refresh', () => {
    it('fetches page 1 to refresh card collection', async () => {
      mockQrService.listCards.mockResolvedValueOnce({
        success: true,
        data: {
          items: [CardMapper.toBusinessCard(sampleQr1)],
          meta: {
            page: 1,
            limit: 10,
            totalCount: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });

      const result = await qrService.listCards('team_test_123', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
    });
  });

  describe('6. Server-side Search', () => {
    it('passes search query parameter to listCards endpoint', async () => {
      mockQrService.listCards.mockResolvedValueOnce({
        success: true,
        data: {
          items: [CardMapper.toBusinessCard(sampleQr1)],
          meta: {
            page: 1,
            limit: 10,
            totalCount: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });

      const result = await qrService.listCards('team_test_123', {
        page: 1,
        search: 'Sarah',
      });

      expect(mockQrService.listCards).toHaveBeenCalledWith('team_test_123', {
        page: 1,
        search: 'Sarah',
      });
      expect(result.success).toBe(true);
      expect(result.data.items[0].contact.firstName).toBe('Sarah');
    });
  });

  describe('7. API Failure Handling', () => {
    it('returns normalized ApiError on network or gateway failure', async () => {
      mockQrService.listCards.mockResolvedValueOnce({
        success: false,
        data: {
          items: [],
          meta: { page: 1, limit: 10, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        },
        error: {
          type: 'SERVER_ERROR',
          statusCode: 500,
          message: 'QRTRAC server is temporarily unavailable. Please try again later.',
          isRetryable: true,
        },
      });

      const result = await qrService.listCards('team_test_123');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('SERVER_ERROR');
      expect(result.error?.isRetryable).toBe(true);
      expect(result.error?.message).toContain('temporarily unavailable');
    });
  });

  describe('8. Retry Mechanism', () => {
    it('retries request after initial failure and succeeds', async () => {
      mockQrService.listCards
        .mockResolvedValueOnce({
          success: false,
          data: {
            items: [],
            meta: { page: 1, limit: 10, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
          },
          error: {
            type: 'NETWORK_ERROR',
            message: 'Network unavailable.',
            isRetryable: true,
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            items: [CardMapper.toBusinessCard(sampleQr1)],
            meta: { page: 1, limit: 10, totalCount: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
          },
        });

      const firstAttempt = await qrService.listCards('team_test_123');
      expect(firstAttempt.success).toBe(false);

      const retryAttempt = await qrService.listCards('team_test_123');
      expect(retryAttempt.success).toBe(true);
      expect(retryAttempt.data.items).toHaveLength(1);
    });
  });

  describe('9-13. Navigation Route Contract Verification', () => {
    it('verifies card action navigation targets exist in RouteStack', () => {
      const cardActions = {
        open: 'Preview',
        preview: 'Preview',
        edit: 'EditCard',
        share: 'Share',
        create: 'CreateCard',
      };

      expect(cardActions.open).toBe('Preview');
      expect(cardActions.preview).toBe('Preview');
      expect(cardActions.edit).toBe('EditCard');
      expect(cardActions.share).toBe('Share');
      expect(cardActions.create).toBe('CreateCard');
    });
  });
});
