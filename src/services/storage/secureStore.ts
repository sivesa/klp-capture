/**
 * secureStore.ts
 *
 * Thin wrapper around @capacitor/preferences providing AES-GCM
 * encryption for sensitive fields.
 *
 * On iOS  → Capacitor Preferences delegates to NSUserDefaults + Keychain
 * On Android → EncryptedSharedPreferences (Jetpack Security)
 * On Web/Dev → localStorage (no hardware backing – dev only)
 *
 * In production swap the encrypt/decrypt stubs for a key derived from
 * the device Keychain via @capacitor/secure-storage-plugin.
 */

import type { AuthToken, User } from '../../types';

const KEYS = {
  AUTH_TOKEN:  'klp_auth_token',
  USER:        'klp_user',
  DEVICE_ID:   'klp_device_id',
  APP_STATS:   'klp_app_stats',
} as const;

type StorageKey = typeof KEYS[keyof typeof KEYS];

class SecureStore {
  private readonly prefix = 'klp_enc_';

  // ── Encryption stubs (replace with SubtleCrypto AES-GCM in production) ───
  private async encrypt(value: string): Promise<string> {
    return btoa(encodeURIComponent(value));
  }
  private async decrypt(value: string): Promise<string> {
    try { return decodeURIComponent(atob(value)); }
    catch { return value; }
  }

  // ── Core get/set/remove ───────────────────────────────────────────────────
  async set<T>(key: StorageKey, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    const encrypted  = await this.encrypt(serialized);
    // Production: await Preferences.set({ key, value: encrypted });
    localStorage.setItem(this.prefix + key, encrypted);
  }

  async get<T>(key: StorageKey): Promise<T | null> {
    // Production: const { value } = await Preferences.get({ key });
    const raw = localStorage.getItem(this.prefix + key);
    if (raw === null) return null;
    const decrypted = await this.decrypt(raw);
    try { return JSON.parse(decrypted) as T; }
    catch { return null; }
  }

  async remove(key: StorageKey): Promise<void> {
    // Production: await Preferences.remove({ key });
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    for (const k of Object.values(KEYS)) {
      localStorage.removeItem(this.prefix + k);
    }
  }

  // ── Typed convenience helpers ─────────────────────────────────────────────
  async saveToken(token: AuthToken): Promise<void> { await this.set(KEYS.AUTH_TOKEN, token); }
  async getToken(): Promise<AuthToken | null>       { return this.get<AuthToken>(KEYS.AUTH_TOKEN); }

  async saveUser(user: User): Promise<void>  { await this.set(KEYS.USER, user); }
  async getUser(): Promise<User | null>      { return this.get<User>(KEYS.USER); }

  async clearAuth(): Promise<void> {
    await this.remove(KEYS.AUTH_TOKEN);
    await this.remove(KEYS.USER);
  }

  async getDeviceId(): Promise<string> {
    let id = await this.get<string>(KEYS.DEVICE_ID);
    if (!id) { id = crypto.randomUUID(); await this.set(KEYS.DEVICE_ID, id); }
    return id;
  }
}

export const secureStore = new SecureStore();
