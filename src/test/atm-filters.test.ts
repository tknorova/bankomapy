import { describe, expect, it } from "vitest";
import { applyFilters, EMPTY_FILTERS } from "@/lib/atm/filters";
import { detectBank, normalizeOsm } from "@/lib/atm/osm";

const a = normalizeOsm({ id: 1, lat: 50.08, lon: 14.42, tags: { amenity: "atm", operator: "Česká spořitelna", cash_in: "yes", opening_hours: "24/7" } });
const b = normalizeOsm({ id: 2, lat: 49.19, lon: 16.6, tags: { amenity: "atm", brand: "ČSOB" } });

describe("atm filters", () => {
  it("detects banks", () => {
    expect(detectBank("Československá obchodní banka, a. s.")).toBe("csob");
    expect(detectBank("Moneta Bank")).toBe("moneta");
  });
  it("unknown deposit is not treated as confirmed", () => {
    expect(applyFilters([a, b], { ...EMPTY_FILTERS, cashIn: true }, null).map((x) => x.id)).toEqual(["osm-1"]);
  });
  it("filters 24/7 and distance", () => {
    expect(applyFilters([a, b], { ...EMPTY_FILTERS, nonstop: true }, null)).toHaveLength(1);
    expect(applyFilters([a, b], { ...EMPTY_FILTERS, maxDistanceKm: 10 }, { lat: 50.08, lon: 14.42 })).toHaveLength(1);
  });
  it("filters by bank", () => {
    expect(applyFilters([a, b], { ...EMPTY_FILTERS, banks: ["csob"] }, null)[0].id).toBe("osm-2");
  });
});
