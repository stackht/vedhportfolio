import type { MetadataRoute } from "next"

export const dynamic = "force-static"

// Lets Android and other mobile browsers pick a full-size icon (tab switcher, home screen).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vedh Pokharkar",
    short_name: "Vedh",
    description: "Software engineer.",
    start_url: "/",
    display: "browser",
    background_color: "#0b0c0e",
    theme_color: "#0b0c0e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
