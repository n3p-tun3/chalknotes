import { listPublishedPosts } from "@/lib/notion/queries";
import { siteConfig } from "@/site.config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await listPublishedPosts();

  const items = posts
    .map(
      (post) => `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>${SITE_URL}/blog/${post.slug}</link>
          <guid>${SITE_URL}/blog/${post.slug}</guid>
          <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
          <description>${escapeXml(post.excerpt || post.title)}</description>
        </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>${escapeXml(siteConfig.name)}</title>
        <link>${SITE_URL}</link>
        <description>${escapeXml(siteConfig.description)}</description>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
