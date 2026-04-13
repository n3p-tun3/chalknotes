import Image from "next/image";

import { resolveImageUrl } from "@/lib/images/adapter";
import type { NotionBlock } from "@/lib/types";

type Props = {
  blocks: NotionBlock[];
};

export function NotionBlockRenderer({ blocks }: Props) {
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (block.type === "bulleted_list_item") {
      const items: NotionBlock[] = [block];
      while (blocks[i + 1]?.type === "bulleted_list_item") {
        i += 1;
        items.push(blocks[i]);
      }

      elements.push(
        <ul key={block.id} className="my-6 list-disc space-y-2 pl-6 text-stone-800">
          {items.map((item) => (
            <li key={item.id}>{item.type === "bulleted_list_item" ? item.text : ""}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (block.type === "numbered_list_item") {
      const items: NotionBlock[] = [block];
      while (blocks[i + 1]?.type === "numbered_list_item") {
        i += 1;
        items.push(blocks[i]);
      }

      elements.push(
        <ol key={block.id} className="my-6 list-decimal space-y-2 pl-6 text-stone-800">
          {items.map((item) => (
            <li key={item.id}>{item.type === "numbered_list_item" ? item.text : ""}</li>
          ))}
        </ol>,
      );
      continue;
    }

    switch (block.type) {
      case "paragraph":
        elements.push(
          <p key={block.id} className="my-5 text-lg leading-8 text-stone-800">
            {block.text}
          </p>,
        );
        break;
      case "heading_1":
        elements.push(
          <h1 key={block.id} className="mt-12 text-4xl font-semibold tracking-tight text-stone-900">
            {block.text}
          </h1>,
        );
        break;
      case "heading_2":
        elements.push(
          <h2 key={block.id} className="mt-10 text-3xl font-semibold tracking-tight text-stone-900">
            {block.text}
          </h2>,
        );
        break;
      case "heading_3":
        elements.push(
          <h3 key={block.id} className="mt-8 text-2xl font-semibold tracking-tight text-stone-900">
            {block.text}
          </h3>,
        );
        break;
      case "quote":
        elements.push(
          <blockquote
            key={block.id}
            className="my-8 border-l-4 border-stone-400 bg-stone-100 px-5 py-3 text-lg italic text-stone-700"
          >
            {block.text}
          </blockquote>,
        );
        break;
      case "code":
        elements.push(
          <pre
            key={block.id}
            className="my-8 overflow-x-auto rounded-md border border-stone-300 bg-stone-950 p-4 text-sm leading-6 text-stone-100"
          >
            <code>{block.text}</code>
          </pre>,
        );
        break;
      case "image": {
        const url = resolveImageUrl({ url: block.url });

        if (!url) {
          break;
        }

        elements.push(
          <figure key={block.id} className="my-10 space-y-3">
            <Image
              src={url}
              alt={block.caption || "Post image"}
              width={1400}
              height={900}
              className="h-auto w-full rounded-lg border border-stone-300 object-cover"
              unoptimized
            />
            {block.caption ? (
              <figcaption className="text-sm text-stone-600">{block.caption}</figcaption>
            ) : null}
          </figure>,
        );
        break;
      }
      case "divider":
        elements.push(
          <hr key={block.id} className="my-10 border-0 border-t border-stone-300" />,
        );
        break;
      default:
        break;
    }
  }

  return <section>{elements}</section>;
}
