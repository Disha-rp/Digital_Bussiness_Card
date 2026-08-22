/**
 * UI State Context (Loading indicators, modals, toast alerts)
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface ToastAlert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  durationMs?: number;
}

export interface ModalState {
  isOpen: boolean;
  type: string | null;
  data: unknown;
}

export interface UIContextValue {
  isLoading: boolean;
  loadingMessage: string | null;
  activeModal: ModalState;
  toast: ToastAlert | null;

  showLoading: (message?: string) => void;
  hideLoading: () => void;
  openModal: (type: string, data?: unknown) => void;
  closeModal: () => void;
  showToast: (toast: Omit<ToastAlert, 'id'>) => void;
  hideToast: () => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalState>({
    isOpen: false,
    type: null,
    data: null,
  });
  const [toast, setToast] = useState<ToastAlert | null>(null);

  const showLoading = useCallback((message = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(null);
  }, []);

  const openModal = useCallback((type: string, data: unknown = null) => {
    setActiveModal({
      isOpen: true,
      type,
      data,
    });
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal({
      isOpen: false,
      type: null,
      data: null,
    });
  }, []);

  const showToast = useCallback((toastData: Omit<ToastAlert, 'id'>) => {
    const id = 'toast_' + Date.now();
    setToast({ ...toastData, id });
    const duration = toastData.durationMs || 3500;
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      isLoading,
      loadingMessage,
      activeModal,
      toast,
      showLoading,
      hideLoading,
      openModal,
      closeModal,
      showToast,
      hideToast,
    }),
    [isLoading, loadingMessage, activeModal, toast, showLoading, hideLoading, openModal, closeModal, showToast, hideToast]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = (): UIContextValue => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
