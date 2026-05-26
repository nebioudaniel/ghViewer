export interface GHRepo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  private: boolean;
  html_url: string;
  owner: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
}

export interface GHLabel {
  name: string;
  color: string;
}

export interface GHUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GHIssue {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: GHLabel[];
  user: GHUser;
  created_at: string;
  updated_at: string;
  comments: number;
  html_url: string;
  pull_request?: { merged_at: string | null; html_url: string };
}

export interface GHComment {
  id: number;
  user: GHUser;
  body: string;
  created_at: string;
  html_url: string;
}

export interface Project {
  id: string;
  name: string;
  owner: string;
  repo: string;
  type: "public" | "private";
  token?: string;
  createdAt: number;
}

export interface GHTreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

export interface GHTree {
  sha: string;
  tree: GHTreeItem[];
  truncated: boolean;
}

export interface GHContent {
  name: string;
  path: string;
  content: string;
  encoding: string;
  size: number;
  html_url: string;
}

export interface GHCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  author: GHUser | null;
  html_url: string;
}

export interface GHBranch {
  name: string;
  commit: { sha: string };
}
