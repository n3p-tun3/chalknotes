import React from "react";

import type { RichTextItem } from "@/lib/types";

// A component that renders a single Notion RichTextItem
function RichTextSegment({ item }: { item: RichTextItem }) {
  const { annotations, href, plainText } = item;

  let element: React.ReactNode = plainText;

  if (annotations.bold) {
    element = <strong className="font-semibold">{element}</strong>;
  }

  if (annotations.italic) {
    element = <em className="italic">{element}</em>;
  }

  if (annotations.underline) {
    element = <span className="underline underline-offset-4">{element}</span>;
  }

  if (annotations.strikethrough) {
    element = <span className="line-through">{element}</span>;
  }

  if (annotations.code) {
    element = (
      <code className="rounded bg-stone-200/50 px-1 py-0.5 font-mono text-[0.9em] font-medium text-stone-800">
        {element}
      </code>
    );
  }

  if (annotations.color !== "default") {
    // Advanced: could map Notion colors to Tailwind classes
    element = <span className={`notion-color-${annotations.color}`}>{element}</span>;
  }

  if (href) {
    element = (
      <a
        href={href}
        className="text-stone-900 underline underline-offset-4 hover:text-stone-600 transition"
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {element}
      </a>
    );
  }

  return <>{element}</>;
}

type Props = {
  text: RichTextItem[];
};

export function RichText({ text }: Props) {
  if (!text || text.length === 0) {
    return null;
  }

  return (
    <>
      {text.map((item, i) => (
        <RichTextSegment key={i} item={item} />
      ))}
    </>
  );
}
