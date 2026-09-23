import { FamilyMember } from '../types';

/**
 * Every relation a family member being invited by WhatsApp can have to an
 * existing "reference" member already in the tree.
 */
export type RelationType =
  | 'child'
  | 'parent'
  | 'spouse'
  | 'sibling'
  | 'uncle_aunt'
  | 'grandparent'
  | 'great_grandparent';

// Which of the reference member's two recorded parents to trace the relation
// through (needed for uncle/aunt, grandparent, great-grandparent). 'A' is the
// first parent on file, 'B' the second — the UI shows their actual names.
export type RelationSide = 'A' | 'B' | '';

export const RELATION_LABELS: Record<RelationType, string> = {
  child: 'Enfant de',
  parent: 'Père / Mère de',
  spouse: "Conjoint(e) de",
  sibling: 'Frère / Sœur de',
  uncle_aunt: 'Oncle / Tante de',
  grandparent: 'Grand-père / Grand-mère de',
  great_grandparent: 'Arrière-grand-père / Arrière-grand-mère de',
};

// Only these relation types need a paternal/maternal side to be picked.
export function relationNeedsSide(relation: RelationType): boolean {
  return relation === 'uncle_aunt' || relation === 'grandparent' || relation === 'great_grandparent';
}

function fullName(m?: FamilyMember): string {
  return m ? `${m.firstName} ${m.lastName}`.trim() : '';
}

function getParentOnSide(
  members: FamilyMember[],
  reference: FamilyMember,
  side: RelationSide
): FamilyMember | undefined {
  const map = new Map(members.map((m) => [m.id, m]));
  if (side === 'A') return map.get(reference.parentIds[0] || '');
  if (side === 'B') return map.get(reference.parentIds[1] || '');
  // No side specified (0 or 1 parent on file) — use whichever is known.
  return map.get(reference.parentIds[0] || '');
}

/**
 * The concrete graph links needed to place a new member relative to an
 * existing "reference" member, resolved ahead of time (before the new
 * member even has an id).
 */
export interface RelationPlan {
  resolved: boolean;
  description: string;
  // Existing member ids that should become the NEW member's parents.
  newMemberParentIds: string[];
  // Existing member ids that should become the NEW member's children.
  newMemberChildrenIds: string[];
  // Existing member id that should become the NEW member's spouse.
  newMemberSpouseId?: string;
  // Existing members whose OWN parentIds must gain the new member's id.
  patchParentIdsOn: string[];
  // Existing members whose OWN childrenIds must gain the new member's id.
  patchChildrenIdsOn: string[];
  // Existing member whose OWN spouseId must point to the new member.
  patchSpouseIdOn?: string;
}

const UNRESOLVED: Omit<RelationPlan, 'description'> = {
  resolved: false,
  newMemberParentIds: [],
  newMemberChildrenIds: [],
  patchParentIdsOn: [],
  patchChildrenIdsOn: [],
};

