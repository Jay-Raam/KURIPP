/**
 * In-Memory Access Token Store
 * STRICT SECURITY MANDATE:
 * Never persist access tokens, refresh tokens, or secrets to localStorage,
 * sessionStorage, or IndexedDB.
 */

let inMemoryAccessToken: string | null = null;
let tokenExpiryTimestamp: number | null = null;

export const authTokenStore = {
  getToken(): string | null {
    if (tokenExpiryTimestamp && Date.now() >= tokenExpiryTimestamp) {
      inMemoryAccessToken = null;
      tokenExpiryTimestamp = null;
    }
    return inMemoryAccessToken;
  },

  setToken(token: string, expiresInSeconds: number): void {
    inMemoryAccessToken = token;
    // Set expiry 30 seconds early for proactive silent refresh
    tokenExpiryTimestamp = Date.now() + Math.max((expiresInSeconds - 30) * 1000, 5000);
  },

  clearToken(): void {
    inMemoryAccessToken = null;
    tokenExpiryTimestamp = null;
  },

  hasValidToken(): boolean {
    return Boolean(this.getToken());
  },
};
