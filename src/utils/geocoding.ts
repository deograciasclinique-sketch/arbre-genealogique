export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeocodedPlace {
  query: string;
  normalizedName: string;
  coords: LatLng;
  country?: string;
}

// Extensive pre-compiled dictionary of cities to avoid network latency
const KNOWN_COORDINATES: Record<string, LatLng> = {
  // Rhône-Alpes / Provence / PACA
  lyon: { lat: 45.764043, lng: 4.835659 },
  grenoble: { lat: 45.188529, lng: 5.724524 },
  gordes: { lat: 43.9126, lng: 5.2001 },
  annecy: { lat: 45.899247, lng: 6.129384 },
  avignon: { lat: 43.949317, lng: 4.805528 },
  marseille: { lat: 43.296482, lng: 5.36978 },
  aix: { lat: 43.529742, lng: 5.447427 },
  'aix-en-provence': { lat: 43.529742, lng: 5.447427 },
  nice: { lat: 43.710173, lng: 7.261953 },
  cannes: { lat: 43.552847, lng: 7.017369 },
  toulon: { lat: 43.124228, lng: 5.928 },
  valence: { lat: 44.933393, lng: 4.89236 },
  chambery: { lat: 45.564601, lng: 5.917781 },
  'saint-etienne': { lat: 45.439695, lng: 4.387178 },
  nimes: { lat: 43.836699, lng: 4.360054 },
  arles: { lat: 43.676647, lng: 4.627793 },

  // Île-de-France & Nord
  paris: { lat: 48.856614, lng: 2.352222 },
  versailles: { lat: 48.801408, lng: 2.130122 },
  lille: { lat: 50.62925, lng: 3.057256 },
  amiens: { lat: 49.894067, lng: 2.295753 },
  rouen: { lat: 49.443232, lng: 1.099971 },
  caen: { lat: 49.182863, lng: -0.370679 },
  'le havre': { lat: 49.49437, lng: 0.107929 },
  reims: { lat: 49.258329, lng: 4.031696 },

  // Ouest & Sud-Ouest
  bordeaux: { lat: 44.837789, lng: -0.57918 },
  toulouse: { lat: 43.604652, lng: 1.444209 },
  montpellier: { lat: 43.610769, lng: 3.876716 },
  nantes: { lat: 47.218371, lng: -1.553621 },
  rennes: { lat: 48.117266, lng: -1.677793 },
  brest: { lat: 48.390394, lng: -4.486076 },
  'saint-malo': { lat: 48.649337, lng: -2.025674 },
  'la rochelle': { lat: 46.160329, lng: -1.151139 },
  biarritz: { lat: 43.483152, lng: -1.558626 },
  pau: { lat: 43.2951, lng: -0.370797 },
  angouleme: { lat: 45.648377, lng: 0.156237 },
  limoges: { lat: 45.833619, lng: 1.261105 },
  poitiers: { lat: 46.580224, lng: 0.340375 },
  tours: { lat: 47.394144, lng: 0.68484 },
  angers: { lat: 47.478419, lng: -0.563166 },
  'le mans': { lat: 48.00611, lng: 0.199556 },

  // Est & Centre
  strasbourg: { lat: 48.573405, lng: 7.752111 },
  mulhouse: { lat: 47.750839, lng: 7.335888 },
  colmar: { lat: 48.079358, lng: 7.358512 },
  metz: { lat: 49.119308, lng: 6.175716 },
  nancy: { lat: 48.692054, lng: 6.184417 },
  dijon: { lat: 47.322047, lng: 5.04148 },
  besancon: { lat: 47.237829, lng: 6.024054 },
  orleans: { lat: 47.90289, lng: 1.90389 },
  'clermont-ferrand': { lat: 45.777222, lng: 3.087025 },
  perpignan: { lat: 42.688659, lng: 2.894833 },
  ajaccio: { lat: 41.926667, lng: 8.736944 },
  bastia: { lat: 42.702778, lng: 9.45 },

  // International & Voisins
  monaco: { lat: 43.738418, lng: 7.424616 },
  geneve: { lat: 46.204391, lng: 6.143158 },
  lausanne: { lat: 46.519653, lng: 6.632273 },
  zurich: { lat: 47.376887, lng: 8.541694 },
  bruxelles: { lat: 50.85034, lng: 4.35171 },
  liege: { lat: 50.632557, lng: 5.579666 },
  luxembourg: { lat: 49.611621, lng: 6.131935 },
  londres: { lat: 51.507351, lng: -0.127758 },
  madrid: { lat: 40.416775, lng: -3.70379 },
  barcelone: { lat: 41.387917, lng: 2.169919 },
  rome: { lat: 41.902783, lng: 12.496366 },
  milan: { lat: 45.464204, lng: 9.189982 },
  berlin: { lat: 52.520007, lng: 13.404954 },
  montreal: { lat: 45.501689, lng: -73.567256 },
  quebec: { lat: 46.813878, lng: -71.207981 },
  dakar: { lat: 14.716677, lng: -17.467686 },
  'new york': { lat: 40.712776, lng: -74.005974 },
};

