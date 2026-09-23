import { FamilyMember } from '../types';

export interface UpcomingBirthdayItem {
  member: FamilyMember;
  day: number;
  month: number; // 1 - 12
  birthYear: number;
  turningAge: number;
  daysLeft: number; // 0 = today, 1 = tomorrow...
  formattedDate: string; // e.g. "18 septembre"
  formattedFullDate: string; // e.g. "18/09/1976"
  status: 'today' | 'tomorrow' | 'this_week' | 'this_month' | 'later';
  relativeLabel: string;
  isMilestoneAge: boolean; // e.g. 18, 20, 30, 40, 50, 60, 70, 80, 90, 100
}

const MONTH_NAMES_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

export function getMonthNameFr(monthIndex1to12: number): string {
  return MONTH_NAMES_FR[monthIndex1to12 - 1] || '';
}

/**
 * Calculates all upcoming birthdays for family members, sorted chronologically from nearest to farthest.
 */
export function getUpcomingBirthdays(
  members: FamilyMember[],
  options: { maxDays?: number; includeDeceased?: boolean } = {}
): UpcomingBirthdayItem[] {
  const { maxDays = 365, includeDeceased = false } = options;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayYear = today.getFullYear();

  const results: UpcomingBirthdayItem[] = [];

  for (const member of members) {
    if (!includeDeceased && member.isDeceased) {
      continue;
    }

    if (!member.birthDate || !member.birthDate.includes('-')) {
      continue;
    }

    const parts = member.birthDate.split('-');
    if (parts.length < 3) continue;

    const birthYear = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(birthYear) || isNaN(month) || isNaN(day)) {
      continue;
    }

    // Determine the next birthday date
    let nextBday = new Date(todayYear, month - 1, day, 0, 0, 0, 0);
    if (nextBday.getTime() < today.getTime()) {
      nextBday = new Date(todayYear + 1, month - 1, day, 0, 0, 0, 0);
    }

    const diffMs = nextBday.getTime() - today.getTime();
    const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft > maxDays) {
      continue;
    }

    const turningAge = nextBday.getFullYear() - birthYear;
    const isMilestoneAge = turningAge > 0 && (turningAge % 10 === 0 || turningAge === 18 || turningAge === 25);

    let status: UpcomingBirthdayItem['status'] = 'later';
    let relativeLabel = `Dans ${daysLeft} jours`;

    if (daysLeft === 0) {
      status = 'today';
      relativeLabel = "Aujourd'hui ! 🎂";
    } else if (daysLeft === 1) {
      status = 'tomorrow';
      relativeLabel = 'Demain';
    } else if (daysLeft <= 7) {
      status = 'this_week';
      relativeLabel = `Dans ${daysLeft} jours`;
    } else if (daysLeft <= 31) {
      status = 'this_month';
      relativeLabel = `Dans ${daysLeft} jours`;
    }

    const formattedDate = `${day} ${getMonthNameFr(month)}`;
    const formattedFullDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${birthYear}`;

    results.push({
      member,
      day,
      month,
      birthYear,
      turningAge,
      daysLeft,
      formattedDate,
      formattedFullDate,
      status,
      relativeLabel,
      isMilestoneAge,
    });
  }

  // Sort by earliest next birthday
  return results.sort((a, b) => a.daysLeft - b.daysLeft);
}
