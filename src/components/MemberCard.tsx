import React, { useState } from 'react';
import { FamilyMember, calculateAge } from '../types';
import { User, Heart, Plus, Eye, Calendar, Sparkles, MapPin, Briefcase } from 'lucide-react';

interface MemberCardProps {
  member: FamilyMember;
  onSelect: (member: FamilyMember) => void;
  onAddChild?: (parent: FamilyMember) => void;
  onAddSpouse?: (member: FamilyMember) => void;
  onAddEvent?: (member: FamilyMember) => void;
  isHighlighted?: boolean;
  compact?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onSelect,
  onAddChild,
  onAddSpouse,
  onAddEvent,
  isHighlighted = false,
  compact = false,
}) => {
  const ageInfo = calculateAge(member.birthDate, member.deathDate, member.isDeceased);
  const [photoError, setPhotoError] = useState(false);
  const showPhoto = Boolean(member.photoUrl) && !photoError;

  const genderDot =
    member.gender === 'F' ? 'bg-rose-400' : member.gender === 'M' ? 'bg-sky-500' : 'bg-[#a8791f]';

  const avatarBorder = 'ring-1 ring-stone-900/[0.08]';

  if (compact) {
    return (
      <div
        id={`member-card-${member.id}`}
        onClick={() => onSelect(member)}
        className={`card-elegant group relative flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
          isHighlighted ? 'ring-2 ring-[#a8791f] shadow-[0_0_0_4px_rgba(168,121,31,0.12)]' : ''
        }`}
      >
        <div className="relative shrink-0">
          {showPhoto ? (
            <img
              src={member.photoUrl}
              alt={`${member.firstName} ${member.lastName}`}
              className={`w-11 h-11 rounded-full object-cover shadow-xs ${avatarBorder}`}
              referrerPolicy="no-referrer"
              onError={() => setPhotoError(true)}
            />
          ) : (
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center text-stone-600 bg-stone-100 ${avatarBorder}`}
            >
              <User className="w-5 h-5" />
            </div>
          )}
          {member.isDeceased && (
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-700 text-white text-[9px] flex items-center justify-center font-bold"
              title="En mémoire"
            >
              †
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className="font-semibold text-stone-900 text-sm truncate leading-tight group-hover:text-amber-800 transition-colors">
            {member.firstName} {member.lastName}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
            <span className="font-medium text-stone-700">{ageInfo.displayText}</span>
            {member.occupation && <span className="truncate hidden sm:inline">• {member.occupation}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`member-card-${member.id}`}
      className={`card-elegant group relative w-64 sm:w-72 rounded-2xl p-4 transition-all duration-200 cursor-pointer ${
        isHighlighted
          ? 'ring-2 ring-[#a8791f] shadow-[0_0_0_4px_rgba(168,121,31,0.12)]'
          : 'hover:-translate-y-0.5'
      }`}
      onClick={() => onSelect(member)}
    >
      {/* Top Header: Photo & Quick Identity */}
      <div className="flex items-start gap-3.5">
        <div className="relative shrink-0">
          {showPhoto ? (
            <img
              src={member.photoUrl}
              alt={`${member.firstName} ${member.lastName}`}
              className={`w-16 h-16 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-105 ${avatarBorder}`}
              referrerPolicy="no-referrer"
              onError={() => setPhotoError(true)}
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-stone-600 bg-stone-100 ${avatarBorder}`}
            >
              <User className="w-7 h-7" />
            </div>
          )}

          {member.isDeceased ? (
            <span
              className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-stone-700 text-white text-[10px] font-bold shadow-xs flex items-center gap-0.5"
              title="En mémoire"
            >
              <span>†</span>
            </span>
          ) : (
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                member.gender === 'F' ? 'bg-rose-400' : member.gender === 'M' ? 'bg-sky-400' : 'bg-amber-400'
              }`}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold font-serif text-stone-900 text-base leading-snug truncate group-hover:text-amber-800 transition-colors">
            {member.firstName}
          </h3>
          <p className="text-xs font-medium text-stone-600 uppercase tracking-wider truncate">
            {member.lastName}
          </p>

          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-700 border border-stone-200/70">
            <span className={`w-1.5 h-1.5 rounded-full ${genderDot}`}></span>
            <span>{ageInfo.displayText}</span>
          </div>
        </div>
      </div>

      {/* Meta details: Profession & Location */}
      <div className="mt-3 pt-3 border-t border-stone-100 space-y-1 text-xs text-stone-600">
        {member.birthDate && (
          <div className="flex items-center gap-1.5 truncate text-stone-500">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>{ageInfo.yearsRangeText}</span>
          </div>
        )}

        {member.currentResidence && (
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-amber-600/80 shrink-0" />
            <span className="truncate">{member.currentResidence}</span>
          </div>
        )}

        {member.occupation && (
          <div className="flex items-center gap-1.5 truncate text-stone-700">
            <Briefcase className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="truncate">{member.occupation}</span>
          </div>
        )}
      </div>

      {/* Quick Action Toolbar (visible on hover or focus) */}
      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(member);
          }}
          className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-950 font-medium transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Fiche</span>
        </button>

        <div className="flex items-center gap-1">
          {onAddChild && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(member);
              }}
              title="Ajouter un enfant à ce membre"
              className="p-1 rounded-md hover:bg-stone-100 text-stone-600 hover:text-amber-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}

          {onAddSpouse && !member.spouseId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddSpouse(member);
              }}
              title="Ajouter un conjoint"
              className="p-1 rounded-md hover:bg-rose-50 text-stone-600 hover:text-rose-600 transition-colors"
            >
              <Heart className="w-3.5 h-3.5" />
            </button>
          )}

          {onAddEvent && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddEvent(member);
              }}
              title="Ajouter un événement marquant pour ce membre"
              className="p-1 rounded-md hover:bg-amber-50 text-stone-600 hover:text-amber-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
