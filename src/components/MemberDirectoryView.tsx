import React, { useState, useMemo } from 'react';
import { FamilyMember, calculateAge } from '../types';
import { computeGenerations, getGenerationLabel } from '../utils/treeUtils';
import { photoOrPlaceholder } from '../utils/avatarUtils';
import { MemberCard } from './MemberCard';
import {
  Users,
  Search,
  ArrowUpDown,
  Filter,
  UserPlus,
  LayoutGrid,
  List,
  Calendar,
  MapPin,
  Briefcase,
  X,
  Sparkles,
} from 'lucide-react';

interface MemberDirectoryViewProps {
  members: FamilyMember[];
  onSelectMember: (member: FamilyMember) => void;
  onAddMember: () => void;
  onAddChild: (parent: FamilyMember) => void;
  onAddSpouse: (member: FamilyMember) => void;
  onAddEventForMember: (member: FamilyMember) => void;
}

// Utility for accent-insensitive and case-insensitive comparison
const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const MemberDirectoryView: React.FC<MemberDirectoryViewProps> = ({
  members,
  onSelectMember,
  onAddMember,
  onAddChild,
  onAddSpouse,
  onAddEventForMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOccupation, setSelectedOccupation] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'living' | 'deceased'>('all');
  const [sortBy, setSortBy] = useState<'ageDesc' | 'ageAsc' | 'name' | 'generation'>('generation');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');

  const generationsMap = useMemo(() => computeGenerations(members), [members]);

  // Extract distinct occupations present in family members
  const availableOccupations = useMemo(() => {
    const counts = new Map<string, number>();
    members.forEach((m) => {
      const occ = m.occupation?.trim();
      if (occ) {
        counts.set(occ, (counts.get(occ) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [members]);

  const filteredAndSortedMembers = useMemo(() => {
    return members
      .filter((m) => {
        // Gender filter
        if (genderFilter !== 'all' && m.gender !== genderFilter) return false;

        // Life status filter
        if (statusFilter === 'living' && m.isDeceased) return false;
        if (statusFilter === 'deceased' && !m.isDeceased) return false;

        // Specific occupation pill filter
        if (selectedOccupation) {
          if (!m.occupation || normalizeText(m.occupation) !== normalizeText(selectedOccupation)) {
            return false;
          }
        }

        // Real-time search filter (matches name, first name, or occupation)
        if (searchTerm.trim()) {
          const tokens = normalizeText(searchTerm).split(/\s+/).filter(Boolean);

          const memberFirstName = normalizeText(m.firstName);
          const memberLastName = normalizeText(m.lastName);
          const memberFullName = `${memberFirstName} ${memberLastName}`;
          const memberReverseName = `${memberLastName} ${memberFirstName}`;
          const memberOccupation = normalizeText(m.occupation || '');
          const memberResidence = normalizeText(m.currentResidence || '');
          const memberBirthPlace = normalizeText(m.birthPlace || '');

          const matchesAllTokens = tokens.every(
            (token) =>
              memberFirstName.includes(token) ||
              memberLastName.includes(token) ||
              memberFullName.includes(token) ||
              memberReverseName.includes(token) ||
              memberOccupation.includes(token) ||
              memberResidence.includes(token) ||
              memberBirthPlace.includes(token)
          );

          if (!matchesAllTokens) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
        }
        if (sortBy === 'generation') {
          const genA = generationsMap.get(a.id) ?? 0;
          const genB = generationsMap.get(b.id) ?? 0;
          if (genA !== genB) return genA - genB;
          return a.birthDate.localeCompare(b.birthDate);
        }

        const ageInfoA = calculateAge(a.birthDate, a.deathDate, a.isDeceased);
        const ageInfoB = calculateAge(b.birthDate, b.deathDate, b.isDeceased);
        const ageA = ageInfoA.age ?? 0;
        const ageB = ageInfoB.age ?? 0;

        return sortBy === 'ageDesc' ? ageB - ageA : ageA - ageB;
      });
  }, [members, searchTerm, selectedOccupation, genderFilter, statusFilter, sortBy, generationsMap]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      selectedOccupation ||
      genderFilter !== 'all' ||
      statusFilter !== 'all'
  );

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedOccupation('');
    setGenderFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header & Controls */}
      <div className="card-elegant rounded-3xl p-5 sm:p-7 mb-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[#a8791f]" strokeWidth={1.75} />
              <span>Annuaire des Membres</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Liste complète et détaillée de tous les membres de la famille ({members.length} répertoriés)
            </p>
          </div>

          <button
            id="add-member-directory-btn"
            onClick={onAddMember}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-[#e4c680] text-xs sm:text-sm font-semibold transition-colors self-start md:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.75} />
            <span>Ajouter un membre</span>
          </button>
        </div>

        {/* Real-Time Search Bar Section */}
        <div className="space-y-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="directory-search-input"
              type="text"
              placeholder="Rechercher par prénom, nom de famille ou occupation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200/90 rounded-2xl placeholder:text-stone-400 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20 focus:border-[#a8791f] focus:bg-white transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                id="clear-search-btn"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-stone-200/70 hover:bg-stone-300 text-stone-600 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                title="Effacer la recherche"
              >
                <X className="w-3 h-3" />
                <span>Effacer</span>
              </button>
            )}
          </div>

          {/* Quick Occupation Filter Pills */}
          {availableOccupations.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
              <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1 mr-1">
                <Briefcase className="w-3 h-3 text-stone-400" />
                <span>Métiers :</span>
              </span>

              {availableOccupations.slice(0, 7).map(({ name, count }) => {
                const isSelected = selectedOccupation === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedOccupation(isSelected ? '' : name)}
                    className={`px-2.5 py-1 rounded-xl text-xs transition-all inline-flex items-center gap-1 ${
                      isSelected
                        ? 'bg-stone-900 text-[#e4c680] font-semibold'
                        : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
                    }`}
                  >
                    <span>{name}</span>
                    <span
                      className={`text-[10px] px-1 rounded-full ${
                        isSelected ? 'bg-[#a8791f]/30 text-[#e4c680]' : 'bg-stone-200/80 text-stone-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              {selectedOccupation && (
                <button
                  type="button"
                  onClick={() => setSelectedOccupation('')}
                  className="text-xs text-[#8a6317] hover:text-stone-900 font-medium underline ml-1"
                >
                  Tous les métiers
                </button>
              )}
            </div>
          )}
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              id="directory-gender-filter"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">Tous genres</option>
              <option value="F">Femmes</option>
              <option value="M">Hommes</option>
            </select>

            <select
              id="directory-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">Tous statuts</option>
              <option value="living">Membres vivants</option>
              <option value="deceased">Membres disparus (†)</option>
            </select>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select
                id="directory-sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="generation">Trier par Génération</option>
                <option value="name">Trier par Nom alphabétique</option>
                <option value="ageDesc">Du plus âgé au plus jeune</option>
                <option value="ageAsc">Du plus jeune au plus âgé</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-stone-500 hover:text-stone-800 underline px-2 py-1"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time search counter */}
            <span className="text-xs text-stone-500 font-medium">
              {filteredAndSortedMembers.length} sur {members.length} membre{members.length > 1 ? 's' : ''}
            </span>

            {/* Layout Toggle Buttons */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-stone-600">
              <button
                type="button"
                id="view-mode-grid-btn"
                onClick={() => setDisplayMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  displayMode === 'grid' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
                title="Affichage en cartes"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                id="view-mode-table-btn"
                onClick={() => setDisplayMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  displayMode === 'table' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
                title="Affichage en tableau"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Content */}
      {filteredAndSortedMembers.length === 0 ? (
        <div className="card-elegant rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto">
          <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-stone-900 text-lg mb-1">
            Aucun membre trouvé
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mb-5 max-w-sm mx-auto">
            {searchTerm.trim() ? (
              <span>
                Aucun résultat ne correspond à votre recherche «{' '}
                <strong className="text-stone-800">{searchTerm}</strong> ».
              </span>
            ) : selectedOccupation ? (
              <span>
                Aucun membre n'exerce le métier «{' '}
                <strong className="text-stone-800">{selectedOccupation}</strong> ».
              </span>
            ) : (
              <span>Aucun membre ne correspond aux filtres appliqués.</span>
            )}
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Réinitialiser la recherche
          </button>
        </div>
      ) : displayMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredAndSortedMembers.map((member) => (
            <div key={member.id} className="flex justify-center">
              <MemberCard
                member={member}
                onSelect={onSelectMember}
                onAddChild={onAddChild}
                onAddSpouse={onAddSpouse}
                onAddEvent={onAddEventForMember}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="card-elegant rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Membre</th>
                  <th className="px-4 py-3">Âge / Dates</th>
                  <th className="px-4 py-3">Génération</th>
                  <th className="px-4 py-3">Résidence</th>
                  <th className="px-4 py-3">Profession</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredAndSortedMembers.map((member) => {
                  const ageInfo = calculateAge(member.birthDate, member.deathDate, member.isDeceased);
                  const gen = generationsMap.get(member.id) ?? 0;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => onSelectMember(member)}
                      className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 flex items-center gap-3">
                        <img
                          src={photoOrPlaceholder(member.photoUrl)}
                          alt={member.firstName}
                          className="w-10 h-10 rounded-full object-cover border border-stone-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-semibold text-stone-900">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-stone-400 capitalize">
                            {member.gender === 'F' ? 'Femme' : 'Homme'}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium text-stone-800">{ageInfo.displayText}</span>
                        <p className="text-xs text-stone-500">{ageInfo.yearsRangeText}</p>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                          Génération {gen + 1}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-stone-600">
                        {member.currentResidence || member.birthPlace || '—'}
                      </td>

                      <td className="px-4 py-3 text-stone-600">
                        {member.occupation ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-xs font-medium">
                            {member.occupation}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMember(member);
                          }}
                          className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 text-xs font-medium transition-colors"
                        >
                          Voir profil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
