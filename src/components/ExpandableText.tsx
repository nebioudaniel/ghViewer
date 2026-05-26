"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

interface Props {
  content: string;
  maxHeight?: number;
}

export default function ExpandableText({ content, maxHeight = 100 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      if (contentRef.current.scrollHeight > maxHeight) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    }
  }, [content, maxHeight]);

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div
        ref={contentRef}
        className={`text-[11px] leading-relaxed relative ${expanded ? "" : "overflow-hidden"}`}
        style={{
          maxHeight: expanded ? "none" : `${maxHeight}px`,
          color: "var(--fg-faint)",
        }}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-[var(--bg-muted)] [&_pre]:p-2 [&_pre]:rounded-md [&_code]:text-[var(--fg)] [&_code]:bg-[var(--bg-muted)] [&_code]:px-1 [&_code]:rounded [&_a]:text-[var(--accent)] [&_a]:underline">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[
              rehypeRaw,
              [rehypeSanitize, {
                ...defaultSchema,
                attributes: {
                  ...defaultSchema.attributes,
                  '*': [...(defaultSchema.attributes?.['*'] || []), 'align', 'valign', 'style', 'className'],
                  'img': [...(defaultSchema.attributes?.['img'] || []), 'width', 'height']
                }
              }]
            ]}
          >
            {content}
          </ReactMarkdown>
        </div>
        {!expanded && showButton && (
          <div
            className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
            style={{
              background: "linear-gradient(transparent, var(--bg))",
            }}
          />
        )}
      </div>
      {showButton && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="self-start text-[10px] font-medium transition-colors hover:underline"
          style={{ color: "var(--accent)" }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
