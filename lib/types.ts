export type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  publishedAt: string;
  coverImageUrl: string | null;
  lastEditedTime: string;
};

export type BlogPost = BlogPostSummary & {
  blocks: NotionBlock[];
};

export type NotionBlock =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading_1"; text: string }
  | { id: string; type: "heading_2"; text: string }
  | { id: string; type: "heading_3"; text: string }
  | { id: string; type: "quote"; text: string }
  | { id: string; type: "bulleted_list_item"; text: string }
  | { id: string; type: "numbered_list_item"; text: string }
  | { id: string; type: "code"; text: string; language: string }
  | { id: string; type: "image"; url: string; caption: string }
  | { id: string; type: "divider" };