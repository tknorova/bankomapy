import { createFileRoute } from "@tanstack/react-router";
import { AtmApp } from "@/components/atm/AtmApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bankomaty v Česku — mapa bankomatů" },
      { name: "description", content: "Najděte nejbližší bankomat v České republice. Filtrujte podle banky, vkladu, otevírací doby a vzdálenosti." },
      { property: "og:title", content: "Bankomaty v Česku — mapa bankomatů" },
      { property: "og:description", content: "Rychlé vyhledání bankomatů v ČR na přehledné mapě." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AtmApp,
});
