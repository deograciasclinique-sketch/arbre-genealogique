import React, { useState, useMemo } from 'react';
import { FamilyMember } from '../types';
import { photoOrPlaceholder } from '../utils/avatarUtils';
import {
  analyzeLineage,
  MemberDescendantStats,
} from '../utils/lineageAnalysis';
import {
  Layers,
  GitBranch,
  Users,
  Search,
  ArrowUpDown,
  Filter,
  Crown,
  ChevronRight,
  Info,
} from 'lucide-react';

interface LineageAnalysisSectionProps {
  members: FamilyMember[];
  onSelectMember: (member: FamilyMember) => void;
}

type FilterMode = 'parents' | 'all' | 'roots';
type SortMode = 'children' | 'descendants' | 'generation' | 'name';

export const LineageAnalysisSection: React.FC<LineageAnalysisSectionProps> = ({
  members,
  onSelectMember,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('parents');
  const [sortMode, setSortMode] = useState<SortMode>('children');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenTab, setSelectedGenTab] = useState<number | 'all'>('all');

  const lineageData = useMemo(() => analyzeLineage(members), [members]);

  // Filter and sort members
  const filteredMemberStats = useMemo(() => {
    let list = [...lineageData.memberStats];

    // Filter mode
    if (filterMode === 'parents') {
      list = list.filter((s) => s.directChildrenCount > 0);
    } else if (filterMode === 'roots') {
      list = list.filter((s) => s.isRootAncestor);
    }

    // Generation tab filter
    if (selectedGenTab !== 'all') {
      list = list.filter((s) => s.generationIndex === selectedGenTab);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.member.firstName.toLowerCase().includes(q) ||
          s.member.lastName.toLowerCase().includes(q) ||
          (s.member.occupation && s.member.occupation.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortMode === 'children') {
        if (b.directChildrenCount !== a.directChildrenCount) {
          return b.directChildrenCount - a.directChildrenCount;
        }
        return b.totalDescendantsCount - a.totalDescendantsCount;
      }
      if (sortMode === 'descendants') {
        if (b.totalDescendantsCount !== a.totalDescendantsCount) {
          return b.totalDescendantsCount - a.totalDescendantsCount;
        }
        return b.directChildrenCount - a.directChildrenCount;
      }
      if (sortMode === 'generation') {
        if (a.generationIndex !== b.generationIndex) {
          return a.generationIndex - b.generationIndex;
        }
        return b.directChildrenCount - a.directChildrenCount;
      }
      if (sortMode === 'name') {
        return `${a.member.firstName} ${a.member.lastName}`.localeCompare(
          `${b.member.firstName} ${b.member.lastName}`
        );
      }
      return 0;
    });

    return list;
  }, [lineageData.memberStats, filterMode, selectedGenTab, searchQuery, sortMode]);

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/70 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-semibold mb-2">
            <GitBranch className="w-3.5 h-3.5 text-amber-700" />
            <span>Perspective Historique & Lignée</span>
          </div>
          <h3 className="text-xl font-bold font-serif text-stone-900">
            Répartition par Génération & Descendance Directe
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
            Analyse de la profondeur généalogique, distribution des aïeux par strate temporelle et
            mesure de la descendance directe générée par chaque membre.
          </p>
        </div>

        {/* Global Lineage Summary Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-center">
            <span className="text-[10px] text-amber-800 font-semibold uppercase tracking-wider block">
              Profondeur
            </span>
            <span className="text-lg font-serif font-bold text-amber-950">
              {lineageData.totalGenerations} gén.
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-stone-50 border border-stone-200 text-center">
            <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider block">
              Moy. Enfants / Parent
            </span>
            <span className="text-lg font-serif font-bold text-stone-900">
              {lineageData.averageChildrenPerParent}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-center">
            <span className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider block">
              Aïeux Fondateurs
            </span>
            <span className="text-lg font-serif font-bold text-emerald-950">
              {lineageData.rootAncestorsCount}
            </span>
          </div>
        </div>
      </div>

      {/* PART 1: Répartition des ancêtres par génération */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold font-serif text-stone-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-700" />
            <span>1. Répartition des Membres & Ancêtres par Génération</span>
          </h4>
          <span className="text-xs text-stone-400 font-medium">
            {members.length} membres répertoriés
          </span>
        </div>

        {/* Generations Grid / Pyramid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lineageData.generations.map((gen) => {
            const isSelected = selectedGenTab === gen.genIndex;
            return (
              <div
                key={gen.genIndex}
                className={`rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400/20'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-stone-800 border border-stone-200 shadow-2xs">
                      {gen.shortLabel}
                    </span>
                    <span className="text-xs font-semibold text-amber-800">
                      {gen.percentage}% de l'arbre
                    </span>
                  </div>

                  <p className="font-serif font-bold text-stone-900 text-sm">
                    {gen.label.replace(/^Génération \d+ • /, '')}
                  </p>

                  <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                    <span>Période :</span>
                    <span className="font-medium text-stone-700">{gen.birthRange}</span>
                  </p>

                  {/* Progress Bar of Generation Weight */}
                  <div className="w-full bg-stone-200 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.max(gen.percentage, 8)}%` }}
                    />
                  </div>

                  {/* Key generation stats */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-200/80 text-xs">
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase block font-semibold">
                        Effectif
                      </span>
                      <span className="font-bold text-stone-900">
                        {gen.totalCount} membre{gen.totalCount > 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        ({gen.livingCount} viv. • {gen.deceasedCount} déc.)
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 text-[10px] uppercase block font-semibold">
                        Descendance direct
                      </span>
                      <span className="font-bold text-stone-900">
                        {gen.averageChildren} enf./membre
                      </span>
                      {gen.rootAncestorsCount > 0 && (
                        <span className="text-[10px] text-amber-700 font-medium block">
                          {gen.rootAncestorsCount} racine{gen.rootAncestorsCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Member Avatars preview */}
                <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between">
                  <div className="flex items-center -space-x-2 overflow-hidden">
                    {gen.members.slice(0, 5).map((m) => (
                      <img
                        key={m.id}
                        src={photoOrPlaceholder(m.photoUrl)}
                        alt={m.firstName}
                        title={`${m.firstName} ${m.lastName}`}
                        onClick={() => onSelectMember(m)}
                        className="w-7 h-7 rounded-full object-cover border-2 border-white cursor-pointer hover:scale-110 hover:z-10 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                    {gen.members.length > 5 && (
                      <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center justify-center border-2 border-white">
                        +{gen.members.length - 5}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedGenTab(isSelected ? 'all' : gen.genIndex)}
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-0.5"
                  >
                    <span>{isSelected ? 'Tous voir' : 'Filtrer'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PART 2: Nombre de descendants directs par membre */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold font-serif text-stone-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-700" />
              <span>2. Descendance Directe & Continuité de la Lignée par Membre</span>
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Identifiez les branches maîtresses et le nombre d'enfants directs (1er degré) issus de chaque individu
            </p>
          </div>

          {/* Patriarch / Matriarch Highlight */}
          {lineageData.topDescendantLeader && (
            <div
              onClick={() => onSelectMember(lineageData.topDescendantLeader!.member)}
              className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs cursor-pointer hover:bg-amber-100/80 transition-colors self-start sm:self-auto"
              title="Membre avec la descendance la plus vaste"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="leading-tight">
                <span className="text-[10px] text-amber-700 uppercase font-bold block">
                  Branche la plus développée
                </span>
                <span className="font-semibold text-amber-950">
                  {lineageData.topDescendantLeader.member.firstName} {lineageData.topDescendantLeader.member.lastName}
                  {' '}({lineageData.topDescendantLeader.directChildrenCount} enfants •{' '}
                  {lineageData.topDescendantLeader.totalDescendantsCount} descendants)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-stone-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Afficher :</span>
            </span>

            <button
              type="button"
              onClick={() => setFilterMode('parents')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
                filterMode === 'parents'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Parents avec descendance ({lineageData.parentsCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('roots')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
                filterMode === 'roots'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Aïeux racines ({lineageData.rootAncestorsCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
                filterMode === 'all'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Tous les membres ({members.length})
            </button>

            {selectedGenTab !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedGenTab('all')}
                className="px-2.5 py-1 rounded-xl text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1"
              >
                <span>Filtre Gen. {selectedGenTab + 1}</span>
                <span className="text-amber-700 hover:text-amber-900 font-bold">×</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="text-xs bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="children">Enfants directs</option>
                <option value="descendants">Descendance totale</option>
                <option value="generation">Par Génération</option>
                <option value="name">Par Nom</option>
              </select>
            </div>
          </div>
        </div>

        {/* Member Descendants Grid */}
        {filteredMemberStats.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs italic bg-stone-50 rounded-2xl border border-stone-200">
            Aucun membre ne correspond aux critères sélectionnés.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredMemberStats.map((item) => {
              const {
                member,
                generationIndex,
                directChildren,
                directChildrenCount,
                totalDescendantsCount,
                isRootAncestor,
                descendantSharePercentage,
              } = item;

              return (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl border border-stone-200/90 bg-stone-50/40 hover:bg-white hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <img
                        src={photoOrPlaceholder(member.photoUrl)}
                        alt={member.firstName}
                        onClick={() => onSelectMember(member)}
                        className="w-12 h-12 rounded-2xl object-cover ring-1 ring-stone-200 shrink-0 cursor-pointer group-hover:ring-amber-300 transition-all"
                        referrerPolicy="no-referrer"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            Gén. {generationIndex + 1}
                          </span>
                          {isRootAncestor && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                              Racine
                            </span>
                          )}
                        </div>

                        <h5
                          onClick={() => onSelectMember(member)}
                          className="font-serif font-bold text-stone-900 text-sm truncate hover:text-amber-800 cursor-pointer mt-0.5"
                        >
                          {member.firstName} {member.lastName}
                        </h5>

                        <p className="text-[11px] text-stone-500 truncate">
                          {member.birthDate?.slice(0, 4) || 'Date inconnue'}
                          {member.isDeceased ? ' (Décédé)' : ''}
                          {member.occupation ? ` • ${member.occupation}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Descendant Indicators */}
                    <div className="mt-3.5 grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-stone-200/70">
                      <div className="text-center">
                        <span className="text-[10px] text-stone-400 font-semibold uppercase block">
                          Enfants directs
                        </span>
                        <span
                          className={`text-base font-serif font-bold ${
                            directChildrenCount > 0 ? 'text-amber-800' : 'text-stone-400'
                          }`}
                        >
                          {directChildrenCount}
                        </span>
                        <span className="text-[10px] text-stone-500 block">
                          1er degré
                        </span>
                      </div>

                      <div className="text-center border-l border-stone-100">
                        <span className="text-[10px] text-stone-400 font-semibold uppercase block">
                          Lignée totale
                        </span>
                        <span
                          className={`text-base font-serif font-bold ${
                            totalDescendantsCount > 0 ? 'text-stone-900' : 'text-stone-400'
                          }`}
                        >
                          {totalDescendantsCount}
                        </span>
                        <span className="text-[10px] text-stone-500 block">
                          {descendantSharePercentage > 0
                            ? `${descendantSharePercentage}% de l'arbre`
                            : 'Sans suite'}
                        </span>
                      </div>
                    </div>

                    {/* Direct Children Pills */}
                    {directChildren.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[10px] text-stone-400 uppercase font-semibold block mb-1.5">
                          Enfants ({directChildren.length}) :
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {directChildren.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => onSelectMember(child)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 text-[11px] font-medium transition-colors"
                              title={`Voir la fiche de ${child.firstName}`}
                            >
                              <img
                                src={photoOrPlaceholder(child.photoUrl)}
                                alt={child.firstName}
                                className="w-3.5 h-3.5 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <span className="truncate max-w-[90px]">{child.firstName}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Action Link */}
                  <div className="mt-4 pt-2.5 border-t border-stone-200/50 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-stone-400">
                      {item.knownAncestorsCount > 0
                        ? `${item.knownAncestorsCount} ancêtre(s) connu(s)`
                        : 'Fondateur initial'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectMember(member)}
                      className="text-amber-800 hover:text-amber-950 font-semibold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Fiche</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical perspective note / Methodology */}
      <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-stone-600 leading-relaxed">
          <p className="font-semibold text-stone-900">
            Méthodologie de l'analyse généalogique
          </p>
          <p className="mt-0.5">
            La répartition générationnelle est établie de manière relative à partir des aïeux
            fondateurs (sans parents renseignés dans l'arbre). Les enfants directs correspondent
            aux descendants immédiats au premier degré, tandis que la lignée totale intègre la
            progéniture récursive (petits-enfants, arrière-petits-enfants) afin d'évaluer la
            contribution démographique de chaque membre à l'histoire de la famille.
          </p>
        </div>
      </div>
    </div>
  );
};
