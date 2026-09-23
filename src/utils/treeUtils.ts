import { FamilyMember } from '../types';

/**
 * Computes generation levels for each member in the family tree.
 * Roots (members with no parents in the tree) start at level 0.
 * Children are placed at parentLevel + 1.
 * If spouse has higher level, spouses are harmonized.
 */
export function computeGenerations(members: FamilyMember[]): Map<string, number> {
  const memberMap = new Map<string, FamilyMember>();
  members.forEach((m) => memberMap.set(m.id, m));

  const generations = new Map<string, number>();

  function getMemberLevel(id: string, visited = new Set<string>()): number {
    if (generations.has(id)) return generations.get(id)!;
    if (visited.has(id)) return 0; // Prevent cyclic loops
    visited.add(id);

    const member = memberMap.get(id);
    if (!member) return 0;

    // If member has parents, generation is max(parent's generation) + 1
    if (member.parentIds && member.parentIds.length > 0) {
      const parentLevels = member.parentIds
        .filter((pid) => memberMap.has(pid))
        .map((pid) => getMemberLevel(pid, new Set(visited)));

      if (parentLevels.length > 0) {
        const level = Math.max(...parentLevels) + 1;
        generations.set(id, level);
        return level;
      }
    }

    // If no parents, check if spouse has a known generation
    if (member.spouseId && memberMap.has(member.spouseId) && !visited.has(member.spouseId)) {
      const spouse = memberMap.get(member.spouseId)!;
      if (spouse.parentIds && spouse.parentIds.length > 0) {
        const spouseLevel = getMemberLevel(member.spouseId, new Set(visited));
        generations.set(id, spouseLevel);
        return spouseLevel;
      }
    }

    // Default root level
    generations.set(id, 0);
    return 0;
  }

  members.forEach((m) => getMemberLevel(m.id));

  // Harmonize spouses so they belong to the same generation level
  members.forEach((m) => {
    if (m.spouseId && generations.has(m.spouseId)) {
      const myLevel = generations.get(m.id) ?? 0;
      const spouseLevel = generations.get(m.spouseId) ?? 0;
      const harmonized = Math.max(myLevel, spouseLevel);
      generations.set(m.id, harmonized);
      generations.set(m.spouseId, harmonized);
    }
  });

  return generations;
}

/**
 * Returns generation labels in French
 */
export function getGenerationLabel(genIndex: number): string {
  switch (genIndex) {
    case 0:
      return 'Génération 1 • Aïeux / Grands-parents';
    case 1:
      return 'Génération 2 • Parents, Oncles & Tantes';
    case 2:
      return 'Génération 3 • Enfants, Neveux & Cousins';
    case 3:
      return 'Génération 4 • Petits-enfants';
    case 4:
      return 'Génération 5 • Arrière-petits-enfants';
    default:
      return `Génération ${genIndex + 1}`;
  }
}

/**
 * Find direct family relations for a member
 */
export interface MemberRelations {
  parents: FamilyMember[];
  spouse?: FamilyMember;
  siblings: FamilyMember[];
  children: FamilyMember[];
}

export function getMemberRelations(member: FamilyMember, allMembers: FamilyMember[]): MemberRelations {
  const memberMap = new Map<string, FamilyMember>();
  allMembers.forEach((m) => memberMap.set(m.id, m));

  const parents = member.parentIds
    .map((id) => memberMap.get(id))
    .filter((m): m is FamilyMember => Boolean(m));

  const spouse = member.spouseId ? memberMap.get(member.spouseId) : undefined;

  // Children: either listed in member.childrenIds or having this member in their parentIds
  const children = allMembers.filter((m) => {
    return (
      (member.childrenIds && member.childrenIds.includes(m.id)) ||
      (m.parentIds && m.parentIds.includes(member.id))
    );
  });

  // Siblings: different person, sharing at least one parent
  const siblings = allMembers.filter((m) => {
    if (m.id === member.id) return false;
    if (!member.parentIds || member.parentIds.length === 0) return false;
    return m.parentIds && m.parentIds.some((pid) => member.parentIds.includes(pid));
  });

  return {
    parents,
    spouse,
    siblings,
    children,
  };
}
