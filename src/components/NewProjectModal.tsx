"use client";
import { useState } from "react";
import { X, Globe, Lock, Loader2, AlertCircle, Eye, EyeOff, HelpCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreate: (data: { name: string; url: string; type: "public" | "private"; token?: string }) => void;
  loading: boolean;
  error: string;
}

export default function NewProjectModal({ onClose, onCreate, loading, error }: Props) {
  const [type, setType] = useState<"public" | "private">("public");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  const inputStyle = {
    background: "var(--bg)",
    color: "var(--fg)",
    border: "1px solid var(--border)",
    outline: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 backdrop-blur-[2px]" style={{ background: "rgba(0,0,0,0.3)" }} onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>New Project</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-muted)" }}>Connect a GitHub repository</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md transition-colors"
            style={{ color: "var(--fg-faint)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-muted)"; (e.currentTarget as HTMLElement).style.color = "var(--fg)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--fg-faint)"; }}>
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Type */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-2" style={{ color: "var(--fg-muted)" }}>Repository Type</p>
            <div className="grid grid-cols-2 gap-2">
              {(["public", "private"] as const).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    border: type === t ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: type === t ? "var(--accent)" : "var(--bg-subtle)",
                    color: type === t ? "var(--accent-fg)" : "var(--fg-muted)",
                  }}>
                  {t === "public" ? <Globe size={12} /> : <Lock size={12} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-widest block mb-1.5" style={{ color: "var(--fg-muted)" }}>
              Repository URL
            </label>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full rounded-lg px-3 py-2 text-xs placeholder-[var(--fg-faint)] transition-colors"
              style={{ ...inputStyle }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--fg)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
          </div>

          {/* Name */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-widest block mb-1.5" style={{ color: "var(--fg-muted)" }}>
              Project Name <span className="normal-case" style={{ color: "var(--fg-faint)" }}>(optional)</span>
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. My Work Repo"
              className="w-full rounded-lg px-3 py-2 text-xs transition-colors"
              style={{ ...inputStyle }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--fg)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
          </div>

          {/* Token */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
                Personal Access Token{" "}
                <span className="normal-case" style={{ color: "var(--fg-faint)" }}>
                  ({type === "public" ? "optional" : "required"})
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowTokenHelp(!showTokenHelp)}
                className="flex items-center gap-1 text-[10px] transition-colors rounded-md px-1.5 py-0.5"
                style={{ color: "var(--fg-faint)", background: showTokenHelp ? "var(--bg-muted)" : "transparent" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--fg)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-muted)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = showTokenHelp ? "var(--fg)" : "var(--fg-faint)"; (e.currentTarget as HTMLElement).style.background = showTokenHelp ? "var(--bg-muted)" : "transparent"; }}
              >
                <HelpCircle size={10} /> How to get one?
                {showTokenHelp ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
              </button>
            </div>

            {/* Help Panel */}
            {showTokenHelp && (
              <div className="mb-2.5 rounded-lg px-3.5 py-3 text-[11px] leading-relaxed"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                <p className="font-semibold mb-2" style={{ color: "var(--fg)" }}>
                  {type === "public" ? "For public repos (optional but recommended)" : "For private repos (required)"}
                </p>
                <ol className="flex flex-col gap-1.5" style={{ color: "var(--fg-muted)" }}>
                  <li className="flex gap-2">
                    <span className="font-bold shrink-0" style={{ color: "var(--fg)" }}>1.</span>
                    Go to GitHub →{" "}
                    <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer"
                      className="underline flex items-center gap-0.5 shrink-0" style={{ color: "var(--accent)" }}>
                      Settings › Developer Settings › Tokens (classic) <ExternalLink size={9} />
                    </a>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold shrink-0" style={{ color: "var(--fg)" }}>2.</span>
                    <span>
                      {type === "public"
                        ? "Click \"Generate new token (classic)\". You don't need to check any scope boxes — just scroll down and click generate."
                        : "Click \"Generate new token (classic)\". Under \"Scopes\", check the repo box to grant full access to your private repositories."}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold shrink-0" style={{ color: "var(--fg)" }}>3.</span>
                    <span>Copy the <code className="px-1 rounded" style={{ background: "var(--bg-muted)" }}>ghp_...</code> token and paste it below. We never store it — it only lives in your browser tab.</span>
                  </li>
                </ol>
                {type === "public" && (
                  <p className="mt-2 pt-2" style={{ color: "var(--fg-faint)", borderTop: "1px solid var(--border)" }}>
                    Without a token you're limited to <strong style={{ color: "var(--fg-muted)" }}>60 requests/hour</strong>. Adding one bumps that to <strong style={{ color: "var(--fg-muted)" }}>5,000/hour</strong>.
                  </p>
                )}
              </div>
            )}

            <div className="relative">
              <input type={showToken ? "text" : "password"} value={token} onChange={e => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full rounded-lg px-3 py-2 pr-8 text-xs font-mono transition-colors"
                style={{ ...inputStyle }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--fg)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
              <button type="button" onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "var(--fg-faint)" }}>
                {showToken ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "var(--fg-faint)" }}>
              {type === "private" ? (
                <>Needs <code className="px-1 rounded text-[10px]" style={{ background: "var(--bg-muted)" }}>repo</code> scope.</>
              ) : (
                "Bypasses the 60 req/hour GitHub API limit."
              )}{" "}Never stored — session memory only.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg px-3 py-2.5"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-red-500">{error}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-md transition-colors"
            style={{ color: "var(--fg-muted)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-muted)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}>
            Cancel
          </button>
          <button onClick={() => onCreate({ name, url, type, token: token.trim() ? token.trim() : undefined })}
            disabled={loading || !url.trim() || (type === "private" && !token.trim())}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            {loading && <Loader2 size={11} className="animate-spin" />}
            {loading ? "Connecting..." : "Add Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