export function resolveRelationPlan(
  members: FamilyMember[],
  referenceId: string,
  relation: RelationType,
  side: RelationSide
): RelationPlan {
  const reference = members.find((m) => m.id === referenceId);
  if (!reference) {
    return { ...UNRESOLVED, description: 'Membre de référence introuvable.' };
  }

  switch (relation) {
    case 'child':
      return {
        resolved: true,
        description: `enfant de ${fullName(reference)}`,
        newMemberParentIds: [reference.id],
        newMemberChildrenIds: [],
        patchParentIdsOn: [],
        patchChildrenIdsOn: [reference.id],
      };

    case 'spouse':
      return {
        resolved: true,
        description: `conjoint(e) de ${fullName(reference)}`,
        newMemberParentIds: [],
        newMemberChildrenIds: [],
        newMemberSpouseId: reference.id,
        patchParentIdsOn: [],
        patchChildrenIdsOn: [],
        patchSpouseIdOn: reference.id,
      };

    case 'sibling': {
      const parentIds = reference.parentIds || [];
      if (parentIds.length === 0) {
        return {
          ...UNRESOLVED,
          description: `frère/sœur de ${fullName(reference)} (aucun parent commun connu — lien à établir manuellement)`,
        };
      }
      return {
        resolved: true,
        description: `frère/sœur de ${fullName(reference)}`,
        newMemberParentIds: parentIds,
        newMemberChildrenIds: [],
        patchParentIdsOn: [],
        patchChildrenIdsOn: parentIds,
      };
    }

    case 'parent': {
      if ((reference.parentIds || []).length >= 2) {
        return {
          ...UNRESOLVED,
          description: `parent de ${fullName(reference)} (deux parents déjà enregistrés — lien à établir manuellement)`,
        };
      }
      return {
        resolved: true,
        description: `parent de ${fullName(reference)}`,
        newMemberParentIds: [],
        newMemberChildrenIds: [reference.id],
        patchParentIdsOn: [reference.id],
        patchChildrenIdsOn: [],
      };
    }

    case 'grandparent': {
      const parent = getParentOnSide(members, reference, side);
      if (!parent) {
        return {
          ...UNRESOLVED,
          description: `grand-parent de ${fullName(reference)} (le parent correspondant n'est pas encore dans l'arbre — lien à établir manuellement)`,
        };
      }
      if ((parent.parentIds || []).length >= 2) {
        return {
          ...UNRESOLVED,
          description: `grand-parent de ${fullName(reference)} — via ${fullName(parent)} (deux parents déjà enregistrés pour ${fullName(parent)})`,
        };
      }
      return {
        resolved: true,
        description: `grand-parent de ${fullName(reference)} (parent de ${fullName(parent)})`,
        newMemberParentIds: [],
        newMemberChildrenIds: [parent.id],
        patchParentIdsOn: [parent.id],
        patchChildrenIdsOn: [],
      };
    }

    case 'uncle_aunt': {
      const parent = getParentOnSide(members, reference, side);
      if (!parent) {
        return {
          ...UNRESOLVED,
          description: `oncle/tante de ${fullName(reference)} (le parent correspondant n'est pas encore dans l'arbre — lien à établir manuellement)`,
        };
      }
      const grandparentIds = parent.parentIds || [];
      if (grandparentIds.length === 0) {
        return {
          ...UNRESOLVED,
          description: `oncle/tante de ${fullName(reference)} — frère/sœur de ${fullName(parent)} (les parents de ${fullName(parent)} ne sont pas connus — lien à établir manuellement)`,
        };
      }
      return {
        resolved: true,
        description: `oncle/tante de ${fullName(reference)} (frère/sœur de ${fullName(parent)})`,
        newMemberParentIds: grandparentIds,
        newMemberChildrenIds: [],
        patchParentIdsOn: [],
        patchChildrenIdsOn: grandparentIds,
      };
    }

    case 'great_grandparent': {
      const parent = getParentOnSide(members, reference, side);
      if (!parent) {
        return {
          ...UNRESOLVED,
          description: `arrière-grand-parent de ${fullName(reference)} (branche familiale incomplète — lien à établir manuellement)`,
        };
      }
      const grandparentId = (parent.parentIds || [])[0];
      const grandparent = grandparentId ? members.find((m) => m.id === grandparentId) : undefined;
      if (!grandparent) {
        return {
          ...UNRESOLVED,
          description: `arrière-grand-parent de ${fullName(reference)} — via ${fullName(parent)} (aucun grand-parent connu — lien à établir manuellement)`,
        };
      }
      if ((grandparent.parentIds || []).length >= 2) {
        return {
          ...UNRESOLVED,
          description: `arrière-grand-parent de ${fullName(reference)} — via ${fullName(grandparent)} (deux parents déjà enregistrés)`,
        };
      }
      return {
        resolved: true,
        description: `arrière-grand-parent de ${fullName(reference)} (parent de ${fullName(grandparent)})`,
        newMemberParentIds: [],
        newMemberChildrenIds: [grandparent.id],
        patchParentIdsOn: [grandparent.id],
        patchChildrenIdsOn: [],
      };
    }

    default:
      return { ...UNRESOLVED, description: '' };
  }
}

/**
 * Applies a resolved RelationPlan: builds the new member's parentIds/
 * spouseId and returns the patched list of all members (new member included)
 * with reciprocal links (childrenIds/parentIds/spouseId) updated on the
 * existing members it connects to.
 */
export function applyRelationPlan(
  members: FamilyMember[],
  newMember: FamilyMember,
  plan: RelationPlan
): FamilyMember[] {
  const withNew: FamilyMember[] = [
    ...members,
    {
      ...newMember,
      parentIds: plan.newMemberParentIds,
      childrenIds: plan.newMemberChildrenIds,
      spouseId: plan.newMemberSpouseId,
    },
  ];

  return withNew.map((m) => {
    if (m.id === newMember.id) return m;

    let updated = m;

    if (plan.patchChildrenIdsOn.includes(m.id) && !m.childrenIds.includes(newMember.id)) {
      updated = { ...updated, childrenIds: [...updated.childrenIds, newMember.id] };
    }
    if (plan.patchParentIdsOn.includes(m.id) && !m.parentIds.includes(newMember.id)) {
      updated = { ...updated, parentIds: [...updated.parentIds, newMember.id] };
    }
    if (plan.patchSpouseIdOn === m.id) {
      updated = { ...updated, spouseId: newMember.id };
    }

    return updated;
  });
}
