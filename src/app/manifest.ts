import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daniel Cabrera | Desarrollador Full-Stack",
    short_name: "Daniel Cabrera",
    description: "Portfolio de Daniel Cabrera: desarrollador Full-Stack en Barcelona. Proyectos en producción con Next.js, TypeScript y Firebase.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0f1a",
    theme_color: "#0b0f1a",
    lang: "es-ES",
    categories: ["portfolio", "technology", "design"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
