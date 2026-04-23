import type {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

import { resolveImageUrl } from "@/lib/images/adapter";
import { notionFilters, notionSchema } from "@/lib/notion/schema";
import type { BlogPostSummary, NotionBlock, RichTextItem } from "@/lib/types";

function mapRichText(richText: any[] | undefined): RichTextItem[] {
  if (!richText || richText.length === 0) {
    return [];
  }

  return richText.map((rt) => ({
    plainText: rt.plain_text,
    href: rt.href,
    annotations: rt.annotations,
  }));
}

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
  const titleProperty = getProperty(page, notionSchema.title);

  if (titleProperty && titleProperty.type === "title") {
    return richTextToPlainText(titleProperty.title) || "Untitled";
  }

  return "Untitled";
}

function getSlug(page: PageObjectResponse): string {
  const slugProperty = getProperty(page, notionSchema.slug);

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
  const statusProperty = getProperty(page, notionSchema.status);

  if (statusProperty?.type === "status") {
    return statusProperty.status?.name ?? "";
  }

  if (statusProperty?.type === "select") {
    return statusProperty.select?.name ?? "";
  }

  return "";
}

function getPublishedAt(page: PageObjectResponse): string {
  const publishedAtProperty = getProperty(page, notionSchema.publishedAt);

  if (publishedAtProperty?.type === "date") {
    return publishedAtProperty.date?.start ?? page.created_time;
  }

  return page.created_time;
}

function getTags(page: PageObjectResponse): string[] {
  const tagsProperty = getProperty(page, notionSchema.tags);

  if (tagsProperty?.type === "multi_select") {
    return tagsProperty.multi_select.map((item) => item.name);
  }

  return [];
}

function getExcerpt(page: PageObjectResponse): string {
  const excerptProperty = getProperty(page, notionSchema.excerpt);

  if (excerptProperty?.type === "rich_text") {
    return richTextToPlainText(excerptProperty.rich_text);
  }

  return "";
}

function getCoverImage(page: PageObjectResponse): string | null {
  const coverProperty = getProperty(page, notionSchema.cover);

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

  return (
    status.toLowerCase() === notionFilters.publishedStatus.toLowerCase() &&
    publishedAt <= new Date()
  );
}

export function mapBlockToContent(block: BlockObjectResponse): NotionBlock | null {
  switch (block.type) {
    case "paragraph": {
      return {
        id: block.id,
        type: "paragraph",
        richText: mapRichText(block.paragraph.rich_text),
      };
    }
    case "heading_1": {
      return {
        id: block.id,
        type: "heading_1",
        richText: mapRichText(block.heading_1.rich_text),
      };
    }
    case "heading_2": {
      return {
        id: block.id,
        type: "heading_2",
        richText: mapRichText(block.heading_2.rich_text),
      };
    }
    case "heading_3": {
      return {
        id: block.id,
        type: "heading_3",
        richText: mapRichText(block.heading_3.rich_text),
      };
    }
    case "quote": {
      return {
        id: block.id,
        type: "quote",
        richText: mapRichText(block.quote.rich_text),
      };
    }
    case "bulleted_list_item": {
      return {
        id: block.id,
        type: "bulleted_list_item",
        richText: mapRichText(block.bulleted_list_item.rich_text),
      };
    }
    case "numbered_list_item": {
      return {
        id: block.id,
        type: "numbered_list_item",
        richText: mapRichText(block.numbered_list_item.rich_text),
      };
    }
    case "code": {
      return {
        id: block.id,
        type: "code",
        richText: mapRichText(block.code.rich_text),
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
