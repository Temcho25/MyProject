import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Insta Tour — China tours",
    short_name: "Insta Tour",
    start_url: "/ru/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#0f0f10",
    icons: [
      { src: "/brand/logo-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.png", sizes: "96x96", type: "image/png" },
    ],
  };
}
