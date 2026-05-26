"use client";
import { useState, useEffect } from "react";
import { GHTreeItem, GHContent, Project } from "@/lib/types";
import { fetchTree, fetchFileContent, fetchBranches } from "@/lib/github";
import {
  Folder, FolderOpen, File, FileCode, FileText, Image, ChevronRight,
  ChevronDown, Loader2, ExternalLink, Copy, Check, GitBranch, X, AlertCircle, Search
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props { project: Project; defaultBranch: string }

type TreeNode = { name: string; path: string; type: "blob" | "tree"; children?: TreeNode[]; size?: number }

function buildTree(items: GHTreeItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map: Record<string, TreeNode> = {};
  const sorted = [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });
  for (const item of sorted) {
    const parts = item.path.split("/");
    const node: TreeNode = { name: parts[parts.length - 1], path: item.path, type: item.type, size: item.size, children: item.type === "tree" ? [] : undefined };
    map[item.path] = node;
    if (parts.length === 1) { root.push(node); }
    else {
      const parentPath = parts.slice(0, -1).join("/");
      if (map[parentPath]) map[parentPath].children?.push(node);
    }
  }
  return root;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const codeExts = ["ts", "tsx", "js", "jsx", "py", "go", "rs", "java", "cpp", "c", "cs", "rb", "php", "swift", "kt", "sh", "bash", "zsh", "fish", "html", "css", "scss", "sass", "less", "vue", "svelte", "json", "yaml", "yml", "toml", "xml", "sql", "graphql", "prisma", "env"];
  const imgExts = ["png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "bmp"];
  if (codeExts.includes(ext)) return FileCode;
  if (imgExts.includes(ext)) return Image;
  return FileText;
}

function getLang(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", go: "go", rs: "rust", java: "java", cpp: "cpp", c: "c",
    cs: "csharp", rb: "ruby", php: "php", swift: "swift", kt: "kotlin",
    sh: "bash", bash: "bash", html: "html", css: "css", scss: "scss",
    json: "json", yaml: "yaml", yml: "yaml", toml: "toml", md: "markdown",
    sql: "sql", graphql: "graphql", prisma: "prisma", xml: "xml",
  };
  return map[ext] || "text";
}

function TreeNodeRow({ node, depth, onSelect, selected }: {
  node: TreeNode; depth: number; onSelect: (n: TreeNode) => void; selected: string;
}) {
  const [open, setOpen] = useState(depth === 0);
  const isDir = node.type === "tree";
  const FileIcon = getFileIcon(node.name);
  const isSelected = selected === node.path;

  return (
    <div>
      <div
        onClick={() => { if (isDir) setOpen(!open); else onSelect(node); }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-[11px] transition-colors group ${
          isSelected
            ? "bg-[var(--accent)] text-[var(--accent-fg)]"
            : "hover:bg-[var(--bg-muted)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {isDir ? (
          <>
            {open ? <ChevronDown size={10} className="shrink-0 opacity-60" /> : <ChevronRight size={10} className="shrink-0 opacity-60" />}
            {open ? <FolderOpen size={12} className="shrink-0" /> : <Folder size={12} className="shrink-0" />}
          </>
        ) : (
          <>
            <span style={{ width: 10 }} />
            <FileIcon size={12} className="shrink-0" />
          </>
        )}
        <span className="truncate flex-1">{node.name}</span>
        {!isDir && node.size != null && (
          <span className={`text-[10px] shrink-0 ${isSelected ? "opacity-60" : "text-[var(--fg-faint)]"}`}>
            {node.size > 1024 ? `${(node.size / 1024).toFixed(1)}k` : `${node.size}b`}
          </span>
        )}
      </div>
      {isDir && open && node.children?.map((child) => (
        <TreeNodeRow key={child.path} node={child} depth={depth + 1} onSelect={onSelect} selected={selected} />
      ))}
    </div>
  );
}

