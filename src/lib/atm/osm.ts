import type { Atm, BankId, Tri } from "./types";

/** OpenStreetMap (Overpass) provider. Runs on the server; output is normalized Atm[]. */

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const QUERY = `[out:json][timeout:90];area["ISO3166-1"="CZ"][admin_level=2]->.a;node["amenity"="atm"](area.a);out body;`;

const BANK_PATTERNS: [BankId, RegExp][] = [
  ["csob", /čsob|československá obchodní/i],
  ["cs", /česká spořitelna|ceska sporitelna/i],
  ["kb", /komerční banka|^kb$/i],
  ["moneta", /moneta|ge money/i],
  ["airbank", /air ?bank/i],
  ["rb", /raiffeisen/i],
  ["fio", /^fio/i],
  ["unicredit", /unicredit/i],
  ["mbank", /mbank/i],
  ["euronet", /euronet/i],
];

export function detectBank(name: string | null): BankId {
  if (!name) return "other";
  for (const [id, re] of BANK_PATTERNS) if (re.test(name)) return id;
  return "other";
}

function tri(v: string | undefined, yesValues = ["yes"]): Tri {
  if (!v) return "unknown";
  if (yesValues.includes(v)) return "yes";
  if (v === "no") return "no";
  return "unknown";
}

function address(t: Record<string, string>): string | null {
  if (t["addr:full"]) return t["addr:full"];
  const street = t["addr:street"] || t["addr:place"];
  const line1 = street ? `${street}${t["addr:housenumber"] ? " " + t["addr:housenumber"] : ""}` : null;
  const city = [t["addr:postcode"], t["addr:city"]].filter(Boolean).join(" ");
  const parts = [line1, city].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return null;
}

export function normalizeOsm(el: { id: number; lat: number; lon: number; tags?: Record<string, string> }): Atm {
  const t = el.tags ?? {};
  const operatorName = t["operator"] || t["brand"] || t["name"] || t["network"] || null;
  const cashOut = tri(t["cash_out"] ?? t["cash_withdrawal"]);
  return {
    id: `osm-${el.id}`,
    lat: el.lat,
    lon: el.lon,
    bank: detectBank(t["brand"] || t["operator"] || t["name"] || null),
    operatorName,
    address: address(t),
    cashOut,
    cashIn: tri(t["cash_in"], ["yes", "customers"]),
    coinsIn: tri(t["cash_in:coins"]),
    contactless: tri(t["authentication:contactless"]),
    wheelchair: tri(t["wheelchair"]),
    openingHours: t["opening_hours"] || null,
    source: "osm",
    sourceUrl: `https://www.openstreetmap.org/node/${el.id}`,
  };
}

export async function fetchOsmAtms(): Promise<Atm[]> {
  let lastErr: unknown;
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "bankomaty-cz/1.0 (ATM finder; cached daily)",
        },
        body: "data=" + encodeURIComponent(QUERY),
      });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const json = (await res.json()) as { elements: Parameters<typeof normalizeOsm>[0][] };
      return json.elements.filter((e) => e.lat && e.lon).map(normalizeOsm);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Overpass nedostupný");
}
