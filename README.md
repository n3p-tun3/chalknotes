# Chalknotes

Self-hostable Next.js + Notion blog boilerplate.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Notion API via `@notionhq/client`
- Vercel-friendly ISR and revalidation endpoint

## Features

- Home page with published posts list
- Dynamic post route at `/blog/[slug]`
- Tag pages at `/tags/[tag]`
- RSS feed at `/rss.xml`
- Sitemap generation
- On-demand revalidation endpoint (`POST /api/revalidate`)
- Custom Notion block renderer with rich text support

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

### Status values

Create these options in the Status column in Notion:

- `Draft`
- `Published`
- `Archived`

Only rows set to `Published` will be publicly rendered on the site.

### What each Notion page should contain

Inside each database row, the page content is your article body. These blocks are fully supported:

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

## Get your Notion setup

1. **Get the Integration Key**  
	- Head over to [notion.so/my-integrations](https://www.notion.so/my-integrations)
	- Click `New integration` and give it a name (e.g. "Chalknotes")
	- Click Submit, copy the `Internal Integration Token`, and paste it into `NOTION_API_KEY` in your `.env.local` file.

2. **Duplicate the Template**  
	- Open the [Chalknotes Starter Template]([INSERT_TEMPLATE_URL_HERE]) and duplicate it into your own workspace.

3. **Share & Connect Datebase**  
	- In your duplicated Notion database, click the three dots `...` in the top right.
	- Under `Connections`, find the integration you created in step 1 and add it.
  
4. **Paste Database URL**  
	- Finally, copy the full URL of your duplicated database page straight from your browser.
	- Paste the entire URL into `NOTION_DATABASE_ID` in your `.env.local`. (Chalknotes will automatically extract the 32-character database ID for you).

## Local setup

1. Copy environment file.

```bash
cp .env.example .env.local
```

2. Fill these values in `.env.local`:

- `NOTION_API_KEY` (Paste the Internal Integration Secret)
- `NOTION_DATABASE_ID` (Paste the full Notion database URL from your browser)

Note: Chalknotes runs automatic regex over the database URL, so you don't need to manually slice the ID out of the string!
- `NEXT_PUBLIC_SITE_URL`
- `REVALIDATE_SECRET`

3. Make it yours: open `site.config.ts` located at the root of the project and update the title, author details, and homepage hero settings.

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

- Required env vars exist (`NOTION_API_KEY`, `NOTION_DATABASE_ID`)
- The target database URL parses accurately
- Database is shared and reachable
- Rows can be queried
- Sample rows pass publish tests (status + publish date)

## Revalidation

Trigger refresh after content updates:

```bash
curl -X POST "https://your-domain.com/api/revalidate?secret=YOUR_SECRET"
```

## Deploying on Vercel

1. Import this repository into Vercel.
2. Add all environment variables from `.env.local` to your Vercel project settings.
3. Deploy!
