/**
 * A simple access-code lock for the app, set by the family head.
 *
 * Important limitation: this app has no server or account system — every
 * device holds its own local copy of the data. This code is therefore a
 * per-device lock screen (like a phone's PIN), not a real account
 * password: anyone with enough technical know-how could clear the
 * browser's local storage and bypass it. It stops casual snooping on a
 * shared device; it is not real security.
 *
 * The code itself is never stored in plain text — only its SHA-256 hash —
 * so reading localStorage doesn't reveal it either.
 */

const HASH_KEY = 'family_access_code_hash_v1';
const UNLOCK_SESSION_KEY = 'family_access_unlocked_v1';

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hasAccessCode(): boolean {
  try {
    return Boolean(localStorage.getItem(HASH_KEY));
  } catch {
    return false;
  }
}

export async function setAccessCode(code: string): Promise<void> {
  const hash = await sha256(code.trim());
  try {
    localStorage.setItem(HASH_KEY, hash);
  } catch {
    // localStorage unavailable — the code can't be persisted; caller should warn the user
  }
}

export async function verifyAccessCode(code: string): Promise<boolean> {
  try {
    const stored = localStorage.getItem(HASH_KEY);
    if (!stored) return false;
    const hash = await sha256(code.trim());
    return hash === stored;
  } catch {
    return false;
  }
}

export async function changeAccessCode(currentCode: string, newCode: string): Promise<boolean> {
  const ok = await verifyAccessCode(currentCode);
  if (!ok) return false;
  await setAccessCode(newCode);
  return true;
}

// The unlock only lasts for this browser tab's session — closing the
// browser (or the tab) locks the app again next time.
export function isSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markSessionUnlocked(): void {
  try {
    sessionStorage.setItem(UNLOCK_SESSION_KEY, 'true');
  } catch {
    // ignore — worst case, the user is asked for the code again
  }
}

export function lockSession(): void {
  try {
    sessionStorage.removeItem(UNLOCK_SESSION_KEY);
  } catch {
    // ignore
  }
}
