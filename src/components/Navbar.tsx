import React from 'react';
import {
  GitBranch,
  Clock,
  Users,
  MapPin,
  BarChart3,
  UserPlus,
  CalendarPlus,
  Download,
  Sparkles,
  Cake,
  History,
  MessageCircleHeart,
  Video,
  KeyRound,
} from 'lucide-react';

export type NavTab = 'tree' | 'timeline' | 'directory' | 'map' | 'stats' | 'meeting';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  familyName: string;
  memberCount: number;
  eventCount: number;
  upcomingBirthdaysCount?: number;
  activityCount?: number;
  onOpenBirthdaysModal: () => void;
  onOpenActivityLog: () => void;
  onAddMember: () => void;
  onAddEvent: () => void;
  onOpenExportImport: () => void;
  onOpenInvite: () => void;
  onOpenChangeAccessCode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  familyName,
  memberCount,
  eventCount,
  upcomingBirthdaysCount = 0,
  activityCount = 0,
  onOpenBirthdaysModal,
  onOpenActivityLog,
  onAddMember,
  onAddEvent,
  onOpenExportImport,
  onOpenInvite,
  onOpenChangeAccessCode,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-900/[0.06] shadow-[0_1px_0_rgba(28,25,23,0.03)]">
      <div className="hairline-gold" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo & Family Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-stone-900 flex items-center justify-center text-[#c9a24b] shrink-0 border border-[#a8791f]/40 ring-1 ring-stone-900/5">
              <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold font-serif text-stone-900 tracking-tight truncate">
                  {familyName || 'Arbre Généalogique'}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-50 text-[#8a6317] border border-[#a8791f]/25">
                  <Sparkles className="w-3 h-3 text-[#a8791f]" />
                  {memberCount} membres
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden md:block truncate tracking-wide uppercase">
                Mémoire familiale &amp; chronologie des événements
              </p>
            </div>
          </div>

          {/* Primary View Switcher */}
          <nav className="flex items-center gap-0.5 sm:gap-1 bg-stone-100/70 p-1 rounded-full border border-stone-900/[0.06]">
            <button
              id="tab-tree-btn"
              onClick={() => setActiveTab('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'tree'
                  ? 'bg-stone-900 text-[#e4c680] shadow-sm font-semibold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <GitBranch className="w-4 h-4" strokeWidth={1.75} />
              <span>Arbre</span>
            </button>

            <button
              id="tab-timeline-btn"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'timeline'
                  ? 'bg-stone-900 text-[#e4c680] shadow-sm font-semibold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Clock className="w-4 h-4" strokeWidth={1.75} />
              <span>Chronologie</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'timeline' ? 'bg-[#a8791f]/30 text-[#e4c680]' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {eventCount}
              </span>
            </button>

            <button
              id="tab-directory-btn"
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'directory'
                  ? 'bg-stone-900 text-[#e4c680] shadow-sm font-semibold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Users className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Annuaire</span>
              <span className="sm:hidden">Membres</span>
            </button>

            <button
              id="tab-map-btn"
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'map'
                  ? 'bg-stone-900 text-[#e4c680] shadow-sm font-semibold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Carte géographique des naissances et résidences"
            >
              <MapPin className="w-4 h-4" strokeWidth={1.75} />
              <span>Carte</span>
            </button>

            <button
              id="tab-stats-btn"
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'stats'
                  ? 'bg-stone-900 text-[#e4c680] shadow-sm font-semibold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Statistiques & Repères"
            >
              <BarChart3 className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden md:inline">Repères</span>
            </button>

            <button
              id="tab-meeting-btn"
              onClick={() => setActiveTab('meeting')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'meeting'
                  ? 'bg-stone-900 text-[#e4c680] shadow-sm font-semibold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Réunion familiale en visioconférence"
            >
              <Video className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden md:inline">Réunion</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Upcoming Birthdays Notification Button */}
            <button
              id="btn-upcoming-birthdays"
              onClick={onOpenBirthdaysModal}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                upcomingBirthdaysCount > 0
                  ? 'bg-[#faf4e6] hover:bg-[#f5ead0] text-[#8a6317] border border-[#a8791f]/30'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100 border border-transparent'
              }`}
              title={
                upcomingBirthdaysCount > 0
                  ? `${upcomingBirthdaysCount} anniversaire${upcomingBirthdaysCount > 1 ? 's' : ''} à venir sous 30 jours`
                  : 'Prochains anniversaires'
              }
            >
              <Cake className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden md:inline">Anniversaires</span>
              {upcomingBirthdaysCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#a8791f] text-white font-bold">
                  {upcomingBirthdaysCount}
                </span>
              )}
            </button>

            {/* Activity Log Button */}
            <button
              id="btn-activity-log"
              onClick={onOpenActivityLog}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full text-xs sm:text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 border border-transparent transition-colors"
              title="Journal des activités et modifications"
            >
              <History className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden md:inline">Journal</span>
              {activityCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-200 text-stone-600 font-bold">
                  {activityCount}
                </span>
              )}
            </button>

            <button
              id="btn-invite-member"
              onClick={onOpenInvite}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full text-xs sm:text-sm font-medium text-[#1fb855] hover:bg-[#25D366]/10 border border-[#25D366]/30 transition-colors"
              title="Inviter un proche à remplir sa fiche par WhatsApp"
            >
              <MessageCircleHeart className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden lg:inline">Inviter</span>
            </button>

            <button
              id="btn-add-member"
              onClick={onAddMember}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-[#e4c680] font-medium text-xs sm:text-sm transition-colors shrink-0"
              title="Ajouter un membre à la famille"
            >
              <UserPlus className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Membre</span>
              <span className="sm:hidden">+</span>
            </button>

            <button
              id="btn-add-event"
              onClick={onAddEvent}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full bg-transparent hover:bg-stone-100 text-stone-700 border border-stone-300 font-medium text-xs sm:text-sm transition-colors shrink-0"
              title="Ajouter un événement marquant"
            >
              <CalendarPlus className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden lg:inline">Événement</span>
            </button>

            <button
              id="btn-open-export"
              onClick={onOpenExportImport}
              className="p-2 sm:px-3 sm:py-2 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors border border-transparent"
              title="Exporter, sauvegarder ou imprimer"
            >
              <Download className="w-4 h-4 sm:mr-1.5 inline" strokeWidth={1.75} />
              <span className="hidden xl:inline text-xs sm:text-sm">Sauvegarde</span>
            </button>

            <button
              id="btn-change-access-code"
              onClick={onOpenChangeAccessCode}
              className="p-2 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors border border-transparent"
              title="Changer le code d'accès de la famille"
            >
              <KeyRound className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
