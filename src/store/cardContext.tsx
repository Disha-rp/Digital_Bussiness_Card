/**
 * Cards State Context
 * Manages cards collection, selected card, card editor draft, and filtering.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { BusinessCard, CardEditorDraft } from '../models/card';
import { CardTemplateId } from '../models/template';
import { ApiError } from '../models/api';

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
  error: ApiError | null;

  // Actions
  setCards: (cards: BusinessCard[]) => void;
  selectCard: (id: string | null) => void;
  setEditorDraft: (draft: CardEditorDraft | null) => void;
  updateEditorDraft: (fields: Partial<CardEditorDraft>) => void;
  clearEditorDraft: () => void;
  setFilter: (filterUpdate: Partial<CardFilter>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApiError | null) => void;
  filteredCards: BusinessCard[];
}

const CardContext = createContext<CardContextValue | undefined>(undefined);

export const CardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cards, setCardsState] = useState<BusinessCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [editorDraft, setEditorDraftState] = useState<CardEditorDraft | null>(null);
  const [filter, setFilterState] = useState<CardFilter>({
    search: '',
    template: 'all',
    favoritesOnly: false,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

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
      if (filter.search.trim()) {
        const query = filter.search.toLowerCase().trim();
        const matchesName = card.name.toLowerCase().includes(query);
        const matchesCompany = (card.contact.company || '').toLowerCase().includes(query);
        const matchesTitle = (card.contact.title || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCompany && !matchesTitle) return false;
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
      error,
      setCards,
      selectCard,
      setEditorDraft,
      updateEditorDraft,
      clearEditorDraft,
      setFilter,
      setLoading,
      setError,
      filteredCards,
    }),
    [
      cards,
      selectedCardId,
      selectedCard,
      editorDraft,
      filter,
      loading,
      error,
      setCards,
      selectCard,
      setEditorDraft,
      updateEditorDraft,
      clearEditorDraft,
      setFilter,
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
