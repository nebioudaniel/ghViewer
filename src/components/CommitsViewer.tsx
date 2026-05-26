"use client";
import { useState, useEffect } from "react";
import { GHCommit, Project } from "@/lib/types";
import { fetchCommits } from "@/lib/github";
import { GitCommitHorizontal, Loader2, ExternalLink, ChevronDown, AlertCircle } from "lucide-react";
import { timeAgo, initials } from "@/lib/utils";

interface Props { project: Project }

export default function CommitsViewer({ project }: Props) {
  const [commits, setCommits] = useState<GHCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchCommits(project.owner, project.repo, project.token, 1)
      .then((data) => { setCommits(data); setHasMore(data.length === 30); setPage(1); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [project]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await fetchCommits(project.owner, project.repo, project.token, next);
      setCommits((prev) => [...prev, ...data]);
      setPage(next);
      setHasMore(data.length === 30);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load more.");
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={16} className="animate-spin text-[var(--fg-faint)]" />
    </div>
  );

  if (error) return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mx-6 mt-4">
      <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
      <p className="text-[11px] text-red-600">{error}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-px px-6 py-4">
      {commits.map((commit, i) => {
        const short = commit.sha.slice(0, 7);
        const firstLine = commit.commit.message.split("\n")[0];
        const rest = commit.commit.message.split("\n").slice(1).join("\n").trim();
        const authorName = commit.author?.login || commit.commit.author.name;

        return (
          <div
            key={commit.sha}
            className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0 group"
          >
            {/* Timeline dot */}
            <div className="relative flex flex-col items-center pt-0.5 shrink-0">
              <div className="w-5 h-5 rounded-full bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center">
                {commit.author ? (
                  <span className="text-[8px] font-bold text-[var(--fg-muted)]">{initials(commit.author.login)}</span>
                ) : (
                  <GitCommitHorizontal size={10} className="text-[var(--fg-faint)]" />
                )}
              </div>
              {i < commits.length - 1 && (
                <div className="w-px flex-1 mt-1 bg-[var(--border)] min-h-[16px]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-medium text-[var(--fg)] leading-snug line-clamp-2 flex-1">{firstLine}</p>
                <a
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1 rounded text-[var(--fg-faint)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <ExternalLink size={11} />
                </a>
              </div>
              {rest && (
                <p className="text-[11px] text-[var(--fg-faint)] mt-0.5 line-clamp-2 leading-relaxed">{rest}</p>
              )}
              <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                <span className="font-mono text-[10px] text-[var(--fg-faint)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded border border-[var(--border)]">{short}</span>
                <span className="text-[11px] text-[var(--fg-muted)]">{authorName}</span>
                <span className="text-[11px] text-[var(--fg-faint)]">{timeAgo(commit.commit.author.date)}</span>
              </div>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="flex items-center justify-center gap-2 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] py-3 mt-2 border border-dashed border-[var(--border)] rounded-lg hover:border-[var(--border-strong)] transition-all disabled:opacity-50"
        >
          {loadingMore ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
          {loadingMore ? "Loading..." : "Load more commits"}
        </button>
      )}
    </div>
  );
}
