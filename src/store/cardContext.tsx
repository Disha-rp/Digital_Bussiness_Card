/**
 * Cards State Context
 * Manages card collection, QRTRAC API fetching, pagination, search, caching,
 * selected card, and editor draft.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { BusinessCard, CardEditorDraft } from '../models/card';
import { CardTemplateId } from '../models/template';
import { ApiError, PaginationMeta } from '../models/api';
import { qrService } from '../services/qr.service';
import { useAuth } from './authContext';

export interface CardFilter {
  search: string;
  template?: CardTemplateId | 'all';
  favoritesOnly: boolean;
}

export interface CardContextValue {
  cards: BusinessCard[];
  selectedCardId: string | null;
  selectedCard: BusinessCard | null;
  editorDraft: CardEditorDraft | null;
  filter: CardFilter;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  pagination: PaginationMeta;
  error: ApiError | null;

  // Actions
  fetchCards: (page?: number, search?: string, isRefresh?: boolean) => Promise<void>;
  refreshCards: () => Promise<void>;
  loadMoreCards: () => Promise<void>;
  searchCards: (query: string) => Promise<void>;
  setCards: (cards: BusinessCard[]) => void;
  selectCard: (id: string | null) => void;
  setEditorDraft: (draft: CardEditorDraft | null) => void;
  updateEditorDraft: (fields: Partial<CardEditorDraft>) => void;
  clearEditorDraft: () => void;
  setFilter: (filterUpdate: Partial<CardFilter>) => void;
  clearError: () => void;
  filteredCards: BusinessCard[];
}

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  totalCount: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const CardContext = createContext<CardContextValue | undefined>(undefined);

export const CardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, organization } = useAuth();

  const [cards, setCardsState] = useState<BusinessCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [editorDraft, setEditorDraftState] = useState<CardEditorDraft | null>(null);
  const [filter, setFilterState] = useState<CardFilter>({
    search: '',
    template: 'all',
    favoritesOnly: false,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMoreMore] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [error, setError] = useState<ApiError | null>(null);

  /**
   * Core API fetcher implementing pagination, search, and cached data preservation
   */
  const fetchCards = useCallback(
    async (page = 1, searchQuery = '', isRefresh = false) => {
      if (!isAuthenticated) return;

      const isFirstPage = page === 1;
      if (isRefresh) {
        setRefreshing(true);
      } else if (isFirstPage) {
        setLoading(true);
      } else {
        setLoadingMoreMore(true);
      }

      setError(null);

      try {
        const teamId = organization?.teamId;
        const response = await qrService.listCards(teamId, {
          page,
          limit: 10,
          search: searchQuery.trim() || undefined,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        });

        if (response.success && response.data) {
          const newItems = response.data.items || [];
          setCardsState((prev) => {
            if (isFirstPage) return newItems;
            // Deduplicate items on append
            const existingIds = new Set(prev.map((c) => c.id));
            const freshItems = newItems.filter((c) => !existingIds.has(c.id));
            return [...prev, ...freshItems];
          });
          setPagination(response.data.meta);
        } else {
          setError(
            response.error || {
              type: 'UNKNOWN_ERROR',
              message: response.message || 'Failed to load business cards.',
              isRetryable: true,
            }
          );
        }
      } catch (err: any) {
        setError({
          type: 'NETWORK_ERROR',
          message: err?.message || 'Network unavailable. Please check your connection.',
          isRetryable: true,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMoreMore(false);
      }
    },
    [isAuthenticated, organization?.teamId]
  );

  // Initial fetch when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCards(1, filter.search);
    } else {
      setCardsState([]);
      setPagination(DEFAULT_PAGINATION);
      setError(null);
    }
  }, [isAuthenticated, fetchCards]);

  const refreshCards = useCallback(async () => {
    await fetchCards(1, filter.search, true);
  }, [fetchCards, filter.search]);

  const loadMoreCards = useCallback(async () => {
    if (loading || refreshing || loadingMore || !pagination.hasNextPage) return;
    await fetchCards(pagination.page + 1, filter.search, false);
  }, [fetchCards, filter.search, loading, refreshing, loadingMore, pagination]);

  const searchCards = useCallback(
    async (query: string) => {
      setFilterState((prev) => ({ ...prev, search: query }));
      await fetchCards(1, query, false);
    },
    [fetchCards]
  );

  const setCards = useCallback((newCards: BusinessCard[]) => {
    setCardsState(newCards);
  }, []);

  const selectCard = useCallback((id: string | null) => {
    setSelectedCardId(id);
  }, []);

  const setEditorDraft = useCallback((draft: CardEditorDraft | null) => {
    setEditorDraftState(draft);
  }, []);

  const updateEditorDraft = useCallback((fields: Partial<CardEditorDraft>) => {
    setEditorDraftState((prev) => {
      if (!prev) return prev;
      return { ...prev, ...fields };
    });
  }, []);

  const clearEditorDraft = useCallback(() => {
    setEditorDraftState(null);
  }, []);

  const setFilter = useCallback((filterUpdate: Partial<CardFilter>) => {
    setFilterState((prev) => ({ ...prev, ...filterUpdate }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const selectedCard = useMemo(() => {
    if (!selectedCardId) return null;
    return cards.find((c) => c.id === selectedCardId) || null;
  }, [cards, selectedCardId]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (filter.favoritesOnly && !card.isFavorite) return false;
      if (filter.template && filter.template !== 'all' && card.template !== filter.template) {
        return false;
      }
      return true;
    });
  }, [cards, filter]);

  const value = useMemo<CardContextValue>(
    () => ({
      cards,
      selectedCardId,
      selectedCard,
      editorDraft,
      filter,
      loading,
      refreshing,
      loadingMore,
      pagination,
      error,
      fetchCards,
      refreshCards,
      loadMoreCards,
      searchCards,
      setCards,
      selectCard,
      setEditorDraft,
      updateEditorDraft,
      clearEditorDraft,
      setFilter,
      clearError,
      filteredCards,
    }),
    [
      cards,
      selectedCardId,
      selectedCard,
      editorDraft,
      filter,
      loading,
      refreshing,
      loadingMore,
      pagination,
      error,
      fetchCards,
      refreshCards,
      loadMoreCards,
      searchCards,
      setCards,
      selectCard,
      setEditorDraft,
      updateEditorDraft,
      clearEditorDraft,
      setFilter,
      clearError,
      filteredCards,
    ]
  );

  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
};

export const useCards = (): CardContextValue => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('useCards must be used within a CardProvider');
  }
  return context;
};
