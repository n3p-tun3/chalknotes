type ResolveImageInput = {
  url: string | null;
};

// MVP mode: keep Notion-hosted asset URLs intact.
// Later we can swap this implementation for proxying or persistence.
export function resolveImageUrl({ url }: ResolveImageInput): string | null {
  if (!url) {
    return null;
  }

  return url;
}
