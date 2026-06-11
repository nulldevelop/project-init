# AGENT.md — Padrões de Projeto (Pedro / Null Development)

Este arquivo descreve os padrões, convenções e stack utilizados em todos os projetos. Use como referência ao iniciar um projeto novo ou ao dar contexto para ferramentas de IA (Claude Code, Gemini CLI, etc.).

---

## Stack Principal

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (App Router, versão mais recente) |
| Linguagem | TypeScript (strict) |
| ORM | Prisma ORM |
| Banco de dados | MySQL / MariaDB |
| Auth | Better Auth |
| UI | Tailwind CSS + shadcn/ui |
| Validação | Zod |
| Package manager | pnpm |
| Linter/Formatter | Biome |
| Editor | Zed / VS Code |

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── (public)/               # Rotas públicas (sem auth)
│   │   └── page.tsx
│   ├── (private)/              # Rotas protegidas (com auth)
│   │   └── dashboard/
│   │       ├── _components/    # Componentes específicos desta rota
│   │       ├── _actions/       # Server Actions desta rota
│   │       ├── _data-access/   # Queries Prisma desta rota
│   │       ├── _schemas/       # Schemas Zod desta rota
│   │       └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/       # Better Auth handler
│   │           └── route.ts
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   └── ui/                     # Componentes shadcn/ui (não editar)
│
├── lib/
│   ├── auth.ts                 # Configuração do Better Auth (server)
│   ├── auth-client.ts          # Cliente do Better Auth (client)
│   └── prisma.ts               # Singleton do Prisma Client
│
├── utils/                      # Funções utilitárias puras (formatação, masks, etc.)
│
├── types/
│   └── index.ts                # Tipos globais compartilhados
│
├── hooks/                      # React hooks customizados
│
├── middleware.ts               # Proteção de rotas (Better Auth)
│
prisma/
├── schema.prisma
└── migrations/
```

### Regras de nomenclatura de pastas

- `_components/` → componentes React **privados** da rota (prefixo `_` = não é rota Next.js)
- `_actions/` → Server Actions de mutação (create, update, delete)
- `_data-access/` → funções de leitura do banco via Prisma (apenas queries, sem lógica de negócio)
- `_schemas/` → schemas Zod para validação dos formulários e actions daquela rota
- `_validates/` → alias alternativo para `_schemas/` usado em alguns projetos

---

## Camadas da Aplicação

### 1. `_data-access/` — Acesso a dados

Responsabilidade única: fazer queries no banco. Não contém lógica de negócio, não chama outras actions, não faz revalidação.

```typescript
// app/(private)/dashboard/_data-access/users.data-access.ts
import { prisma } from "@/lib/prisma";

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
}
```

### 2. `_actions/` — Server Actions

Responsabilidade: receber dados do cliente, validar com Zod, verificar sessão/permissão, chamar o banco (via data-access ou direto no Prisma) e revalidar o cache.

```typescript
// app/(private)/dashboard/_actions/user.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createUserSchema, type CreateUserInput } from "../_schemas/user.schema";

export async function createUser(data: CreateUserInput) {
  // 1. Verificar sessão
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Não autenticado" };
  }

  // 2. Validar com Zod
  const validation = createUserSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  // 3. Operação no banco
  try {
    const user = await prisma.user.create({ data: validation.data });
    revalidatePath("/dashboard/users");
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar usuário",
    };
  }
}
```

### 3. `_schemas/` — Validação Zod

```typescript
// app/(private)/dashboard/_schemas/user.schema.ts
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(["ADMIN", "USER"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

---

## Prisma

### Singleton (`lib/prisma.ts`)

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Convenções do schema

- IDs: `String @id @default(cuid())`
- Timestamps: `createdAt DateTime @default(now())` e `updatedAt DateTime @updatedAt`
- Soft delete quando necessário: campo `deletedAt DateTime?`
- Enums para status e roles (nunca strings soltas)
- Sempre usar `select` explícito nas queries para não vazar campos sensíveis

---

## Autenticação (Better Auth)

### `lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "mysql" }),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24,      // renovar sessão após 1 dia
  },
  emailAndPassword: {
    enabled: true,
  },
});
```

### `lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
```

### `middleware.ts`

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

---

## Padrões de Código

### Retorno padrão de Server Actions

Sempre retornar objeto com `success`, `data` e `error`:

```typescript
// Sucesso
return { success: true, data: result };

