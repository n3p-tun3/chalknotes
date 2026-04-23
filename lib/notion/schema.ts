export type NotionSchemaConfig = {
  title: string;
  slug: string;
  status: string;
  publishedAt: string;
  tags: string;
  excerpt: string;
  cover: string;
};

function envOrDefault(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

export const notionSchema: NotionSchemaConfig = {
  title: envOrDefault("NOTION_PROP_TITLE", "Title"),
  slug: envOrDefault("NOTION_PROP_SLUG", "Slug"),
  status: envOrDefault("NOTION_PROP_STATUS", "Status"),
  publishedAt: envOrDefault("NOTION_PROP_PUBLISHED_AT", "PublishedAt"),
  tags: envOrDefault("NOTION_PROP_TAGS", "Tags"),
  excerpt: envOrDefault("NOTION_PROP_EXCERPT", "Excerpt"),
  cover: envOrDefault("NOTION_PROP_COVER", "Cover"),
};

export const notionFilters = {
  publishedStatus: envOrDefault("NOTION_STATUS_PUBLISHED_VALUE", "Published"),
};
