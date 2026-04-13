import type { MetadataRoute } from "next";

import { listPublishedPosts } from "@/lib/notion/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listPublishedPosts();

  const postRoutes = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.lastEditedTime,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...postRoutes,
  ];
}
