import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotionBlockRenderer } from "@/components/notion-block-renderer";
import { getPublishedPostBySlug, listPublishedPosts } from "@/lib/notion/queries";

export const revalidate = 300;

type Params = {
  params: Promise<{ slug: string }>;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export async function generateStaticParams() {
  const posts = await listPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : [],
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-10 space-y-4 border-b border-stone-200 pb-8">
        <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
          Back to posts
        </Link>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
          {post.title}
        </h1>
        <div className="text-sm text-stone-600">{formatDate(post.publishedAt)}</div>
      </div>
      <NotionBlockRenderer blocks={post.blocks} />
    </main>
  );
}
