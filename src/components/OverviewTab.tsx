"use client";
import { useState, useEffect } from "react";
import { Project, GHRepo, GHContent } from "@/lib/types";
import { analyzeTechStack, TechStack } from "@/lib/techStackAnalyzer";
import { fetchFileContent } from "@/lib/github";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { Loader2, Zap, BookOpen, Clock, Users } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  project: Project;
  repo: GHRepo;
}

export default function OverviewTab({ project, repo }: Props) {
  const [techStack, setTechStack] = useState<TechStack[]>([]);
  const [readme, setReadme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [stack, readmeNode] = await Promise.allSettled([
          analyzeTechStack(project.owner, project.repo, project.token),
          fetchFileContent(project.owner, project.repo, "README.md", project.token).catch(() => 
            fetchFileContent(project.owner, project.repo, "readme.md", project.token)
          ),
        ]);

        if (stack.status === "fulfilled") setTechStack(stack.value);
        if (readmeNode.status === "fulfilled") {
          const content = readmeNode.value;
          const decoded = content.encoding === "base64" 
            ? atob(content.content.replace(/\n/g, "")) 
            : content.content;
          setReadme(decoded);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [project]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={16} className="animate-spin text-[var(--fg-faint)]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto px-5 py-6 flex flex-col gap-6 overflow-y-auto">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Activity Card */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] flex flex-col gap-2 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--fg-muted)] mb-1">
            <Clock size={14} />
            <span className="text-xs font-semibold">Activity</span>
          </div>
          <p className="text-sm text-[var(--fg)]">
            Last updated <span className="font-semibold">{timeAgo(repo.updated_at || new Date().toISOString())}</span>
          </p>
          <p className="text-[11px] text-[var(--fg-faint)]">
            Created {timeAgo(repo.created_at || new Date().toISOString())}
          </p>
        </div>

        {/* Tech Stack Card */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] flex flex-col gap-2 shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 text-[var(--fg-muted)] mb-1">
            <Zap size={14} />
            <span className="text-xs font-semibold">Tech Stack</span>
          </div>
          {techStack.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span
                  key={tech.name}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium border"
                  style={{
                    backgroundColor: `${tech.color}15`,
                    color: tech.color,
                    borderColor: `${tech.color}30`,
                  }}
                >
                  {tech.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--fg-faint)]">No major frameworks detected in package.json.</p>
          )}
        </div>
      </div>

      {/* Readme Section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-sm overflow-hidden mt-2">
        <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-subtle)] flex items-center gap-2">
          <BookOpen size={14} className="text-[var(--fg-muted)]" />
          <span className="text-xs font-semibold text-[var(--fg)]">README.md</span>
        </div>
        <div className="p-6 text-[13px] leading-relaxed text-[var(--fg)]">
          {readme ? (
            <div className="prose prose-sm dark:prose-invert max-w-none 
              [&_pre]:bg-[var(--bg-subtle)] [&_pre]:p-0 [&_pre]:rounded-lg [&_pre]:overflow-hidden [&_pre]:border [&_pre]:border-[var(--border)]
              [&_code]:text-[var(--fg)] [&_code]:bg-[var(--bg-muted)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md
              [&_a]:text-blue-500 hover:[&_a]:underline [&_img]:rounded-lg [&_img]:border [&_img]:border-[var(--border)]">
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
                components={{
                  code({node, inline, className, children, ...props}: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        {...props}
                        children={String(children).replace(/\n$/, '')}
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ margin: 0, background: "transparent", padding: "1rem" }}
                      />
                    ) : (
                      <code {...props} className={className}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {readme}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-[var(--fg-faint)] text-center py-10">No README.md found in this repository.</p>
          )}
        </div>
      </div>
    </div>
  );
}
