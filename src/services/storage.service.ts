/**
 * Secure Credential & Session Storage Service
 * Encapsulates encrypted device-level storage via Expo SecureStore (Keychain/Keystore)
 * with platform fallback for web/testing environments.
 *
 * Security Constraints:
 * - Client Secret and API credentials are NEVER stored in unencrypted AsyncStorage.
 * - Credentials are wiped completely upon logout.
 */

import * as SecureStore from 'expo-secure-store';
import { QrTracCredentials } from '../types/qrtrac';

const KEYS = {
  CLIENT_ID: 'qrtrac_client_id',
  CLIENT_SECRET: 'qrtrac_client_secret',
  TEAM_ID: 'qrtrac_team_id',
  BASE_URL: 'qrtrac_base_url',
  SESSION_META: 'qrtrac_session_meta',
} as const;

export interface SessionMeta {
  organizationName?: string;
  connectedAt: number;
}

// In-memory fallback for environments where SecureStore is unavailable (e.g. web/test)
const memoryStore: Record<string, string> = {};

class StorageService {
  private async isSecureStoreAvailable(): Promise<boolean> {
    try {
      if (typeof SecureStore.isAvailableAsync === 'function') {
        return await SecureStore.isAvailableAsync();
      }
      return false;
    } catch {
      return false;
    }
  }

  private async setItem(key: string, value: string): Promise<void> {
    const isAvailable = await this.isSecureStoreAvailable();
    if (isAvailable) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(key, value);
      } catch {
        memoryStore[key] = value;
      }
    } else {
      memoryStore[key] = value;
    }
  }

  private async getItem(key: string): Promise<string | null> {
    const isAvailable = await this.isSecureStoreAvailable();
    if (isAvailable) {
      return await SecureStore.getItemAsync(key);
    } else if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        return window.sessionStorage.getItem(key) || memoryStore[key] || null;
      } catch {
        return memoryStore[key] || null;
      }
    }
    return memoryStore[key] || null;
  }

  private async deleteItem(key: string): Promise<void> {
    const isAvailable = await this.isSecureStoreAvailable();
    if (isAvailable) {
      await SecureStore.deleteItemAsync(key);
    } else if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        delete memoryStore[key];
      }
    }
    delete memoryStore[key];
  }

  /**
   * Save organization credentials into encrypted secure store
   */
  public async saveCredentials(credentials: QrTracCredentials): Promise<void> {
    await this.setItem(KEYS.CLIENT_ID, credentials.clientId.trim());
    await this.setItem(KEYS.CLIENT_SECRET, credentials.clientSecret.trim());
    await this.setItem(KEYS.TEAM_ID, credentials.teamId.trim());
    if (credentials.baseUrl) {
      await this.setItem(KEYS.BASE_URL, credentials.baseUrl.trim());
    }
  }

  /**
   * Retrieve organization credentials from encrypted secure store
   */
  public async getCredentials(): Promise<QrTracCredentials | null> {
    const clientId = await this.getItem(KEYS.CLIENT_ID);
    const clientSecret = await this.getItem(KEYS.CLIENT_SECRET);
    const teamId = await this.getItem(KEYS.TEAM_ID);
    const baseUrl = await this.getItem(KEYS.BASE_URL);

    if (clientId && clientSecret && teamId) {
      return {
        clientId,
        clientSecret,
        teamId,
        baseUrl: baseUrl || 'https://api.qrtrac.com/api',
      };
    }
    return null;
  }

  /**
   * Check if valid credentials exist in secure store
   */
  public async hasCredentials(): Promise<boolean> {
    const creds = await this.getCredentials();
    return creds !== null;
  }

  /**
   * Purge all credentials and session state on logout
   */
  public async clearCredentials(): Promise<void> {
    await this.deleteItem(KEYS.CLIENT_ID);
    await this.deleteItem(KEYS.CLIENT_SECRET);
    await this.deleteItem(KEYS.TEAM_ID);
    await this.deleteItem(KEYS.BASE_URL);
    await this.deleteItem(KEYS.SESSION_META);
  }

  /**
   * Save non-sensitive session metadata
   */
  public async saveSessionMeta(meta: SessionMeta): Promise<void> {
    await this.setItem(KEYS.SESSION_META, JSON.stringify(meta));
  }

  /**
   * Retrieve non-sensitive session metadata
   */
  public async getSessionMeta(): Promise<SessionMeta | null> {
    const raw = await this.getItem(KEYS.SESSION_META);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

export const storageService = new StorageService();
