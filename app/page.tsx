import { DiagnosticToast } from "@/components/diagnostic-toast";
import { PostCard } from "@/components/post-card";
import { getNotionDiagnostic } from "@/lib/notion/diagnostics";
import { isNotionConfigured } from "@/lib/notion/client";
import { listPublishedPosts } from "@/lib/notion/queries";

export const revalidate = 300;

export default async function Home() {
  const [posts, diagnostic] = await Promise.all([
    listPublishedPosts(),
    getNotionDiagnostic(),
  ]);
  const configured = isNotionConfigured();

  return (
    <>
      <DiagnosticToast diagnostic={diagnostic} />
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
            <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 marker:text-amber-600/80">
              <li>Duplicate the <a href="[INSERT_TEMPLATE_URL_HERE]" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4 hover:text-amber-700">Chalknotes Notion Template</a> to your workspace.</li>
              <li>Create a new integration at <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4 hover:text-amber-700">notion.so/my-integrations</a>, copy the token, and paste it into <code className="rounded bg-amber-200/50 px-1 py-0.5 font-mono text-[0.9em] font-medium">NOTION_API_KEY</code>.</li>
              <li>Share your Notion database with the integration via the Connections menu.</li>
              <li>Copy the full URL of your database page and paste it into <code className="rounded bg-amber-200/50 px-1 py-0.5 font-mono text-[0.9em] font-medium">NOTION_DATABASE_ID</code>.</li>
            </ol>
            <p className="mt-4 text-sm font-medium">Add those to your <code className="rounded bg-amber-200/50 px-1 py-0.5 font-mono text-[0.9em]">.env.local</code> file and refresh.</p>
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
    </>
  );
}
