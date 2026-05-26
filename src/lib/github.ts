import { GHRepo, GHIssue, GHComment } from "./types";

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim();
  const match = trimmed.match(/github\.com\/([^\/\s]+)\/([^\/\s\?#]+)/);
  if (match) return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  return null;
}

async function ghFetch<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com${path}`, { headers });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid token or unauthorized access.");
    if (res.status === 403) throw new Error("Rate limit exceeded or forbidden. Add a token to increase limits.");
    if (res.status === 404) throw new Error("Repository not found. Check the URL or your access permissions.");
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

export async function fetchRepo(owner: string, repo: string, token?: string): Promise<GHRepo> {
  return ghFetch<GHRepo>(`/repos/${owner}/${repo}`, token);
}

export async function fetchIssues(
  owner: string,
  repo: string,
  token?: string,
  state: "open" | "closed" | "all" = "all",
  page = 1
): Promise<GHIssue[]> {
  return ghFetch<GHIssue[]>(
    `/repos/${owner}/${repo}/issues?state=${state}&per_page=30&page=${page}&sort=created&direction=desc`,
    token
  );
}

export async function fetchComments(
  owner: string,
  repo: string,
  issueNumber: number,
  token?: string
): Promise<GHComment[]> {
  return ghFetch<GHComment[]>(
    `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    token
  );
}

import { GHTree, GHContent, GHCommit, GHBranch } from "./types";

export async function fetchBranches(owner: string, repo: string, token?: string): Promise<GHBranch[]> {
  return ghFetch<GHBranch[]>(`/repos/${owner}/${repo}/branches?per_page=30`, token);
}

export async function fetchTree(owner: string, repo: string, sha: string, token?: string): Promise<GHTree> {
  return ghFetch<GHTree>(`/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`, token);
}

export async function fetchFileContent(owner: string, repo: string, path: string, token?: string): Promise<GHContent> {
  return ghFetch<GHContent>(`/repos/${owner}/${repo}/contents/${path}`, token);
}

export async function fetchCommits(owner: string, repo: string, token?: string, page = 1): Promise<GHCommit[]> {
  return ghFetch<GHCommit[]>(`/repos/${owner}/${repo}/commits?per_page=30&page=${page}`, token);
}
