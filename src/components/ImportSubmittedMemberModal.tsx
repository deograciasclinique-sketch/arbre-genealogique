import React, { useMemo } from 'react';
import { FamilyMember } from '../types';
import { InviteSubmissionPayload } from '../utils/inviteUtils';
import { resolveRelationPlan, RelationPlan } from '../utils/relationUtils';
import { X, UserCheck, User, Check } from 'lucide-react';

interface ImportSubmittedMemberModalProps {
  submission: InviteSubmissionPayload;
  allMembers: FamilyMember[];
  onConfirm: (member: FamilyMember, plan: RelationPlan) => void;
  onDismiss: () => void;
}

export const ImportSubmittedMemberModal: React.FC<ImportSubmittedMemberModalProps> = ({
  submission,
  allMembers,
  onConfirm,
  onDismiss,
}) => {
  const referenceExists = submission.referenceId
    ? allMembers.some((m) => m.id === submission.referenceId)
    : false;

  const plan: RelationPlan | null = useMemo(() => {
    if (!referenceExists || !submission.referenceId || !submission.relation) return null;
    return resolveRelationPlan(allMembers, submission.referenceId, submission.relation, submission.side || '');
  }, [allMembers, referenceExists, submission.referenceId, submission.relation, submission.side]);

  const handleAdd = () => {
    const newMember: FamilyMember = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      firstName: submission.firstName,
      lastName: submission.lastName,
      gender: submission.gender,
      birthDate: submission.birthDate || '',
      photoUrl: submission.photoUrl || '',
      bio: submission.bio,
      occupation: submission.occupation,
      birthPlace: submission.birthPlace,
      currentResidence: submission.currentResidence,
      parentIds: [],
      childrenIds: [],
    };

    onConfirm(
      newMember,
      plan && plan.resolved
        ? plan
        : {
            resolved: false,
            description: '',
            newMemberParentIds: [],
            newMemberChildrenIds: [],
            patchParentIdsOn: [],
            patchChildrenIdsOn: [],
          }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
      <div className="card-elegant rounded-3xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100">
          <h2 className="text-lg font-bold font-serif text-stone-900 flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-[#a8791f]" strokeWidth={1.75} />
            <span>Fiche reçue</span>
          </h2>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-sm text-stone-600">
            Voici la fiche que votre proche a remplie. Vérifiez les informations puis ajoutez-la à
            l'arbre.
          </p>

          <div className="flex items-center gap-3 bg-stone-50 border border-stone-200/70 rounded-2xl p-3.5">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center overflow-hidden ring-1 ring-stone-900/[0.08] shrink-0">
              {submission.photoUrl ? (
                <img src={submission.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-stone-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-stone-900 truncate">
                {submission.firstName} {submission.lastName}
              </p>
              <p className="text-xs text-stone-500 truncate">
                {submission.occupation || (submission.birthDate ? `Né(e) le ${submission.birthDate}` : 'Détails à venir')}
              </p>
            </div>
          </div>

          <dl className="text-sm space-y-1.5">
            {submission.birthDate && (
              <div className="flex justify-between">
                <dt className="text-stone-400">Naissance</dt>
                <dd className="text-stone-800">{submission.birthDate}</dd>
              </div>
            )}
            {submission.birthPlace && (
              <div className="flex justify-between">
                <dt className="text-stone-400">Lieu de naissance</dt>
                <dd className="text-stone-800">{submission.birthPlace}</dd>
              </div>
            )}
            {submission.currentResidence && (
              <div className="flex justify-between">
                <dt className="text-stone-400">Résidence</dt>
                <dd className="text-stone-800">{submission.currentResidence}</dd>
              </div>
            )}
          </dl>

          {plan ? (
            <div
              className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 border ${
                plan.resolved
                  ? 'text-[#8a6317] bg-[#faf4e6] border-[#a8791f]/25'
                  : 'text-stone-500 bg-stone-50 border-stone-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {plan.resolved ? (
                  <>
                    Sera ajouté(e) comme <strong>{plan.description}</strong>, avec le lien
                    automatiquement établi.
                  </>
                ) : (
                  <>{plan.description || "Lien de parenté à établir manuellement après l'ajout."}</>
                )}
              </span>
            </div>
          ) : submission.relationLabel ? (
            <div className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
              Le membre lié à cette invitation ({submission.referenceName}) n'existe plus dans
              l'arbre — la fiche sera ajoutée sans lien de parenté ; vous pourrez le faire
              manuellement ensuite.
            </div>
          ) : (
            <div className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
              Aucun lien de parenté n'était précisé — vous pourrez le rattacher à la famille après
              l'ajout.
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 px-4 py-2.5 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-100 text-sm font-medium transition-colors"
            >
              Ignorer
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-[#e4c680] text-sm font-semibold transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Ajouter à l'arbre</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
