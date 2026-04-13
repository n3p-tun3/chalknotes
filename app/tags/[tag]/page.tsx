import type { Metadata } from "next";
import Link from "next/link";

import { PostCard } from "@/components/post-card";
import {
  listAllPublishedTags,
  listPublishedPostsByTag,
} from "@/lib/notion/queries";

export const revalidate = 300;

type Params = {
  params: Promise<{ tag: string }>;
};

export async function generateStaticParams() {
  const tags = await listAllPublishedTags();

  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  return {
    title: `Tag: ${decodedTag}`,
    description: `Posts filed under ${decodedTag}`,
  };
}

export default async function TagPage({ params }: Params) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = await listPublishedPostsByTag(decodedTag);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-6 py-12">
      <div className="space-y-3">
        <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
          Back to all posts
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900">
          {decodedTag}
        </h1>
      </div>

      {posts.length === 0 ? (
        <p className="text-stone-700">No published posts for this tag yet.</p>
      ) : (
        <section className="space-y-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      )}
    </main>
  );
}
