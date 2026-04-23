import { APIResponseError } from "@notionhq/client";
import { cache } from "react";
import type {
  BlockObjectResponse,
  PageObjectResponse,
  QueryDatabaseParameters,
} from "@notionhq/client/build/src/api-endpoints";

import { mapBlockToContent, mapPageToSummary, isPublished } from "@/lib/notion/mapper";
import { getNotionClient, getNotionDatabaseId, isNotionConfigured } from "@/lib/notion/client";
import { notionSchema } from "@/lib/notion/schema";
import type { BlogPost, BlogPostSummary, NotionBlock } from "@/lib/types";

const DB_PAGE_SIZE = 100;

function pageBelongsToDatabase(page: PageObjectResponse, databaseId: string): boolean {
  return (
    page.parent.type === "database_id" &&
    page.parent.database_id === databaseId
  );
}

async function queryPagesBySearch(
  notion: NonNullable<ReturnType<typeof getNotionClient>>,
  databaseId: string,
): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let nextCursor: string | undefined;

  do {
    const response = await notion.search({
      query: "",
      filter: {
        property: "object",
        value: "page",
      },
      page_size: DB_PAGE_SIZE,
      start_cursor: nextCursor,
    });

    for (const result of response.results) {
      if (asPageObject(result) && pageBelongsToDatabase(result, databaseId)) {
        pages.push(result);
      }
    }

    nextCursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (nextCursor);

  return pages;
}

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

const queryAllDatabasePages = cache(async (): Promise<PageObjectResponse[]> => {
  if (!isNotionConfigured()) {
    return [];
  }

  const notion = getNotionClient();
  const databaseId = getNotionDatabaseId();

  if (!notion || !databaseId) {
    return [];
  }

  const pages: PageObjectResponse[] = [];
  let nextCursor: string | undefined;
  let usePublishedAtSort = true;

  do {
    const payload: QueryDatabaseParameters = {
      database_id: databaseId,
      page_size: DB_PAGE_SIZE,
      start_cursor: nextCursor,
      ...(usePublishedAtSort
        ? {
            sorts: [
              {
                property: notionSchema.publishedAt,
                direction: "descending" as const,
              },
            ],
          }
        : {}),
    };

    let response;

    try {
      response = await notion.databases.query(payload);
    } catch (error) {
      if (
        error instanceof APIResponseError &&
        error.code === "object_not_found"
      ) {
        console.warn(
          "Notion database query unavailable for this database ID. Falling back to search-based page discovery.",
        );
        return queryPagesBySearch(notion, databaseId);
      }

      if (usePublishedAtSort) {
        usePublishedAtSort = false;
        console.warn(
          `Notion sort fallback: could not sort by property \"${notionSchema.publishedAt}\". Retrying without remote sort.`,
        );
        continue;
      }

      throw error;
    }

    for (const result of response.results) {
      if (asPageObject(result)) {
        pages.push(result);
      }
    }

    nextCursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (nextCursor);

  return pages;
});

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
