import type { MetadataRoute } from "next";
import { getEvents, getNewsPosts } from "@/lib/firestore";

const BASE_URL = "https://accrcbd.com";

/** Static routes with their crawl priority and change frequency. */
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/events`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/news`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/membership`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/panels`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/fest`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/social`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${BASE_URL}/portal`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic routes from Firestore; gracefully degrade on error so the
  // build never fails because of a network blip.
  const [events, newsPosts] = await Promise.all([
    getEvents().catch(() => []),
    getNewsPosts().catch(() => []),
  ]);

  const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${BASE_URL}/events/detail?id=${event.id}`,
    lastModified: event.createdAt ?? new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const newsRoutes: MetadataRoute.Sitemap = newsPosts.map((post) => ({
    url: `${BASE_URL}/news/detail?id=${post.id}`,
    lastModified: post.publishedAt ?? new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...STATIC_ROUTES, ...eventRoutes, ...newsRoutes];
}
