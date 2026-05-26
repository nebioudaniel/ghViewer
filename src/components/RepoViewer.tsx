"use client";
import { useState, useEffect, useCallback } from "react";
import { Project, GHIssue, GHRepo, GHComment } from "@/lib/types";
import { fetchIssues, fetchRepo, fetchComments } from "@/lib/github";
import { timeAgo, initials } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Star, GitFork, CircleDot, Lock, Globe,
  MessageCircle, ChevronDown, ChevronUp, Loader2, RefreshCw,
  ExternalLink, GitPullRequest, Tag, AlertCircle, Sun, Moon,
  Code, GitCommitHorizontal, FileText, GitBranch, LayoutDashboard
} from "lucide-react";
import ExpandableText from "./ExpandableText";
import OverviewTab from "./OverviewTab";

const CodeExplorer = dynamic(() => import("./CodeExplorer"), { ssr: false });
const CommitsViewer = dynamic(() => import("./CommitsViewer"), { ssr: false });

interface Props { project: Project; onBack: () => void }
type StateFilter = "all" | "open" | "closed";
type MainTab = "overview" | "code" | "issues" | "commits";

export default function RepoViewer({ project, onBack }: Props) {
  const { theme, toggle } = useTheme();
  const [repo, setRepo] = useState<GHRepo | null>(null);
  const [items, setItems] = useState<GHIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [issueTab, setIssueTab] = useState<"all" | "issues" | "prs">("all");
  const [mainTab, setMainTab] = useState<MainTab>("overview");
  const [expandedComments, setExpandedComments] = useState<Record<number, GHComment[] | "loading">>({});
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (reset = true) => {
    if (reset) { setLoading(true); setError(""); setPage(1); }
    else setLoadingMore(true);
    try {
      const p = reset ? 1 : page + 1;
      const [repoData, issueData] = reset
        ? await Promise.all([
            fetchRepo(project.owner, project.repo, project.token),
            fetchIssues(project.owner, project.repo, project.token, stateFilter, 1),
          ])
        : [null, await fetchIssues(project.owner, project.repo, project.token, stateFilter, p)];
      if (repoData) setRepo(repoData);
      if (reset) setItems(issueData);
      else { setItems((prev) => [...prev, ...issueData]); setPage(p); }
      setHasMore(issueData.length === 30);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [project, stateFilter, page]); // eslint-disable-line

  useEffect(() => { load(true); }, [project, stateFilter]); // eslint-disable-line

  async function toggleComments(issue: GHIssue) {
    if (expandedComments[issue.number]) {
      setExpandedComments((prev) => { const n = { ...prev }; delete n[issue.number]; return n; });
      return;
    }
    setExpandedComments((prev) => ({ ...prev, [issue.number]: "loading" }));
    try {
      const data = await fetchComments(project.owner, project.repo, issue.number, project.token);
      setExpandedComments((prev) => ({ ...prev, [issue.number]: data }));
    } catch {
      setExpandedComments((prev) => { const n = { ...prev }; delete n[issue.number]; return n; });
    }
  }

  const filtered = items.filter((i) => {
    if (issueTab === "issues") return !i.pull_request;
    if (issueTab === "prs") return !!i.pull_request;
    return true;
  });

  const defaultBranch = (repo as any)?.default_branch || "main";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
        className="px-5 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack}
            className="flex items-center gap-1 text-xs transition-colors shrink-0"
            style={{ color: "var(--fg-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--fg)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--fg-muted)")}>
            <ArrowLeft size={12} /> Projects
          </button>
          <span style={{ color: "var(--border-strong)" }}>·</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <GitBranch size={12} style={{ color: "var(--fg-muted)", flexShrink: 0 }} />
            <span className="text-xs font-medium truncate" style={{ color: "var(--fg)" }}>
              {project.owner}/{project.repo}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 flex items-center gap-0.5"
              style={{ color: "var(--fg-faint)", borderColor: "var(--border)" }}>
              {project.type === "private" ? <Lock size={8} /> : <Globe size={8} />}
              {project.type}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={toggle}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "var(--fg-faint)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--fg)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-muted)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--fg-faint)"; (e.currentTarget as HTMLElement).style.background = ""; }}>
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button onClick={() => load(true)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "var(--fg-faint)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--fg)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-muted)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--fg-faint)"; (e.currentTarget as HTMLElement).style.background = ""; }}>
            <RefreshCw size={12} />
          </button>
        </div>
      </header>

      {/* Repo info strip */}
      {repo && (
        <div className="px-5 py-3 border-b flex items-start justify-between gap-3 flex-wrap"
          style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--fg)" }}>{repo.full_name}</p>
            {repo.description && (
              <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--fg-muted)" }}>{repo.description}</p>
            )}
            <div className="flex items-center gap-4 flex-wrap mt-1.5">
              {[
                { icon: Star, val: repo.stargazers_count.toLocaleString() },
                { icon: GitFork, val: repo.forks_count.toLocaleString() },
                { icon: CircleDot, val: `${repo.open_issues_count} open` },
              ].map(({ icon: Icon, val }) => (
                <span key={val} className="flex items-center gap-1 text-[11px]" style={{ color: "var(--fg-muted)" }}>
                  <Icon size={10} />{val}
                </span>
              ))}
              {repo.language && (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--fg-muted)" }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--fg-faint)" }} />
                  {repo.language}
                </span>
              )}
            </div>
          </div>
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-md transition-colors shrink-0"
            style={{ color: "var(--fg-faint)" }}>
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* Main tabs */}
      <div className="px-5 border-b flex items-center gap-1 shrink-0" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        {([
          { id: "overview", label: "Overview", icon: LayoutDashboard },
          { id: "code", label: "Code", icon: Code },
          { id: "issues", label: "Issues & PRs", icon: FileText },
          { id: "commits", label: "Commits", icon: GitCommitHorizontal },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setMainTab(id)}
            className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-2.5 border-b-2 transition-all"
            style={{
              borderBottomColor: mainTab === id ? "var(--fg)" : "transparent",
              color: mainTab === id ? "var(--fg)" : "var(--fg-faint)",
            }}>
            <Icon size={11} />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* OVERVIEW TAB */}
        {mainTab === "overview" && repo && (
          <OverviewTab project={project} repo={repo} />
        )}

        {/* CODE TAB */}
        {mainTab === "code" && (
          <div className="flex-1 overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
            {repo ? (
              <CodeExplorer project={project} defaultBranch={defaultBranch} />
            ) : loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={16} className="animate-spin" style={{ color: "var(--fg-faint)" }} />
              </div>
            ) : null}
          </div>
        )}

        {/* ISSUES TAB */}
        {mainTab === "issues" && (
          <div className="max-w-2xl w-full mx-auto px-5 py-5 flex flex-col gap-4 flex-1 overflow-y-auto">
            {/* Sub-filters */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
                {([["all", "All", items.length], ["issues", "Issues", items.filter(i => !i.pull_request).length], ["prs", "PRs", items.filter(i => !!i.pull_request).length]] as const).map(([val, label, count]) => (
                  <button key={val} onClick={() => setIssueTab(val)}
                    className="text-[11px] font-medium px-3 py-1 rounded-md transition-all"
                    style={{
                      background: issueTab === val ? "var(--bg)" : "transparent",
                      color: issueTab === val ? "var(--fg)" : "var(--fg-faint)",
                      boxShadow: issueTab === val ? "0 1px 3px rgba(0,0,0,0.08)" : "",
                      border: issueTab === val ? "1px solid var(--border)" : "1px solid transparent",
                    }}>
                    {label} <span className="ml-1 text-[10px]">{count}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {(["all", "open", "closed"] as const).map((s) => (
                  <button key={s} onClick={() => setStateFilter(s)}
                    className="text-[11px] px-2.5 py-1 rounded-md border transition-all capitalize"
                    style={{
                      background: stateFilter === s ? "var(--accent)" : "transparent",
                      color: stateFilter === s ? "var(--accent-fg)" : "var(--fg-faint)",
                      borderColor: stateFilter === s ? "var(--accent)" : "var(--border)",
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={16} className="animate-spin" style={{ color: "var(--fg-faint)" }} />
              </div>
            ) : error ? (
              <div className="flex items-start gap-2 rounded-lg px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-red-500">{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CircleDot size={20} className="mb-3" style={{ color: "var(--fg-faint)" }} />
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>No items found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((issue) => (
                  <IssueCard key={issue.number} issue={issue} expanded={expandedComments[issue.number]} onToggleComments={() => toggleComments(issue)} />
                ))}
                {hasMore && (
                  <button onClick={() => load(false)} disabled={loadingMore}
                    className="flex items-center justify-center gap-2 text-xs py-3 rounded-lg border border-dashed transition-all disabled:opacity-50"
                    style={{ color: "var(--fg-muted)", borderColor: "var(--border)" }}>
                    {loadingMore ? <Loader2 size={12} className="animate-spin" /> : null}
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* COMMITS TAB */}
        {mainTab === "commits" && (
          <div className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto">
            <CommitsViewer project={project} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t px-5 py-2 flex items-center justify-center" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <p className="text-[11px]" style={{ color: "var(--fg-faint)" }}>
          Made with ♥ by <span className="font-medium" style={{ color: "var(--fg)" }}>Nebiou</span>
        </p>
      </footer>
    </div>
  );
}

function IssueCard({ issue, expanded, onToggleComments }: {
  issue: GHIssue;
  expanded: GHComment[] | "loading" | undefined;
  onToggleComments: () => void;
}) {
  const [showAllComments, setShowAllComments] = useState(false);

  useEffect(() => {
    if (!expanded) setShowAllComments(false);
  }, [expanded]);

  const isPR = !!issue.pull_request;
  const isMerged = isPR && !!issue.pull_request?.merged_at;
  const isOpen = issue.state === "open";

  const stateStyle = isMerged
    ? { bg: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "rgba(139,92,246,0.25)" }
    : isOpen
    ? { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" }
    : { bg: "rgba(239,68,68,0.08)", color: "#dc2626", border: "rgba(239,68,68,0.2)" };

  return (
    <div className="rounded-lg overflow-hidden transition-all"
      style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-strong)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5" style={{ color: stateStyle.color }}>
            {isPR ? <GitPullRequest size={13} /> : <CircleDot size={13} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0"
                style={{ background: stateStyle.bg, color: stateStyle.color, borderColor: stateStyle.border }}>
                {isMerged ? "Merged" : isOpen ? "Open" : "Closed"}
              </span>
              <a href={issue.html_url} target="_blank" rel="noopener noreferrer"
                className="text-xs font-medium flex-1 min-w-0 leading-snug hover:underline"
                style={{ color: "var(--fg)" }}>
                {issue.title}
              </a>
            </div>

            {issue.labels.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {issue.labels.map((label) => (
                  <span key={label.name} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border"
                    style={{ borderColor: `#${label.color}55`, background: `#${label.color}18`, color: `#${label.color}` }}>
                    <Tag size={8} />{label.name}
                  </span>
                ))}
              </div>
            )}

            {issue.body && (
              <div className="mt-2">
                <ExpandableText content={issue.body} maxHeight={120} />
              </div>
            )}

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--fg-muted)" }}>
                <img src={issue.user.avatar_url} alt={issue.user.login} className="w-4 h-4 rounded-full shrink-0" />
                {issue.user.login}
              </span>
              <span className="text-[11px]" style={{ color: "var(--fg-faint)" }}>#{issue.number}</span>
              <span className="text-[11px]" style={{ color: "var(--fg-faint)" }}>{timeAgo(issue.created_at)}</span>
            </div>
          </div>
        </div>

        {issue.comments > 0 && (
          <button onClick={onToggleComments}
            className="flex items-center gap-1.5 text-[11px] mt-3 ml-5 transition-colors"
            style={{ color: "var(--fg-faint)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--fg)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--fg-faint)")}>
            <MessageCircle size={11} />
            {issue.comments} comment{issue.comments !== 1 ? "s" : ""}
            {expanded === "loading" ? <Loader2 size={10} className="animate-spin ml-0.5" />
              : expanded ? <ChevronUp size={11} />
              : <ChevronDown size={11} />}
          </button>
        )}
      </div>

      {expanded && expanded !== "loading" && expanded.length > 0 && (
        <div className="border-t px-4 py-3 flex flex-col gap-3"
          style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
          {(showAllComments ? expanded : expanded.slice(0, 3)).map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <img src={comment.user.avatar_url} alt={comment.user.login} className="w-5 h-5 rounded-full shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-medium" style={{ color: "var(--fg)" }}>{comment.user.login}</span>
                  <span className="text-[11px]" style={{ color: "var(--fg-faint)" }}>{timeAgo(comment.created_at)}</span>
                  <a href={comment.html_url} target="_blank" rel="noopener noreferrer"
                    className="transition-colors" style={{ color: "var(--border-strong)" }}>
                    <ExternalLink size={9} />
                  </a>
                </div>
                <div className="mt-1">
                  <ExpandableText content={comment.body} maxHeight={150} />
                </div>
              </div>
            </div>
          ))}
          {!showAllComments && expanded.length > 3 && (
            <button 
              onClick={() => setShowAllComments(true)}
              className="self-start text-[11px] font-medium transition-colors hover:underline mt-1"
              style={{ color: "var(--accent)" }}
            >
              View {expanded.length - 3} more comment{expanded.length - 3 !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
