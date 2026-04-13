import Link from "next/link";

import type { BlogPostSummary } from "@/lib/types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function PostCard({ post }: { post: BlogPostSummary }) {
  return (
    <article className="space-y-3 border-b border-stone-200 pb-8">
      <div className="text-sm text-stone-500">{formatDate(post.publishedAt)}</div>
      <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
        <Link href={`/blog/${post.slug}`} className="hover:underline">
          {post.title}
        </Link>
      </h2>
      {post.excerpt ? (
        <p className="max-w-2xl text-base leading-7 text-stone-700">{post.excerpt}</p>
      ) : null}
      {post.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag}>
              <Link
                href={`/tags/${encodeURIComponent(tag)}`}
                className="rounded-full border border-stone-300 px-2.5 py-1 text-xs text-stone-700 transition hover:bg-stone-100"
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
