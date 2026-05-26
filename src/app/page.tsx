"use client";
import { useState, useEffect } from "react";
import { Project } from "@/lib/types";
import { getProjects, saveProject, deleteProject, generateId } from "@/lib/store";
import { parseRepoUrl, fetchRepo } from "@/lib/github";
import { useTheme } from "@/lib/theme";
import ProjectCard from "@/components/ProjectCard";
import RepoViewer from "@/components/RepoViewer";
import NewProjectModal from "@/components/NewProjectModal";
import { Plus, Layers, Sun, Moon, GitBranch } from "lucide-react";

export default function Home() {
  const { theme, toggle } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => { setProjects(getProjects()); }, []);

  async function handleCreate(data: { name: string; url: string; type: "public" | "private"; token?: string }) {
    setCreating(true);
    setCreateError("");
    const parsed = parseRepoUrl(data.url);
    if (!parsed) {
      setCreateError("Invalid GitHub URL. Try: https://github.com/owner/repo");
      setCreating(false);
      return;
    }
    try {
      await fetchRepo(parsed.owner, parsed.repo, data.token);
      const project: Project = {
        id: generateId(),
        name: data.name || parsed.owner + "/" + parsed.repo,
        owner: parsed.owner,
        repo: parsed.repo,
        type: data.type,
        token: data.token,
        createdAt: Date.now(),
      };
      saveProject(project);
      setProjects(getProjects());
      setShowModal(false);
      setActive(project);
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Failed to connect.");
    } finally {
      setCreating(false);
    }
  }

  function handleDelete(id: string) {
    deleteProject(id);
    setProjects(getProjects());
    if (active?.id === id) setActive(null);
  }

  if (active) return <RepoViewer project={active} onBack={() => setActive(null)} />;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
        <div className="flex items-center gap-2.5">
          <GitBranch size={15} style={{ color: "var(--fg)" }} />
          <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--fg)" }}>GH Viewer</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border"
            style={{ color: "var(--fg-faint)", borderColor: "var(--border)" }}>by Nebiou</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "var(--fg-faint)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--fg)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-muted)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--fg-faint)"; (e.currentTarget as HTMLElement).style.background = ""; }}>
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button onClick={() => { setShowModal(true); setCreateError(""); }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            <Plus size={12} /> New Project
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-10 h-10 rounded-xl border flex items-center justify-center mb-4"
              style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
              <Layers size={15} style={{ color: "var(--fg-faint)" }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>No projects yet</p>
            <p className="text-xs mb-5" style={{ color: "var(--fg-faint)" }}>
              Add a GitHub repo to browse code, issues & comments
            </p>
            <button onClick={() => { setShowModal(true); setCreateError(""); }}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
              <Plus size={12} /> Add your first project
            </button>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-5"
              style={{ color: "var(--fg-faint)" }}>
              Projects ({projects.length})
            </p>
            <div className="flex flex-col gap-2">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} onOpen={() => setActive(p)} onDelete={() => handleDelete(p.id)} />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t px-6 py-2.5 flex items-center justify-center backdrop-blur-sm"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <p className="text-[11px]" style={{ color: "var(--fg-faint)" }}>
          Made with ♥ by <span className="font-medium" style={{ color: "var(--fg)" }}>Nebiou</span>
          {" "}· Tokens stored in session memory only
        </p>
      </footer>

      {showModal && (
        <NewProjectModal onClose={() => setShowModal(false)} onCreate={handleCreate} loading={creating} error={createError} />
      )}
    </div>
  );
}
