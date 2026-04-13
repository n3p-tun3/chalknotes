import type {
  BlockObjectResponse,
  PageObjectResponse,
  QueryDataSourceParameters,
} from "@notionhq/client/build/src/api-endpoints";

import { mapBlockToContent, mapPageToSummary, isPublished } from "@/lib/notion/mapper";
import { getNotionClient, isNotionConfigured } from "@/lib/notion/client";
import type { BlogPost, BlogPostSummary, NotionBlock } from "@/lib/types";

const DB_PAGE_SIZE = 100;

function asPageObject(entry: unknown): entry is PageObjectResponse {
  return Boolean(
    entry &&
      typeof entry === "object" &&
      "object" in (entry as Record<string, unknown>) &&
      (entry as { object?: string }).object === "page",
  );
}

function asBlockObject(entry: unknown): entry is BlockObjectResponse {
  return Boolean(
    entry &&
      typeof entry === "object" &&
      "object" in (entry as Record<string, unknown>) &&
      (entry as { object?: string }).object === "block" &&
      "type" in (entry as Record<string, unknown>),
  );
}

async function queryAllDatabasePages(): Promise<PageObjectResponse[]> {
  if (!isNotionConfigured()) {
    return [];
  }

  const notion = getNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notion || !databaseId) {
    return [];
  }

  const pages: PageObjectResponse[] = [];
  let nextCursor: string | undefined;

  do {
    const payload: QueryDataSourceParameters = {
      data_source_id: databaseId,
      page_size: DB_PAGE_SIZE,
      start_cursor: nextCursor,
      sorts: [
        {
          property: "PublishedAt",
          direction: "descending",
        },
      ],
    };

    const response = await notion.dataSources.query(payload);

    for (const result of response.results) {
      if (asPageObject(result)) {
        pages.push(result);
      }
    }

    nextCursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (nextCursor);

  return pages;
}

export async function listPublishedPosts(): Promise<BlogPostSummary[]> {
  const allPages = await queryAllDatabasePages();

  return allPages
    .filter(isPublished)
    .map(mapPageToSummary)
    .filter((post) => post.slug.length > 0)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

async function listPageBlocks(pageId: string): Promise<NotionBlock[]> {
  if (!isNotionConfigured()) {
    return [];
  }

  const notion = getNotionClient();
  if (!notion) {
    return [];
  }

  let nextCursor: string | undefined;
  const blocks: NotionBlock[] = [];

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      start_cursor: nextCursor,
    });

    for (const result of response.results) {
      if (asBlockObject(result)) {
        const mapped = mapBlockToContent(result);
        if (mapped) {
          blocks.push(mapped);
        }
      }
    }

    nextCursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (nextCursor);

  return blocks;
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  const posts = await listPublishedPosts();
  const post = posts.find((candidate) => candidate.slug === slug);

  if (!post) {
    return null;
  }

  const blocks = await listPageBlocks(post.id);

  return {
    ...post,
    blocks,
  };
}

export async function listAllPublishedTags(): Promise<string[]> {
  const posts = await listPublishedPosts();
  const tags = new Set<string>();

  for (const post of posts) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }

  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

export async function listPublishedPostsByTag(
  tag: string,
): Promise<BlogPostSummary[]> {
  const posts = await listPublishedPosts();

  return posts.filter((post) =>
    post.tags.some((candidate) => candidate.toLowerCase() === tag.toLowerCase()),
  );
}
