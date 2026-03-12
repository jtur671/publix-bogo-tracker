import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Publix BOGO Tracker",
    short_name: "BOGO",
    description: "Track Publix Buy One Get One deals at your local store",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f5",
    theme_color: "#3b7d23",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
