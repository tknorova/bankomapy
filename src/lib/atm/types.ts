/** Tri-state value: "unknown" means the data source does not say. Never treat unknown as yes. */
export type Tri = "yes" | "no" | "unknown";

export type BankId =
  | "cs"
  | "csob"
  | "kb"
  | "moneta"
  | "airbank"
  | "rb"
  | "fio"
  | "unicredit"
  | "mbank"
  | "euronet"
  | "other";

export interface Atm {
  id: string;
  lat: number;
  lon: number;
  bank: BankId;
  /** Raw operator/brand name as recorded by the source. */
  operatorName: string | null;
  address: string | null;
  cashOut: Tri;
  cashIn: Tri;
  coinsIn: Tri;
  contactless: Tri;
  wheelchair: Tri;
  openingHours: string | null;
  source: "osm";
  sourceUrl: string;
}

export interface AtmDataset {
  atms: Atm[];
  fetchedAt: string;
  attribution: string;
}

export const BANKS: { id: BankId; label: string; color: string }[] = [
  { id: "cs", label: "Česká spořitelna", color: "#1f6fd1" },
  { id: "csob", label: "ČSOB", color: "#0b2f6b" },
  { id: "kb", label: "Komerční banka", color: "#d61e2b" },
  { id: "moneta", label: "MONETA Money Bank", color: "#e65c00" },
  { id: "airbank", label: "Air Bank", color: "#3aa335" },
  { id: "rb", label: "Raiffeisenbank", color: "#c9a800" },
  { id: "fio", label: "Fio banka", color: "#1a8fbf" },
  { id: "unicredit", label: "UniCredit Bank", color: "#a3121d" },
  { id: "mbank", label: "mBank", color: "#c4007a" },
  { id: "euronet", label: "Euronet", color: "#4b5563" },
  { id: "other", label: "Ostatní banky", color: "#8a8f98" },
];

export const bankLabel = (id: BankId) => BANKS.find((b) => b.id === id)?.label ?? "Ostatní";
