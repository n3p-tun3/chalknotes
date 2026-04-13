import type {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

import { resolveImageUrl } from "@/lib/images/adapter";
import type { BlogPostSummary, NotionBlock } from "@/lib/types";

function richTextToPlainText(
  richText:
    | { plain_text: string }[]
    | undefined,
): string {
  if (!richText || richText.length === 0) {
    return "";
  }

  return richText.map((entry) => entry.plain_text).join("").trim();
}

function getProperty(
  page: PageObjectResponse,
  propertyName: string,
) {
  return page.properties[propertyName];
}

function getTitle(page: PageObjectResponse): string {
  const titleProperty = getProperty(page, "Title");

  if (titleProperty && titleProperty.type === "title") {
    return richTextToPlainText(titleProperty.title) || "Untitled";
  }

  return "Untitled";
}

function getSlug(page: PageObjectResponse): string {
  const slugProperty = getProperty(page, "Slug");

  if (slugProperty && slugProperty.type === "rich_text") {
    const rawSlug = richTextToPlainText(slugProperty.rich_text);
    if (rawSlug) {
      return rawSlug;
    }
  }

  return getTitle(page)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getStatus(page: PageObjectResponse): string {
  const statusProperty = getProperty(page, "Status");

  if (statusProperty?.type === "status") {
    return statusProperty.status?.name ?? "";
  }

  if (statusProperty?.type === "select") {
    return statusProperty.select?.name ?? "";
  }

  return "";
}

function getPublishedAt(page: PageObjectResponse): string {
  const publishedAtProperty = getProperty(page, "PublishedAt");

  if (publishedAtProperty?.type === "date") {
    return publishedAtProperty.date?.start ?? page.created_time;
  }

  return page.created_time;
}

function getTags(page: PageObjectResponse): string[] {
  const tagsProperty = getProperty(page, "Tags");

  if (tagsProperty?.type === "multi_select") {
    return tagsProperty.multi_select.map((item) => item.name);
  }

  return [];
}

function getExcerpt(page: PageObjectResponse): string {
  const excerptProperty = getProperty(page, "Excerpt");

  if (excerptProperty?.type === "rich_text") {
    return richTextToPlainText(excerptProperty.rich_text);
  }

  return "";
}

function getCoverImage(page: PageObjectResponse): string | null {
  const coverProperty = getProperty(page, "Cover");

  if (coverProperty?.type === "files") {
    const firstFile = coverProperty.files[0];

    if (firstFile?.type === "external") {
      return resolveImageUrl({ url: firstFile.external.url });
    }

    if (firstFile?.type === "file") {
      return resolveImageUrl({ url: firstFile.file.url });
    }
  }

  if (page.cover?.type === "external") {
    return resolveImageUrl({ url: page.cover.external.url });
  }

  if (page.cover?.type === "file") {
    return resolveImageUrl({ url: page.cover.file.url });
  }

  return null;
}

export function mapPageToSummary(page: PageObjectResponse): BlogPostSummary {
  return {
    id: page.id,
    title: getTitle(page),
    slug: getSlug(page),
    excerpt: getExcerpt(page),
    tags: getTags(page),
    publishedAt: getPublishedAt(page),
    coverImageUrl: getCoverImage(page),
    lastEditedTime: page.last_edited_time,
  };
}

export function isPublished(page: PageObjectResponse): boolean {
  const status = getStatus(page);
  const publishedAt = new Date(getPublishedAt(page));

  return status.toLowerCase() === "published" && publishedAt <= new Date();
}

export function mapBlockToContent(block: BlockObjectResponse): NotionBlock | null {
  switch (block.type) {
    case "paragraph": {
      return {
        id: block.id,
        type: "paragraph",
        text: richTextToPlainText(block.paragraph.rich_text),
      };
    }
    case "heading_1": {
      return {
        id: block.id,
        type: "heading_1",
        text: richTextToPlainText(block.heading_1.rich_text),
      };
    }
    case "heading_2": {
      return {
        id: block.id,
        type: "heading_2",
        text: richTextToPlainText(block.heading_2.rich_text),
      };
    }
    case "heading_3": {
      return {
        id: block.id,
        type: "heading_3",
        text: richTextToPlainText(block.heading_3.rich_text),
      };
    }
    case "quote": {
      return {
        id: block.id,
        type: "quote",
        text: richTextToPlainText(block.quote.rich_text),
      };
    }
    case "bulleted_list_item": {
      return {
        id: block.id,
        type: "bulleted_list_item",
        text: richTextToPlainText(block.bulleted_list_item.rich_text),
      };
    }
    case "numbered_list_item": {
      return {
        id: block.id,
        type: "numbered_list_item",
        text: richTextToPlainText(block.numbered_list_item.rich_text),
      };
    }
    case "code": {
      return {
        id: block.id,
        type: "code",
        text: richTextToPlainText(block.code.rich_text),
        language: block.code.language,
      };
    }
    case "image": {
      const url =
        block.image.type === "external"
          ? block.image.external.url
          : block.image.file.url;

      return {
        id: block.id,
        type: "image",
        url,
        caption: richTextToPlainText(block.image.caption),
      };
    }
    case "divider": {
      return {
        id: block.id,
        type: "divider",
      };
    }
    default:
      return null;
  }
}
