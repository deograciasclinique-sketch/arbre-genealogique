import React, { useState, useMemo } from 'react';
import { FamilyMember } from '../types';
import { getUpcomingBirthdays, UpcomingBirthdayItem } from '../utils/birthdayUtils';
import { photoOrPlaceholder } from '../utils/avatarUtils';
import {
  Cake,
  Calendar,
  X,
  Sparkles,
  Gift,
  Clock,
  ChevronRight,
  PartyPopper,
  CalendarPlus,
  Heart,
} from 'lucide-react';

interface UpcomingBirthdaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: FamilyMember[];
  onSelectMember: (member: FamilyMember) => void;
  onAddEventForMember?: (member: FamilyMember) => void;
}

export const UpcomingBirthdaysModal: React.FC<UpcomingBirthdaysModalProps> = ({
  isOpen,
  onClose,
  members,
  onSelectMember,
  onAddEventForMember,
}) => {
  const [filterRange, setFilterRange] = useState<'30days' | '90days' | 'all'>('30days');
  const [includeDeceased, setIncludeDeceased] = useState(false);

  const maxDays = filterRange === '30days' ? 30 : filterRange === '90days' ? 90 : 365;

  const upcomingBirthdays = useMemo(() => {
    return getUpcomingBirthdays(members, { maxDays, includeDeceased });
  }, [members, maxDays, includeDeceased]);

  const statsCount = useMemo(() => {
    const next30 = getUpcomingBirthdays(members, { maxDays: 30, includeDeceased: false }).length;
    const next90 = getUpcomingBirthdays(members, { maxDays: 90, includeDeceased: false }).length;
    const total = getUpcomingBirthdays(members, { maxDays: 365, includeDeceased: false }).length;
    return { next30, next90, total };
  }, [members]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="upcoming-birthdays-modal"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with Warm Festive Aesthetic */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-stone-800 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-amber-200 shadow-inner shrink-0">
              <Cake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
                  Prochains Anniversaires
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/30 text-amber-100 border border-amber-300/40">
                  {upcomingBirthdays.length} à venir
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-100/80 mt-0.5">
                Ne manquez aucun anniversaire marquant des membres de votre famille
              </p>
            </div>
          </div>

          {/* Timeframe Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 mt-5 bg-black/20 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setFilterRange('30days')}
              className={`flex-1 min-w-[100px] py-1.5 px-3 rounded-lg font-medium transition-all text-center ${
                filterRange === '30days'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-amber-100/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>30 jours</span>
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
                {statsCount.next30}
              </span>
            </button>

            <button
              onClick={() => setFilterRange('90days')}
              className={`flex-1 min-w-[100px] py-1.5 px-3 rounded-lg font-medium transition-all text-center ${
                filterRange === '90days'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-amber-100/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>3 mois</span>
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-stone-200 text-stone-800 font-bold">
                {statsCount.next90}
              </span>
            </button>

            <button
              onClick={() => setFilterRange('all')}
              className={`flex-1 min-w-[100px] py-1.5 px-3 rounded-lg font-medium transition-all text-center ${
                filterRange === 'all'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-amber-100/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>Toute l'année</span>
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-stone-200 text-stone-800 font-bold">
                {statsCount.total}
              </span>
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {upcomingBirthdays.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
                <PartyPopper className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-stone-800">Aucun anniversaire sur cette période</p>
              <p className="text-xs text-stone-400 mt-1">
                Essayez d'élargir la période sur « 3 mois » ou « Toute l'année ».
              </p>
            </div>
          ) : (
            upcomingBirthdays.map((item) => {
              const isToday = item.daysLeft === 0;
              const isVerySoon = item.daysLeft > 0 && item.daysLeft <= 7;

              return (
                <div
                  key={item.member.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isToday
                      ? 'bg-gradient-to-r from-amber-50 to-rose-50/60 border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
                      : isVerySoon
                      ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                      : 'bg-stone-50/60 border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  {/* Left info */}
                  <div
                    onClick={() => {
                      onSelectMember(item.member);
                      onClose();
                    }}
                    className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={photoOrPlaceholder(item.member.photoUrl)}
                        alt={item.member.firstName}
                        className={`w-12 h-12 rounded-full object-cover border-2 ${
                          isToday
                            ? 'border-amber-500 ring-2 ring-amber-300'
                            : 'border-stone-200 group-hover:border-amber-400'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                      {isToday && (
                        <span className="absolute -top-1 -right-1 text-sm animate-bounce" title="Aujourd'hui !">
                          🎂
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base group-hover:text-amber-800 transition-colors truncate">
                          {item.member.firstName} {item.member.lastName}
                        </h4>
                        {item.isMilestoneAge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                            Cap symbolique !
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-stone-600 mt-0.5">
                        <span className="font-semibold text-stone-800">
                          Fêtera ses {item.turningAge} ans
                        </span>
                        <span>•</span>
                        <span className="text-stone-500">{item.formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Badge & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/60">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isToday
                          ? 'bg-amber-500 text-white shadow-xs animate-pulse'
                          : isVerySoon
                          ? 'bg-amber-100 text-amber-900 border border-amber-300/80 font-bold'
                          : 'bg-stone-200/80 text-stone-700'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{item.relativeLabel}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onAddEventForMember && (
                        <button
                          type="button"
                          onClick={() => {
                            onAddEventForMember(item.member);
                            onClose();
                          }}
                          className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-white hover:bg-amber-100 text-stone-700 hover:text-amber-900 text-xs font-medium border border-stone-200 transition-colors shadow-2xs inline-flex items-center gap-1"
                          title="Créer un événement pour cet anniversaire"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-rose-600" />
                          <span className="hidden md:inline">+ Événement</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onSelectMember(item.member);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium shadow-2xs transition-colors inline-flex items-center gap-1"
                      >
                        <span>Fiche</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & Deceased toggle */}
        <div className="bg-stone-50 px-5 py-3.5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDeceased}
              onChange={(e) => setIncludeDeceased(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-amber-700 focus:ring-amber-500 border-stone-300"
            />
            <span>Inclure aussi les anniversaires en mémoire (membres disparus)</span>
          </label>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
