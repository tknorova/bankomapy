import OpeningHours from "opening_hours";
import type { Atm, BankId } from "./types";
import { distanceKm } from "./client";

export interface Filters {
  banks: BankId[]; // empty = all
  cashOut: boolean;
  cashIn: boolean;
  coinsIn: boolean;
  contactless: boolean;
  openNow: boolean;
  nonstop: boolean;
  wheelchair: boolean;
  maxDistanceKm: number | null;
}

export const EMPTY_FILTERS: Filters = {
  banks: [],
  cashOut: false,
  cashIn: false,
  coinsIn: false,
  contactless: false,
  openNow: false,
  nonstop: false,
  wheelchair: false,
  maxDistanceKm: null,
};

export const is247 = (oh: string | null) => !!oh && /^\s*24\/7\s*$/.test(oh);

const ohCache = new Map<string, OpeningHours | null>();
/** Returns true/false when known, null when hours are missing or unparseable. */
export function isOpenNow(oh: string | null, now = new Date()): boolean | null {
  if (!oh) return null;
  if (is247(oh)) return true;
  let parsed = ohCache.get(oh);
  if (parsed === undefined) {
    try {
      parsed = new OpeningHours(oh, { lat: 50, lon: 15, address: { country_code: "cz", state: "" } } as never);
    } catch {
      parsed = null;
    }
    ohCache.set(oh, parsed);
  }
  if (!parsed) return null;
  try {
    return parsed.getState(now);
  } catch {
    return null;
  }
}

export function countActive(f: Filters) {
  return (
    (f.banks.length ? 1 : 0) +
    [f.cashOut, f.cashIn, f.coinsIn, f.contactless, f.openNow, f.nonstop, f.wheelchair].filter(Boolean).length +
    (f.maxDistanceKm != null ? 1 : 0)
  );
}

/** Only confirmed ("yes") values pass a filter — unknown never counts as verified. */
export function applyFilters(atms: Atm[], f: Filters, origin: { lat: number; lon: number } | null, now = new Date()) {
  return atms.filter((a) => {
    if (f.banks.length && !f.banks.includes(a.bank)) return false;
    if (f.cashOut && a.cashOut === "no") return false; // withdrawal is the default ATM function
    if (f.cashIn && a.cashIn !== "yes") return false;
    if (f.coinsIn && a.coinsIn !== "yes") return false;
    if (f.contactless && a.contactless !== "yes") return false;
    if (f.wheelchair && a.wheelchair !== "yes") return false;
    if (f.nonstop && !is247(a.openingHours)) return false;
    if (f.openNow && isOpenNow(a.openingHours, now) !== true) return false;
    if (f.maxDistanceKm != null && origin && distanceKm(origin, a) > f.maxDistanceKm) return false;
    return true;
  });
}

/** How many ATMs have confirmed data for each filter — used to hide unsupported options. */
export function dataSupport(atms: Atm[]) {
  const c = { cashIn: 0, coinsIn: 0, contactless: 0, wheelchair: 0, hours: 0, nonstop: 0 };
  for (const a of atms) {
    if (a.cashIn === "yes") c.cashIn++;
    if (a.coinsIn === "yes") c.coinsIn++;
    if (a.contactless === "yes") c.contactless++;
    if (a.wheelchair === "yes") c.wheelchair++;
    if (a.openingHours) c.hours++;
    if (is247(a.openingHours)) c.nonstop++;
  }
  return c;
}
