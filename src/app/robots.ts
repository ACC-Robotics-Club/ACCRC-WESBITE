import type { MetadataRoute } from "next";

// Required for this metadata route when the site is statically exported.
export const dynamic = 'force-static';

const BASE_URL = "https://accrcbd.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all crawlers to index public-facing pages.
        userAgent: "*",
        allow: "/",
        // Keep admin, portal, and internal API routes out of search indexes.
        disallow: ["/admin", "/admin/", "/portal", "/portal/", "/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
