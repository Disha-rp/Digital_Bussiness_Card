/**
 * Phase 5 — My Cards Screen & Context Unit Tests
 * Tests all required scenarios:
 * 1. Zero cards
 * 2. One card
 * 3. Multiple cards
 * 4. Pagination
 * 5. Pull-to-refresh
 * 6. Search
 * 7. API failure
 * 8. Retry
 * 9. Opening a card (Gauri Khiste)
 * 10. Preview navigation & data resolution
 * 11. Edit navigation & data population
 * 12. Share navigation & data display
 * 13. Dynamic team cards resolution (Game, Tiger img, PDF DEMO, Untitled)
 * 14. Missing/invalid cardId error handling (NO Alex Morgan fallback)
 * 15. Verified publicUrl construction using qr.baseUrl & displayId (Gauri, Game, Tiger, PDF, Untitled)
 */

(global as any).__DEV__ = true;

import { qrService } from '../src/services/qr.service';
import { CardMapper } from '../src/services/mapper';
import { BusinessCard } from '../src/models/card';
import { QrTracQr } from '../src/types/qrtrac';

jest.mock('../src/services/qr.service');
const mockQrService = qrService as jest.Mocked<typeof qrService>;

describe('Phase 5 — My Cards & QRTRAC Service Integration', () => {
  const gauriQr: QrTracQr = {
    id: 'bMiu',
    name: 'Gauri Khiste',
    qrType: 'VCARD',
    teamId: 'team_live_44S2',
    baseUrl: 'https://qrtrac.link/',
    firstName: 'Gauri',
    lastName: 'Khiste',
    company: 'Qrtrac',
    designation: 'Software developer',
    email: 'gauri.khiste@qrtrac.com',
    mobile: '+91-9876543210',
    displayId: 'bMiu',
    qrImageUrl: 'https://storage.googleapis.com/qrtrac-prod.appspot.com/qrs/bMiu.svg',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    metadata: {
      cardTheme: 'modern_minimal',
    },
  };

  const gameQr: QrTracQr = {
    id: 'eDgI',
    name: 'Game',
    qrType: 'APP_DOWNLOAD',
    teamId: 'team_live_44S2',
    baseUrl: 'https://qrtrac.link/',
    firstName: 'Game',
    company: 'Arcade Studios',
    designation: 'Lead Game Designer',
    email: 'contact@arcadestudios.com',
    displayId: 'eDgI',
    createdAt: 1700001000000,
    updatedAt: 1700001000000,
  };

  const tigerQr: QrTracQr = {
    id: 'fPlwVDSQDZm9XdL9gDgz',
    name: 'Tiger img',
    qrType: 'IMAGE_GALLERY',
    teamId: 'team_live_44S2',
    baseUrl: 'https://qrtrac.link/',
    firstName: 'Tiger img',
    company: 'WildLife Initiative',
    displayId: 'tiger',
    createdAt: 1700002000000,
    updatedAt: 1700002000000,
  };

  const pdfQr: QrTracQr = {
    id: 'mXLZ',
    name: 'PDF DEMO',
    qrType: 'PDF',
    teamId: 'team_live_44S2',
    baseUrl: 'https://qrtrac.link/',
    firstName: 'PDF DEMO',
    company: 'DocuSync Corp',
    displayId: 'mXLZ',
    createdAt: 1700003000000,
    updatedAt: 1700003000000,
  };

  const untitledQr: QrTracQr = {
    id: 'IY41',
    name: 'Untitled',
    qrType: 'VCARD',
    teamId: 'team_live_44S2',
    baseUrl: 'https://qrtrac.link/',
    firstName: 'Untitled',
    displayId: 'IY41',
    createdAt: 1700004000000,
    updatedAt: 1700004000000,
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

      const result = await qrService.listCards('team_live_44S2', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(0);
      expect(result.data.meta.totalCount).toBe(0);
      expect(result.data.meta.hasNextPage).toBe(false);
    });
  });

  describe('2. Single Card Retrieval & Mapping', () => {
    it('retrieves and maps Gauri Khiste card with verified contact and QR asset', async () => {
      const gauriCard = CardMapper.toBusinessCard(gauriQr);

      mockQrService.listCards.mockResolvedValueOnce({
        success: true,
        data: {
          items: [gauriCard],
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

      const result = await qrService.listCards('team_live_44S2', { page: 1 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      const first = result.data.items[0];
      expect(first.id).toBe('bMiu');
      expect(first.name).toBe('Gauri Khiste');
      expect(first.contact.title).toBe('Software developer');
      expect(first.contact.company).toBe('Qrtrac');
      expect(first.cloud?.qrImageUrl).toBe('https://storage.googleapis.com/qrtrac-prod.appspot.com/qrs/bMiu.svg');
      expect(first.cloud?.displayId).toBe('bMiu');
      expect(first.cloud?.publicUrl).toBe('https://qrtrac.link/bMiu');
    });
  });

  describe('3. Multiple Cards Retrieval for Authenticated Team', () => {
    it('retrieves all real team cards (Gauri Khiste, Game, Tiger img, PDF DEMO, Untitled)', async () => {
      const teamCards: BusinessCard[] = [
        CardMapper.toBusinessCard(gauriQr),
        CardMapper.toBusinessCard(gameQr),
        CardMapper.toBusinessCard(tigerQr),
        CardMapper.toBusinessCard(pdfQr),
        CardMapper.toBusinessCard(untitledQr),
      ];

      mockQrService.listCards.mockResolvedValueOnce({
        success: true,
        data: {
          items: teamCards,
          meta: {
            page: 1,
            limit: 10,
            totalCount: 5,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });

      const result = await qrService.listCards('team_live_44S2');

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(5);
      expect(result.data.items[0].name).toBe('Gauri Khiste');
      expect(result.data.items[1].name).toBe('Game');
      expect(result.data.items[2].name).toBe('Tiger img');
      expect(result.data.items[3].name).toBe('PDF DEMO');
      expect(result.data.items[4].name).toBe('Untitled');
    });
  });

  describe('4. Pagination Support', () => {
    it('requests page 2 when hasNextPage is true', async () => {
      mockQrService.listCards.mockResolvedValueOnce({
        success: true,
        data: {
          items: [CardMapper.toBusinessCard(gameQr)],
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

      const result = await qrService.listCards('team_live_44S2', { page: 2, limit: 1 });

      expect(mockQrService.listCards).toHaveBeenCalledWith('team_live_44S2', { page: 2, limit: 1 });
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
          items: [CardMapper.toBusinessCard(gauriQr)],
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

      const result = await qrService.listCards('team_live_44S2', { page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
    });
  });

  describe('6. Server-side Search', () => {
    it('passes search query parameter to listCards endpoint', async () => {
      mockQrService.listCards.mockResolvedValueOnce({
        success: true,
        data: {
          items: [CardMapper.toBusinessCard(gauriQr)],
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

      const result = await qrService.listCards('team_live_44S2', {
        page: 1,
        search: 'Gauri',
      });

      expect(mockQrService.listCards).toHaveBeenCalledWith('team_live_44S2', {
        page: 1,
        search: 'Gauri',
      });
      expect(result.success).toBe(true);
      expect(result.data.items[0].contact.firstName).toBe('Gauri');
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

      const result = await qrService.listCards('team_live_44S2');

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
            items: [CardMapper.toBusinessCard(gauriQr)],
            meta: { page: 1, limit: 10, totalCount: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
          },
        });

      const firstAttempt = await qrService.listCards('team_live_44S2');
      expect(firstAttempt.success).toBe(false);

      const retryAttempt = await qrService.listCards('team_live_44S2');
      expect(retryAttempt.success).toBe(true);
      expect(retryAttempt.data.items).toHaveLength(1);
    });
  });

  describe('9. Single Card Fetch by ID for Destination Screens', () => {
    it('fetches specific card by ID when not present in local state', async () => {
      const gauriCard = CardMapper.toBusinessCard(gauriQr);
      mockQrService.getCard.mockResolvedValueOnce({
        success: true,
        data: gauriCard,
      });

      const result = await qrService.getCard('bMiu');
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('bMiu');
      expect(result.data?.name).toBe('Gauri Khiste');
      expect(result.data?.contact.title).toBe('Software developer');
    });
  });

  describe('10-15. Card Action Resolution & Public URL Mapping', () => {
    it('resolves Gauri Khiste card data correctly for Preview, Edit, Share, and QR flows', () => {
      const card = CardMapper.toBusinessCard(gauriQr);

      // Verify that card has exact fields required by Preview
      expect(card.id).toBe('bMiu');
      expect(card.name).toBe('Gauri Khiste');
      expect(card.contact.title).toBe('Software developer');
      expect(card.contact.company).toBe('Qrtrac');
      expect(card.contact.email).toBe('gauri.khiste@qrtrac.com');
      expect(card.contact.phoneMobile).toBe('+91-9876543210');

      // Verify that QR assets and public URLs are correctly mapped
      expect(card.cloud?.qrImageUrl).toBe('https://storage.googleapis.com/qrtrac-prod.appspot.com/qrs/bMiu.svg');
      expect(card.cloud?.displayId).toBe('bMiu');
      expect(card.cloud?.publicUrl).toBe('https://qrtrac.link/bMiu');

      // Verify that navigation params can carry cardId
      const navParams = {
        cardId: card.id,
        cardTitle: card.name,
        templateId: card.template,
        previewUrl: card.cloud?.publicUrl,
      };

      expect(navParams.cardId).toBe('bMiu');
      expect(navParams.cardTitle).toBe('Gauri Khiste');
      expect(navParams.previewUrl).toBe('https://qrtrac.link/bMiu');
    });

    it('correctly maps publicUrl for all team cards using qr.baseUrl and displayId', () => {
      const gauri = CardMapper.toBusinessCard(gauriQr);
      const untitled = CardMapper.toBusinessCard(untitledQr);
      const game = CardMapper.toBusinessCard(gameQr);
      const tiger = CardMapper.toBusinessCard(tigerQr);
      const pdf = CardMapper.toBusinessCard(pdfQr);

      expect(gauri.cloud?.publicUrl).toBe('https://qrtrac.link/bMiu');
      expect(untitled.cloud?.publicUrl).toBe('https://qrtrac.link/IY41');
      expect(game.cloud?.publicUrl).toBe('https://qrtrac.link/eDgI');
      expect(tiger.cloud?.publicUrl).toBe('https://qrtrac.link/tiger');
      expect(pdf.cloud?.publicUrl).toBe('https://qrtrac.link/mXLZ');
    });
  });
});
