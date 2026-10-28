import { Suspense, lazy, useEffect, useMemo, useState, type FormEvent } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { LocateFixed, Search, SlidersHorizontal, Loader2, X, AlertCircle } from "lucide-react";
import { loadAtms, geocode, type Place } from "@/lib/atm/client";
import { applyFilters, countActive, dataSupport, EMPTY_FILTERS, type Filters } from "@/lib/atm/filters";
import type { AtmDataset } from "@/lib/atm/types";
import { FilterSheet } from "./FilterSheet";
import { AtmCard } from "./AtmCard";
import type { Focus } from "./AtmMap";

const AtmMap = lazy(() => import("./AtmMap"));

export function AtmApp() {
  const [data, setData] = useState<AtmDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sheet, setSheet] = useState(false);
  const [origin, setOrigin] = useState<{ lat: number; lon: number } | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => {
    setError(null);
    loadAtms().then(setData).catch((e) => setError(e.message));
  };
  useEffect(load, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const all = data?.atms ?? [];
  const support = useMemo(() => dataSupport(all), [all]);
  const visible = useMemo(() => applyFilters(all, filters, origin), [all, filters, origin]);
  const selected = visible.find((a) => a.id === selectedId) ?? null;
  const active = countActive(filters);

  const goTo = (p: { lat: number; lon: number }, zoom = 14) => {
    setOrigin(p);
    setFocus({ ...p, zoom, key: Date.now() });
  };

  const locate = () => {
    if (!("geolocation" in navigator)) return setToast("Váš prohlížeč nepodporuje zjištění polohy.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); goTo({ lat: pos.coords.latitude, lon: pos.coords.longitude }, 15); },
      (err) => { setLocating(false); setToast(err.code === 1 ? "Přístup k poloze byl zamítnut." : "Polohu se nepodařilo zjistit."); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const search = async (e: FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 2 || searching) return;
    setSearching(true);
    try {
      const r = await geocode(q.trim());
      if (r.length === 1 && r[0]) { goTo(r[0]); setResults(null); }
      else setResults(r);
    } catch (err) {
      setToast((err as Error).message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-muted">
      <ClientOnly fallback={<div className="absolute inset-0 bg-muted" />}>
        <Suspense fallback={<div className="absolute inset-0 bg-muted" />}>
          <AtmMap atms={visible} origin={origin} focus={focus} selectedId={selectedId} onSelect={setSelectedId} />
        </Suspense>
      </ClientOnly>

      {/* Top: search */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5">
        <div className="pointer-events-auto mx-auto max-w-xl">
          <form onSubmit={search} className="searchbar">
            <span className="brand-mark" aria-hidden>₭</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setResults(null); }} placeholder="Město, ulice, adresa nebo místo" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground" aria-label="Hledat místo" enterKeyHint="search" />
            {q && <button type="button" className="icon-btn" aria-label="Vymazat" onClick={() => { setQ(""); setResults(null); }}><X className="size-4" /></button>}
            <button type="submit" className="btn-primary h-10 px-4" aria-label="Hledat">
              {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              <span className="hidden sm:inline">Hledat</span>
            </button>
          </form>
          {results && (
            <ul className="card-float mt-2 p-1.5">
              {results.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">Nic jsme nenašli. Zkuste jiný výraz.</li>}
              {results.map((r) => (
                <li key={r.lat + "," + r.lon}>
                  <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { goTo(r); setResults(null); }}>{r.name}</button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex justify-center">
            {!data && !error && <span className="status-pill"><Loader2 className="size-3.5 animate-spin" />Načítám bankomaty…</span>}
            {error && <button onClick={load} className="status-pill status-error"><AlertCircle className="size-3.5" />{error} Zkusit znovu</button>}
            {data && <span className="status-pill">{visible.length.toLocaleString("cs-CZ")} {active ? `z ${all.length.toLocaleString("cs-CZ")} ` : ""}bankomatů</span>}
          </div>
          {data && visible.length === 0 && (
            <div className="card-float mt-2 text-center text-sm">
              Žádný bankomat neodpovídá filtrům.{" "}
              <button className="font-semibold text-primary underline" onClick={() => setFilters(EMPTY_FILTERS)}>Vymazat filtry</button>
            </div>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="absolute right-3 z-20 flex flex-col gap-2 sm:right-5" style={{ bottom: selected ? "auto" : "calc(1.25rem + env(safe-area-inset-bottom))", top: selected ? "calc(9rem + env(safe-area-inset-top))" : "auto" }}>
        <button className="fab" onClick={locate} aria-label="Moje poloha">
          {locating ? <Loader2 className="size-5 animate-spin" /> : <LocateFixed className="size-5" />}
        </button>
      </div>
      {!selected && (
        <div className="absolute inset-x-0 z-20 flex justify-center" style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>
          <button className="fab-wide" onClick={() => setSheet(true)} disabled={!data}>
            <SlidersHorizontal className="size-4" />Filtry
            {active > 0 && <span className="badge">{active}</span>}
          </button>
        </div>
      )}

      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:left-5 sm:right-auto sm:bottom-5 sm:w-96 sm:p-0">
          <AtmCard atm={selected} origin={origin} onClose={() => setSelectedId(null)} />
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}

      <FilterSheet open={sheet} initial={filters} support={support} hasOrigin={!!origin}
        onApply={(f) => { setFilters(f); setSheet(false); setSelectedId(null); }} onClose={() => setSheet(false)} />
    </main>
  );
}