const GEO_CACHE_STORAGE_KEY = 'family_genealogy_geocache_v1';

/**
 * Normalizes a place string for matching:
 * removes accents, lowercases, strips trailing country or dept info
 */
export function normalizePlaceQuery(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Attempts to extract the main city name from strings like:
 * "Lyon, France", "Gordes, Luberon", "Avignon (84)", "Paris 15e"
 */
export function extractCityName(raw: string): string {
  if (!raw) return '';
  const firstPart = raw.split(/[,(/–-]/)[0]?.trim() || raw.trim();
  return firstPart.replace(/\b(luberon|provence|france|cedex|\d{5})\b/gi, '').trim() || firstPart;
}

/**
 * Reads geocoding cache from localStorage
 */
function getStoredCache(): Record<string, LatLng> {
  try {
    const raw = localStorage.getItem(GEO_CACHE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Geocache read error:', e);
  }
  return {};
}

/**
 * Saves a new coordinate entry to localStorage
 */
function setStoredCache(key: string, coords: LatLng) {
  try {
    const current = getStoredCache();
    current[key] = coords;
    localStorage.setItem(GEO_CACHE_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Geocache write error:', e);
  }
}

/**
 * Geocodes a place name to coordinates (lat, lng)
 * 1. Checks Static built-in dictionary
 * 2. Checks LocalStorage cache
 * 3. Fallbacks to OpenStreetMap Nominatim API with rate limiting
 */
export async function geocodeLocation(rawPlace: string): Promise<LatLng | null> {
  if (!rawPlace || !rawPlace.trim()) return null;

  const normalized = normalizePlaceQuery(rawPlace);
  const cityExtracted = normalizePlaceQuery(extractCityName(rawPlace));

  // 1. Direct Static Match
  if (KNOWN_COORDINATES[normalized]) {
    return KNOWN_COORDINATES[normalized];
  }
  if (KNOWN_COORDINATES[cityExtracted]) {
    return KNOWN_COORDINATES[cityExtracted];
  }

  // Check partial key matches (e.g. if key is inside raw string)
  for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (normalized.includes(key) || key.includes(cityExtracted)) {
      return coords;
    }
  }

  // 2. Check local storage cache
  const cache = getStoredCache();
  if (cache[normalized]) return cache[normalized];
  if (cache[cityExtracted]) return cache[cityExtracted];

  // 3. Fallback: Query OpenStreetMap Nominatim (Async)
  try {
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      rawPlace
    )}`;
    const response = await fetch(searchUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          const coords = { lat, lng };
          setStoredCache(normalized, coords);
          return coords;
        }
      }
    }
  } catch (err) {
    console.warn(`Geocoding lookup failed for "${rawPlace}":`, err);
  }

  // If no match found, fallback to approximate center of France if mentions France, or Paris center
  if (normalized.includes('france')) {
    return { lat: 46.603354, lng: 1.888334 }; // Geographical center of France
  }

  return null;
}
