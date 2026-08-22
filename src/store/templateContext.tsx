/**
 * Templates State Context
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CardTemplate, CardTemplateId } from '../models/template';
import { CARD_TEMPLATES, CARD_TEMPLATE_LIST } from '../theme/templates';

export interface TemplateContextValue {
  templates: CardTemplate[];
  selectedTemplateId: CardTemplateId;
  selectedTemplate: CardTemplate;
  selectTemplate: (id: CardTemplateId) => void;
  getTemplateById: (id: CardTemplateId) => CardTemplate;
}

const TemplateContext = createContext<TemplateContextValue | undefined>(undefined);

export const TemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<CardTemplateId>('modern_minimal');

  const selectTemplate = useCallback((id: CardTemplateId) => {
    setSelectedTemplateId(id);
  }, []);

  const getTemplateById = useCallback((id: CardTemplateId): CardTemplate => {
    return CARD_TEMPLATES[id] || CARD_TEMPLATES.modern_minimal;
  }, []);

  const selectedTemplate = useMemo(() => {
    return getTemplateById(selectedTemplateId);
  }, [selectedTemplateId, getTemplateById]);

  const value = useMemo<TemplateContextValue>(
    () => ({
      templates: CARD_TEMPLATE_LIST,
      selectedTemplateId,
      selectedTemplate,
      selectTemplate,
      getTemplateById,
    }),
    [selectedTemplateId, selectedTemplate, selectTemplate, getTemplateById]
  );

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
};

export const useTemplates = (): TemplateContextValue => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
};
