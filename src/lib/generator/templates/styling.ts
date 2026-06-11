import type { ProjectConfig } from "../types";

export function getGlobalsCss(config: ProjectConfig): string {
  const hasTailwind = config.tailwind;
  const hasUILib =
    config.uiLibraries.includes("shadcn") ||
    config.uiLibraries.includes("magic-ui") ||
    config.uiLibraries.includes("kibo-ui");

  if (!hasTailwind) {
    return `* {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}\n\nbody {\n  font-family: system-ui, sans-serif;\n}\n`;
  }

  const cssVars = hasUILib
    ? `
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --radius: 0.625rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}

body {
  background-color: var(--background);
  color: var(--foreground);
}
`
    : `
body {
  background-color: #fff;
  color: #0a0a0a;
}
`;

  return `@import "tailwindcss";\n${cssVars}`;
}

export function getComponentsJson(config: ProjectConfig): string | null {
  if (!config.uiLibraries.includes("shadcn") && !config.uiLibraries.includes("magic-ui") && !config.uiLibraries.includes("kibo-ui")) {
    return null;
  }
  return JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema.json",
      style: "new-york",
      rsc: config.framework === "nextjs",
      tsx: config.language === "typescript",
      tailwind: {
        config: "",
        css: config.framework === "nextjs" ? "src/app/globals.css" : "src/index.css",
        baseColor: "zinc",
        cssVariables: true,
        prefix: "",
      },
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
        ui: "@/components/ui",
        lib: "@/lib",
        hooks: "@/hooks",
      },
      iconLibrary: "lucide",
    },
    null,
    2
  );
}

export function getLibUtils(isTS: boolean): string {
  if (isTS) {
    return `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
  }
  return `import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
`;
}

export function getPostcssConfig(): string {
  return `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`;
}
