import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DLSU Tracker",
    short_name: "DLSU Tracker",
    description: "Assignments, exams, schedule, and finances in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#181310",
    theme_color: "#181310",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
