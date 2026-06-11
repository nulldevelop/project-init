import type { ProjectConfig } from "../types";

export function getPackageJson(config: ProjectConfig): string {
  const isNext = config.framework === "nextjs";
  const isTS = config.language === "typescript";
  const hasPrisma = config.orm === "prisma";
  const hasDrizzle = config.orm === "drizzle";
  const hasUILib =
    config.uiLibraries.includes("shadcn") ||
    config.uiLibraries.includes("magic-ui") ||
    config.uiLibraries.includes("kibo-ui");

  const scripts: Record<string, string> = {};
  if (isNext) {
    scripts.dev = "next dev";
    scripts.build = "next build";
    scripts.start = "next start";
  } else {
    scripts.dev = "vite";
    scripts.build = isTS ? "tsc -b && vite build" : "vite build";
    scripts.preview = "vite preview";
  }
  scripts.lint = "biome check .";
  scripts.format = "biome format --write .";
  if (isTS) scripts.typecheck = "tsc --noEmit";
  if (hasPrisma) {
    scripts["db:generate"] = "prisma generate";
    scripts["db:migrate"] = "prisma migrate dev";
    scripts["db:push"] = "prisma db push";
    scripts["db:studio"] = "prisma studio";
  }
  if (hasDrizzle) {
    scripts["db:generate"] = "drizzle-kit generate";
    scripts["db:migrate"] = "drizzle-kit migrate";
    scripts["db:push"] = "drizzle-kit push";
    scripts["db:studio"] = "drizzle-kit studio";
  }

  const deps: Record<string, string> = {};
  const devDeps: Record<string, string> = {};

  if (isNext) deps.next = "^15.2.0";
  deps.react = "^19.0.0";
  deps["react-dom"] = "^19.0.0";

  if (config.tailwind) {
    devDeps.tailwindcss = "^4.0.0";
    if (isNext) devDeps["@tailwindcss/postcss"] = "^4.0.0";
    else devDeps["@tailwindcss/vite"] = "^4.0.0";
  }

  if (hasUILib) {
    deps["class-variance-authority"] = "^0.7.1";
    deps.clsx = "^2.1.1";
    deps["tailwind-merge"] = "^2.6.0";
    deps["lucide-react"] = "^0.468.0";
  }
  if (config.uiLibraries.includes("magic-ui")) deps.motion = "^11.15.0";

  if (hasPrisma) {
    deps["@prisma/client"] = "^6.0.0";
    devDeps.prisma = "^6.0.0";
  }
  if (hasDrizzle) {
    deps["drizzle-orm"] = "^0.38.0";
    devDeps["drizzle-kit"] = "^0.29.0";
    if (config.database === "mysql") deps.mysql2 = "^3.11.0";
    if (config.database === "postgresql") {
      deps.pg = "^8.13.0";
      if (isTS) devDeps["@types/pg"] = "^8.6.0";
    }
  }

  if (config.auth === "better-auth") deps["better-auth"] = "^1.2.0";
  if (config.auth === "next-auth") deps["next-auth"] = "^5.0.0-beta.25";

  if (config.extras.includes("stripe")) deps.stripe = "^17.0.0";
  if (config.extras.includes("resend")) deps.resend = "^4.0.0";

  devDeps["@biomejs/biome"] = "^1.9.4";
  if (isTS) {
    devDeps["@types/node"] = "^22";
    devDeps["@types/react"] = "^19";
    devDeps["@types/react-dom"] = "^19";
    devDeps.typescript = "^5";
  }
  if (!isNext) {
    devDeps.vite = "^6.0.0";
    devDeps["@vitejs/plugin-react"] = "^4.3.0";
  }

  return JSON.stringify(
    { name: config.name, version: "0.1.0", private: true, scripts, dependencies: deps, devDependencies: devDeps },
    null,
    2
  );
}

