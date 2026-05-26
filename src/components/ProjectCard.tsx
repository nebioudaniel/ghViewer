"use client";
import { Project } from "@/lib/types";
import { Lock, Globe, Trash2, ChevronRight } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface Props { project: Project; onOpen: () => void; onDelete: () => void }

export default function ProjectCard({ project, onOpen, onDelete }: Props) {
  return (
    <div className="group flex items-center justify-between rounded-lg px-4 py-3 transition-all cursor-pointer"
      style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}>
      <div className="flex items-center gap-3 min-w-0 flex-1" onClick={onOpen}>
        <div className="w-7 h-7 rounded-md border flex items-center justify-center shrink-0"
          style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
          {project.type === "private"
            ? <Lock size={11} style={{ color: "var(--fg-muted)" }} />
            : <Globe size={11} style={{ color: "var(--fg-muted)" }} />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: "var(--fg)" }}>{project.name}</p>
          <p className="text-[11px] truncate" style={{ color: "var(--fg-faint)" }}>
            {project.owner}/{project.repo} · {timeAgo(new Date(project.createdAt).toISOString())}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-3">
        <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium"
          style={{ color: "var(--fg-faint)", borderColor: "var(--border)", background: "var(--bg-muted)" }}>
          {project.type}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="ml-1 p-1 rounded text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 size={12} />
        </button>
        <button onClick={onOpen} className="p-1 rounded transition-colors" style={{ color: "var(--fg-faint)" }}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
