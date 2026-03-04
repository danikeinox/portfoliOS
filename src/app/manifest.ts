import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daniel Cabrera | Portfolio iOS",
    short_name: "Daniel Cabrera",
    description: "Portfolio de Daniel Cabrera con interfaz inspirada en iOS.",
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
