export type Framework = "nextjs" | "react-vite";
export type Language = "typescript" | "javascript";
export type PackageManager = "pnpm" | "npm" | "yarn";
export type Database = "mysql" | "postgresql" | "none";
export type Orm = "prisma" | "drizzle" | "none";
export type Auth = "better-auth" | "next-auth" | "none";
export type UILibrary = "shadcn" | "magic-ui" | "kibo-ui";
export type Deploy = "vercel" | "hostinger" | "iis" | "none";
export type Editor = "zed" | "vscode" | "none";
export type Extra = "docker" | "github-actions" | "stripe" | "resend";

export interface ProjectConfig {
  name: string;
  framework: Framework;
  language: Language;
  packageManager: PackageManager;
  tailwind: boolean;
  uiLibraries: UILibrary[];
  database: Database;
  orm: Orm;
  auth: Auth;
  deploy: Deploy;
  editor: Editor;
  extras: Extra[];
}