// Erro
return { success: false, error: "Mensagem de erro" };
```

### Formulários com react-hook-form + Zod

```typescript
const form = useForm<CreateUserInput>({
  resolver: zodResolver(createUserSchema),
  defaultValues: {
    name: "",
    email: "",
    role: "USER",
  },
});

async function onSubmit(data: CreateUserInput) {
  const result = await createUser(data);
  if (!result.success) {
    toast.error(result.error);
    return;
  }
  toast.success("Criado com sucesso!");
  form.reset();
}
```

### Imports

Sempre usar path aliases (`@/`), nunca imports relativos com `../../`:

```typescript
// ✅ Correto
import { prisma } from "@/lib/prisma";

// ❌ Evitar
import { prisma } from "../../../lib/prisma";
```

---

## Variáveis de Ambiente

```env
# .env.local (nunca commitar)
DATABASE_URL="mysql://user:password@localhost:3306/dbname"
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Deploy

O deploy varia conforme o projeto — confirmar sempre antes de configurar.

### Opção A — Hostinger (VPS/shared)

```
Next.js (porta 3000) → PM2 → Nginx (reverse proxy) → HTTPS (Let's Encrypt)
```

**Nginx config padrão:**

```nginx
server {
    listen 80;
    server_name dominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Opção B — Windows Server (IIS) — Projetos da Prefeitura

- IIS com iisnode + `web.config`
- App Pool: sem código gerenciado, modo integrado
- PM2 para gerenciar o processo Node.js

### Opção C — Vercel

- Deploy direto pelo GitHub, zero config para Next.js
- Variáveis de ambiente configuradas no painel da Vercel
- Adequado para projetos SaaS sem necessidade de servidor dedicado

### CI/CD (GitHub Actions) — quando aplicável

- Branch strategy: `main` (produção) + `develop` + feature branches
- Self-hosted runner no servidor (Hostinger/IIS)
- Pipeline: checkout → pnpm install → pnpm build → deploy
- Estratégia de rollback: pasta com timestamp + symlink

**Exemplo básico (Hostinger/Linux):**

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pm2 restart nome-do-app
```

---

## Ferramentas de Desenvolvimento

| Ferramenta | Uso |
|---|---|
| pnpm | Package manager (sempre, nunca npm/yarn) |
| Biome | Linting e formatação (substitui ESLint + Prettier) |
| Zed | Editor principal |
| VS Code | Editor alternativo com extensão Symbols para ícones de pasta |

### Scripts padrão no `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  }
}
```

---

## Ícones de Pasta (VS Code / Zed — extensão Symbols)

```json
"symbols.folders.associations": {
  "_components": "folder-layout",
  "_actions": "folder-redux-actions",
  "_data-access": "folder-database",
  "components": "folder-layout",
  "hooks": "folder-providers",
  "lib": "folder-core",
  "utils": "folder-utils",
  "prisma": "folder-prisma",
  "(private)": "folder-lock",
  "(public)": "folder-public",
  "api": "folder-router"
}
```

---

## Projetos em Produção (referência)

| Projeto | Descrição | Infra |
|---|---|---|
| SIRA | Gestão de contratos + fiscalização (Azure AD SSO) | IIS / Windows Server |
| SIBEA | Gestão de bem-estar animal (multi-tenant, RBAC 5 roles) | IIS / Windows Server |
| BookEase | SaaS para bibliotecas municipais | VPS Linux |
| FootEasy | Gestão de campeonatos esportivos | VPS Linux |
| ScopeFlow | SaaS de propostas para freelancers de TI | VPS Linux |

---

## Convenções Gerais

- **Nunca** usar `any` no TypeScript — usar `unknown` e narrowing quando necessário
- **Sempre** validar dados com Zod antes de tocar no banco, tanto no cliente quanto no server
- **Sempre** verificar sessão dentro de Server Actions (não confiar só no middleware)
- **Sempre** usar `select` explícito nas queries Prisma
- Componentes de servidor por padrão — `"use client"` apenas onde necessário (formulários, hooks, interatividade)
- Manter `_data-access/` com funções puras de leitura; mutações ficam nas `_actions/`
- Mensagens de erro sempre em português para o usuário final
