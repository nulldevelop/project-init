"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { OptionTile } from "@/components/option-tile";
import { SectionCard } from "@/components/section-card";
import { cn } from "@/lib/utils";
import type {
  Auth,
  Database,
  Deploy,
  Editor,
  Extra,
  Framework,
  Language,
  Orm,
  PackageManager,
  ProjectConfig,
  UILibrary,
} from "@/lib/generator/types";

const defaultConfig: ProjectConfig = {
  name: "my-app",
  framework: "nextjs",
  language: "typescript",
  packageManager: "pnpm",
  tailwind: true,
  uiLibraries: [],
  database: "mysql",
  orm: "prisma",
  auth: "better-auth",
  deploy: "vercel",
  editor: "zed",
  extras: [],
};

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            value === opt.value
              ? "bg-zinc-100 text-zinc-900"
              : "text-zinc-400 hover:text-zinc-100"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function Page() {
  const [config, setConfig] = useState<ProjectConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function setFramework(f: Framework) {
    setConfig((prev) => ({
      ...prev,
      framework: f,
      auth: f === "react-vite" && prev.auth === "next-auth" ? "none" : prev.auth,
      deploy: f === "react-vite" && prev.deploy === "iis" ? "none" : prev.deploy,
    }));
  }

  function setDatabase(db: Database) {
    setConfig((prev) => ({
      ...prev,
      database: db,
      orm: db === "none" ? "none" : prev.orm === "none" ? "prisma" : prev.orm,
    }));
  }

  function setTailwind(on: boolean) {
    setConfig((prev) => ({
      ...prev,
      tailwind: on,
      uiLibraries: on ? prev.uiLibraries : [],
    }));
  }

  function toggleUILibrary(lib: UILibrary) {
    setConfig((prev) => {
      const has = prev.uiLibraries.includes(lib);
      if (has) return { ...prev, uiLibraries: prev.uiLibraries.filter((l) => l !== lib) };
      const next = [...prev.uiLibraries, lib];
      // magic-ui and kibo-ui require shadcn as base
      if ((lib === "magic-ui" || lib === "kibo-ui") && !next.includes("shadcn")) {
        next.unshift("shadcn");
      }
      return { ...prev, uiLibraries: next };
    });
  }

  function toggleExtra(extra: Extra) {
    setConfig((prev) => ({
      ...prev,
      extras: prev.extras.includes(extra)
        ? prev.extras.filter((e) => e !== extra)
        : [...prev.extras, extra],
    }));
  }

  async function handleGenerate() {
    if (!config.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config.name}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao gerar o projeto. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const isVite = config.framework === "react-vite";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div>
            <span className="text-sm font-semibold tracking-tight">Project Initializr</span>
            <span className="ml-3 text-xs text-zinc-500">Geração de projetos web</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="sticky top-[49px] h-[calc(100vh-49px)] w-72 shrink-0 overflow-y-auto border-r border-zinc-800 p-5">
          <div className="space-y-5">
            {/* Project name */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Project</p>
              <input
                type="text"
                value={config.name}
                onChange={(e) => update("name", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="my-app"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Framework */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Framework</p>
              <ToggleGroup
                options={[
                  { value: "nextjs" as Framework, label: "Next.js" },
                  { value: "react-vite" as Framework, label: "React + Vite" },
                ]}
                value={config.framework}
                onChange={setFramework}
              />
            </div>

            {/* Language */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Language</p>
              <ToggleGroup
                options={[
                  { value: "typescript" as Language, label: "TypeScript" },
                  { value: "javascript" as Language, label: "JavaScript" },
                ]}
                value={config.language}
                onChange={(v) => update("language", v)}
              />
            </div>

            {/* Package manager */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Package manager</p>
              <ToggleGroup
                options={[
                  { value: "pnpm" as PackageManager, label: "pnpm" },
                  { value: "npm" as PackageManager, label: "npm" },
                  { value: "yarn" as PackageManager, label: "yarn" },
                ]}
                value={config.packageManager}
                onChange={(v) => update("packageManager", v)}
              />
            </div>

            <div className="border-t border-zinc-800" />

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !config.name.trim()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Baixar .zip
                </>
              )}
            </button>

            <p className="text-center text-xs text-zinc-600">
              Arquivo .zip com o projeto configurado
            </p>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 space-y-4 p-6">
          {/* Styling */}
          <SectionCard title="Styling" description="Estilização e componentes de UI">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs text-zinc-500">Tailwind CSS</p>
                <div className="grid grid-cols-2 gap-2">
                  <OptionTile
                    icon="🎨"
                    label="Sim"
                    description="Utilitários CSS prontos"
                    selected={config.tailwind}
                    onClick={() => setTailwind(true)}
                  />
                  <OptionTile
                    icon="🚫"
                    label="Não"
                    description="CSS padrão"
                    selected={!config.tailwind}
                    onClick={() => setTailwind(false)}
                  />
                </div>
              </div>

              {config.tailwind && (
                <div>
                  <p className="mb-2 text-xs text-zinc-500">UI Components <span className="text-zinc-700">— multi-seleção</span></p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(
                      [
                        { value: "shadcn", icon: "◼", label: "shadcn/ui", description: "Copy-paste components" },
                        { value: "magic-ui", icon: "✨", label: "Magic UI", description: "Componentes animados" },
                        { value: "kibo-ui", icon: "🧱", label: "Kibo UI", description: "UI baseado em shadcn" },
                      ] as { value: UILibrary; icon: string; label: string; description: string }[]
                    ).map((opt) => (
                      <OptionTile
                        key={opt.value}
                        icon={opt.icon}
                        label={opt.label}
                        description={opt.description}
                        selected={config.uiLibraries.includes(opt.value)}
                        onClick={() => toggleUILibrary(opt.value)}
                      />
                    ))}
                  </div>
                  {(config.uiLibraries.includes("magic-ui") || config.uiLibraries.includes("kibo-ui")) && (
                    <p className="mt-2 text-xs text-zinc-600">shadcn/ui incluído automaticamente como base</p>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Data */}
          <SectionCard title="Data" description="Banco de dados e ORM">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs text-zinc-500">Database</p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "mysql", icon: "🐬", label: "MySQL", description: "MariaDB / MySQL" },
                      { value: "postgresql", icon: "🐘", label: "PostgreSQL", description: "Banco relacional robusto" },
                      { value: "none", icon: "🚫", label: "Nenhum", description: "Sem persistência" },
                    ] as { value: Database; icon: string; label: string; description: string }[]
                  ).map((opt) => (
                    <OptionTile
                      key={opt.value}
                      icon={opt.icon}
                      label={opt.label}
                      description={opt.description}
                      selected={config.database === opt.value}
                      onClick={() => setDatabase(opt.value)}
                    />
                  ))}
                </div>
              </div>

              {config.database !== "none" && (
                <div>
                  <p className="mb-2 text-xs text-zinc-500">ORM</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: "prisma", icon: "◭", label: "Prisma", description: "Schema declarativo" },
                        { value: "drizzle", icon: "💧", label: "Drizzle", description: "Leve e type-safe" },
                        { value: "none", icon: "🚫", label: "Nenhum", description: "Sem ORM" },
                      ] as { value: Orm; icon: string; label: string; description: string }[]
                    ).map((opt) => (
                      <OptionTile
                        key={opt.value}
                        icon={opt.icon}
                        label={opt.label}
                        description={opt.description}
                        selected={config.orm === opt.value}
                        onClick={() => update("orm", opt.value)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Auth */}
          <SectionCard title="Auth" description="Autenticação e gerenciamento de sessão">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "better-auth", icon: "🔐", label: "Better Auth", description: "Auth moderno para Next.js", disabledFor: [] },
                  { value: "next-auth", icon: "🔒", label: "NextAuth", description: "Auth para Next.js (v5)", disabledFor: ["react-vite"] },
                  { value: "none", icon: "🚫", label: "Nenhum", description: "Sem autenticação", disabledFor: [] },
                ] as { value: Auth; icon: string; label: string; description: string; disabledFor: Framework[] }[]
              ).map((opt) => (
                <OptionTile
                  key={opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.description}
                  selected={config.auth === opt.value}
                  disabled={opt.disabledFor.includes(config.framework)}
                  onClick={() => update("auth", opt.value)}
                />
              ))}
            </div>
          </SectionCard>

          {/* Editor */}
          <SectionCard title="Editor" description="Configuração do editor de código">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "zed", icon: "⚡", label: "Zed", description: ".zed/settings.json" },
                  { value: "vscode", icon: "🔷", label: "VS Code", description: ".vscode/settings.json" },
                  { value: "none", icon: "🚫", label: "Nenhum", description: "Sem config de editor" },
                ] as { value: Editor; icon: string; label: string; description: string }[]
              ).map((opt) => (
                <OptionTile
                  key={opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.description}
                  selected={config.editor === opt.value}
                  onClick={() => update("editor", opt.value)}
                />
              ))}
            </div>
          </SectionCard>

          {/* Deploy */}
          <SectionCard title="Deploy" description="Infraestrutura e configuração de deploy">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  { value: "vercel", icon: "▲", label: "Vercel", description: "Zero config, zero ops", disabledFor: [] },
                  { value: "hostinger", icon: "🌐", label: "Hostinger", description: "PM2 + Nginx", disabledFor: [] },
                  { value: "iis", icon: "🪟", label: "IIS", description: "Windows Server + iisnode", disabledFor: ["react-vite"] },
                  { value: "none", icon: "🚫", label: "Nenhum", description: "Sem config de deploy", disabledFor: [] },
                ] as { value: Deploy; icon: string; label: string; description: string; disabledFor: Framework[] }[]
              ).map((opt) => (
                <OptionTile
                  key={opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.description}
                  selected={config.deploy === opt.value}
                  disabled={opt.disabledFor.includes(config.framework)}
                  onClick={() => update("deploy", opt.value)}
                />
              ))}
            </div>
          </SectionCard>

          {/* Extras */}
          <SectionCard title="Extras" description="Dependências e integrações adicionais — multi-seleção">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  { value: "docker", icon: "🐳", label: "Docker", description: "Dockerfile + compose" },
                  { value: "github-actions", icon: "⚙️", label: "GitHub Actions", description: "Pipeline de CI/CD" },
                  { value: "stripe", icon: "💳", label: "Stripe", description: "Pagamentos online" },
                  { value: "resend", icon: "📧", label: "Resend", description: "Envio de e-mails" },
                ] as { value: Extra; icon: string; label: string; description: string }[]
              ).map((opt) => (
                <OptionTile
                  key={opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.description}
                  selected={config.extras.includes(opt.value)}
                  onClick={() => toggleExtra(opt.value)}
                />
              ))}
            </div>
          </SectionCard>
        </main>
      </div>
    </div>
  );
}
