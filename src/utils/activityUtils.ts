import { ActivityLogItem, ActivityType } from '../types';

export const ACTIVITY_STORAGE_KEY = 'family_genealogy_activity_log_v1';

// The app starts with an empty activity log — no demo entries.
export const INITIAL_ACTIVITIES: ActivityLogItem[] = [];

/**
 * Formats an ISO date into a readable relative or absolute French time label
 */
export function formatActivityTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Récemment';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return "À l'instant";
    }
    if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} min`;
    }
    if (diffHours < 24 && now.getDate() === date.getDate()) {
      const hoursStr = date.getHours().toString().padStart(2, '0');
      const minsStr = date.getMinutes().toString().padStart(2, '0');
      return `Aujourd'hui à ${hoursStr}:${minsStr}`;
    }
    if (diffDays === 1 || (diffHours < 48 && now.getDate() - date.getDate() === 1)) {
      const hoursStr = date.getHours().toString().padStart(2, '0');
      const minsStr = date.getMinutes().toString().padStart(2, '0');
      return `Hier à ${hoursStr}:${minsStr}`;
    }
    if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    }

    // Default formatted date
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Récemment';
  }
}

/**
 * Returns visual meta for an activity type
 */
export function getActivityTypeMeta(type: ActivityType): {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  iconBg: string;
  iconColor: string;
} {
  switch (type) {
    case 'member_add':
      return {
        label: 'Ajout de membre',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-900',
        borderClass: 'border-emerald-200',
        iconBg: 'bg-emerald-500',
        iconColor: 'text-white',
      };
    case 'member_edit':
      return {
        label: 'Modification',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-900',
        borderClass: 'border-amber-200',
        iconBg: 'bg-amber-500',
        iconColor: 'text-white',
      };
    case 'member_delete':
      return {
        label: 'Suppression',
        badgeBg: 'bg-rose-100',
        badgeText: 'text-rose-900',
        borderClass: 'border-rose-200',
        iconBg: 'bg-rose-500',
        iconColor: 'text-white',
      };
    case 'event_add':
      return {
        label: 'Événement ajouté',
        badgeBg: 'bg-indigo-100',
        badgeText: 'text-indigo-900',
        borderClass: 'border-indigo-200',
        iconBg: 'bg-indigo-500',
        iconColor: 'text-white',
      };
    case 'event_edit':
      return {
        label: 'Événement modifié',
        badgeBg: 'bg-sky-100',
        badgeText: 'text-sky-900',
        borderClass: 'border-sky-200',
        iconBg: 'bg-sky-500',
        iconColor: 'text-white',
      };
    case 'event_delete':
      return {
        label: 'Événement supprimé',
        badgeBg: 'bg-stone-200',
        badgeText: 'text-stone-800',
        borderClass: 'border-stone-300',
        iconBg: 'bg-stone-500',
        iconColor: 'text-white',
      };
    case 'tree_reset':
      return {
        label: 'Réinitialisation',
        badgeBg: 'bg-orange-100',
        badgeText: 'text-orange-900',
        borderClass: 'border-orange-200',
        iconBg: 'bg-orange-500',
        iconColor: 'text-white',
      };
    case 'tree_import':
      return {
        label: 'Import de données',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-900',
        borderClass: 'border-purple-200',
        iconBg: 'bg-purple-500',
        iconColor: 'text-white',
      };
    default:
      return {
        label: 'Activité',
        badgeBg: 'bg-stone-100',
        badgeText: 'text-stone-800',
        borderClass: 'border-stone-200',
        iconBg: 'bg-stone-500',
        iconColor: 'text-white',
      };
  }
}
