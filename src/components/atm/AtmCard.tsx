import { Navigation, X, Check, Minus, HelpCircle, ExternalLink } from "lucide-react";
import { bankLabel, type Atm, type Tri } from "@/lib/atm/types";
import { distanceKm, formatDistance } from "@/lib/atm/client";
import { is247, isOpenNow } from "@/lib/atm/filters";

function Status({ v, label }: { v: Tri; label: string }) {
  const Icon = v === "yes" ? Check : v === "no" ? Minus : HelpCircle;
  const text = v === "yes" ? "ano" : v === "no" ? "ne" : "neověřeno";
  return (
    <li className="flex items-center justify-between py-1 text-sm">
      <span>{label}</span>
      <span className="tri" data-v={v}><Icon className="size-3.5" />{text}</span>
    </li>
  );
}

export function AtmCard({ atm, origin, onClose }: { atm: Atm; origin: { lat: number; lon: number } | null; onClose: () => void }) {
  const open = isOpenNow(atm.openingHours);
  const nav = `https://www.google.com/maps/dir/?api=1&destination=${atm.lat},${atm.lon}`;
  const mapy = `https://mapy.com/fnc/v1/route?end=${atm.lon},${atm.lat}`;
  return (
    <div className="card-float animate-in slide-in-from-bottom-4 fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{bankLabel(atm.bank)}</p>
          <h2 className="font-display text-lg font-semibold leading-tight">{atm.operatorName ?? "Provozovatel neuveden"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{atm.address ?? "Adresa není v datech uvedena"}</p>
        </div>
        <button onClick={onClose} className="icon-btn -mr-1 -mt-1" aria-label="Zavřít"><X className="size-5" /></button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {origin && <span className="pill">{formatDistance(distanceKm(origin, atm))} od vybraného místa</span>}
        {is247(atm.openingHours) ? <span className="pill pill-ok">Nonstop</span>
          : atm.openingHours ? <span className={`pill ${open ? "pill-ok" : ""}`}>{open === true ? "Otevřeno" : open === false ? "Zavřeno" : "Otevírací doba"}: {atm.openingHours}</span>
          : <span className="pill pill-unknown">Otevírací doba neznámá</span>}
      </div>
      <ul className="mt-3 divide-y">
        <Status v={atm.cashOut === "unknown" ? "unknown" : atm.cashOut} label="Výběr hotovosti" />
        <Status v={atm.cashIn} label="Vklad hotovosti" />
        <Status v={atm.contactless} label="Bezkontaktní" />
        <Status v={atm.wheelchair} label="Bezbariérový" />
      </ul>
      <div className="mt-4 flex items-center gap-2">
        <a href={nav} target="_blank" rel="noreferrer" className="btn-primary flex-1"><Navigation className="size-4" />Navigovat</a>
        <a href={mapy} target="_blank" rel="noreferrer" className="btn-ghost">Mapy.com</a>
      </div>
      <a href={atm.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline">
        Zdroj: OpenStreetMap · opravit údaje <ExternalLink className="size-3" />
      </a>
    </div>
  );
}
