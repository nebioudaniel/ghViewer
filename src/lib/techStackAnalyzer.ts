import { fetchFileContent } from "./github";

export interface TechStack {
  name: string;
  icon?: string;
  color?: string;
}

const KNOWN_TECHS: Record<string, { name: string; color: string }> = {
  react: { name: "React", color: "#61DAFB" },
  "react-dom": { name: "React DOM", color: "#61DAFB" },
  next: { name: "Next.js", color: "#000000" },
  vue: { name: "Vue.js", color: "#4FC08D" },
  svelte: { name: "Svelte", color: "#FF3E00" },
  angular: { name: "Angular", color: "#DD0031" },
  tailwindcss: { name: "Tailwind CSS", color: "#06B6D4" },
  prisma: { name: "Prisma", color: "#2D3748" },
  express: { name: "Express", color: "#000000" },
  "framer-motion": { name: "Framer Motion", color: "#0055FF" },
  typescript: { name: "TypeScript", color: "#3178C6" },
  jest: { name: "Jest", color: "#C21325" },
  vitest: { name: "Vitest", color: "#FCC72B" },
};

export async function analyzeTechStack(
  owner: string,
  repo: string,
  token?: string
): Promise<TechStack[]> {
  const stack: TechStack[] = [];

  try {
    const pkgJsonNode = await fetchFileContent(owner, repo, "package.json", token);
    const decoded = pkgJsonNode.encoding === "base64" 
      ? atob(pkgJsonNode.content.replace(/\n/g, "")) 
      : pkgJsonNode.content;
    const pkg = JSON.parse(decoded);

    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const key of Object.keys(deps)) {
      if (KNOWN_TECHS[key]) {
        stack.push(KNOWN_TECHS[key]);
      }
    }
  } catch (e) {
    // No package.json or failed to parse
  }

  // Remove duplicates
  const uniqueStack = Array.from(new Map(stack.map((item) => [item.name, item])).values());
  return uniqueStack;
}
