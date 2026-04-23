# Chalknotes

Self-hostable Next.js + Notion blog boilerplate.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Notion API via `@notionhq/client`
- Vercel-friendly ISR and revalidation endpoint

## What this MVP includes

- Home page with published posts list
- Dynamic post route at `/blog/[slug]`
- Tag pages at `/tags/[tag]`
- RSS feed at `/rss.xml`
- Sitemap generation
- On-demand revalidation endpoint (`POST /api/revalidate`)
- Image adapter layer with Option A enabled (direct Notion image URLs)

## Notion database schema

Create one database with these properties:

- `Title` (title)
- `Slug` (rich_text)
- `Status` (status or select)
- `PublishedAt` (date)
- `Tags` (multi_select)
- `Excerpt` (rich_text)
- `Cover` (files, optional)

Only records where `Status` is `Published` and `PublishedAt` is in the past are shown.

### Recommended field behavior

| Property | Type | Required | Example | Notes |
| --- | --- | --- | --- | --- |
| `Title` | `title` | Yes | `Building Chalknotes` | Used as post title and metadata title fallback. |
| `Slug` | `rich_text` | Recommended | `building-chalknotes` | URL path segment for `/blog/[slug]`. If empty, it is auto-generated from title. |
| `Status` | `status` or `select` | Yes | `Published` | Only posts matching the published status value are shown publicly. |
| `PublishedAt` | `date` | Recommended | `2026-04-13` | Controls publish timing. Future date means not yet visible. |
| `Tags` | `multi_select` | Optional | `Product`, `Writing` | Used for tag pages at `/tags/[tag]`. |
| `Excerpt` | `rich_text` | Optional | `This is the post summary.` | Used on home list cards and RSS description fallback. |
| `Cover` | `files` | Optional | (image file) | Used for social preview image metadata. |

### Status values (MVP recommendation)

Create these status options in Notion:

- `Draft`
- `Published`
- `Archived`

For now, only `Published` is rendered on the site. Draft preview links are planned later.

### What each Notion page should contain

Inside each database row, the page content is your article body. For MVP, these blocks are rendered well:

- Paragraph
- Headings (H1, H2, H3)
- Quote
- Bulleted list
- Numbered list
- Code block
- Image
- Divider

### Example post row

Use this as a starter when creating your first post:

- `Title`: `My first Chalknotes post`
- `Slug`: `my-first-chalknotes-post`
- `Status`: `Published`
- `PublishedAt`: today (or any past date/time)
- `Tags`: `Announcements`, `Build`
- `Excerpt`: `How I set up my Notion-powered blog with Chalknotes.`
- `Cover`: optional image

Then write your article in the page body below those properties.

## Get your Notion keys and IDs

1. Create a Notion integration token.
	- Open [https://www.notion.so/profile/integrations](https://www.notion.so/profile/integrations)
	- Click `New integration`
	- Give it a name and workspace access
	- Copy the token and set it as `NOTION_API_KEY`

2. Share your content database with the integration.
	- Open your blog database in Notion
	- Click `Share`
	- Invite your integration so it can read the database

3. Get the database ID.
	- Open the database as a full page
	- Copy the URL
	- The 32-character ID in the URL is your database ID
	- Put it in `NOTION_DATABASE_ID`

## Local setup

1. Copy environment file.

```bash
cp .env.example .env.local
```

2. Fill these values in `.env.local`:

- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`
- `NEXT_PUBLIC_SITE_URL`
- `REVALIDATE_SECRET`

Optional overrides if your property names differ from defaults:

- `NOTION_PROP_TITLE`
- `NOTION_PROP_SLUG`
- `NOTION_PROP_STATUS`
- `NOTION_PROP_PUBLISHED_AT`
- `NOTION_PROP_TAGS`
- `NOTION_PROP_EXCERPT`
- `NOTION_PROP_COVER`
- `NOTION_STATUS_PUBLISHED_VALUE`

3. Run development server.

```bash
pnpm dev
```

## Troubleshooting check script

Run a direct environment and connection check:

```bash
pnpm notion:check
```

It validates:

- Required env vars exist
- Notion database ID is reachable
- Rows can be queried
- Sample rows pass publish checks (status + publish date)

## Revalidation

Trigger refresh after content updates:

```bash
curl -X POST "http://localhost:3000/api/revalidate?secret=YOUR_SECRET"
```

## Deploy on Vercel

1. Import this repo into Vercel.
2. Add all environment variables from `.env.example`.
3. Deploy.

## Notes

- MVP image mode uses direct Notion-hosted URLs through an adapter in `lib/images/adapter.ts`.
- We can later swap adapter strategy to proxy/cache/download without changing page components.