export function getTsConfig(config: ProjectConfig): string {
  if (config.framework === "nextjs") {
    return JSON.stringify(
      {
        compilerOptions: {
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./src/*"] },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"],
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      files: [],
      references: [{ path: "./tsconfig.app.json" }, { path: "./tsconfig.node.json" }],
    },
    null,
    2
  );
}

export function getTsConfigApp(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        tsBuildInfoFile: "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: "force",
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedSideEffectImports: true,
        paths: { "@/*": ["./src/*"] },
      },
      include: ["src"],
    },
    null,
    2
  );
}

export function getTsConfigNode(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        tsBuildInfoFile: "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
        target: "ES2022",
        lib: ["ES2023"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: "force",
        noEmit: true,
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedSideEffectImports: true,
      },
      include: ["vite.config.ts"],
    },
    null,
    2
  );
}

export function getBiomeJson(): string {
  return JSON.stringify(
    {
      $schema: "https://biomejs.dev/schemas/1.9.4/schema.json",
      vcs: { enabled: true, clientKind: "git", useIgnoreFile: true },
      files: { ignoreUnknown: false, ignore: [] },
      formatter: { enabled: true, indentStyle: "space", indentWidth: 2 },
      organizeImports: { enabled: true },
      linter: { enabled: true, rules: { recommended: true } },
      javascript: { formatter: { quoteStyle: "double" } },
    },
    null,
    2
  );
}

export function getNextConfig(isTS: boolean): string {
  const ext = isTS ? "ts" : "js";
  if (isTS) {
    return `import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {};\n\nexport default nextConfig;\n`;
  }
  return `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\n\nexport default nextConfig;\n`;
}

export function getViteConfig(config: ProjectConfig): string {
  const isTS = config.language === "typescript";
  const hasTailwind = config.tailwind;
  const imports = [`import { defineConfig } from "vite"`, `import react from "@vitejs/plugin-react"`];
  const plugins = ["react()"];
  if (hasTailwind) {
    imports.push(`import tailwindcss from "@tailwindcss/vite"`);
    plugins.push("tailwindcss()");
  }
  return `${imports.join(";\n")};\n\nexport default defineConfig({\n  plugins: [\n    ${plugins.join(",\n    ")},\n  ],\n  resolve: {\n    alias: {\n      "@": "/src",\n    },\n  },\n});\n`;
}

export function getNextLayout(config: ProjectConfig): string {
  const isTS = config.language === "typescript";
  const hasGoogle = true;
  return `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata${isTS ? ": Metadata" : ""} = {
  title: "${config.name}",
  description: "Generated by Project Initializr",
};

export default function RootLayout({
  children,
}${isTS ? ': Readonly<{ children: React.ReactNode }>' : ""}) {
  return (
    <html lang="pt-BR" className={\`\${geistSans.variable} \${geistMono.variable} antialiased\`}>
      <body>{children}</body>
    </html>
  );
}
`;
}

export function getNextPage(config: ProjectConfig): string {
  return `export default function Page() {
  return (
    <main>
      <h1>${config.name}</h1>
    </main>
  );
}
`;
}

export function getViteMain(config: ProjectConfig): string {
  const isTS = config.language === "typescript";
  return `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
${config.tailwind ? `import "./index.css";\n` : ""}import App from "./App";

createRoot(document.getElementById("root")${isTS ? "!" : ""}).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;
}

export function getViteApp(config: ProjectConfig): string {
  return `export default function App() {
  return (
    <main>
      <h1>${config.name}</h1>
    </main>
  );
}
`;
}

export function getViteHtml(config: ProjectConfig): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main${config.language === "typescript" ? ".tsx" : ".jsx"}"></script>
  </body>
</html>
`;
}

export function getGitignore(): string {
  return `# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# next.js
/.next/
/out/

# vite
/dist/

# production
/build

# env files
.env
.env.*
!.env.example
!.env.local.example

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
prisma/dev.db
prisma/dev.db-journal
`;
}
