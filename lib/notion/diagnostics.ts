import { APIResponseError, Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

import { getNotionDatabaseId } from "@/lib/notion/client";

export type NotionDiagnostic = {
  level: "ok" | "warn" | "error";
  title: string;
  details: string[];
};

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function asPageObject(entry: unknown): entry is PageObjectResponse {
  return Boolean(
    entry &&
      typeof entry === "object" &&
      "object" in (entry as Record<string, unknown>) &&
      (entry as { object?: string }).object === "page" &&
      "parent" in (entry as Record<string, unknown>),
  );
}

export async function getNotionDiagnostic(): Promise<NotionDiagnostic> {
  const apiKey = env("NOTION_API_KEY");
  const databaseId = getNotionDatabaseId()?.trim() ?? "";

  if (!apiKey && !databaseId) {
    return {
      level: "error",
      title: "Missing Notion configuration",
      details: [
        "Set NOTION_API_KEY and paste your Notion Database URL in NOTION_DATABASE_ID in .env.local.",
      ],
    };
  }

  if (!apiKey) {
    return {
      level: "error",
      title: "Missing NOTION_API_KEY",
      details: [
        "Create an integration at notion.so/my-integrations and paste the token into .env.local.",
      ],
    };
  }

  if (!databaseId) {
    return {
      level: "error",
      title: "Missing NOTION_DATABASE_ID",
      details: [
        "Copy the URL of your duplicated Notion Database and paste it into NOTION_DATABASE_ID in .env.local.",
      ],
    };
  }

  const notion = new Client({ auth: apiKey });

  try {
    await notion.databases.retrieve({ database_id: databaseId });

    let sample;

    try {
      sample = await notion.databases.query({
        database_id: databaseId,
        page_size: 1,
      });
    } catch (error) {
      if (error instanceof APIResponseError && error.code === "object_not_found") {
        const fallback = await notion.search({
          query: "",
          filter: {
            property: "object",
            value: "page",
          },
          page_size: 1,
        });

        const matchingRow = fallback.results.find((entry) => {
          if (!asPageObject(entry)) {
            return false;
          }

          return (
            entry.parent.type === "database_id" &&
            entry.parent.database_id === databaseId
          );
        });

        if (matchingRow) {
          return {
            level: "warn",
            title: "Connected (fallback mode)",
            details: [
              "Database access is valid, but Notion database query is unavailable for this ID.",
              "The app will use search-based fallback to discover posts.",
            ],
          };
        }

        return {
          level: "warn",
          title: "Connected, but no rows found",
          details: [
            "Database is reachable, but no rows were found for this database ID.",
            "Add a test row or verify the ID is from the correct full-page database URL.",
          ],
        };
      }

      throw error;
    }

    if (sample.results.length === 0) {
      return {
        level: "warn",
        title: "Connected, but no rows found",
        details: [
          "Your integration can access the table, but it has no rows yet.",
          "Add a test row and set Status to Published.",
        ],
      };
    }

    return {
      level: "ok",
      title: "Notion connection is healthy",
      details: ["Environment variables and table access look good."],
    };
  } catch (error) {
    if (error instanceof APIResponseError) {
      if (error.code === "object_not_found") {
        return {
          level: "error",
          title: "Database not found",
          details: [
            "The Notion integration can't find your database.",
            "Make sure you shared the database with your integration via the Connections menu.",
            "Also ensure you copied the full database page URL into .env.local.",
          ],
        };
      }

      if (error.code === "unauthorized") {
        return {
          level: "error",
          title: "Notion token unauthorized",
          details: [
            "Your NOTION_API_KEY is invalid or expired.",
            "Rotate the integration token and update .env.local.",
          ],
        };
      }

      return {
        level: "error",
        title: "Notion API error",
        details: [error.message],
      };
    }

    return {
      level: "error",
      title: "Unexpected connection error",
      details: ["Could not validate Notion connection. Check server logs for details."],
    };
  }
}
