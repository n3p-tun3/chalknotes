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

3. Run development server.

```bash
pnpm dev
```

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
