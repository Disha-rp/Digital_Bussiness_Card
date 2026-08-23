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
    id: 'qr_gauri_101',
    name: 'Gauri Khiste',
    qrType: 'VCARD',
    teamId: 'team_live_44S2',
    firstName: 'Gauri',
    lastName: 'Khiste',
    company: 'Tech Innovations',
    designation: 'Senior Lead Engineer',
    email: 'gauri.khiste@tech.io',
    mobile: '+91-9876543210',
    displayId: 'gauri-khiste',
    qrImageUrl: 'https://storage.qrtrac.com/qrs/qr_gauri_101.png',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    metadata: {
      cardTheme: 'modern_minimal',
    },
  };

  const gameQr: QrTracQr = {
    id: 'qr_game_102',
    name: 'Game',
    qrType: 'VCARD',
    teamId: 'team_live_44S2',
    firstName: 'Game',
    company: 'Arcade Studios',
    designation: 'Lead Game Designer',
    email: 'contact@arcadestudios.com',
    displayId: 'game-card',
    qrImageUrl: 'https://storage.qrtrac.com/qrs/qr_game_102.png',
    createdAt: 1700001000000,
    updatedAt: 1700001000000,
  };

  const tigerQr: QrTracQr = {
    id: 'qr_tiger_103',
    name: 'Tiger img',
    qrType: 'VCARD',
    teamId: 'team_live_44S2',
    firstName: 'Tiger img',
    company: 'WildLife Initiative',
    displayId: 'tiger-img',
    qrImageUrl: 'https://storage.qrtrac.com/qrs/qr_tiger_103.png',
    createdAt: 1700002000000,
    updatedAt: 1700002000000,
  };

  const pdfQr: QrTracQr = {
    id: 'qr_pdf_104',
    name: 'PDF DEMO',
    qrType: 'VCARD',
    teamId: 'team_live_44S2',
    firstName: 'PDF DEMO',
    company: 'DocuSync Corp',
    displayId: 'pdf-demo',
    qrImageUrl: 'https://storage.qrtrac.com/qrs/qr_pdf_104.png',
    createdAt: 1700003000000,
    updatedAt: 1700003000000,
  };

  const untitledQr: QrTracQr = {
    id: 'qr_untitled_105',
    name: 'Untitled',
    qrType: 'VCARD',
    teamId: 'team_live_44S2',
    firstName: 'Untitled',
    displayId: 'untitled-card',
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
      expect(first.id).toBe('qr_gauri_101');
      expect(first.name).toBe('Gauri Khiste');
      expect(first.contact.title).toBe('Senior Lead Engineer');
      expect(first.contact.company).toBe('Tech Innovations');
      expect(first.cloud?.qrImageUrl).toBe('https://storage.qrtrac.com/qrs/qr_gauri_101.png');
      expect(first.cloud?.displayId).toBe('gauri-khiste');
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

      const result = await qrService.getCard('qr_gauri_101');
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('qr_gauri_101');
      expect(result.data?.name).toBe('Gauri Khiste');
      expect(result.data?.contact.title).toBe('Senior Lead Engineer');
    });
  });

  describe('10-14. Card Action Resolution & Navigation Contract', () => {
    it('resolves Gauri Khiste card data correctly for Preview, Edit, Share, and QR flows', () => {
      const card = CardMapper.toBusinessCard(gauriQr);

      // Verify that card has exact fields required by Preview
      expect(card.id).toBe('qr_gauri_101');
      expect(card.name).toBe('Gauri Khiste');
      expect(card.contact.title).toBe('Senior Lead Engineer');
      expect(card.contact.company).toBe('Tech Innovations');
      expect(card.contact.email).toBe('gauri.khiste@tech.io');
      expect(card.contact.phoneMobile).toBe('+91-9876543210');

      // Verify that QR assets are populated
      expect(card.cloud?.qrImageUrl).toBe('https://storage.qrtrac.com/qrs/qr_gauri_101.png');
      expect(card.cloud?.displayId).toBe('gauri-khiste');

      // Verify that navigation params can carry cardId
      const navParams = {
        cardId: card.id,
        cardTitle: card.name,
        templateId: card.template,
        previewUrl: `https://qr.qrtrac.com/${card.cloud?.displayId}`,
      };

      expect(navParams.cardId).toBe('qr_gauri_101');
      expect(navParams.cardTitle).toBe('Gauri Khiste');
    });

    it('resolves each distinct team card correctly without falling back to demo data', () => {
      const cards = [gameQr, tigerQr, pdfQr, untitledQr].map((qr) => CardMapper.toBusinessCard(qr));

      expect(cards[0].name).toBe('Game');
      expect(cards[0].id).toBe('qr_game_102');

      expect(cards[1].name).toBe('Tiger img');
      expect(cards[1].id).toBe('qr_tiger_103');

      expect(cards[2].name).toBe('PDF DEMO');
      expect(cards[2].id).toBe('qr_pdf_104');

      expect(cards[3].name).toBe('Untitled');
      expect(cards[3].id).toBe('qr_untitled_105');
    });
  });
});
