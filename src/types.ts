export type Gender = 'M' | 'F' | 'other';

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD or YYYY
  deathDate?: string; // YYYY-MM-DD or YYYY
  isDeceased?: boolean;
  photoUrl: string;
  bio?: string;
  occupation?: string;
  birthPlace?: string;
  currentResidence?: string;
  parentIds: string[]; // IDs of parents
  spouseId?: string; // ID of spouse/partner
  childrenIds: string[]; // IDs of children
  notes?: string;
  generation?: number; // Calculated or assigned generation (0 = root/oldest, 1, 2, 3...)
}

export type EventType =
  | 'birth'
  | 'wedding'
  | 'anniversary'
  | 'graduation'
  | 'career'
  | 'relocation'
  | 'achievement'
  | 'reunion'
  | 'memorial'
  | 'journey'
  | 'other';

export interface FamilyEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD or YYYY
  type: EventType;
  description: string;
  memberIds: string[]; // IDs of members involved
  location?: string;
  photoUrl?: string;
  isHighlight?: boolean;
}

export type ActivityType =
  | 'member_add'
  | 'member_edit'
  | 'member_delete'
  | 'event_add'
  | 'event_edit'
  | 'event_delete'
  | 'tree_reset'
  | 'tree_import';

export interface ActivityLogItem {
  id: string;
  timestamp: string; // ISO date string
  type: ActivityType;
  title: string;
  details: string;
  targetName: string;
  targetPhotoUrl?: string;
  targetId?: string;
}

export interface FamilyData {
  familyName: string;
  motto?: string;
  members: FamilyMember[];
  events: FamilyEvent[];
}

export interface AgeCalculation {
  age: number | null;
  displayText: string;
  isLiving: boolean;
  yearsRangeText: string;
}

/**
 * Calculates age and formatted date string for a family member
 */
export function calculateAge(birthDateStr?: string, deathDateStr?: string, isDeceased?: boolean): AgeCalculation {
  if (!birthDateStr) {
    return {
      age: null,
      displayText: 'Âge inconnu',
      isLiving: !isDeceased,
      yearsRangeText: '',
    };
  }

  const birthYear = parseInt(birthDateStr.split('-')[0], 10);
  if (isNaN(birthYear)) {
    return {
      age: null,
      displayText: 'Âge inconnu',
      isLiving: !isDeceased,
      yearsRangeText: '',
    };
  }

  const currentYear = new Date().getFullYear();
  const deathYear = deathDateStr ? parseInt(deathDateStr.split('-')[0], 10) : null;
  const isPassed = Boolean(isDeceased || deathDateStr);

  if (isPassed) {
    const endYear = deathYear && !isNaN(deathYear) ? deathYear : currentYear;
    const ageAtDeath = Math.max(0, endYear - birthYear);
    return {
      age: ageAtDeath,
      displayText: `Décédé(e) à ${ageAtDeath} an${ageAtDeath > 1 ? 's' : ''}`,
      isLiving: false,
      yearsRangeText: `${birthYear} - ${deathYear || '?'} (${ageAtDeath} ans)`,
    };
  }

  const age = Math.max(0, currentYear - birthYear);
  return {
    age,
    displayText: `${age} an${age > 1 ? 's' : ''}`,
    isLiving: true,
    yearsRangeText: `Né(e) en ${birthYear} (${age} ans)`,
  };
}

export const EVENT_TYPE_INFO: Record<
  EventType,
  { label: string; iconName: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  birth: {
    label: 'Naissance',
    iconName: 'Baby',
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
  },
  wedding: {
    label: 'Mariage & Union',
    iconName: 'Heart',
    colorClass: 'text-rose-700',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
  },
  anniversary: {
    label: 'Anniversaire & Fête',
    iconName: 'Cake',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
  },
  graduation: {
    label: 'Diplôme & Études',
    iconName: 'GraduationCap',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  career: {
    label: 'Carrière & Projet',
    iconName: 'Briefcase',
    colorClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
  },
  relocation: {
    label: 'Déménagement & Maison',
    iconName: 'Home',
    colorClass: 'text-teal-700',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200',
  },
  achievement: {
    label: 'Exploit & Distinction',
    iconName: 'Award',
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
  },
  journey: {
    label: 'Voyage mémorable',
    iconName: 'Compass',
    colorClass: 'text-cyan-700',
    bgClass: 'bg-cyan-50',
    borderClass: 'border-cyan-200',
  },
  reunion: {
    label: 'Réunion de famille',
    iconName: 'Users',
    colorClass: 'text-amber-800',
    bgClass: 'bg-amber-100/70',
    borderClass: 'border-amber-300',
  },
  memorial: {
    label: 'Hommage & Souvenir',
    iconName: 'Sparkles',
    colorClass: 'text-stone-700',
    bgClass: 'bg-stone-100',
    borderClass: 'border-stone-300',
  },
  other: {
    label: 'Autre événement',
    iconName: 'Calendar',
    colorClass: 'text-slate-700',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-300',
  },
};
