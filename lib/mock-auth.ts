/**
 * TODO: replace with real Supabase auth.
 * This mock allows full app navigation and development without SMS/OTP costs.
 * When ready: remove this file, use real supabase.auth in login + index.
 */

let mockAuthenticated = false;

export function setMockAuthenticated(): void {
  mockAuthenticated = true;
}

export function getMockAuthenticated(): boolean {
  return mockAuthenticated;
}

export function clearMockAuth(): void {
  mockAuthenticated = false;
}
