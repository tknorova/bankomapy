import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { BANKS, type Atm } from "@/lib/atm/types";

maplibregl.setWorkerUrl(workerUrl);

export interface Focus {
  lat: number;
  lon: number;
  zoom: number;
  key: number;
}

interface Props {
  atms: Atm[];
  origin: { lat: number; lon: number } | null;
  focus: Focus | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const colorExpr: maplibregl.ExpressionSpecification = [
  "match",
  ["get", "bank"],
  ...BANKS.flatMap((b) => [b.id, b.color]),
  "#8a8f98",
] as unknown as maplibregl.ExpressionSpecification;

function toGeo(atms: Atm[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: atms.map((a) => ({
      type: "Feature",
      id: a.id,
      properties: { id: a.id, bank: a.bank },
      geometry: { type: "Point", coordinates: [a.lon, a.lat] },
    })),
  };
}

export default function AtmMap({ atms, origin, focus, selectedId, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const ready = useRef(false);
  const atmsRef = useRef(atms);
  atmsRef.current = atms;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const originMarker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!el.current) return;
    const m = new maplibregl.Map({
      container: el.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [15.4, 49.8],
      zoom: 6.4,
      attributionControl: { compact: true },
    });
    map.current = m;
    m.on("load", () => {
      m.addSource("atms", { type: "geojson", data: toGeo(atmsRef.current), cluster: true, clusterRadius: 48, clusterMaxZoom: 14 });
      m.addLayer({
        id: "clusters",
        type: "circle",
        source: "atms",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#14302b",
          "circle-opacity": 0.88,
          "circle-radius": ["step", ["get", "point_count"], 16, 25, 20, 100, 26, 500, 32],
          "circle-stroke-width": 3,
          "circle-stroke-color": "rgba(255,255,255,0.8)",
        },
      });
      m.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "atms",
        filter: ["has", "point_count"],
        layout: { "text-field": "{point_count_abbreviated}", "text-size": 12, "text-font": ["Noto Sans Bold"] },
        paint: { "text-color": "#ffffff" },
      });
      m.addLayer({
        id: "atm",
        type: "circle",
        source: "atms",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": colorExpr,
          "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 11, 7],
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });
      m.on("click", "clusters", async (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const src = m.getSource("atms") as maplibregl.GeoJSONSource;
        const z = await src.getClusterExpansionZoom(f.properties.cluster_id);
        m.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: z });
      });
      m.on("click", "atm", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) onSelectRef.current(id);
      });
      m.on("click", (e) => {
        const hits = m.queryRenderedFeatures(e.point, { layers: ["atm", "clusters"] });
        if (!hits.length) onSelectRef.current(null);
      });
      for (const l of ["clusters", "atm"]) {
        m.on("mouseenter", l, () => (m.getCanvas().style.cursor = "pointer"));
        m.on("mouseleave", l, () => (m.getCanvas().style.cursor = ""));
      }
      ready.current = true;
    });
    return () => {
      m.remove();
      map.current = null;
      ready.current = false;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const set = () => (m.getSource("atms") as maplibregl.GeoJSONSource | undefined)?.setData(toGeo(atms));
    if (ready.current) set();
    else m.once("load", set);
  }, [atms]);

  const prevSel = useRef<string | null>(null);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    if (prevSel.current) m.setFeatureState({ source: "atms", id: prevSel.current }, { selected: false });
    if (selectedId) m.setFeatureState({ source: "atms", id: selectedId }, { selected: true });
    prevSel.current = selectedId;
  }, [selectedId, atms]);

  useEffect(() => {
    if (focus && map.current) map.current.flyTo({ center: [focus.lon, focus.lat], zoom: focus.zoom, speed: 1.6 });
  }, [focus]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    originMarker.current?.remove();
    if (origin) {
      const dot = document.createElement("div");
      dot.className = "origin-dot";
      originMarker.current = new maplibregl.Marker({ element: dot }).setLngLat([origin.lon, origin.lat]).addTo(m);
    }
  }, [origin]);

  return <div ref={el} className="absolute inset-0" aria-label="Mapa bankomatů" />;
}
