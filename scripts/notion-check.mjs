import { APIResponseError, Client } from "@notionhq/client";

function value(name, fallback = "") {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  return raw.trim();
}

function mask(input) {
  if (!input) {
    return "(missing)";
  }
  if (input.length <= 8) {
    return "********";
  }
  return `${input.slice(0, 4)}...${input.slice(-4)}`;
}

function getProperty(page, propName) {
  return page.properties[propName];
}

function richTextToText(value) {
  if (!value || value.length === 0) {
    return "";
  }
  return value.map((part) => part.plain_text).join("").trim();
}

function readTitle(page, schema) {
  const prop = getProperty(page, schema.title);
  if (prop?.type === "title") {
    return richTextToText(prop.title) || "Untitled";
  }
  return "Untitled";
}

function readSlug(page, schema) {
  const prop = getProperty(page, schema.slug);
  if (prop?.type === "rich_text") {
    return richTextToText(prop.rich_text);
  }
  return "";
}

function readStatus(page, schema) {
  const prop = getProperty(page, schema.status);
  if (prop?.type === "status") {
    return prop.status?.name || "";
  }
  if (prop?.type === "select") {
    return prop.select?.name || "";
  }
  return "";
}

function readPublishedAt(page, schema) {
  const prop = getProperty(page, schema.publishedAt);
  if (prop?.type === "date") {
    return prop.date?.start || "";
  }
  return "";
}

function isPublishable(page, schema, publishedValue) {
  const status = readStatus(page, schema);
  const publishedAt = readPublishedAt(page, schema);
  const statusOk = status.toLowerCase() === publishedValue.toLowerCase();

  let dateOk = false;
  if (publishedAt) {
    dateOk = new Date(publishedAt) <= new Date();
  }

  return {
    status,
    publishedAt,
    statusOk,
    dateOk,
    pass: statusOk && dateOk,
  };
}

function describeApiError(error) {
  if (!(error instanceof APIResponseError)) {
    return `Unexpected error: ${String(error)}`;
  }

  const lines = [];
  lines.push(`Notion API error code: ${error.code}`);
  lines.push(`Message: ${error.message}`);

  if (error.code === "object_not_found") {
    lines.push("Likely causes:");
    lines.push("- Wrong database ID (ID copied from the wrong URL segment)");
    lines.push("- Database not shared with integration");
    lines.push("- Integration belongs to a different workspace");
  }

  if (error.code === "unauthorized") {
    lines.push("Likely causes:");
    lines.push("- Invalid/expired NOTION_API_KEY");
    lines.push("- Token belongs to a deleted integration");
  }

  return lines.join("\n");
}

function pageBelongsToDatabase(page, databaseId) {
  return (
    page.parent?.type === "database_id" &&
    page.parent.database_id === databaseId
  );
}

async function queryRowsWithFallback(notion, databaseId) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 20,
    });

    return {
      mode: "database-query",
      pages: response.results.filter(
        (entry) => entry && typeof entry === "object" && entry.object === "page",
      ),
    };
  } catch (error) {
    if (!(error instanceof APIResponseError) || error.code !== "object_not_found") {
      throw error;
    }

    console.warn(
      "Database query is unavailable for this database ID. Falling back to search-based discovery.",
    );

    const response = await notion.search({
      query: "",
      filter: {
        property: "object",
        value: "page",
      },
      page_size: 100,
    });

    return {
      mode: "search-fallback",
      pages: response.results.filter(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          entry.object === "page" &&
          pageBelongsToDatabase(entry, databaseId),
      ),
    };
  }
}

async function main() {
  const apiKey = value("NOTION_API_KEY");
  const databaseId = value("NOTION_DATABASE_ID");

  const schema = {
    title: value("NOTION_PROP_TITLE", "Title"),
    slug: value("NOTION_PROP_SLUG", "Slug"),
    status: value("NOTION_PROP_STATUS", "Status"),
    publishedAt: value("NOTION_PROP_PUBLISHED_AT", "PublishedAt"),
  };

  const publishedValue = value("NOTION_STATUS_PUBLISHED_VALUE", "Published");

  console.log("=== Notion Check ===");
  console.log(`NOTION_API_KEY: ${mask(apiKey)}`);
  console.log(`Database ID: ${databaseId || "(missing)"}`);
  console.log(`Schema mapping: ${JSON.stringify(schema)}`);
  console.log(`Published status value: ${publishedValue}`);
  console.log("");

  if (!apiKey || !databaseId) {
    console.error("Missing required env vars.");
    console.error("Required: NOTION_API_KEY and NOTION_DATABASE_ID");
    process.exit(1);
  }

  const notion = new Client({ auth: apiKey });

  try {
    await notion.databases.retrieve({ database_id: databaseId });
    console.log("Connection check: OK (database found and accessible)");
  } catch (error) {
    console.error(describeApiError(error));
    process.exit(1);
  }

  let queryResult;
  try {
    queryResult = await queryRowsWithFallback(notion, databaseId);
  } catch (error) {
    console.error("Failed querying rows.");
    console.error(describeApiError(error));
    process.exit(1);
  }

  const pages = queryResult.pages;

  console.log(`Rows fetched: ${pages.length} (${queryResult.mode})`);

  if (pages.length === 0) {
    console.warn("No rows returned. Add at least one row in the database.");
    process.exit(0);
  }

  let publishableCount = 0;
  console.log("\nSample evaluation (first 10 rows):");

  for (const page of pages.slice(0, 10)) {
    const title = readTitle(page, schema);
    const slug = readSlug(page, schema);
    const evalResult = isPublishable(page, schema, publishedValue);

    if (evalResult.pass) {
      publishableCount += 1;
    }

    console.log(`- ${title}`);
    console.log(`  slug: ${slug || "(empty)"}`);
    console.log(
      `  status: ${evalResult.status || "(missing)"} | publishedAt: ${evalResult.publishedAt || "(missing)"}`,
    );
    console.log(
      `  checks: status=${evalResult.statusOk ? "ok" : "fail"}, date=${evalResult.dateOk ? "ok" : "fail"}, final=${evalResult.pass ? "PASS" : "FAIL"}`,
    );
  }

  console.log("");
  console.log(`Publishable rows in sample: ${publishableCount}/${Math.min(10, pages.length)}`);
  console.log("If rows are failing, check Status type/value and PublishedAt type/value.");
}

main().catch((error) => {
  console.error("Unhandled script error.");
  console.error(error);
  process.exit(1);
});
