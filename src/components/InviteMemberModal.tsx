import React, { useMemo, useState } from 'react';
import { FamilyMember } from '../types';
import { encodePayload, buildAppUrl, buildWhatsAppLink, InviteRequestPayload } from '../utils/inviteUtils';
import {
  RelationType,
  RelationSide,
  RELATION_LABELS,
  relationNeedsSide,
  resolveRelationPlan,
} from '../utils/relationUtils';
import { X, Send, Copy, Check, MessageCircleHeart, UserCheck } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyName: string;
  allMembers: FamilyMember[];
  presetReferenceId?: string;
  presetRelation?: RelationType;
}

const RELATION_ORDER: RelationType[] = [
  'child',
  'parent',
  'spouse',
  'sibling',
  'uncle_aunt',
  'grandparent',
  'great_grandparent',
];

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  familyName,
  allMembers,
  presetReferenceId,
  presetRelation,
}) => {
  const [referenceId, setReferenceId] = useState(presetReferenceId || '');
  const [relation, setRelation] = useState<RelationType | ''>(presetRelation || '');
  const [side, setSide] = useState<RelationSide>('');
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);

  const sortedMembers = useMemo(
    () => [...allMembers].sort((a, b) => a.firstName.localeCompare(b.firstName)),
    [allMembers]
  );

  if (!isOpen) return null;

  const reference = allMembers.find((m) => m.id === referenceId);
  const needsSide = relation ? relationNeedsSide(relation) : false;
  const parentA = reference?.parentIds[0] ? allMembers.find((m) => m.id === reference.parentIds[0]) : undefined;
  const parentB = reference?.parentIds[1] ? allMembers.find((m) => m.id === reference.parentIds[1]) : undefined;

  const plan =
    reference && relation
      ? resolveRelationPlan(allMembers, reference.id, relation, side)
      : null;

  const payload: InviteRequestPayload = {
    v: 2,
    type: 'request',
    familyName,
    referenceId: reference?.id,
    referenceName: reference ? `${reference.firstName} ${reference.lastName}` : undefined,
    relation: relation || undefined,
    side: needsSide ? side : '',
    relationLabel: plan?.description,
  };

  const encoded = encodePayload(payload);
  const link = buildAppUrl('remplir', encoded);

  const message = `Bonjour ! Nous complétons l'arbre généalogique de la famille ${
    familyName || ''
  }. Peux-tu remplir ta fiche${plan ? ` (${plan.description})` : ''} en 2 minutes ? ${link}`;

  const whatsappLink = buildWhatsAppLink(message, phone);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may be unavailable; user can still select the text field manually
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
      <div className="card-elegant rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100">
          <h2 className="text-lg font-bold font-serif text-stone-900 flex items-center gap-2.5">
            <MessageCircleHeart className="w-5 h-5 text-[#a8791f]" strokeWidth={1.75} />
            <span>Inviter un proche par WhatsApp</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <p className="text-sm text-stone-600">
            Générez un lien de formulaire que votre proche remplit lui-même sur son téléphone.
            Une fois terminé, il vous renvoie automatiquement un lien de retour — un clic suffit
            pour l'ajouter à l'arbre, avec le lien de parenté déjà établi.
          </p>

          {allMembers.length === 0 ? (
            <div className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5">
              Ajoutez au moins un premier membre à l'arbre pour pouvoir préciser un lien de
              parenté. Vous pouvez tout de même envoyer une invitation sans lien précisé.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Cette personne est
                </label>
                <select
                  value={relation}
                  onChange={(e) => {
                    setRelation(e.target.value as RelationType | '');
                    setSide('');
                  }}
                  className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
                >
                  <option value="">— Non précisé —</option>
                  {RELATION_ORDER.map((r) => (
                    <option key={r} value={r}>
                      {RELATION_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Membre de référence
                </label>
                <select
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  disabled={!relation}
                  className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20 disabled:opacity-50"
                >
                  <option value="">— Choisir —</option>
                  {sortedMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {needsSide && reference && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                    Du côté de
                  </label>
                  {parentA || parentB ? (
                    <select
                      value={side}
                      onChange={(e) => setSide(e.target.value as RelationSide)}
                      className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
                    >
                      <option value="">— Choisir —</option>
                      {parentA && (
                        <option value="A">
                          {parentA.firstName} {parentA.lastName}
                        </option>
                      )}
                      {parentB && (
                        <option value="B">
                          {parentB.firstName} {parentB.lastName}
                        </option>
                      )}
                    </select>
                  ) : (
                    <p className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                      Les parents de {reference.firstName} ne sont pas encore enregistrés — le
                      lien devra être complété manuellement après l'ajout.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {plan && (
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
                    Le lien précisera que la personne sera ajoutée <strong>{plan.description}</strong>.
                  </>
                ) : (
                  <>{plan.description}</>
                )}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
              Numéro WhatsApp du destinataire (optionnel)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+226 70 00 00 00"
              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Laissez vide pour choisir le contact directement dans WhatsApp.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
              Lien du formulaire
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-600 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
                title="Copier le lien"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold text-sm transition-colors"
          >
            <Send className="w-4 h-4" strokeWidth={1.75} />
            <span>Envoyer l'invitation via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
