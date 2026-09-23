import React, { useState, useMemo } from 'react';
import { ActivityLogItem, FamilyMember, ActivityType } from '../types';
import { formatActivityTime, getActivityTypeMeta } from '../utils/activityUtils';
import {
  History,
  X,
  Search,
  Filter,
  UserPlus,
  UserCheck,
  UserMinus,
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  RotateCcw,
  Trash2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityLogItem[];
  members: FamilyMember[];
  onSelectMember: (member: FamilyMember) => void;
  onClearActivities: () => void;
  onResetDefaultActivities: () => void;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  activities,
  members,
  onSelectMember,
  onClearActivities,
  onResetDefaultActivities,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'members' | 'events' | 'add' | 'edit' | 'delete'>('all');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Map member IDs for quick lookup
  const membersMap = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Type filter
      if (selectedFilter === 'members') {
        if (!act.type.startsWith('member_')) return false;
      } else if (selectedFilter === 'events') {
        if (!act.type.startsWith('event_')) return false;
      } else if (selectedFilter === 'add') {
        if (!act.type.endsWith('_add')) return false;
      } else if (selectedFilter === 'edit') {
        if (!act.type.endsWith('_edit')) return false;
      } else if (selectedFilter === 'delete') {
        if (!act.type.endsWith('_delete')) return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(query);
        const matchDetails = act.details.toLowerCase().includes(query);
        const matchTarget = act.targetName.toLowerCase().includes(query);
        return matchTitle || matchDetails || matchTarget;
      }

      return true;
    });
  }, [activities, selectedFilter, searchTerm]);

  if (!isOpen) return null;

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'member_add':
        return <UserPlus className="w-4 h-4 text-emerald-700" />;
      case 'member_edit':
        return <UserCheck className="w-4 h-4 text-amber-700" />;
      case 'member_delete':
        return <UserMinus className="w-4 h-4 text-rose-700" />;
      case 'event_add':
        return <CalendarPlus className="w-4 h-4 text-indigo-700" />;
      case 'event_edit':
        return <CalendarCheck className="w-4 h-4 text-sky-700" />;
      case 'event_delete':
        return <CalendarX className="w-4 h-4 text-stone-600" />;
      case 'tree_reset':
      case 'tree_import':
        return <RotateCcw className="w-4 h-4 text-orange-700" />;
      default:
        return <Clock className="w-4 h-4 text-stone-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="activity-log-modal"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
                  Journal des Activités
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-stone-200 border border-white/15">
                  {activities.length} entrée{activities.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-300 mt-0.5">
                Historique des ajouts, modifications et suppressions pour suivre l'évolution de l'arbre
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-5 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par prénom, nom ou action..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/15"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs"
                >
                  Effacer
                </button>
              )}
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'bg-white/10 text-stone-300 hover:bg-white/15'
                }`}
              >
                Tout ({activities.length})
              </button>
              <button
                onClick={() => setSelectedFilter('members')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedFilter === 'members'
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'bg-white/10 text-stone-300 hover:bg-white/15'
                }`}
              >
                Membres
              </button>
              <button
                onClick={() => setSelectedFilter('events')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedFilter === 'events'
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'bg-white/10 text-stone-300 hover:bg-white/15'
                }`}
              >
                Événements
              </button>
              <button
                onClick={() => setSelectedFilter('add')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all inline-flex items-center gap-1 ${
                  selectedFilter === 'add'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'bg-white/10 text-stone-300 hover:bg-white/15'
                }`}
              >
                <UserPlus className="w-3 h-3" />
                <span>Ajouts</span>
              </button>
              <button
                onClick={() => setSelectedFilter('edit')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all inline-flex items-center gap-1 ${
                  selectedFilter === 'edit'
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'bg-white/10 text-stone-300 hover:bg-white/15'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Modifications</span>
              </button>
              <button
                onClick={() => setSelectedFilter('delete')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all inline-flex items-center gap-1 ${
                  selectedFilter === 'delete'
                    ? 'bg-rose-600 text-white shadow-xs font-semibold'
                    : 'bg-white/10 text-stone-300 hover:bg-white/15'
                }`}
              >
                <UserMinus className="w-3 h-3" />
                <span>Suppressions</span>
              </button>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {filteredActivities.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-800">Aucune activité trouvée</p>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? `Aucun résultat pour « ${searchTerm} ». Essayez d'ajuster votre recherche.`
                  : "Le journal des modifications s'enrichira au fil de vos ajouts, éditions ou suppressions de membres."}
              </p>
              {activities.length === 0 && (
                <button
                  onClick={onResetDefaultActivities}
                  className="mt-4 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
                >
                  Charger l'historique d'exemple
                </button>
              )}
            </div>
          ) : (
            filteredActivities.map((act) => {
              const meta = getActivityTypeMeta(act.type);
              const linkedMember = act.targetId ? membersMap.get(act.targetId) : undefined;

              return (
                <div
                  key={act.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${meta.borderClass} bg-stone-50/60 hover:bg-white hover:shadow-2xs`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon or Photo Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      {act.targetPhotoUrl ? (
                        <img
                          src={act.targetPhotoUrl}
                          alt={act.targetName}
                          className="w-10 h-10 rounded-full object-cover border border-stone-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center">
                          {getActivityIcon(act.type)}
                        </div>
                      )}
                      <div
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-2xs ${meta.badgeBg}`}
                      >
                        {getActivityIcon(act.type)}
                      </div>
                    </div>

                    {/* Details content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.badgeBg} ${meta.badgeText}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-xs text-stone-400">•</span>
                        <span className="text-xs text-stone-500 font-medium">
                          {formatActivityTime(act.timestamp)}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base mt-1">
                        {act.title}
                      </h4>

                      <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                        {act.details}
                      </p>

                      {/* Action to view profile if member exists */}
                      {linkedMember && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectMember(linkedMember);
                            onClose();
                          }}
                          className="mt-2 text-xs font-semibold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Voir la fiche de {linkedMember.firstName}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-5 py-3.5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-2">
            {showConfirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-700 font-medium">Effacer tout l'historique ?</span>
                <button
                  onClick={() => {
                    onClearActivities();
                    setShowConfirmClear(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors"
                >
                  Oui, effacer
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="px-2.5 py-1 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear(true)}
                disabled={activities.length === 0}
                className="text-stone-400 hover:text-rose-700 disabled:opacity-30 disabled:hover:text-stone-400 transition-colors inline-flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer l'historique</span>
              </button>
            )}

            {activities.length === 0 && (
              <button
                onClick={onResetDefaultActivities}
                className="text-amber-800 hover:text-amber-950 transition-colors inline-flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurer l'historique d'exemple</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium transition-colors self-end sm:self-auto"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
