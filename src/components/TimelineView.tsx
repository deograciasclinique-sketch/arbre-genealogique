import React, { useState, useMemo } from 'react';
import { FamilyEvent, FamilyMember, EVENT_TYPE_INFO, EventType } from '../types';
import { photoOrPlaceholder } from '../utils/avatarUtils';
import {
  Calendar,
  MapPin,
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Pencil,
  Trash2,
  Users,
  Baby,
  Heart,
  Cake,
  GraduationCap,
  Briefcase,
  Home,
  Award,
  Compass,
} from 'lucide-react';

interface TimelineViewProps {
  events: FamilyEvent[];
  members: FamilyMember[];
  onAddEvent: () => void;
  onEditEvent: (event: FamilyEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onSelectMember: (member: FamilyMember) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  members,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onSelectMember,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [onlyHighlights, setOnlyHighlights] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Member map for quick lookup
  const memberMap = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  // Filter & sort events
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        if (selectedType !== 'all' && ev.type !== selectedType) return false;
        if (selectedMemberId !== 'all' && !ev.memberIds.includes(selectedMemberId)) return false;
        if (onlyHighlights && !ev.isHighlight) return false;
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitle = ev.title.toLowerCase().includes(term);
          const matchDesc = ev.description.toLowerCase().includes(term);
          const matchLoc = (ev.location || '').toLowerCase().includes(term);
          if (!matchTitle && !matchDesc && !matchLoc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = a.date || '0000';
        const dateB = b.date || '0000';
        return sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
      });
  }, [events, selectedType, selectedMemberId, onlyHighlights, searchTerm, sortOrder]);

  // Group events by Decade
  const groupedEvents = useMemo(() => {
    const groups: Array<{ decade: string; events: FamilyEvent[] }> = [];
    const decadeMap = new Map<string, FamilyEvent[]>();

    filteredEvents.forEach((ev) => {
      const year = parseInt(ev.date.slice(0, 4), 10);
      const decadeLabel = !isNaN(year)
        ? `Années ${Math.floor(year / 10) * 10}`
        : 'Événements sans date';

      if (!decadeMap.has(decadeLabel)) {
        decadeMap.set(decadeLabel, []);
      }
      decadeMap.get(decadeLabel)!.push(ev);
    });

    decadeMap.forEach((evList, decade) => {
      groups.push({ decade, events: evList });
    });

    return groups;
  }, [filteredEvents]);

  // Helper to format French date
  const formatFrenchDate = (dateStr: string) => {
    if (!dateStr) return 'Date non précisée';
    if (dateStr.length === 4) return dateStr; // Just year

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'birth':
        return <Baby className="w-4 h-4" />;
      case 'wedding':
        return <Heart className="w-4 h-4" />;
      case 'anniversary':
        return <Cake className="w-4 h-4" />;
      case 'graduation':
        return <GraduationCap className="w-4 h-4" />;
      case 'career':
        return <Briefcase className="w-4 h-4" />;
      case 'relocation':
        return <Home className="w-4 h-4" />;
      case 'achievement':
        return <Award className="w-4 h-4" />;
      case 'journey':
        return <Compass className="w-4 h-4" />;
      case 'reunion':
        return <Users className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-6 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-amber-700" />
              <span>Chronologie Familiale</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Les grands moments, souvenirs marquants et étapes importantes de votre famille à travers le temps.
            </p>
          </div>

          <button
            onClick={onAddEvent}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un événement</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un événement, un lieu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-stone-100/70 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:bg-white"
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

          {/* Filter by event type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs sm:text-sm bg-stone-100/70 border border-stone-200 rounded-xl px-3 py-1.5 text-stone-700 focus:outline-none"
          >
            <option value="all">Tous les types d'événements</option>
            {Object.entries(EVENT_TYPE_INFO).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>

          {/* Filter by family member */}
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="text-xs sm:text-sm bg-stone-100/70 border border-stone-200 rounded-xl px-3 py-1.5 text-stone-700 focus:outline-none"
          >
            <option value="all">Tous les membres</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>

          {/* Toggle Highlights */}
          <button
            onClick={() => setOnlyHighlights((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
              onlyHighlights
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                : 'bg-stone-100/70 text-stone-600 border-stone-200 hover:bg-stone-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Événements majeurs</span>
          </button>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-stone-100/70 text-stone-600 border border-stone-200 hover:bg-stone-200/60 transition-colors ml-auto"
            title="Changer l'ordre chronologique"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'asc' ? 'Plus ancien d’abord' : 'Plus récent d’abord'}</span>
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center max-w-md mx-auto">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-stone-900 text-lg mb-1">
            Aucun événement ne correspond
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mb-5">
            Essayez de réinitialiser vos filtres ou ajoutez une nouvelle date importante pour la famille.
          </p>
          <button
            onClick={onAddEvent}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un événement</span>
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical central branch line for larger screens */}
          <div className="hidden sm:block absolute left-8 top-6 bottom-6 w-0.5 bg-gradient-to-b from-amber-300 via-stone-300 to-amber-200"></div>

          <div className="space-y-10">
            {groupedEvents.map((group) => (
              <div key={group.decade} className="space-y-6">
                {/* Decade Marker */}
                <div className="sticky top-20 z-10 flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-stone-800 text-amber-200 font-serif font-bold text-xs sm:text-sm shadow-sm border border-stone-700">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{group.decade}</span>
                  </div>
                  <div className="flex-1 h-px bg-stone-200"></div>
                </div>

                {/* Events list within decade */}
                <div className="space-y-6">
                  {group.events.map((event) => {
                    const typeInfo = EVENT_TYPE_INFO[event.type] || EVENT_TYPE_INFO.other;
                    const eventMembers = event.memberIds
                      .map((id) => memberMap.get(id))
                      .filter((m): m is FamilyMember => Boolean(m));

                    return (
                      <div
                        key={event.id}
                        id={`event-card-${event.id}`}
                        className="relative sm:pl-16 group"
                      >
                        {/* Timeline Node Icon (on the vertical line) */}
                        <div
                          className={`hidden sm:flex absolute left-5 top-5 -translate-x-1/2 w-7 h-7 rounded-full items-center justify-center border-2 border-white shadow-xs transition-transform group-hover:scale-115 ${typeInfo.bgClass} ${typeInfo.colorClass}`}
                        >
                          {getEventIcon(event.type)}
                        </div>

                        {/* Event Card Content */}
                        <div
                          className={`bg-white rounded-2xl border transition-all duration-200 p-5 sm:p-6 shadow-xs hover:shadow-md ${
                            event.isHighlight
                              ? 'border-amber-300/90 bg-amber-50/20'
                              : 'border-stone-200/80 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              {/* Meta: Date & Category */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="font-mono font-semibold text-xs text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                                  {formatFrenchDate(event.date)}
                                </span>

                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${typeInfo.bgClass} ${typeInfo.colorClass} ${typeInfo.borderClass}`}
                                >
                                  {getEventIcon(event.type)}
                                  <span>{typeInfo.label}</span>
                                </span>

                                {event.isHighlight && (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                                    <Sparkles className="w-3 h-3 text-amber-600" />
                                    <span>Majeur</span>
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="text-lg sm:text-xl font-bold font-serif text-stone-900 mb-1 leading-snug">
                                {event.title}
                              </h3>

                              {/* Location */}
                              {event.location && (
                                <p className="text-xs text-stone-500 flex items-center gap-1 mb-3">
                                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                                  <span>{event.location}</span>
                                </p>
                              )}

                              {/* Description */}
                              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line mb-4">
                                {event.description}
                              </p>

                              {/* Associated Family Members */}
                              {eventMembers.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-stone-100">
                                  <span className="text-xs text-stone-500 font-medium">
                                    Membres concernés :
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {eventMembers.map((member) => (
                                      <button
                                        key={member.id}
                                        onClick={() => onSelectMember(member)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-800 text-xs font-medium transition-colors border border-stone-200/70"
                                      >
                                        <img
                                          src={photoOrPlaceholder(member.photoUrl)}
                                          alt={member.firstName}
                                          className="w-4 h-4 rounded-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                        <span>
                                          {member.firstName} {member.lastName}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Optional Photo or Actions */}
                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                              {event.photoUrl && (
                                <img
                                  src={event.photoUrl}
                                  alt={event.title}
                                  className="w-24 h-24 sm:w-32 sm:h-28 rounded-xl object-cover shadow-sm border border-stone-200"
                                  referrerPolicy="no-referrer"
                                />
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onEditEvent(event)}
                                  title="Modifier cet événement"
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Êtes-vous sûr de vouloir supprimer l'événement "${event.title}" ?`
                                      )
                                    ) {
                                      onDeleteEvent(event.id);
                                    }
                                  }}
                                  title="Supprimer cet événement"
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
