"use client";

import { useState, useEffect } from "react";
import { Check, Copy, Download, Loader2, X } from "lucide-react";
import { ForgeIcon } from "@/components/forge-icon";
import { OptionTile } from "@/components/option-tile";
import { SectionCard, SubSection } from "@/components/section-card";
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

function DownloadToast({ name, pm, onClose }: { name: string; pm: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const command = `cd ${name} && ${pm} install`;

  useEffect(() => {
    const t = setTimeout(onClose, 12000);
    return () => clearTimeout(t);
  }, [onClose]);

  function handleCopy() {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed right-4 top-16 z-50 w-80 animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/15">
            <Check className="h-3.5 w-3.5 text-orange-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-100">Projeto gerado!</p>
            <p className="text-[11px] text-zinc-500">Instale as dependências para começar</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-zinc-600 transition-colors hover:text-zinc-400">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mx-4 mb-4 flex items-center justify-between gap-2 rounded-lg bg-zinc-950/80 px-3 py-2 ring-1 ring-zinc-800">
        <code className="font-mono text-[11px] text-orange-300">{command}</code>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "shrink-0 transition-colors",
            copied ? "text-orange-400" : "text-zinc-600 hover:text-zinc-300"
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

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

function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-md bg-zinc-900 p-0.5 ring-1 ring-zinc-800/60">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded px-2.5 py-1 text-[11px] font-medium transition-all",
            value === opt.value
              ? "bg-zinc-700/80 text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function getSummaryItems(config: ProjectConfig): string[] {
  const items: string[] = [];
  items.push(config.framework === "nextjs" ? "next.js" : "react+vite");
  items.push(config.language === "typescript" ? "ts" : "js");
  items.push(config.packageManager);
  if (config.tailwind) items.push("tailwind");
  config.uiLibraries.forEach((l) => items.push(l));
  if (config.database !== "none") items.push(config.database);
  if (config.orm !== "none") items.push(config.orm);
  if (config.auth !== "none") items.push(config.auth === "better-auth" ? "better-auth" : "next-auth");
  if (config.deploy !== "none") items.push(config.deploy);
  if (config.editor !== "none") items.push(config.editor);
  config.extras.forEach((e) => items.push(e));
  return items;
}

export default function Page() {
  const [config, setConfig] = useState<ProjectConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

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
    setConfig((prev) => ({ ...prev, tailwind: on, uiLibraries: on ? prev.uiLibraries : [] }));
  }

  function toggleUILibrary(lib: UILibrary) {
    setConfig((prev) => {
      const has = prev.uiLibraries.includes(lib);
      if (has) return { ...prev, uiLibraries: prev.uiLibraries.filter((l) => l !== lib) };
      const next = [...prev.uiLibraries, lib];
      if ((lib === "magic-ui" || lib === "kibo-ui") && !next.includes("shadcn")) next.unshift("shadcn");
      return { ...prev, uiLibraries: next };
    });
  }

  function toggleExtra(extra: Extra) {
    setConfig((prev) => ({
      ...prev,
      extras: prev.extras.includes(extra) ? prev.extras.filter((e) => e !== extra) : [...prev.extras, extra],
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
      setShowToast(true);
    } catch {
      alert("Erro ao gerar o projeto. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const isVite = config.framework === "react-vite";
  const summary = getSummaryItems(config);

  return (
    <div className="flex min-h-screen flex-col">
      {showToast && (
        <DownloadToast
          name={config.name}
          pm={config.packageManager}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/60 bg-[#08080c]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <ForgeIcon className="h-7 w-7" />
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-bold tracking-tight text-zinc-100">forge</span>
              <span className="rounded bg-orange-500/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-orange-400 ring-1 ring-orange-500/20">
                v1.0
              </span>
            </div>
          </div>

          <a
            href="https://github.com/nulldevelop"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            nulldevelop
          </a>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-6 pb-24">

        {/* Project bar */}
        <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Name */}
            <div className="flex items-center gap-2.5">
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-zinc-600">name</span>
              <input
                type="text"
                value={config.name}
                onChange={(e) => update("name", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="my-app"
                className="w-32 rounded-md border border-zinc-800 bg-transparent px-2.5 py-1 font-mono text-xs text-zinc-100 placeholder-zinc-700 outline-none transition-colors focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20"
              />
            </div>

            <div className="h-4 w-px bg-zinc-800 max-sm:hidden" />

            {/* Framework */}
            <div className="flex items-center gap-2.5">
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-zinc-600">framework</span>
              <Pills
                options={[
                  { value: "nextjs" as Framework, label: "Next.js" },
                  { value: "react-vite" as Framework, label: "React + Vite" },
                ]}
                value={config.framework}
                onChange={setFramework}
              />
            </div>

            <div className="h-4 w-px bg-zinc-800 max-sm:hidden" />

            {/* Language */}
            <div className="flex items-center gap-2.5">
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-zinc-600">lang</span>
              <Pills
                options={[
                  { value: "typescript" as Language, label: "TypeScript" },
                  { value: "javascript" as Language, label: "JavaScript" },
                ]}
                value={config.language}
                onChange={(v) => update("language", v)}
              />
            </div>

            <div className="h-4 w-px bg-zinc-800 max-sm:hidden" />

            {/* Package manager */}
            <div className="flex items-center gap-2.5">
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-zinc-600">pkg</span>
              <Pills
                options={[
                  { value: "pnpm" as PackageManager, label: "pnpm" },
                  { value: "npm" as PackageManager, label: "npm" },
                  { value: "yarn" as PackageManager, label: "yarn" },
                ]}
                value={config.packageManager}
                onChange={(v) => update("packageManager", v)}
              />
            </div>
          </div>
        </div>

        {/* Sections grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          {/* Styling */}
          <SectionCard title="Styling" description="Estilização e componentes de UI">
            <SubSection label="Tailwind CSS">
              <OptionTile icon="🎨" label="Sim" description="Utilitários CSS prontos" selected={config.tailwind} onClick={() => setTailwind(true)} />
              <OptionTile icon="—" label="Não" description="CSS puro" selected={!config.tailwind} onClick={() => setTailwind(false)} />
            </SubSection>

            {config.tailwind && (
              <SubSection label="UI Components — multi-seleção">
                <OptionTile icon="◼" label="shadcn/ui" description="Copy-paste components" selected={config.uiLibraries.includes("shadcn")} multi onClick={() => toggleUILibrary("shadcn")} />
                <OptionTile icon="✦" label="Magic UI" description="Componentes animados" selected={config.uiLibraries.includes("magic-ui")} multi onClick={() => toggleUILibrary("magic-ui")} />
                <OptionTile icon="◧" label="Kibo UI" description="UI baseado em shadcn" selected={config.uiLibraries.includes("kibo-ui")} multi onClick={() => toggleUILibrary("kibo-ui")} />
                {(config.uiLibraries.includes("magic-ui") || config.uiLibraries.includes("kibo-ui")) && (
                  <p className="px-3 pt-1 text-[10px] text-zinc-700">shadcn/ui incluído como base</p>
                )}
              </SubSection>
            )}
          </SectionCard>

          {/* Data */}
          <SectionCard title="Data" description="Banco de dados e ORM">
            <SubSection label="Database">
              <OptionTile icon="🐬" label="MySQL" description="MariaDB / MySQL" selected={config.database === "mysql"} onClick={() => setDatabase("mysql")} />
              <OptionTile icon="🐘" label="PostgreSQL" description="Banco relacional robusto" selected={config.database === "postgresql"} onClick={() => setDatabase("postgresql")} />
              <OptionTile icon="—" label="Nenhum" description="Sem persistência" selected={config.database === "none"} onClick={() => setDatabase("none")} />
            </SubSection>

            {config.database !== "none" && (
              <SubSection label="ORM">
                <OptionTile icon="◭" label="Prisma" description="Schema declarativo" selected={config.orm === "prisma"} onClick={() => update("orm", "prisma" as Orm)} />
                <OptionTile icon="💧" label="Drizzle" description="Leve e type-safe" selected={config.orm === "drizzle"} onClick={() => update("orm", "drizzle" as Orm)} />
                <OptionTile icon="—" label="Nenhum" description="Sem ORM" selected={config.orm === "none"} onClick={() => update("orm", "none" as Orm)} />
              </SubSection>
            )}
          </SectionCard>

          {/* Auth */}
          <SectionCard title="Auth" description="Autenticação e sessão">
            <OptionTile icon="🔐" label="Better Auth" description="Auth moderno, sem lock-in" selected={config.auth === "better-auth"} onClick={() => update("auth", "better-auth" as Auth)} />
            <OptionTile icon="🔒" label="NextAuth v5" description="Auth oficial do Next.js" selected={config.auth === "next-auth"} disabled={isVite} onClick={() => update("auth", "next-auth" as Auth)} />
            <OptionTile icon="—" label="Nenhum" description="Sem autenticação" selected={config.auth === "none"} onClick={() => update("auth", "none" as Auth)} />
            {isVite && <p className="px-3 pt-1 text-[10px] text-zinc-700">NextAuth requer Next.js</p>}
          </SectionCard>

          {/* Deploy */}
          <SectionCard title="Deploy" description="Infraestrutura e configuração">
            <OptionTile icon="▲" label="Vercel" description="Zero config, CI integrado" selected={config.deploy === "vercel"} onClick={() => update("deploy", "vercel" as Deploy)} />
            <OptionTile icon="🌐" label="Hostinger" description="VPS Linux — PM2 + Nginx" selected={config.deploy === "hostinger"} onClick={() => update("deploy", "hostinger" as Deploy)} />
            <OptionTile icon="🪟" label="IIS" description="Windows Server + iisnode" selected={config.deploy === "iis"} disabled={isVite} onClick={() => update("deploy", "iis" as Deploy)} />
            <OptionTile icon="—" label="Nenhum" description="Sem config de infra" selected={config.deploy === "none"} onClick={() => update("deploy", "none" as Deploy)} />
            {isVite && <p className="px-3 pt-1 text-[10px] text-zinc-700">IIS requer Next.js</p>}
          </SectionCard>

          {/* Editor */}
          <SectionCard title="Editor" description="Config do editor gerada automaticamente">
            <OptionTile icon="⚡" label="Zed" description=".zed/settings.json com Biome + ícones" selected={config.editor === "zed"} onClick={() => update("editor", "zed" as Editor)} />
            <OptionTile icon="🔷" label="VS Code" description=".vscode/settings.json + extensions" selected={config.editor === "vscode"} onClick={() => update("editor", "vscode" as Editor)} />
            <OptionTile icon="—" label="Nenhum" description="Sem config de editor" selected={config.editor === "none"} onClick={() => update("editor", "none" as Editor)} />
          </SectionCard>

          {/* Extras */}
          <SectionCard title="Extras" description="Integrações adicionais — multi-seleção">
            <OptionTile icon="🐳" label="Docker" description="Dockerfile + docker-compose" selected={config.extras.includes("docker")} multi onClick={() => toggleExtra("docker")} />
            <OptionTile icon="⚙️" label="GitHub Actions" description="Pipeline de CI/CD" selected={config.extras.includes("github-actions")} multi onClick={() => toggleExtra("github-actions")} />
            <OptionTile icon="💳" label="Stripe" description="Pagamentos — src/lib/stripe.ts" selected={config.extras.includes("stripe")} multi onClick={() => toggleExtra("stripe")} />
            <OptionTile icon="📧" label="Resend" description="E-mail transacional" selected={config.extras.includes("resend")} multi onClick={() => toggleExtra("resend")} />
          </SectionCard>

        </div>
      </div>

      {/* Sticky generate bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-800/60 bg-[#08080c]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-3">
          <div className="flex min-w-0 flex-1 flex-wrap gap-1">
            {summary.map((item) => (
              <span
                key={item}
                className="rounded border border-zinc-800 bg-zinc-900/60 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500"
              >
                {item}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !config.name.trim()}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold transition-all",
              "bg-orange-600 text-white hover:bg-orange-500 active:bg-orange-700",
              "disabled:cursor-not-allowed disabled:opacity-40"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                Gerar projeto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
