import type { ProjectConfig } from "../types";

export function getZedSettings(): string {
  return JSON.stringify(
    {
      tab_size: 2,
      formatter: "language_server",
      format_on_save: "on",
      languages: {
        TypeScript: {
          formatter: {
            external: {
              command: "biome",
              arguments: ["format", "--write", "--stdin-file-path", "{buffer_path}"],
            },
          },
        },
        JavaScript: {
          formatter: {
            external: {
              command: "biome",
              arguments: ["format", "--write", "--stdin-file-path", "{buffer_path}"],
            },
          },
        },
      },
      "symbols.folders.associations": {
        _components: "folder-layout",
        _actions: "folder-redux-actions",
        "_data-access": "folder-database",
        components: "folder-layout",
        hooks: "folder-providers",
        lib: "folder-core",
        utils: "folder-utils",
        prisma: "folder-prisma",
        "(private)": "folder-lock",
        "(public)": "folder-public",
        api: "folder-router",
        drizzle: "folder-database",
      },
    },
    null,
    2
  );
}

export function getVscodeSettings(): string {
  return JSON.stringify(
    {
      "editor.formatOnSave": true,
      "editor.defaultFormatter": "biomejs.biome",
      "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
      "[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
      "[javascript]": { "editor.defaultFormatter": "biomejs.biome" },
      "[javascriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
      "[json]": { "editor.defaultFormatter": "biomejs.biome" },
      "editor.codeActionsOnSave": { "source.organizeImports.biome": "explicit" },
      "symbols.folders.associations": {
        _components: "folder-layout",
        _actions: "folder-redux-actions",
        "_data-access": "folder-database",
        components: "folder-layout",
        hooks: "folder-providers",
        lib: "folder-core",
        utils: "folder-utils",
        prisma: "folder-prisma",
        "(private)": "folder-lock",
        "(public)": "folder-public",
        api: "folder-router",
        drizzle: "folder-database",
      },
    },
    null,
    2
  );
}

export function getVscodeExtensions(): string {
  return JSON.stringify(
    {
      recommendations: [
        "biomejs.biome",
        "bradlc.vscode-tailwindcss",
        "prisma.prisma",
        "symbols.symbols",
      ],
    },
    null,
    2
  );
}
