import { Client } from "@notionhq/client";

export function getNotionDatabaseId(): string | null {
  const raw = process.env.NOTION_DATABASE_ID;
  if (!raw) return null;
  
  // Extract 32-character hex ID from full Notion URL or raw ID
  const match = raw.match(/[a-f0-9]{32}/i);
  return match ? match[0] : null;
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
