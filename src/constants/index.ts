/**
 * Application Constants & Runtime Environment Configuration Loader
 * Safely resolves runtime environment variables without hardcoding secrets.
 */

import { QrTracCredentials } from '../types/qrtrac';

export const APP_CONFIG = {
  appName: 'Digital Business Card',
  version: '1.0.0',
  defaultQrTracBaseUrl: 'https://api.qrtrac.com/api',
};

/**
 * Safely load credentials from environment variables if present at runtime.
 * Supports both standard environment variables and Expo public runtime variables (EXPO_PUBLIC_*).
 * Returns null if required variables are missing or unconfigured.
 */
export const getEnvCredentials = (): QrTracCredentials | null => {
  const teamId =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_QRTRAC_TEAM_ID) ||
    (typeof process !== 'undefined' && process.env?.QRTRAC_TEAM_ID);

  const clientId =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_QRTRAC_CLIENT_ID) ||
    (typeof process !== 'undefined' && process.env?.QRTRAC_CLIENT_ID);

  const clientSecret =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_QRTRAC_CLIENT_SECRET) ||
    (typeof process !== 'undefined' && process.env?.QRTRAC_CLIENT_SECRET);

  const baseUrl =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_QRTRAC_BASE_URL) ||
    (typeof process !== 'undefined' && process.env?.QRTRAC_BASE_URL) ||
    APP_CONFIG.defaultQrTracBaseUrl;

  const isPlaceholder = (val?: string) =>
    !val || val.trim() === '' || val.startsWith('your_') || val.includes('placeholder');

  if (!isPlaceholder(teamId) && !isPlaceholder(clientId) && !isPlaceholder(clientSecret)) {
    return {
      teamId: teamId!.trim(),
      clientId: clientId!.trim(),
      clientSecret: clientSecret!.trim(),
      baseUrl: baseUrl.trim(),
    };
  }

  return null;
};
