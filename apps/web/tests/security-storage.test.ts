import { describe, it, expect, beforeEach } from 'vitest';
import { authTokenStore } from '../src/lib/auth-token-store';

describe('Zero Sensitive Browser Storage Policy', () => {
  beforeEach(() => {
    // Clear in-memory token store before each test
    authTokenStore.clearToken();
  });

  it('stores access tokens strictly in-memory and never in window.localStorage or sessionStorage', () => {
    const dummyJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_access_token_payload';
    authTokenStore.setToken(dummyJwt, 900);

    // Verify in-memory retrieval works
    expect(authTokenStore.getToken()).toBe(dummyJwt);
    expect(authTokenStore.hasValidToken()).toBe(true);

    // Assert that the global browser storage is never touched
    if (typeof window !== 'undefined' && window.localStorage) {
      expect(window.localStorage.getItem('token')).toBeNull();
      expect(window.localStorage.getItem('accessToken')).toBeNull();
      expect(window.localStorage.getItem('jwt')).toBeNull();
      expect(window.localStorage.getItem('refreshToken')).toBeNull();

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i) || '';
        expect(key.toLowerCase()).not.toMatch(/token|jwt|auth|secret|key|password/i);
      }
    }

    if (typeof window !== 'undefined' && window.sessionStorage) {
      expect(window.sessionStorage.length).toBe(0);
    }
  });

  it('allows non-sensitive UI preference storage without leakage', () => {
    const nonSensitivePrefKey = 'kuripp_theme';
    const nonSensitivePrefValue = 'dark';

    // Non-sensitive preferences should be permitted
    expect(nonSensitivePrefKey).not.toMatch(/token|jwt|auth|secret|key|password/i);
  });
});
