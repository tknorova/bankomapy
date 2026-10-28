import { useState } from "react";
import { X } from "lucide-react";
import { BANKS, type BankId } from "@/lib/atm/types";
import { EMPTY_FILTERS, type Filters, type dataSupport } from "@/lib/atm/filters";

interface Props {
  open: boolean;
  initial: Filters;
  support: ReturnType<typeof dataSupport>;
  hasOrigin: boolean;
  onApply: (f: Filters) => void;
  onClose: () => void;
}

function Toggle({ label, hint, checked, disabled, onChange }: { label: string; hint?: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`flex items-start justify-between gap-4 py-2.5 ${disabled ? "opacity-45" : "cursor-pointer"}`}>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <input type="checkbox" className="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function FilterSheet({ open, initial, support, hasOrigin, onApply, onClose }: Props) {
  const [f, setF] = useState<Filters>(initial);
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setF(initial);
  }
  const toggleBank = (id: BankId) =>
    setF((p) => ({ ...p, banks: p.banks.includes(id) ? p.banks.filter((b) => b !== id) : [...p.banks, id] }));
  const n = (c: number) => (c ? `Ověřeno u ${c} bankomatů` : "Zatím bez ověřených dat — nelze filtrovat");

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Filtry">
      <button className="absolute inset-0 bg-overlay animate-in fade-in" aria-label="Zavřít" onClick={onClose} />
      <div className="sheet relative flex max-h-[88dvh] w-full flex-col sm:max-w-md animate-in slide-in-from-bottom-8">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="font-display text-lg font-semibold">Filtry</h2>
          <button onClick={onClose} className="icon-btn" aria-label="Zavřít"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <section className="py-3">
            <h3 className="section-title">Banka</h3>
            <div className="flex flex-wrap gap-2">
              {BANKS.map((b) => (
                <button key={b.id} onClick={() => toggleBank(b.id)} className="chip" data-active={f.banks.includes(b.id)}>
                  <span className="size-2 rounded-full" style={{ background: b.color }} />
                  {b.label}
                </button>
              ))}
            </div>
          </section>
          <section className="py-3 border-t">
            <h3 className="section-title">Služby</h3>
            <Toggle label="Výběr hotovosti" hint="Skryje bankomaty, u nichž je výběr výslovně nedostupný" checked={f.cashOut} onChange={(v) => setF({ ...f, cashOut: v })} />
            <Toggle label="Vklad hotovosti" hint={n(support.cashIn)} checked={f.cashIn} disabled={!support.cashIn} onChange={(v) => setF({ ...f, cashIn: v })} />
            <Toggle label="Vklad mincí" hint={n(support.coinsIn)} checked={f.coinsIn} disabled={!support.coinsIn} onChange={(v) => setF({ ...f, coinsIn: v })} />
            <Toggle label="Bezkontaktní bankomat" hint={n(support.contactless)} checked={f.contactless} disabled={!support.contactless} onChange={(v) => setF({ ...f, contactless: v })} />
          </section>
          <section className="py-3 border-t">
            <h3 className="section-title">Otevírací doba</h3>
            <Toggle label="Otevřeno nyní" hint={`Jen bankomaty se známou otevírací dobou (${support.hours})`} checked={f.openNow} disabled={!support.hours} onChange={(v) => setF({ ...f, openNow: v })} />
            <Toggle label="Nonstop 24/7" hint={n(support.nonstop)} checked={f.nonstop} disabled={!support.nonstop} onChange={(v) => setF({ ...f, nonstop: v })} />
          </section>
          <section className="py-3 border-t">
            <h3 className="section-title">Přístupnost</h3>
            <Toggle label="Bezbariérový přístup" hint={n(support.wheelchair)} checked={f.wheelchair} disabled={!support.wheelchair} onChange={(v) => setF({ ...f, wheelchair: v })} />
          </section>
          <section className="py-3 border-t">
            <div className="flex items-center justify-between">
              <h3 className="section-title mb-0">Maximální vzdálenost</h3>
              <span className="text-sm font-semibold">{f.maxDistanceKm == null ? "Bez omezení" : `${f.maxDistanceKm} km`}</span>
            </div>
            {hasOrigin ? (
              <>
                <input type="range" min={0.5} max={50} step={0.5} className="range mt-3 w-full"
                  value={f.maxDistanceKm ?? 50}
                  onChange={(e) => { const v = +e.target.value; setF({ ...f, maxDistanceKm: v >= 50 ? null : v }); }} />
                <div className="flex justify-between text-xs text-muted-foreground"><span>0,5 km</span><span>bez omezení</span></div>
              </>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Nejprve vyhledejte místo nebo použijte svou polohu.</p>
            )}
          </section>
        </div>
        <div className="flex gap-3 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button className="btn-ghost flex-1" onClick={() => setF(EMPTY_FILTERS)}>Vymazat filtry</button>
          <button className="btn-primary flex-1" onClick={() => onApply(f)}>Použít filtry</button>
        </div>
      </div>
    </div>
  );
}
