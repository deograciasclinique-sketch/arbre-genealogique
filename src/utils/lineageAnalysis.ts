import { FamilyMember } from '../types';
import { computeGenerations, getGenerationLabel } from './treeUtils';

export interface GenerationBreakdown {
  genIndex: number;
  label: string;
  shortLabel: string;
  members: FamilyMember[];
  totalCount: number;
  livingCount: number;
  deceasedCount: number;
  percentage: number;
  rootAncestorsCount: number;
  birthRange: string;
  averageChildren: number;
}

export interface MemberDescendantStats {
  member: FamilyMember;
  generationIndex: number;
  directChildren: FamilyMember[];
  directChildrenCount: number;
  allDescendants: FamilyMember[];
  totalDescendantsCount: number;
  knownAncestors: FamilyMember[];
  knownAncestorsCount: number;
  isRootAncestor: boolean;
  descendantSharePercentage: number; // Percentage of the tree that stems from this member
}

export interface LineageOverviewStats {
  totalGenerations: number;
  rootAncestorsCount: number;
  parentsCount: number;
  childlessCount: number;
  averageChildrenPerParent: number;
  topDescendantLeader: MemberDescendantStats | null;
  generations: GenerationBreakdown[];
  memberStats: MemberDescendantStats[];
}

/**
 * Returns direct children of a family member (1st degree descendants).
 */
export function getDirectChildren(member: FamilyMember, allMembers: FamilyMember[]): FamilyMember[] {
  const memberMap = new Map<string, FamilyMember>();
  allMembers.forEach((m) => memberMap.set(m.id, m));

  return allMembers.filter((m) => {
    const isDirectChildId = member.childrenIds && member.childrenIds.includes(m.id);
    const hasParentId = m.parentIds && m.parentIds.includes(member.id);
    return Boolean(isDirectChildId || hasParentId);
  });
}

/**
 * Returns all recursive descendants of a family member (children, grandchildren, etc.).
 */
export function getAllDescendants(member: FamilyMember, allMembers: FamilyMember[]): FamilyMember[] {
  const visited = new Set<string>();
  const descendants: FamilyMember[] = [];

  function traverse(current: FamilyMember) {
    const children = getDirectChildren(current, allMembers);
    for (const child of children) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        descendants.push(child);
        traverse(child);
      }
    }
  }

  traverse(member);
  return descendants;
}

/**
 * Returns all direct known ancestors of a family member (parents, grandparents, etc.).
 */
export function getAllAncestors(member: FamilyMember, allMembers: FamilyMember[]): FamilyMember[] {
  const memberMap = new Map<string, FamilyMember>();
  allMembers.forEach((m) => memberMap.set(m.id, m));

  const visited = new Set<string>();
  const ancestors: FamilyMember[] = [];

  function traverse(current: FamilyMember) {
    if (!current.parentIds || current.parentIds.length === 0) return;
    for (const pid of current.parentIds) {
      const parent = memberMap.get(pid);
      if (parent && !visited.has(parent.id)) {
        visited.add(parent.id);
        ancestors.push(parent);
        traverse(parent);
      }
    }
  }

  traverse(member);
  return ancestors;
}

/**
 * Computes full lineage analytics:
 * - Generation distribution of ancestors & members
 * - Direct children count and overall descendant network per member
 */
