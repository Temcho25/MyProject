import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  // Keep preview deployments out of search results; only production is indexable.
  const isPreview = process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production";
  return {
    rules: isPreview ? [{ userAgent: "*", disallow: "/" }] : [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
