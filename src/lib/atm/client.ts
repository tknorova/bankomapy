import type { Atm, AtmDataset } from "./types";

const KEY = "bankomaty-cache-v1";
const TTL = 1000 * 60 * 60 * 12;

/** Loads all ATMs once; cached in localStorage for 12 h. Call only in the browser. */
export async function loadAtms(): Promise<AtmDataset> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const c = JSON.parse(raw) as { at: number; data: AtmDataset };
      if (Date.now() - c.at < TTL && c.data.atms?.length) return c.data;
    }
  } catch {
    /* ignore */
  }
  const res = await fetch("/api/public/atms");
  if (!res.ok) throw new Error("Nepodařilo se načíst data o bankomatech.");
  const data = (await res.json()) as AtmDataset;
  try {
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* quota */
  }
  return data;
}

export interface Place {
  name: string;
  lat: number;
  lon: number;
}

/** Nominatim geocoding — called only on explicit search submit (usage policy: ≤1 req/s). */
export async function geocode(q: string): Promise<Place[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=cz&limit=5&accept-language=cs&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Vyhledávání se nezdařilo.");
  const json = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return json.map((r) => ({ name: r.display_name, lat: +r.lat, lon: +r.lon }));
}

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0).replace(".", ",")} km`;
}

export type { Atm };
