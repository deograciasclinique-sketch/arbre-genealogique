/**
 * Utilities for the "Demander une fiche par WhatsApp" flow.
 *
 * The app has no shared backend: everything lives in each device's localStorage.
 * To let a relative fill their own member card on their phone and have it come
 * back into the tree owner's app, we round-trip a small encoded payload through
 * a URL:
 *
 *  1. Owner picks an optional relation (child/spouse of an existing member) and
 *     generates a "request" link: /?remplir=<payload>
 *  2. That link is sent via WhatsApp (wa.me). The relative opens it — the app
 *     detects `remplir` and shows a standalone public form (no access to the
 *     rest of the family data).
 *  3. On submit, the relative gets a "reply" link: /?fiche=<payload> and a
 *     ready-made WhatsApp message to send back.
 *  4. When the owner opens that link (or pastes it), the app detects `fiche`
 *     and shows an import/preview modal — one click adds the member to the tree.
 */

import { RelationType, RelationSide } from './relationUtils';

export interface InviteRequestPayload {
  v: 2;
  type: 'request';
  familyName: string;
  referenceId?: string;
  referenceName?: string;
  relation?: RelationType;
  side?: RelationSide;
  relationLabel?: string; // human-readable summary shown to the invitee
  requesterName?: string;
  note?: string;
}

export interface InviteSubmissionPayload {
  v: 2;
  type: 'submission';
  familyName: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F' | 'other';
  birthDate?: string;
  birthPlace?: string;
  currentResidence?: string;
  occupation?: string;
  bio?: string;
  photoUrl?: string;
  referenceId?: string;
  referenceName?: string;
  relation?: RelationType;
  side?: RelationSide;
  relationLabel?: string;
}

// Unicode-safe base64 (handles accented French text)
export function encodePayload(payload: InviteRequestPayload | InviteSubmissionPayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodePayload<T>(encoded: string): T | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('Impossible de décoder le lien reçu:', e);
    return null;
  }
}

export function buildAppUrl(paramName: 'remplir' | 'fiche', encoded: string): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set(paramName, encoded);
  return url.toString();
}

export function buildWhatsAppLink(message: string, phone?: string): string {
  const cleanPhone = phone ? phone.replace(/[^\d+]/g, '') : '';
  const base = cleanPhone ? `https://wa.me/${cleanPhone.replace(/^\+/, '')}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(message)}`;
}
