/**
 * Centralized Application Store Provider & Hooks
 */

import React from 'react';
import { AuthProvider, useAuth } from './authContext';
import { CardProvider, useCards } from './cardContext';
import { TemplateProvider, useTemplates } from './templateContext';
import { UIProvider, useUI } from './uiContext';

export * from './authContext';
export * from './cardContext';
export * from './templateContext';
export * from './uiContext';

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <AuthProvider>
        <TemplateProvider>
          <CardProvider>{children}</CardProvider>
        </TemplateProvider>
      </AuthProvider>
    </UIProvider>
  );
};

/**
 * Composite hook providing high-level app state
 */
export const useAppState = () => {
  const auth = useAuth();
  const cards = useCards();
  const templates = useTemplates();
  const ui = useUI();

  return {
    auth,
    cards,
    templates,
    ui,
  };
};
