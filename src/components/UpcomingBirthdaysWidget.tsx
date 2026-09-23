import React, { useState } from 'react';
import { FamilyMember } from '../types';
import { UpcomingBirthdayItem } from '../utils/birthdayUtils';
import { photoOrPlaceholder } from '../utils/avatarUtils';
import { Cake, Sparkles, X, ChevronRight, PartyPopper, BellRing } from 'lucide-react';

interface UpcomingBirthdaysWidgetProps {
  upcomingItems: UpcomingBirthdayItem[];
  onOpenAll: () => void;
  onSelectMember: (member: FamilyMember) => void;
}

export const UpcomingBirthdaysWidget: React.FC<UpcomingBirthdaysWidgetProps> = ({
  upcomingItems,
  onOpenAll,
  onSelectMember,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // If no upcoming birthdays in the near period, don't show the widget
  if (upcomingItems.length === 0) {
    return null;
  }

  const closest = upcomingItems[0];
  const isToday = closest.daysLeft === 0;
  const isTomorrow = closest.daysLeft === 1;
  const isThisWeek = closest.daysLeft <= 7;

  // When minimized, show an unobtrusive floating pill
  if (isDismissed) {
    return (
      <div className="fixed bottom-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <button
          onClick={() => setIsDismissed(false)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg border text-xs font-semibold transition-all hover:scale-105 ${
            isToday
              ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-400 ring-2 ring-amber-300 animate-pulse'
              : 'bg-white hover:bg-amber-50 text-stone-800 border-amber-300/80 shadow-stone-900/10'
          }`}
          title="Afficher la notification d'anniversaire"
        >
          <span className="text-base leading-none">🎂</span>
          <span className="truncate max-w-[150px]">
            {closest.member.firstName} ({closest.relativeLabel})
          </span>
          {upcomingItems.length > 1 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
              +{upcomingItems.length - 1}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1">
      <div
        id="upcoming-birthday-banner"
        className={`relative overflow-hidden rounded-2xl border transition-all shadow-xs ${
          isToday
            ? 'bg-gradient-to-r from-amber-50 via-rose-50 to-amber-100/60 border-amber-300 ring-2 ring-amber-400/40'
            : isThisWeek
            ? 'bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-stone-50 border-amber-200/90'
            : 'bg-stone-50/90 border-stone-200/90'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3">
          {/* Left: Avatar & Message */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <img
                src={photoOrPlaceholder(closest.member.photoUrl)}
                alt={closest.member.firstName}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 shadow-2xs ${
                  isToday
                    ? 'border-amber-500 ring-2 ring-amber-300'
                    : 'border-amber-300/80'
                }`}
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 text-xs sm:text-sm">
                {isToday ? '🎉' : '🎂'}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                    isToday
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : isTomorrow
                      ? 'bg-rose-100 text-rose-900 border border-rose-200'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                >
                  {isToday ? "C'est son anniversaire aujourd'hui !" : isTomorrow ? 'Anniversaire demain !' : 'Anniversaire à venir'}
                </span>

                {closest.isMilestoneAge && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-900 border border-purple-200">
                    Grand Cap : {closest.turningAge} ans !
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-stone-800 mt-0.5 truncate">
                <span className="font-semibold text-stone-900">
                  {closest.member.firstName} {closest.member.lastName}
                </span>{' '}
                fêtera ses{' '}
                <span className="font-bold text-amber-900">
                  {closest.turningAge} ans
                </span>{' '}
                {isToday
                  ? "aujourd'hui !"
                  : isTomorrow
                  ? "demain !"
                  : `${closest.relativeLabel.toLowerCase()} (le ${closest.formattedDate})`}
              </p>
            </div>
          </div>

          {/* Right: Actions & Dismiss */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectMember(closest.member)}
                className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs shadow-2xs transition-colors inline-flex items-center gap-1"
              >
                <span>Voir la fiche</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onOpenAll}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-stone-800 font-medium text-xs border border-stone-200 transition-colors shadow-2xs inline-flex items-center gap-1"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  Tous ({upcomingItems.length})
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors ml-1"
              title="Réduire cette notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
