import JSZip from "jszip";
import type { ProjectConfig } from "./types";
import {
  getBiomeJson,
  getGitignore,
  getNextConfig,
  getNextLayout,
  getNextPage,
  getPackageJson,
  getTsConfig,
  getTsConfigApp,
  getTsConfigNode,
  getViteApp,
  getViteConfig,
  getViteHtml,
  getViteMain,
} from "./templates/base";
import { getComponentsJson, getGlobalsCss, getLibUtils, getPostcssConfig } from "./templates/styling";
import {
  getDrizzleConfig,
  getDrizzleIndex,
  getDrizzleSchema,
  getEnvExample,
  getPrismaClient,
  getPrismaSchema,
} from "./templates/database";
import {
  getBetterAuthClient,
  getBetterAuthRoute,
  getBetterAuthServer,
  getMiddleware,
  getNextAuthConfig,
  getNextAuthRoute,
} from "./templates/auth";
import { getEcosystemConfig, getNginxConf, getVercelJson, getWebConfig } from "./templates/deploy";
import {
  getDockerCompose,
  getDockerfile,
  getDockerignore,
  getGithubActionsWorkflow,
  getResendLib,
  getStripeLib,
} from "./templates/extras";
import { getVscodeExtensions, getVscodeSettings, getZedSettings } from "./templates/editor";

type FileMap = Record<string, string>;

export async function generateProject(config: ProjectConfig): Promise<Buffer> {
  const files: FileMap = {};
  const isNext = config.framework === "nextjs";
  const isTS = config.language === "typescript";
  const srcExt = isTS ? "ts" : "js";
  const tsxExt = isTS ? "tsx" : "jsx";

  // Base files
  files["package.json"] = getPackageJson(config);
  files["biome.json"] = getBiomeJson();
  files[".gitignore"] = getGitignore();
  files[".env.local.example"] = getEnvExample(config);

  if (isTS) {
    files["tsconfig.json"] = getTsConfig(config);
    if (!isNext) {
      files["tsconfig.app.json"] = getTsConfigApp();
      files["tsconfig.node.json"] = getTsConfigNode();
    }
  }

  if (isNext) {
    files[`next.config.${srcExt}`] = getNextConfig(isTS);
    if (config.tailwind) files["postcss.config.mjs"] = getPostcssConfig();
    files[`src/app/layout.${tsxExt}`] = getNextLayout(config);
    files[`src/app/page.${tsxExt}`] = getNextPage(config);
    files["src/app/globals.css"] = getGlobalsCss(config);
  } else {
    files[`vite.config.${srcExt}`] = getViteConfig(config);
    files["index.html"] = getViteHtml(config);
    files[`src/main.${tsxExt}`] = getViteMain(config);
    files[`src/App.${tsxExt}`] = getViteApp(config);
    if (config.tailwind) files["src/index.css"] = getGlobalsCss(config);
  }

  // Styling
  const componentsJson = getComponentsJson(config);
  if (componentsJson) files["components.json"] = componentsJson;

  const hasUILib =
    config.uiLibraries.includes("shadcn") ||
    config.uiLibraries.includes("magic-ui") ||
    config.uiLibraries.includes("kibo-ui");
  if (hasUILib) {
    files[`src/lib/utils.${srcExt}`] = getLibUtils(isTS);
  }

  // Database
  const prismaSchema = getPrismaSchema(config);
  if (prismaSchema) files["prisma/schema.prisma"] = prismaSchema;

  const prismaClient = getPrismaClient(isTS);
  if (config.orm === "prisma" && prismaClient) files[`src/lib/prisma.${srcExt}`] = prismaClient;

  const drizzleSchema = getDrizzleSchema(config);
  if (drizzleSchema) files[`src/drizzle/schema.${srcExt}`] = drizzleSchema;

  const drizzleIndex = getDrizzleIndex(config);
  if (drizzleIndex) files[`src/drizzle/index.${srcExt}`] = drizzleIndex;

  const drizzleConfig = getDrizzleConfig(config);
  if (drizzleConfig) files[`drizzle.config.${srcExt}`] = drizzleConfig;

  // Auth
  const betterAuthServer = getBetterAuthServer(config);
  if (betterAuthServer) files[`src/lib/auth.${srcExt}`] = betterAuthServer;

  const betterAuthClient = getBetterAuthClient();
  if (config.auth === "better-auth") files[`src/lib/auth-client.${srcExt}`] = betterAuthClient!;

  if (config.auth === "better-auth" && isNext) {
    const route = getBetterAuthRoute();
    if (route) files[`src/app/api/auth/[...all]/route.${srcExt}`] = route;
  }

  const nextAuthConfig = getNextAuthConfig(config);
  if (nextAuthConfig) files[`src/lib/auth.${srcExt}`] = nextAuthConfig;

  if (config.auth === "next-auth" && isNext) {
    const route = getNextAuthRoute();
    if (route) files[`src/app/api/auth/[...nextauth]/route.${srcExt}`] = route;
  }

  const middleware = getMiddleware(config);
  if (middleware) files[`src/middleware.${srcExt}`] = middleware;

  // Deploy
  if (config.deploy === "vercel") files["vercel.json"] = getVercelJson();
  if (config.deploy === "hostinger") {
    files["ecosystem.config.js"] = getEcosystemConfig(config);
    files["nginx.conf.example"] = getNginxConf(config);
  }
  if (config.deploy === "iis") files["web.config"] = getWebConfig(config);

  // Extras
  if (config.extras.includes("docker")) {
    files["Dockerfile"] = getDockerfile(config);
    files["docker-compose.yml"] = getDockerCompose(config);
    files[".dockerignore"] = getDockerignore();
  }

  if (config.extras.includes("github-actions")) {
    files[".github/workflows/deploy.yml"] = getGithubActionsWorkflow(config);
  }

  if (config.extras.includes("stripe")) {
    files[`src/lib/stripe.${srcExt}`] = getStripeLib(isTS);
  }

  if (config.extras.includes("resend")) {
    files[`src/lib/resend.${srcExt}`] = getResendLib(isTS);
  }

  // Editor
  if (config.editor === "zed") {
    files[".zed/settings.json"] = getZedSettings();
  }
  if (config.editor === "vscode") {
    files[".vscode/settings.json"] = getVscodeSettings();
    files[".vscode/extensions.json"] = getVscodeExtensions();
  }

  // Build zip
  const zip = new JSZip();
  const folder = zip.folder(config.name)!;
  for (const [path, content] of Object.entries(files)) {
    folder.file(path, content);
  }

  return zip.generateAsync({ type: "nodebuffer" });
}