function FileViewer({ content, name, url, onClose }: { content: GHContent; name: string; url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const decoded = content.encoding === "base64"
    ? atob(content.content.replace(/\n/g, ""))
    : content.content;
  const lines = decoded.split("\n");
  const lang = getLang(name);
  const isImage = ["png", "jpg", "jpeg", "gif", "svg", "ico", "webp"].includes(name.split(".").pop()?.toLowerCase() || "");

  function copy() {
    navigator.clipboard.writeText(decoded);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full">
      {/* File header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-subtle)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-medium text-[var(--fg)] truncate">{content.path}</span>
          <span className="text-[10px] text-[var(--fg-faint)] shrink-0">
            {lines.length} lines · {content.size > 1024 ? `${(content.size / 1024).toFixed(1)} KB` : `${content.size} B`}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={copy} className="p-1.5 rounded-md text-[var(--fg-faint)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition-colors" title="Copy">
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-[var(--fg-faint)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition-colors" title="Open on GitHub">
            <ExternalLink size={12} />
          </a>
          <button onClick={onClose} className="p-1.5 rounded-md text-[var(--fg-faint)] hover:text-[var(--fg)] hover:bg-[var(--bg-muted)] transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* File content */}
      <div className="flex-1 overflow-auto">
        {isImage ? (
          <div className="flex items-center justify-center p-8">
            <img src={`data:image/${name.split(".").pop()};base64,${content.content.replace(/\n/g, "")}`} alt={name} className="max-w-full max-h-96 object-contain rounded border border-[var(--border)]" />
          </div>
        ) : content.size > 200000 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={20} className="text-[var(--fg-faint)] mb-3" />
            <p className="text-xs text-[var(--fg-muted)]">File too large to preview</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--fg-muted)] underline mt-1">View on GitHub</a>
          </div>
        ) : (
          <div className="flex text-[11px]">
            {/* Code */}
            <div className="flex-1 overflow-x-auto text-[var(--fg)]">
              <SyntaxHighlighter
                language={lang}
                style={oneDark}
                showLineNumbers={true}
                customStyle={{ margin: 0, borderRadius: 0, background: "transparent", fontSize: "12px", lineHeight: "1.5" }}
              >
                {decoded}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CodeExplorer({ project, defaultBranch }: Props) {
  const [branches, setBranches] = useState<string[]>([]);
  const [branch, setBranch] = useState(defaultBranch);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState("");
  const [rawTree, setRawTree] = useState<GHTreeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [fileContent, setFileContent] = useState<GHContent | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    fetchBranches(project.owner, project.repo, project.token)
      .then((b) => setBranches(b.map((x) => x.name)))
      .catch(() => {});
  }, [project]);

  useEffect(() => {
    setLoadingTree(true);
    setTreeError("");
    setSelected(null);
    setFileContent(null);
    fetchTree(project.owner, project.repo, branch, project.token)
      .then((t) => {
        setRawTree(t.tree);
        setTree(buildTree(t.tree));
        const readme = t.tree.find(item => item.type === "blob" && item.path.toLowerCase() === "readme.md");
        if (readme) {
          handleSelect({ name: readme.path.split('/').pop() || "README.md", path: readme.path, type: "blob", size: readme.size });
        }
      })
      .catch((e) => setTreeError(e.message))
      .finally(() => setLoadingTree(false));
  }, [project, branch]);

  async function handleSelect(node: TreeNode) {
    setSelected(node);
    setFileContent(null);
    setFileError("");
    setLoadingFile(true);
    try {
      const c = await fetchFileContent(project.owner, project.repo, node.path, project.token);
      setFileContent(c);
    } catch (e: unknown) {
      setFileError(e instanceof Error ? e.message : "Failed to load file.");
    } finally {
      setLoadingFile(false);
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar tree */}
      <div className="w-56 shrink-0 border-r border-[var(--border)] flex flex-col overflow-hidden bg-[var(--bg-subtle)]">
        {/* Branch selector */}
        <div className="px-3 py-2.5 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--fg-muted)]">
            <GitBranch size={11} />
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="flex-1 bg-transparent text-[11px] text-[var(--fg)] outline-none cursor-pointer"
            >
              {branches.length === 0
                ? <option value={defaultBranch}>{defaultBranch}</option>
                : branches.map((b) => <option key={b} value={b}>{b}</option>)
              }
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="px-2 py-2 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-md focus-within:border-[var(--accent)] transition-colors">
            <Search size={12} className="text-[var(--fg-muted)] shrink-0" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[11px] text-[var(--fg)] outline-none placeholder-[var(--fg-faint)]"
            />
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto p-1.5">
          {loadingTree ? (
            <div className="flex justify-center py-8"><Loader2 size={14} className="animate-spin text-[var(--fg-faint)]" /></div>
          ) : treeError ? (
            <p className="text-[11px] text-red-500 px-2 py-2">{treeError}</p>
          ) : tree.length === 0 ? (
            <p className="text-[11px] text-[var(--fg-faint)] px-2 py-4 text-center">Empty repo</p>
          ) : searchQuery ? (
            rawTree
              .filter(item => item.type === "blob" && item.path.toLowerCase().includes(searchQuery.toLowerCase()))
              .slice(0, 50)
              .map(item => {
                const parts = item.path.split("/");
                const name = parts.pop()!;
                const node: TreeNode = { name, path: item.path, type: "blob", size: item.size };
                const isSelected = selected?.path === node.path;
                const FileIcon = getFileIcon(name);
                return (
                  <div
                    key={item.path}
                    onClick={() => handleSelect(node)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-[11px] transition-colors group ${
                      isSelected
                        ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                        : "hover:bg-[var(--bg-muted)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                    }`}
                  >
                    <FileIcon size={12} className="shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{name}</span>
                      {parts.length > 0 && <span className="text-[9px] truncate opacity-50">{parts.join("/")}</span>}
                    </div>
                  </div>
                );
              })
          ) : (
            tree.map((node) => (
              <TreeNodeRow key={node.path} node={node} depth={0} onSelect={handleSelect} selected={selected?.path || ""} />
            ))
          )}
        </div>
      </div>

      {/* File viewer */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[var(--bg)]">
        {loadingFile ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={16} className="animate-spin text-[var(--fg-faint)]" />
          </div>
        ) : fileError ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 max-w-sm">
              <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-red-600">{fileError}</p>
            </div>
          </div>
        ) : fileContent ? (
          <FileViewer content={fileContent} name={fileContent.name} url={fileContent.html_url} onClose={() => { setFileContent(null); setSelected(null); }} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-2">
            <File size={24} className="text-[var(--fg-faint)]" />
            <p className="text-xs text-[var(--fg-muted)]">Select a file to view its content</p>
            <p className="text-[11px] text-[var(--fg-faint)]">Browse the file tree on the left</p>
          </div>
        )}
      </div>
    </div>
  );
}
