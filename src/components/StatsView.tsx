import React, { useMemo } from 'react';
import { FamilyMember, FamilyEvent, calculateAge, ActivityLogItem } from '../types';
import { computeGenerations, getGenerationLabel } from '../utils/treeUtils';
import { getUpcomingBirthdays } from '../utils/birthdayUtils';
import { formatActivityTime, getActivityTypeMeta } from '../utils/activityUtils';
import { photoOrPlaceholder } from '../utils/avatarUtils';
import { LineageAnalysisSection } from './LineageAnalysisSection';
import {
  BarChart3,
  Cake,
  Heart,
  Users,
  Award,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  Clock,
  History,
} from 'lucide-react';

interface StatsViewProps {
  members: FamilyMember[];
  events: FamilyEvent[];
  familyName: string;
  activities?: ActivityLogItem[];
  onSelectMember: (member: FamilyMember) => void;
  onOpenMap?: () => void;
  onOpenActivityLog?: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  members,
  events,
  familyName,
  activities = [],
  onSelectMember,
  onOpenMap,
  onOpenActivityLog,
}) => {
  const generationsMap = useMemo(() => computeGenerations(members), [members]);

  // Living vs Deceased
  const livingMembers = members.filter((m) => !m.isDeceased);
  const deceasedMembers = members.filter((m) => m.isDeceased);

  // Highest generation count
  const maxGeneration = useMemo(() => {
    let max = 0;
    generationsMap.forEach((gen) => {
      if (gen > max) max = gen;
    });
    return max + 1;
  }, [generationsMap]);

  // Oldest living member (Doyen/Doyenne)
  const oldestLiving = useMemo(() => {
    const list = [...livingMembers].sort((a, b) => (a.birthDate || '').localeCompare(b.birthDate || ''));
    return list[0] || null;
  }, [livingMembers]);

  // Youngest living member (Cadet/Cadette)
  const youngestLiving = useMemo(() => {
    const list = [...livingMembers].sort((a, b) => (b.birthDate || '').localeCompare(a.birthDate || ''));
    return list[0] || null;
  }, [livingMembers]);

  // Average age among living members
  const averageAge = useMemo(() => {
    const ages = livingMembers
      .map((m) => calculateAge(m.birthDate).age)
      .filter((age): age is number => age !== null);
    if (ages.length === 0) return 0;
    const sum = ages.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / ages.length);
  }, [livingMembers]);

  // Upcoming birthdays this calendar year
  const upcomingBirthdays = useMemo(() => {
    return getUpcomingBirthdays(livingMembers, { maxDays: 365, includeDeceased: false })
      .slice(0, 5)
      .map((item) => ({
        ...item,
        dateStr: `${item.day.toString().padStart(2, '0')}/${item.month.toString().padStart(2, '0')}`,
      }));
  }, [livingMembers]);

  // Gender totals across the whole family
  const totalMen = members.filter((m) => m.gender === 'M').length;
  const totalWomen = members.filter((m) => m.gender === 'F').length;

  // Breakdown by generation: how many sons/daughters (or grandsons/
  // granddaughters, great-grandsons…) the family counts at each level.
  const generationBreakdown = useMemo(() => {
    const buckets = new Map<number, { total: number; men: number; women: number }>();
    members.forEach((m) => {
      const gen = generationsMap.get(m.id) ?? 0;
      const bucket = buckets.get(gen) || { total: 0, men: 0, women: 0 };
      bucket.total++;
      if (m.gender === 'M') bucket.men++;
      if (m.gender === 'F') bucket.women++;
      buckets.set(gen, bucket);
    });
    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([genIndex, counts]) => ({ genIndex, ...counts, label: getGenerationLabel(genIndex) }));
  }, [members, generationsMap]);

  // Top cities breakdown
  const cityStats = useMemo(() => {
    const counts = new Map<string, { births: number; residences: number; total: number }>();
    members.forEach((m) => {
      if (m.birthPlace?.trim()) {
        const c = m.birthPlace.split(/[,(]/)[0].trim();
        const cur = counts.get(c) || { births: 0, residences: 0, total: 0 };
        cur.births++;
        cur.total++;
        counts.set(c, cur);
      }
      if (m.currentResidence?.trim()) {
        const c = m.currentResidence.split(/[,(]/)[0].trim();
        const cur = counts.get(c) || { births: 0, residences: 0, total: 0 };
        cur.residences++;
        cur.total++;
        counts.set(c, cur);
      }
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6);
  }, [members]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Overview Title */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
              Repères & Statistiques de la {familyName}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Panorama historique, pyramide des générations et jalons marquants
            </p>
          </div>
        </div>

        {/* 4 Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <p className="text-xs text-stone-500 font-medium">Membres totaux</p>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              {members.length}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {livingMembers.length} vivants • {deceasedMembers.length} en mémoire
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
            <p className="text-xs text-amber-800 font-medium">Générations</p>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-amber-900 mt-1">
              {maxGeneration}
            </p>
            <p className="text-[11px] text-amber-700/80 mt-0.5">De l'aïeul au plus jeune</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <p className="text-xs text-stone-500 font-medium">Moyenne d'âge</p>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              {averageAge} ans
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">Parmi les membres vivants</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/70">
            <p className="text-xs text-rose-800 font-medium">Événements archivés</p>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-rose-900 mt-1">
              {events.length}
            </p>
            <p className="text-[11px] text-rose-700/80 mt-0.5">
              {events.filter((e) => e.isHighlight).length} majeurs
            </p>
          </div>
        </div>
      </div>

      {/* Pillars: Doyen vs Benjamin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Doyen / Oldest */}
        {oldestLiving && (
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs flex items-center gap-5">
            <img
              src={photoOrPlaceholder(oldestLiving.photoUrl)}
              alt={oldestLiving.firstName}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-amber-200"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
                  Doyen(ne) de la famille
                </span>
              </div>
              <h3 className="text-lg font-bold font-serif text-stone-900 truncate">
                {oldestLiving.firstName} {oldestLiving.lastName}
              </h3>
              <p className="text-xs text-stone-500">
                {calculateAge(oldestLiving.birthDate).displayText} • Né(e) en{' '}
                {oldestLiving.birthDate?.slice(0, 4)}
              </p>
              <button
                onClick={() => onSelectMember(oldestLiving)}
                className="mt-2 text-xs font-semibold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1"
              >
                <span>Consulter la fiche</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Youngest */}
        {youngestLiving && (
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs flex items-center gap-5">
            <img
              src={photoOrPlaceholder(youngestLiving.photoUrl)}
              alt={youngestLiving.firstName}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-sky-200"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-900">
                  Benjamin(e) de la famille
                </span>
              </div>
              <h3 className="text-lg font-bold font-serif text-stone-900 truncate">
                {youngestLiving.firstName} {youngestLiving.lastName}
              </h3>
              <p className="text-xs text-stone-500">
                {calculateAge(youngestLiving.birthDate).displayText} • Né(e) en{' '}
                {youngestLiving.birthDate?.slice(0, 4)}
              </p>
              <button
                onClick={() => onSelectMember(youngestLiving)}
                className="mt-2 text-xs font-semibold text-sky-800 hover:text-sky-950 inline-flex items-center gap-1"
              >
                <span>Consulter la fiche</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Family headcount by generation: sons, daughters, grandsons... */}
      <div className="card-elegant rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-[#a8791f]" strokeWidth={1.75} />
          <h3 className="text-lg font-bold font-serif text-stone-900">Dénombrement de la famille</h3>
        </div>
        <p className="text-xs text-stone-500 mb-5">
          Nombre total de membres, réparti par génération — fils et filles, petits-fils et
          petites-filles, etc.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">{members.length}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Total famille</p>
          </div>
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/70 text-center">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-sky-900">{totalMen}</p>
            <p className="text-[11px] text-sky-700/80 mt-0.5">Hommes (fils)</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/70 text-center">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-rose-900">{totalWomen}</p>
            <p className="text-[11px] text-rose-700/80 mt-0.5">Femmes (filles)</p>
          </div>
        </div>

        <div className="space-y-2">
          {generationBreakdown.map((g) => (
            <div
              key={g.genIndex}
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200/70"
            >
              <span className="text-xs sm:text-sm text-stone-700 font-medium truncate">{g.label}</span>
              <div className="flex items-center gap-3 text-xs sm:text-sm shrink-0">
                <span className="text-stone-900 font-semibold">{g.total} membre{g.total > 1 ? 's' : ''}</span>
                <span className="text-sky-700">{g.men} H</span>
                <span className="text-rose-700">{g.women} F</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Lineage & Generational Analysis */}
      <LineageAnalysisSection members={members} onSelectMember={onSelectMember} />

      {/* Upcoming Birthdays this year */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
        <h3 className="text-lg font-bold font-serif text-stone-900 flex items-center gap-2 mb-4">
          <Cake className="w-5 h-5 text-amber-700" />
          <span>Prochains Anniversaires à Célébrer</span>
        </h3>

        {upcomingBirthdays.length === 0 ? (
          <p className="text-xs text-stone-500 italic">Aucun anniversaire renseigné.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {upcomingBirthdays.map((item) => (
              <div
                key={item.member.id}
                onClick={() => onSelectMember(item.member)}
                className="p-3 rounded-2xl border border-stone-200 hover:border-amber-300 bg-stone-50/70 hover:bg-amber-50/30 transition-all cursor-pointer text-center"
              >
                <img
                  src={photoOrPlaceholder(item.member.photoUrl)}
                  alt={item.member.firstName}
                  className="w-12 h-12 rounded-full object-cover mx-auto mb-2 border-2 border-white shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <p className="font-semibold text-stone-900 text-xs truncate">
                  {item.member.firstName}
                </p>
                <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                  {item.dateStr}
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Fêtera ses <span className="font-semibold">{item.turningAge} ans</span>
                </p>
                <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                  Dans {item.daysLeft} jour{item.daysLeft > 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Geographic Hubs Overview */}
      {cityStats.length > 0 && (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-lg font-bold font-serif text-stone-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-700" />
                <span>Berceaux & Principaux Territoires Familiaux</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Villes de naissance et résidences les plus représentées au sein de la famille
              </p>
            </div>

            {onOpenMap && (
              <button
                type="button"
                onClick={onOpenMap}
                className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Explorer sur la carte</span>
                <span>→</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {cityStats.map(([cityName, stats]) => (
              <div
                key={cityName}
                onClick={onOpenMap}
                className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all cursor-pointer text-left group"
              >
                <p className="font-serif font-bold text-stone-900 text-sm truncate group-hover:text-amber-900">
                  {cityName}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-stone-600">
                  {stats.births > 0 && (
                    <span className="text-amber-800 font-medium">
                      {stats.births} naiss.
                    </span>
                  )}
                  {stats.births > 0 && stats.residences > 0 && <span>•</span>}
                  {stats.residences > 0 && (
                    <span className="text-emerald-800 font-medium">
                      {stats.residences} résid.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities Section */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold font-serif text-stone-900 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-700" />
              <span>Dernières Activités & Évolution de l'Arbre</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Suivez les récentes créations, modifications de fiches et événements enregistrés
            </p>
          </div>

          {onOpenActivityLog && (
            <button
              type="button"
              onClick={onOpenActivityLog}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/90 text-stone-800 text-xs font-semibold border border-stone-300/80 shadow-2xs transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Consulter le journal complet</span>
              <span>→</span>
            </button>
          )}
        </div>

        {activities.length === 0 ? (
          <div className="py-8 text-center text-stone-400 text-xs italic bg-stone-50 rounded-2xl border border-stone-200/60">
            Aucune activité enregistrée pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activities.slice(0, 4).map((act) => {
              const meta = getActivityTypeMeta(act.type);
              const targetMember = act.targetId
                ? members.find((m) => m.id === act.targetId)
                : undefined;

              return (
                <div
                  key={act.id}
                  className={`p-3.5 rounded-2xl border ${meta.borderClass} bg-stone-50/70 hover:bg-white hover:shadow-2xs transition-all flex items-start gap-3`}
                >
                  {act.targetPhotoUrl ? (
                    <img
                      src={act.targetPhotoUrl}
                      alt={act.targetName}
                      className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full ${meta.badgeBg} flex items-center justify-center shrink-0 text-stone-700`}
                    >
                      <History className="w-4 h-4" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.badgeBg} ${meta.badgeText}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {formatActivityTime(act.timestamp)}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-stone-900 text-sm mt-1 truncate">
                      {act.title}
                    </h4>

                    <p className="text-xs text-stone-600 line-clamp-2 mt-0.5">
                      {act.details}
                    </p>

                    {targetMember && (
                      <button
                        type="button"
                        onClick={() => onSelectMember(targetMember)}
                        className="mt-1.5 text-[11px] font-semibold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1 hover:underline"
                      >
                        <span>Fiche de {targetMember.firstName} →</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
