import { createFileRoute } from "@tanstack/react-router";
import { fetchOsmAtms } from "@/lib/atm/osm";
import type { AtmDataset } from "@/lib/atm/types";

// Public, read-only endpoint serving open OSM data. One upstream request per ~day per
// server instance; CDN/browser caching via Cache-Control keeps Overpass load minimal.
let memo: { data: AtmDataset; at: number } | null = null;
const TTL = 1000 * 60 * 60 * 12;

export const Route = createFileRoute("/api/public/atms")({
  server: {
    handlers: {
      GET: async () => {
        try {
          if (!memo || Date.now() - memo.at > TTL) {
            const atms = await fetchOsmAtms();
            memo = {
              at: Date.now(),
              data: {
                atms,
                fetchedAt: new Date().toISOString(),
                attribution: "© přispěvatelé OpenStreetMap (ODbL)",
              },
            };
          }
          return new Response(JSON.stringify(memo.data), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=3600, s-maxage=43200, stale-while-revalidate=86400",
            },
          });
        } catch (e) {
          if (memo) return Response.json(memo.data);
          return Response.json({ error: String(e) }, { status: 502 });
        }
      },
    },
  },
});
