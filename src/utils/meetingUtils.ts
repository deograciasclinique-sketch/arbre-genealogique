/**
 * Family video meetings, powered by Jitsi Meet (meet.jit.si) — a free,
 * account-free video call service reachable straight from a browser. The
 * app has no video/signaling server of its own, so this is the practical
 * way to offer "call the whole family" without building that infrastructure.
 *
 * The room name doubles as the "password": anyone with the link can join,
 * nobody else can guess it. It's generated once per family and kept in
 * localStorage so the same room is reused across sessions on this device.
 */

const ROOM_STORAGE_KEY = 'family_meeting_room_v1';

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .slice(0, 24);
}

function randomCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function getOrCreateMeetingRoom(familyName: string): string {
  try {
    const saved = localStorage.getItem(ROOM_STORAGE_KEY);
    if (saved) return saved;
  } catch {
    // localStorage unavailable — fall through to generating a fresh room each time
  }

  const room = `Famille-${slugify(familyName) || 'Reunion'}-${randomCode()}`;
  try {
    localStorage.setItem(ROOM_STORAGE_KEY, room);
  } catch {
    // ignore — non-persistent room is still usable for this session
  }
  return room;
}

export function createNewMeetingRoom(familyName: string): string {
  const room = `Famille-${slugify(familyName) || 'Reunion'}-${randomCode()}`;
  try {
    localStorage.setItem(ROOM_STORAGE_KEY, room);
  } catch {
    // ignore
  }
  return room;
}

export function buildMeetingUrl(room: string): string {
  return `https://meet.jit.si/${encodeURIComponent(room)}`;
}

export function buildMeetingEmbedUrl(room: string, displayName?: string): string {
  const params = new URLSearchParams({
    'config.prejoinPageEnabled': 'true',
    'userInfo.displayName': displayName || '',
  });
  return `https://meet.jit.si/${encodeURIComponent(room)}#${params.toString()}`;
}
