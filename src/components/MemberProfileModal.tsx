import React, { useMemo } from 'react';
import { FamilyMember, FamilyEvent, calculateAge, EVENT_TYPE_INFO } from '../types';
import { getMemberRelations } from '../utils/treeUtils';
import { photoOrPlaceholder } from '../utils/avatarUtils';
import {
  X,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  Briefcase,
  Heart,
  Plus,
  Clock,
  Sparkles,
  Users,
  Camera,
  Baby,
  Cake,
  GraduationCap,
} from 'lucide-react';

interface MemberProfileModalProps {
  member: FamilyMember | null;
  allMembers: FamilyMember[];
  allEvents: FamilyEvent[];
  onClose: () => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (memberId: string) => void;
  onSelectRelative: (member: FamilyMember) => void;
  onAddChild: (parent: FamilyMember) => void;
  onAddSpouse: (member: FamilyMember) => void;
  onAddEventForMember: (member: FamilyMember) => void;
  onViewOnMap?: (member: FamilyMember) => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  allMembers,
  allEvents,
  onClose,
  onEdit,
  onDelete,
  onSelectRelative,
  onAddChild,
  onAddSpouse,
  onAddEventForMember,
  onViewOnMap,
}) => {
  if (!member) return null;

  const ageInfo = calculateAge(member.birthDate, member.deathDate, member.isDeceased);
  const relations = useMemo(() => getMemberRelations(member, allMembers), [member, allMembers]);

  // Events concerning this member
  const memberEvents = useMemo(() => {
    return allEvents
      .filter((ev) => ev.memberIds.includes(member.id))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [allEvents, member.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner Header */}
        <div className="relative h-28 sm:h-36 bg-gradient-to-r from-amber-800 via-amber-900 to-stone-900 p-4 sm:p-6 flex items-start justify-between">
          <div className="text-amber-200/80 text-xs font-medium tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fiche Généalogique</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Identity Bar */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            <div className="flex items-end gap-4">
              <div className="relative group">
                <img
                  src={photoOrPlaceholder(member.photoUrl)}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-white shadow-lg bg-stone-100"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => onEdit(member)}
                  className="absolute inset-0 rounded-3xl bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold backdrop-blur-[1px]"
                  title="Changer la photo (Caméra ou Fichier)"
                >
                  <Camera className="w-5 h-5 mb-0.5 text-amber-300" />
                  <span>Photo</span>
                </button>
                {member.isDeceased && (
                  <span
                    className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-md bg-stone-800 text-white text-xs font-bold shadow-md"
                    title="En mémoire"
                  >
                    † Décédé(e)
                  </span>
                )}
              </div>

              <div className="mb-1">
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 leading-tight">
                  {member.firstName} {member.lastName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                    {ageInfo.displayText}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {member.gender === 'F' ? 'Femme' : member.gender === 'M' ? 'Homme' : 'Autre'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(member)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-800 text-xs font-medium border border-stone-200 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-stone-600" />
                <span>Modifier</span>
              </button>

              <button
                onClick={() => onAddEventForMember(member)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Événement</span>
              </button>
            </div>
          </div>

          {/* Key Facts & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-y border-stone-100 text-xs sm:text-sm text-stone-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {member.birthDate ? `Né(e) le ${member.birthDate}` : 'Date de naissance inconnue'}
                {member.deathDate ? ` — Décédé(e) le ${member.deathDate}` : ''}
              </span>
            </div>

            {member.birthPlace && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="truncate">Lieu de naissance : {member.birthPlace}</span>
                </div>
                {onViewOnMap && (
                  <button
                    type="button"
                    onClick={() => onViewOnMap(member)}
                    className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors shrink-0"
                    title="Voir sur la carte"
                  >
                    Carte →
                  </button>
                )}
              </div>
            )}

            {member.currentResidence && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="truncate">Résidence : {member.currentResidence}</span>
                </div>
                {onViewOnMap && (
                  <button
                    type="button"
                    onClick={() => onViewOnMap(member)}
                    className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors shrink-0"
                    title="Voir sur la carte"
                  >
                    Carte →
                  </button>
                )}
              </div>
            )}

            {member.occupation && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-stone-400 shrink-0" />
                <span>Profession : {member.occupation}</span>
              </div>
            )}
          </div>

          {/* Bio / Anecdotes */}
          {member.bio && (
            <div className="my-4 p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/50">
              <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1">
                Souvenirs & Biographie
              </p>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                « {member.bio} »
              </p>
            </div>
          )}

          {/* Family Circle / Direct Kinship */}
          <div className="mt-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-700" />
              <span>Cercle Familial Direct</span>
            </h4>

            {/* Parents */}
            <div>
              <p className="text-[11px] font-semibold text-stone-500 mb-1.5">
                Parents ({relations.parents.length})
              </p>
              {relations.parents.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {relations.parents.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectRelative(p)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-amber-100 text-stone-800 text-xs font-medium border border-stone-200 transition-colors"
                    >
                      <img
                        src={photoOrPlaceholder(p.photoUrl)}
                        alt={p.firstName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span>
                        {p.firstName} {p.lastName}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">Aucun parent renseigné</p>
              )}
            </div>

            {/* Spouse */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold text-stone-500">Conjoint / Époux</p>
                {!relations.spouse && (
                  <button
                    onClick={() => onAddSpouse(member)}
                    className="text-[11px] text-amber-800 hover:text-amber-950 font-medium"
                  >
                    + Associer un conjoint
                  </button>
                )}
              </div>
              {relations.spouse ? (
                <button
                  onClick={() => onSelectRelative(relations.spouse!)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-medium border border-rose-200 transition-colors"
                >
                  <Heart className="w-4 h-4 fill-rose-400 text-rose-500" />
                  <img
                    src={photoOrPlaceholder(relations.spouse.photoUrl)}
                    alt={relations.spouse.firstName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span>
                    {relations.spouse.firstName} {relations.spouse.lastName}
                  </span>
                </button>
              ) : (
                <p className="text-xs text-stone-400 italic">Non marié(e) ou non renseigné</p>
              )}
            </div>

            {/* Children */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold text-stone-500">
                  Enfants ({relations.children.length})
                </p>
                <button
                  onClick={() => onAddChild(member)}
                  className="text-[11px] text-amber-800 hover:text-amber-950 font-medium"
                >
                  + Ajouter un enfant
                </button>
              </div>
              {relations.children.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {relations.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onSelectRelative(child)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-amber-100 text-stone-800 text-xs font-medium border border-stone-200 transition-colors"
                    >
                      <img
                        src={photoOrPlaceholder(child.photoUrl)}
                        alt={child.firstName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span>
                        {child.firstName} {child.lastName}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">Aucun enfant renseigné</p>
              )}
            </div>

            {/* Siblings */}
            {relations.siblings.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-stone-500 mb-1.5">
                  Frères & Sœurs ({relations.siblings.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {relations.siblings.map((sib) => (
                    <button
                      key={sib.id}
                      onClick={() => onSelectRelative(sib)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-amber-100 text-stone-800 text-xs font-medium border border-stone-200 transition-colors"
                    >
                      <img
                        src={photoOrPlaceholder(sib.photoUrl)}
                        alt={sib.firstName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span>
                        {sib.firstName} {sib.lastName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Personal Timeline Moments */}
          <div className="mt-6 pt-5 border-t border-stone-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>Chronologie Personnelle ({memberEvents.length} événements)</span>
            </h4>

            {memberEvents.length > 0 ? (
              <div className="space-y-2.5">
                {memberEvents.map((ev) => {
                  const typeInfo = EVENT_TYPE_INFO[ev.type] || EVENT_TYPE_INFO.other;
                  return (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-amber-900 font-mono">{ev.date}</span>
                          <span
                            className={`px-2 py-0.2 rounded-md font-medium text-[10px] border ${typeInfo.bgClass} ${typeInfo.colorClass} ${typeInfo.borderClass}`}
                          >
                            {typeInfo.label}
                          </span>
                        </div>
                        <p className="font-bold text-stone-800 text-sm">{ev.title}</p>
                        <p className="text-stone-600 mt-0.5">{ev.description}</p>
                        {ev.location && (
                          <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{ev.location}</span>
                          </p>
                        )}
                      </div>

                      {ev.photoUrl && (
                        <img
                          src={ev.photoUrl}
                          alt={ev.title}
                          className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">
                Aucun événement spécifique enregistré pour l'instant.
              </p>
            )}
          </div>

          {/* Footer Delete action */}
          <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-between">
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Êtes-vous sûr de vouloir supprimer ${member.firstName} ${member.lastName} de l'arbre familial ?`
                  )
                ) {
                  onDelete(member.id);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer ce membre</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
