import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { FamilyMember, calculateAge } from '../types';
import { geocodeLocation, LatLng, extractCityName } from '../utils/geocoding';
import { photoOrPlaceholder } from '../utils/avatarUtils';
import {
  MapPin,
  Home,
  Baby,
  Compass,
  Search,
  Filter,
  Users,
  Sparkles,
  Layers,
  Eye,
  Maximize2,
  Navigation,
  ArrowRight,
  Info,
  Calendar,
  Briefcase,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface FamilyMapViewProps {
  members: FamilyMember[];
  familyName: string;
  onSelectMember: (member: FamilyMember) => void;
  onEditMember?: (member: FamilyMember) => void;
}

export type MapFilterMode = 'all' | 'birth' | 'residence';

interface MemberLocationPoint {
  id: string; // unique id per point
  member: FamilyMember;
  type: 'birth' | 'residence';
  locationName: string;
  coords: LatLng;
}

interface LocationCluster {
  cityName: string;
  coords: LatLng;
  birthCount: number;
  residenceCount: number;
  points: MemberLocationPoint[];
}

export const FamilyMapView: React.FC<FamilyMapViewProps> = ({
  members,
  familyName,
  onSelectMember,
  onEditMember,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pathsLayerRef = useRef<L.LayerGroup | null>(null);

  // States
  const [filterMode, setFilterMode] = useState<MapFilterMode>('all');
  const [selectedGen, setSelectedGen] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMigrationPaths, setShowMigrationPaths] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<LocationCluster | null>(null);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(true);
  const [resolvedPoints, setResolvedPoints] = useState<MemberLocationPoint[]>([]);

  // 1. Geocode all members' birthplaces and residences
  useEffect(() => {
    let isCancelled = false;

    async function resolveAllLocations() {
      setIsGeocodingLoading(true);
      const points: MemberLocationPoint[] = [];

      for (const m of members) {
        // Birth location
        if (m.birthPlace && m.birthPlace.trim()) {
          const coords = await geocodeLocation(m.birthPlace);
          if (coords && !isCancelled) {
            points.push({
              id: `${m.id}-birth`,
              member: m,
              type: 'birth',
              locationName: m.birthPlace.trim(),
              coords,
            });
          }
        }

        // Current residence
        if (m.currentResidence && m.currentResidence.trim()) {
          const coords = await geocodeLocation(m.currentResidence);
          if (coords && !isCancelled) {
            points.push({
              id: `${m.id}-residence`,
              member: m,
              type: 'residence',
              locationName: m.currentResidence.trim(),
              coords,
            });
          }
        }
      }

      if (!isCancelled) {
        setResolvedPoints(points);
        setIsGeocodingLoading(false);
      }
    }

    resolveAllLocations();

    return () => {
      isCancelled = true;
    };
  }, [members]);

  // 2. Filter points based on selected criteria
  const filteredPoints = useMemo(() => {
    return resolvedPoints.filter((pt) => {
      // Filter by type (birth vs residence)
      if (filterMode === 'birth' && pt.type !== 'birth') return false;
      if (filterMode === 'residence' && pt.type !== 'residence') return false;

      // Filter by generation
      if (selectedGen !== 'all') {
        const genNum = parseInt(selectedGen, 10);
        if (pt.member.generation !== genNum) return false;
      }

      // Filter by search text (member name or city)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${pt.member.firstName} ${pt.member.lastName}`.toLowerCase();
        const loc = pt.locationName.toLowerCase();
        if (!fullName.includes(q) && !loc.includes(q)) return false;
      }

      return true;
    });
  }, [resolvedPoints, filterMode, selectedGen, searchQuery]);

  // 3. Group filtered points into geographic clusters by proximity / city
  const clusters = useMemo(() => {
    const clusterMap = new Map<string, LocationCluster>();

    filteredPoints.forEach((pt) => {
      // Group by approximate coordinates (rounded to 3 decimals ~ 100m)
      const coordKey = `${pt.coords.lat.toFixed(3)},${pt.coords.lng.toFixed(3)}`;
      const cityName = extractCityName(pt.locationName) || pt.locationName;

      if (!clusterMap.has(coordKey)) {
        clusterMap.set(coordKey, {
          cityName,
          coords: pt.coords,
          birthCount: 0,
          residenceCount: 0,
          points: [],
        });
      }

      const cluster = clusterMap.get(coordKey)!;
      cluster.points.push(pt);
      if (pt.type === 'birth') cluster.birthCount++;
      if (pt.type === 'residence') cluster.residenceCount++;
    });

    return Array.from(clusterMap.values()).sort(
      (a, b) => b.points.length - a.points.length
    );
  }, [filteredPoints]);

  // 4. Migration Paths (Birth -> Residence for each member)
  const migrationPaths = useMemo(() => {
    if (!showMigrationPaths) return [];

    const paths: {
      member: FamilyMember;
      from: { name: string; coords: LatLng };
      to: { name: string; coords: LatLng };
    }[] = [];

    members.forEach((m) => {
      if (selectedGen !== 'all') {
        const genNum = parseInt(selectedGen, 10);
        if (m.generation !== genNum) return;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
        if (!fullName.includes(q)) return;
      }

      const birthPt = resolvedPoints.find((p) => p.member.id === m.id && p.type === 'birth');
      const resPt = resolvedPoints.find((p) => p.member.id === m.id && p.type === 'residence');

      if (birthPt && resPt) {
        // Only draw if different coordinates (person moved to another city/region)
        const dist = Math.hypot(
          birthPt.coords.lat - resPt.coords.lat,
          birthPt.coords.lng - resPt.coords.lng
        );
        if (dist > 0.05) {
          paths.push({
            member: m,
            from: { name: birthPt.locationName, coords: birthPt.coords },
            to: { name: resPt.locationName, coords: resPt.coords },
          });
        }
      }
    });

    return paths;
  }, [members, resolvedPoints, showMigrationPaths, selectedGen, searchQuery]);

  // Members without location
  const membersWithoutLocations = useMemo(() => {
    return members.filter(
      (m) =>
        (!m.birthPlace || !m.birthPlace.trim()) &&
        (!m.currentResidence || !m.currentResidence.trim())
    );
  }, [members]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: France/Western Europe
      const map = L.map(mapContainerRef.current, {
        center: [46.5, 3.5],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
      });

      // Add clean zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add stylish attribution at bottom left
      L.control
        .attribution({
          position: 'bottomleft',
          prefix: '<a href="https://leafletjs.com" target="_blank">Leaflet</a> &bull; &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        })
        .addTo(map);

      // Add CartoDB Positron / OpenStreetMap standard tiles (warm, elegant aesthetic)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Create layers
      pathsLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Note: we keep the map instance mounted, or clean up if unmounted
    };
  }, []);

  // Update Markers and Migration Paths whenever clusters or filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const markersLayer = markersLayerRef.current;
    const pathsLayer = pathsLayerRef.current;

    if (markersLayer) markersLayer.clearLayers();
    if (pathsLayer) pathsLayer.clearLayers();

    // Draw migration paths (curves / dashed lines)
    if (pathsLayer && showMigrationPaths && migrationPaths.length > 0) {
      migrationPaths.forEach((path) => {
        const latlngs: [number, number][] = [
          [path.from.coords.lat, path.from.coords.lng],
          [path.to.coords.lat, path.to.coords.lng],
        ];

        const polyline = L.polyline(latlngs, {
          color: '#d97706', // amber-600
          weight: 2.5,
          opacity: 0.75,
          dashArray: '6, 6',
          lineCap: 'round',
        });

        polyline.bindTooltip(
          `<strong>${path.member.firstName} ${path.member.lastName}</strong><br/>De ${path.from.name} vers ${path.to.name}`,
          { direction: 'top', className: 'custom-leaflet-tooltip' }
        );

        polyline.addTo(pathsLayer);
      });
    }

    // Draw markers for each cluster
    if (markersLayer) {
      const bounds: [number, number][] = [];

      clusters.forEach((cluster) => {
        bounds.push([cluster.coords.lat, cluster.coords.lng]);

        // Determine dominant type & color
        const isSelected = selectedCluster?.cityName === cluster.cityName;
        const hasBirth = cluster.birthCount > 0;
        const hasResidence = cluster.residenceCount > 0;

        let badgeBg = 'bg-amber-600 text-white';
        let ringColor = 'ring-amber-400';
        let iconHtml = '<span class="text-xs">✦</span>';

        if (hasBirth && hasResidence) {
          badgeBg = 'bg-gradient-to-br from-amber-600 to-emerald-600 text-white';
          ringColor = 'ring-amber-300';
          iconHtml = '<span class="text-[11px] font-bold">★</span>';
        } else if (hasResidence) {
          badgeBg = 'bg-emerald-600 text-white';
          ringColor = 'ring-emerald-300';
          iconHtml = '<span class="text-[11px]">🏠</span>';
        } else {
          badgeBg = 'bg-amber-600 text-white';
          ringColor = 'ring-amber-300';
          iconHtml = '<span class="text-[11px]">👶</span>';
        }

        const totalCount = cluster.points.length;
        const primaryAvatar = photoOrPlaceholder(cluster.points[0]?.member.photoUrl);

        // Custom HTML Marker
        const markerHtml = `
          <div class="relative group cursor-pointer transition-transform duration-200 hover:scale-110 ${
            isSelected ? 'scale-115 z-30' : 'z-10'
          }">
            <div class="relative flex items-center justify-center">
              <!-- Pin Head / Avatar Circle -->
              <div class="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden ${ringColor} ring-2 bg-stone-900">
                <img src="${primaryAvatar}" class="w-full h-full object-cover" alt="${cluster.cityName}" />
              </div>

              <!-- Badge count if multiple members -->
              <div class="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full ${badgeBg} text-[10px] font-extrabold shadow-sm border border-white">
                ${totalCount}
              </div>

              <!-- Mini indicator pin below -->
              <div class="absolute -bottom-2 w-3 h-3 bg-stone-800 rotate-45 border-r border-b border-white rounded-xs"></div>
            </div>

            <!-- City Name Label on hover or selected -->
            <div class="mt-2.5 px-2 py-0.5 rounded-md bg-stone-900/90 text-white text-[10px] font-semibold tracking-wide whitespace-nowrap shadow-md text-center max-w-[120px] truncate mx-auto">
              ${cluster.cityName}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-map-marker',
          html: markerHtml,
          iconSize: [48, 64],
          iconAnchor: [24, 48],
          popupAnchor: [0, -44],
        });

        const marker = L.marker([cluster.coords.lat, cluster.coords.lng], {
          icon: customIcon,
        });

        marker.on('click', () => {
          setSelectedCluster(cluster);
          map.panTo([cluster.coords.lat, cluster.coords.lng], {
            animate: true,
            duration: 0.5,
          });
        });

        marker.addTo(markersLayer);
      });

      // Fit bounds if we have points and not user-focused
      if (bounds.length > 0 && !selectedCluster) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
      }
    }
  }, [clusters, migrationPaths, showMigrationPaths, selectedCluster]);

  // Center on specific cluster
  const handleSelectCluster = (cluster: LocationCluster) => {
    setSelectedCluster(cluster);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([cluster.coords.lat, cluster.coords.lng], 12, {
        animate: true,
      });
    }
  };

  // Reset map to fit all locations
  const handleResetView = () => {
    setSelectedCluster(null);
    if (mapInstanceRef.current && clusters.length > 0) {
      const bounds = clusters.map((c) => [c.coords.lat, c.coords.lng] as [number, number]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
    }
  };

  // Distinct generations list for filter
  const availableGenerations = useMemo(() => {
    const gens = new Set<number>();
    members.forEach((m) => {
      if (typeof m.generation === 'number') gens.add(m.generation);
    });
    return Array.from(gens).sort((a, b) => a - b);
  }, [members]);

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] bg-stone-100 overflow-hidden">
      {/* Top Filter & Control Bar */}
      <div className="bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-6 py-3 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Title & Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 mr-1">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold font-serif text-stone-900">
                  Cartographie Familiale
                </h2>
                <p className="text-[11px] text-stone-500 hidden sm:block">
                  {clusters.length} ville{clusters.length > 1 ? 's' : ''} &bull; {filteredPoints.length} repères cartographiés
                </p>
              </div>
            </div>

            {/* Filter Mode: All / Birth / Residence */}
            <div className="flex items-center p-0.5 bg-stone-100 rounded-xl border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-stone-900 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Tous les lieux
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('birth')}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                  filterMode === 'birth'
                    ? 'bg-amber-700 text-white font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Baby className="w-3 h-3 text-amber-300" />
                <span>Naissances</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('residence')}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                  filterMode === 'residence'
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Home className="w-3 h-3 text-emerald-300" />
                <span>Résidences</span>
              </button>
            </div>

            {/* Toggle Migration Paths */}
            <button
              type="button"
              onClick={() => setShowMigrationPaths(!showMigrationPaths)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                showMigrationPaths
                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
              title="Afficher les lignes reliant le lieu de naissance à la résidence actuelle"
            >
              <Navigation className="w-3 h-3 text-amber-600" />
              <span>Trajectoires de vie ({migrationPaths.length})</span>
            </button>
          </div>

          {/* Right: Search & Generation filter & Reset */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chercher un membre ou une ville..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-600/30 text-stone-800"
              />
            </div>

            {/* Generation Filter */}
            {availableGenerations.length > 1 && (
              <select
                value={selectedGen}
                onChange={(e) => setSelectedGen(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              >
                <option value="all">Toutes générations</option>
                {availableGenerations.map((g) => (
                  <option key={g} value={g.toString()}>
                    Génération {g + 1}
                  </option>
                ))}
              </select>
            )}

            {/* Fit All View Button */}
            <button
              type="button"
              onClick={handleResetView}
              className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors"
              title="Recentrer la carte sur tous les membres"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Area: Map + Side Drawer */}
      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {/* Leaflet Map Stage */}
        <div className="flex-1 relative h-full w-full">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

          {/* Loading indicator if resolving geocoding */}
          {isGeocodingLoading && (
            <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-stone-200 flex items-center gap-2 text-xs text-stone-700 font-medium animate-pulse">
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-700" />
              <span>Géocodage des lieux familiaux...</span>
            </div>
          )}

          {/* Legend Badge in Map */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-stone-200/90 text-[11px] text-stone-700 space-y-1 hidden sm:block">
            <p className="font-bold text-stone-900 text-xs mb-1">Légende</p>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-600 shrink-0 border border-white"></span>
              <span>Lieu de naissance (berceau)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0 border border-white"></span>
              <span>Résidence actuelle</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 border-b-2 border-dashed border-amber-600 shrink-0"></span>
              <span>Lignée migratoire</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Location Directory & Active Cluster Details */}
        <div className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-stone-200 flex flex-col max-h-[45vh] md:max-h-full overflow-hidden shrink-0 shadow-lg z-10">
          {/* Header of Sidebar */}
          <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-700" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                {selectedCluster ? selectedCluster.cityName : 'Territoires & Villes'}
              </h3>
            </div>
            {selectedCluster ? (
              <button
                onClick={() => setSelectedCluster(null)}
                className="text-[11px] text-stone-500 hover:text-stone-800 font-semibold underline"
              >
                Voir toutes les villes
              </button>
            ) : (
              <span className="text-[11px] text-stone-500 font-medium">
                {clusters.length} répertoriée{clusters.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Body of Sidebar */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* If a city cluster is selected, show its detailed member list */}
            {selectedCluster ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-stone-900 text-base">
                      {selectedCluster.cityName}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900">
                      {selectedCluster.points.length} attache{selectedCluster.points.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-600">
                    {selectedCluster.birthCount > 0 && (
                      <span className="flex items-center gap-1 text-amber-800 font-medium">
                        <Baby className="w-3.5 h-3.5" />
                        {selectedCluster.birthCount} naissance{selectedCluster.birthCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {selectedCluster.residenceCount > 0 && (
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">
                        <Home className="w-3.5 h-3.5" />
                        {selectedCluster.residenceCount} résidence{selectedCluster.residenceCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 px-1">
                    Membres liés à cette ville
                  </p>

                  {selectedCluster.points.map((pt) => {
                    const ageInfo = calculateAge(
                      pt.member.birthDate,
                      pt.member.deathDate,
                      pt.member.isDeceased
                    );

                    return (
                      <div
                        key={pt.id}
                        className="p-2.5 rounded-2xl border border-stone-200 hover:border-amber-300 bg-white hover:bg-stone-50/80 transition-all flex items-center justify-between gap-3 shadow-2xs group"
                      >
                        <div
                          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                          onClick={() => onSelectMember(pt.member)}
                        >
                          <img
                            src={photoOrPlaceholder(pt.member.photoUrl)}
                            alt={pt.member.firstName}
                            className="w-11 h-11 rounded-xl object-cover ring-1 ring-stone-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  pt.type === 'birth'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                {pt.type === 'birth' ? 'Naissance' : 'Résidence'}
                              </span>
                              {pt.member.isDeceased && (
                                <span className="text-[10px] text-stone-400">†</span>
                              )}
                            </div>
                            <h5 className="font-semibold text-xs sm:text-sm text-stone-900 truncate mt-0.5 group-hover:text-amber-900">
                              {pt.member.firstName} {pt.member.lastName}
                            </h5>
                            <p className="text-[11px] text-stone-500 truncate">
                              {ageInfo.displayText}
                              {pt.member.occupation ? ` • ${pt.member.occupation}` : ''}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectMember(pt.member)}
                          className="p-1.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-900 transition-colors shrink-0"
                          title="Consulter la fiche complète"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* All Cities Hub Overview */
              <div className="space-y-3">
                {clusters.length === 0 ? (
                  <div className="text-center py-8 px-4 text-stone-500 text-xs">
                    <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                    <p className="font-semibold">Aucun lieu ne correspond aux filtres.</p>
                    <p className="text-[11px] mt-1 text-stone-400">
                      Essayez d'ajuster votre recherche ou de sélectionner "Tous les lieux".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clusters.map((cluster) => (
                      <div
                        key={cluster.cityName}
                        onClick={() => handleSelectCluster(cluster)}
                        className="p-3 rounded-2xl border border-stone-200 hover:border-amber-300 bg-stone-50/50 hover:bg-amber-50/30 cursor-pointer transition-all flex items-center justify-between gap-2 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-serif font-bold text-stone-900 text-xs sm:text-sm group-hover:text-amber-900 truncate">
                              {cluster.cityName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                            {cluster.birthCount > 0 && (
                              <span className="text-amber-800 font-medium">
                                {cluster.birthCount} naissance{cluster.birthCount > 1 ? 's' : ''}
                              </span>
                            )}
                            {cluster.birthCount > 0 && cluster.residenceCount > 0 && (
                              <span>&bull;</span>
                            )}
                            {cluster.residenceCount > 0 && (
                              <span className="text-emerald-800 font-medium">
                                {cluster.residenceCount} résidence{cluster.residenceCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Avatars preview of up to 3 members */}
                        <div className="flex -space-x-2 shrink-0">
                          {cluster.points.slice(0, 3).map((pt, i) => (
                            <img
                              key={i}
                              src={photoOrPlaceholder(pt.member.photoUrl)}
                              alt={pt.member.firstName}
                              className="w-7 h-7 rounded-full object-cover ring-2 ring-white"
                              referrerPolicy="no-referrer"
                            />
                          ))}
                          {cluster.points.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-stone-200 ring-2 ring-white text-stone-700 text-[10px] font-bold flex items-center justify-center">
                              +{cluster.points.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Section for members with unassigned locations */}
                {membersWithoutLocations.length > 0 && (
                  <div className="pt-3 border-t border-stone-200/80">
                    <details className="group">
                      <summary className="flex items-center justify-between text-xs font-bold text-stone-600 cursor-pointer select-none py-1 hover:text-stone-900">
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-stone-400" />
                          <span>Lieux à renseigner ({membersWithoutLocations.length})</span>
                        </span>
                        <span className="text-[10px] font-normal text-stone-400 group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </summary>
                      <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                        {membersWithoutLocations.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => onSelectMember(m)}
                            className="p-2 rounded-xl bg-stone-100 hover:bg-amber-100/60 cursor-pointer text-xs flex items-center justify-between text-stone-700 transition-colors"
                          >
                            <span className="truncate">
                              {m.firstName} {m.lastName}
                            </span>
                            <span className="text-[10px] text-amber-800 font-semibold shrink-0">
                              Compléter →
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