export function analyzeLineage(members: FamilyMember[]): LineageOverviewStats {
  if (members.length === 0) {
    return {
      totalGenerations: 0,
      rootAncestorsCount: 0,
      parentsCount: 0,
      childlessCount: 0,
      averageChildrenPerParent: 0,
      topDescendantLeader: null,
      generations: [],
      memberStats: [],
    };
  }

  const generationsMap = computeGenerations(members);
  const memberMap = new Map<string, FamilyMember>();
  members.forEach((m) => memberMap.set(m.id, m));

  // 1. Calculate stats per member
  const memberStats: MemberDescendantStats[] = members.map((member) => {
    const genIndex = generationsMap.get(member.id) ?? 0;
    const directChildren = getDirectChildren(member, members);
    const allDescendants = getAllDescendants(member, members);
    const knownAncestors = getAllAncestors(member, members);
    const isRootAncestor =
      !member.parentIds ||
      member.parentIds.length === 0 ||
      member.parentIds.every((pid) => !memberMap.has(pid));

    const descendantSharePercentage =
      members.length > 0
        ? Math.round((allDescendants.length / members.length) * 100)
        : 0;

    return {
      member,
      generationIndex: genIndex,
      directChildren,
      directChildrenCount: directChildren.length,
      allDescendants,
      totalDescendantsCount: allDescendants.length,
      knownAncestors,
      knownAncestorsCount: knownAncestors.length,
      isRootAncestor,
      descendantSharePercentage,
    };
  });

  // Sort members by direct children count descending by default
  memberStats.sort((a, b) => {
    if (b.directChildrenCount !== a.directChildrenCount) {
      return b.directChildrenCount - a.directChildrenCount;
    }
    return b.totalDescendantsCount - a.totalDescendantsCount;
  });

  // 2. Group by Generation
  const maxGen = Math.max(...Array.from(generationsMap.values()), 0);
  const generations: GenerationBreakdown[] = [];

  for (let g = 0; g <= maxGen; g++) {
    const genMembers = members.filter((m) => (generationsMap.get(m.id) ?? 0) === g);
    if (genMembers.length === 0) continue;

    const livingCount = genMembers.filter((m) => !m.isDeceased).length;
    const deceasedCount = genMembers.filter((m) => m.isDeceased).length;
    const rootAncestorsCount = genMembers.filter((m) => {
      const stats = memberStats.find((s) => s.member.id === m.id);
      return stats?.isRootAncestor;
    }).length;

    // Birth dates range
    const birthYears = genMembers
      .map((m) => {
        const yr = parseInt(m.birthDate?.slice(0, 4) || '', 10);
        return isNaN(yr) ? null : yr;
      })
      .filter((yr): yr is number => yr !== null)
      .sort((a, b) => a - b);

    let birthRange = 'Dates non renseignées';
    if (birthYears.length === 1) {
      birthRange = `Né(s) env. ${birthYears[0]}`;
    } else if (birthYears.length > 1) {
      birthRange = `${birthYears[0]} — ${birthYears[birthYears.length - 1]}`;
    }

    // Average children per member in this generation
    const genChildrenCounts = genMembers.map((m) => {
      const stats = memberStats.find((s) => s.member.id === m.id);
      return stats ? stats.directChildrenCount : 0;
    });
    const totalGenChildren = genChildrenCounts.reduce((acc, c) => acc + c, 0);
    const avgChildren =
      genMembers.length > 0
        ? Math.round((totalGenChildren / genMembers.length) * 10) / 10
        : 0;

    generations.push({
      genIndex: g,
      label: getGenerationLabel(g),
      shortLabel: `Génération ${g + 1}`,
      members: genMembers,
      totalCount: genMembers.length,
      livingCount,
      deceasedCount,
      percentage: Math.round((genMembers.length / members.length) * 100),
      rootAncestorsCount,
      birthRange,
      averageChildren: avgChildren,
    });
  }

  // 3. Global indicators
  const rootAncestorsCount = memberStats.filter((s) => s.isRootAncestor).length;
  const parents = memberStats.filter((s) => s.directChildrenCount > 0);
  const parentsCount = parents.length;
  const childlessCount = memberStats.length - parentsCount;

  const totalChildrenCount = parents.reduce((sum, s) => sum + s.directChildrenCount, 0);
  const averageChildrenPerParent =
    parentsCount > 0 ? Math.round((totalChildrenCount / parentsCount) * 10) / 10 : 0;

  // Person with highest direct/total descendants
  const topDescendantLeader = memberStats[0]?.directChildrenCount > 0 ? memberStats[0] : null;

  return {
    totalGenerations: generations.length,
    rootAncestorsCount,
    parentsCount,
    childlessCount,
    averageChildrenPerParent,
    topDescendantLeader,
    generations,
    memberStats,
  };
}
