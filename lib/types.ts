export type RichTextItem = {
  plainText: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
};

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
  | { id: string; type: "paragraph"; richText: RichTextItem[] }
  | { id: string; type: "heading_1"; richText: RichTextItem[] }
  | { id: string; type: "heading_2"; richText: RichTextItem[] }
  | { id: string; type: "heading_3"; richText: RichTextItem[] }
  | { id: string; type: "quote"; richText: RichTextItem[] }
  | { id: string; type: "bulleted_list_item"; richText: RichTextItem[] }
  | { id: string; type: "numbered_list_item"; richText: RichTextItem[] }
  | { id: string; type: "code"; richText: RichTextItem[]; language: string }
  | { id: string; type: "image"; url: string; caption: string }
  | { id: string; type: "divider" };