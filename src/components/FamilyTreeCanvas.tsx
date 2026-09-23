import React, { useState, useMemo } from 'react';
import { FamilyMember } from '../types';
import { computeGenerations, getGenerationLabel, getMemberRelations } from '../utils/treeUtils';
import { photoOrPlaceholder } from '../utils/avatarUtils';
import { MemberCard } from './MemberCard';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Heart,
  GitBranch,
  UserPlus,
  Compass,
  Layers,
  ArrowDown,
} from 'lucide-react';

interface FamilyTreeCanvasProps {
  members: FamilyMember[];
  onSelectMember: (member: FamilyMember) => void;
  onAddMember: () => void;
  onAddChild: (parent: FamilyMember) => void;
  onAddSpouse: (member: FamilyMember) => void;
  onAddEventForMember: (member: FamilyMember) => void;
}

export const FamilyTreeCanvas: React.FC<FamilyTreeCanvasProps> = ({
  members,
  onSelectMember,
  onAddMember,
  onAddChild,
  onAddSpouse,
  onAddEventForMember,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'generations' | 'focus'>('generations');
  const [focusMemberId, setFocusMemberId] = useState<string>(members[0]?.id || '');

  // Calculate generation for each member
  const generationsMap = useMemo(() => computeGenerations(members), [members]);

  // Group members by generation level
  const generationGroups = useMemo(() => {
    const groups = new Map<number, FamilyMember[]>();

    members.forEach((member) => {
      const gen = generationsMap.get(member.id) ?? 0;
      if (!groups.has(gen)) {
        groups.set(gen, []);
      }
      groups.get(gen)!.push(member);
    });

    // Sort generations ascending (0 = oldest ancestors)
    const sortedLevels = Array.from(groups.keys()).sort((a, b) => a - b);
    return sortedLevels.map((level) => ({
      level,
      label: getGenerationLabel(level),
      members: groups.get(level)!,
    }));
  }, [members, generationsMap]);

  // Search filtered matches
  const matchedMemberIds = useMemo(() => {
    if (!searchTerm.trim()) return new Set<string>();
    const term = searchTerm.toLowerCase();
    const set = new Set<string>();
    members.forEach((m) => {
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
      const occ = (m.occupation || '').toLowerCase();
      const place = (m.birthPlace || m.currentResidence || '').toLowerCase();
      if (fullName.includes(term) || occ.includes(term) || place.includes(term)) {
        set.add(m.id);
      }
    });
    return set;
  }, [members, searchTerm]);

  // Group members into couples and singles for structured layout
  const organizeIntoFamilyUnits = (genMembers: FamilyMember[]) => {
    const visited = new Set<string>();
    const units: Array<{
      type: 'couple' | 'single';
      member1: FamilyMember;
      member2?: FamilyMember;
    }> = [];

    genMembers.forEach((member) => {
      if (visited.has(member.id)) return;

      if (member.spouseId) {
        const spouse = genMembers.find((m) => m.id === member.spouseId);
        if (spouse && !visited.has(spouse.id)) {
          units.push({
            type: 'couple',
            member1: member,
            member2: spouse,
          });
          visited.add(member.id);
          visited.add(spouse.id);
          return;
        }
      }

      units.push({
        type: 'single',
        member1: member,
      });
      visited.add(member.id);
    });

    return units;
  };

  // Focus member lineage
  const focusMember = members.find((m) => m.id === focusMemberId) || members[0];
  const focusRelations = useMemo(() => {
    if (!focusMember) return null;
    return getMemberRelations(focusMember, members);
  }, [focusMember, members]);

  return (
    <div className="relative w-full h-[calc(100vh-5rem)] flex flex-col bg-[#faf8f5] overflow-hidden">
      {/* Top Floating Control Bar */}
      <div className="p-3 sm:p-4 bg-white/90 backdrop-blur border-b border-stone-200/80 z-20 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Left: View Mode Toggle & Search */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-medium">
            <button
              onClick={() => setViewMode('generations')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                viewMode === 'generations'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>Par Générations</span>
            </button>
            <button
              onClick={() => {
                setViewMode('focus');
                if (!focusMemberId && members.length > 0) {
                  setFocusMemberId(members[0].id);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                viewMode === 'focus'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-rose-600" />
              <span>Vue Lignée (Focus)</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, métier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-stone-100/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:bg-white w-48 sm:w-64 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Zoom controls & Add */}
        <div className="flex items-center gap-2">
          {viewMode === 'focus' && (
            <select
              value={focusMemberId}
              onChange={(e) => setFocusMemberId(e.target.value)}
              className="text-xs bg-stone-100 border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-800 font-medium focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  Lignée de {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-stone-600">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1.5 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-medium px-2 text-stone-700 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors"
              title="Zoom avant"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 hover:text-stone-900 hover:bg-stone-200/70 rounded-lg transition-colors ml-1 border-l border-stone-200"
              title="Réinitialiser zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onAddMember}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nouveau membre</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 cursor-grab active:cursor-grabbing selection:bg-none">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-4">
              <GitBranch className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold font-serif text-stone-900 mb-2">Votre arbre est vide</h3>
            <p className="text-sm text-stone-600 mb-6">
              Commencez à raconter l'histoire de votre famille en ajoutant le premier membre (vous-même, vos parents ou vos grands-parents).
            </p>
            <button
              onClick={onAddMember}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm shadow-md transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Ajouter le premier membre</span>
            </button>
          </div>
        ) : viewMode === 'generations' ? (
          /* ================= VIEW 1: GENERATIONAL PEDIGREE ================= */
          <div
            className="min-w-fit mx-auto transition-transform duration-200 origin-top flex flex-col items-center gap-12 sm:gap-16 py-6"
            style={{ transform: `scale(${zoom})` }}
          >
            {generationGroups.map((group, groupIndex) => {
              const familyUnits = organizeIntoFamilyUnits(group.members);

              return (
                <div key={group.level} className="flex flex-col items-center w-full">
                  {/* Generation Badge Header */}
                  <div className="mb-6 flex items-center gap-3">
                    <div className="h-px w-8 sm:w-16 bg-stone-300"></div>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-stone-300/80 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-700"></span>
                      <span className="font-serif font-bold text-xs sm:text-sm text-stone-800 tracking-wide">
                        {group.label}
                      </span>
                      <span className="text-xs text-stone-500 font-mono bg-stone-100 px-2 py-0.2 rounded-full">
                        {group.members.length} {group.members.length > 1 ? 'membres' : 'membre'}
                      </span>
                    </div>
                    <div className="h-px w-8 sm:w-16 bg-stone-300"></div>
                  </div>

                  {/* Family Units of this generation */}
                  <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 max-w-7xl">
                    {familyUnits.map((unit, idx) => {
                      if (unit.type === 'couple' && unit.member2) {
                        return (
                          <div
                            key={`couple-${unit.member1.id}-${unit.member2.id}`}
                            className="relative flex flex-col items-center bg-stone-100/70 p-3 sm:p-4 rounded-3xl border border-stone-200/90 shadow-2xs"
                          >
                            <div className="flex items-center gap-3 sm:gap-4">
                              <MemberCard
                                member={unit.member1}
                                onSelect={onSelectMember}
                                onAddChild={onAddChild}
                                onAddSpouse={onAddSpouse}
                                onAddEvent={onAddEventForMember}
                                isHighlighted={matchedMemberIds.has(unit.member1.id)}
                              />

                              {/* Union / Marriage Bridge */}
                              <div
                                className="flex flex-col items-center justify-center px-1 text-rose-500"
                                title="Union / Mariage"
                              >
                                <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shadow-xs">
                                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                                </div>
                                <span className="text-[10px] font-semibold text-rose-600 mt-1 uppercase tracking-wider">
                                  Union
                                </span>
                              </div>

                              <MemberCard
                                member={unit.member2}
                                onSelect={onSelectMember}
                                onAddChild={onAddChild}
                                onAddSpouse={onAddSpouse}
                                onAddEvent={onAddEventForMember}
                                isHighlighted={matchedMemberIds.has(unit.member2.id)}
                              />
                            </div>

                            {/* Downward indicator to next generation */}
                            {groupIndex < generationGroups.length - 1 && (
                              <div className="mt-2 text-stone-400 flex flex-col items-center">
                                <div className="w-0.5 h-3 bg-stone-300"></div>
                                <ArrowDown className="w-3.5 h-3.5 -mt-1 text-stone-400" />
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`single-${unit.member1.id}`}
                          className="flex flex-col items-center"
                        >
                          <MemberCard
                            member={unit.member1}
                            onSelect={onSelectMember}
                            onAddChild={onAddChild}
                            onAddSpouse={onAddSpouse}
                            onAddEvent={onAddEventForMember}
                            isHighlighted={matchedMemberIds.has(unit.member1.id)}
                          />
                          {groupIndex < generationGroups.length - 1 && (
                            <div className="mt-2 text-stone-400 flex flex-col items-center">
                              <div className="w-0.5 h-3 bg-stone-300"></div>
                              <ArrowDown className="w-3.5 h-3.5 -mt-1 text-stone-400" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= VIEW 2: FOCUSED LINEAGE (FOCUS VIEW) ================= */
          focusMember && focusRelations && (
            <div
              className="max-w-4xl mx-auto flex flex-col items-center gap-8 py-6 transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* Top: Parents of Focus Member */}
              {focusRelations.parents.length > 0 && (
                <div className="flex flex-col items-center w-full">
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                    <span>Parents</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {focusRelations.parents.map((parent) => (
                      <MemberCard
                        key={parent.id}
                        member={parent}
                        onSelect={onSelectMember}
                        onAddChild={onAddChild}
                        onAddSpouse={onAddSpouse}
                        onAddEvent={onAddEventForMember}
                        isHighlighted={matchedMemberIds.has(parent.id)}
                      />
                    ))}
                  </div>
                  <div className="w-0.5 h-6 bg-amber-300 mt-3"></div>
                  <ArrowDown className="w-4 h-4 text-amber-500 -mt-1" />
                </div>
              )}

              {/* Center: The Focus Member & Spouse / Siblings */}
              <div className="flex flex-col items-center w-full p-6 bg-white rounded-3xl border-2 border-amber-400/70 shadow-md">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full mb-4">
                  Personne au centre de la lignée
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <MemberCard
                    member={focusMember}
                    onSelect={onSelectMember}
                    onAddChild={onAddChild}
                    onAddSpouse={onAddSpouse}
                    onAddEvent={onAddEventForMember}
                    isHighlighted={true}
                  />

                  {focusRelations.spouse && (
                    <>
                      <div className="flex flex-col items-center text-rose-500 px-2">
                        <Heart className="w-5 h-5 fill-rose-500" />
                        <span className="text-[10px] font-bold text-rose-600 mt-1 uppercase">
                          Époux / Épouse
                        </span>
                      </div>
                      <MemberCard
                        member={focusRelations.spouse}
                        onSelect={onSelectMember}
                        onAddChild={onAddChild}
                        onAddSpouse={onAddSpouse}
                        onAddEvent={onAddEventForMember}
                      />
                    </>
                  )}
                </div>

                {/* Siblings */}
                {focusRelations.siblings.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-stone-200/80 w-full text-center">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                      Frères & Sœurs ({focusRelations.siblings.length})
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {focusRelations.siblings.map((sib) => (
                        <button
                          key={sib.id}
                          onClick={() => setFocusMemberId(sib.id)}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-800 text-xs font-medium border border-stone-200 transition-colors flex items-center gap-2"
                        >
                          <img
                            src={photoOrPlaceholder(sib.photoUrl)}
                            alt={sib.firstName}
                            className="w-5 h-5 rounded-full object-cover"
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

              {/* Bottom: Children */}
              {focusRelations.children.length > 0 && (
                <div className="flex flex-col items-center w-full">
                  <div className="w-0.5 h-6 bg-amber-300 mb-1"></div>
                  <ArrowDown className="w-4 h-4 text-amber-500 mb-3" />
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                    Enfants ({focusRelations.children.length})
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {focusRelations.children.map((child) => (
                      <MemberCard
                        key={child.id}
                        member={child}
                        onSelect={onSelectMember}
                        onAddChild={onAddChild}
                        onAddSpouse={onAddSpouse}
                        onAddEvent={onAddEventForMember}
                        isHighlighted={matchedMemberIds.has(child.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};
