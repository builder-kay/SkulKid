import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SkulKid Learning",
    short_name: "SkulKid",
    description: "Learn, play and grow with primary lessons, class activities, quizzes and rewards.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eff6ff",
    theme_color: "#2563eb",
    orientation: "any",
    categories: ["education", "kids"],
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/pwa/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/pwa/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "Open dashboard",
        short_name: "Dashboard",
        description: "Continue learning on SkulKid.",
        url: "/dashboard",
        icons: [{ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }]
      },
      {
        name: "My classes",
        short_name: "Classes",
        description: "Open your classes and activities.",
        url: "/classes",
        icons: [{ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }]
      },
      {
        name: "Public Learning",
        short_name: "Learning",
        description: "Explore learning available to every learner.",
        url: "/courses",
        icons: [{ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }]
      }
    ]
  };
}
