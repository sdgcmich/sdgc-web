import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/garden-walk`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/notices`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/membership`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/join`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tickets-checkout`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const supabase = await createClient();

    const [eventsRes, noticesRes, albumsRes, pagesRes] = await Promise.all([
      supabase.from("events").select("slug, updated_at").eq("status", "published"),
      supabase.from("notices").select("slug, updated_at").eq("is_published", true),
      supabase.from("albums").select("slug, updated_at").eq("is_public", true),
      supabase.from("pages").select("slug, updated_at").eq("status", "published"),
    ]);

    const eventRoutes: MetadataRoute.Sitemap = (eventsRes.data || []).map((e) => ({
      url: `${baseUrl}/event/${e.slug}`,
      lastModified: e.updated_at ? new Date(e.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const noticeRoutes: MetadataRoute.Sitemap = (noticesRes.data || []).map((n) => ({
      url: `${baseUrl}/notices/${n.slug}`,
      lastModified: n.updated_at ? new Date(n.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const albumRoutes: MetadataRoute.Sitemap = (albumsRes.data || []).map((a) => ({
      url: `${baseUrl}/gallery/${a.slug}`,
      lastModified: a.updated_at ? new Date(a.updated_at) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    const dynamicPageRoutes: MetadataRoute.Sitemap = (pagesRes.data || [])
      .filter((p) => !staticRoutes.some((sr) => sr.url === `${baseUrl}/${p.slug}`))
      .map((p) => ({
        url: `${baseUrl}/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));

    return [...staticRoutes, ...eventRoutes, ...noticeRoutes, ...albumRoutes, ...dynamicPageRoutes];
  } catch {
    return staticRoutes;
  }
}
