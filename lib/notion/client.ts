import { Client } from "@notionhq/client";

export function getNotionDatabaseId(): string | null {
  return process.env.NOTION_DATABASE_ID || null;
}

export function isNotionConfigured(): boolean {
  return Boolean(process.env.NOTION_API_KEY && getNotionDatabaseId());
}

export function getNotionClient(): Client | null {
  if (!process.env.NOTION_API_KEY) {
    return null;
  }

  return new Client({ auth: process.env.NOTION_API_KEY });
}
