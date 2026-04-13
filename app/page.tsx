import { PostCard } from "@/components/post-card";
import { isNotionConfigured } from "@/lib/notion/client";
import { listPublishedPosts } from "@/lib/notion/queries";

export const revalidate = 300;

export default async function Home() {
  const posts = await listPublishedPosts();
  const configured = isNotionConfigured();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-12 px-6 py-12">
      <section className="space-y-5 border-b border-stone-200 pb-10">
        <p className="text-sm uppercase tracking-[0.14em] text-stone-500">
          Editorial minimal
        </p>
        <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-tight tracking-tight text-stone-900 md:text-6xl">
          Publish from Notion without giving up your own codebase.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-stone-700">
          Chalknotes is a self-hostable Next.js boilerplate with a Notion-native
          content flow: write, tag, and publish from your Notion database.
        </p>
      </section>

      {!configured ? (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-xl font-semibold">Finish setup</h2>
          <p className="mt-3 leading-7">
            Add <span className="font-semibold">NOTION_API_KEY</span> and
            <span className="font-semibold"> NOTION_DATABASE_ID</span> to your
            environment variables to load published posts.
          </p>
          <p className="mt-3 text-sm">Then follow the setup steps in README.md.</p>
        </section>
      ) : null}

      {configured && posts.length === 0 ? (
        <section className="rounded-lg border border-stone-300 bg-white p-6 text-stone-800">
          <h2 className="text-xl font-semibold">No published posts yet</h2>
          <p className="mt-3 leading-7">
            Add a row in your Notion database with <span className="font-semibold">Status = Published</span> and a valid
            <span className="font-semibold"> Slug</span>.
          </p>
        </section>
      ) : null}

      <section className="space-y-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>
    </main>
  );
}
