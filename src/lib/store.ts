"use client";
import { Project } from "./types";

const KEY = "ghviewer_projects";

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveProject(project: Project): void {
  const existing = getProjects().filter((p) => p.id !== project.id);
  localStorage.setItem(KEY, JSON.stringify([project, ...existing]));
}

export function deleteProject(id: string): void {
  const updated = getProjects().filter((p) => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(updated));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}
