import type { ProjectConfig } from "../types";

export function getDockerfile(config: ProjectConfig): string {
  return `FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

${config.orm === "prisma" ? "RUN npx prisma generate\n" : ""}RUN corepack enable pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
`;
}

export function getDockerCompose(config: ProjectConfig): string {
  const services: string[] = [`  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:${config.database !== "none" ? "\n      - db" : " []"}`];

  if (config.database === "mysql") {
    services.push(`  db:
    image: mysql:8
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: ${config.name.replace(/-/g, "_")}
      MYSQL_USER: user
      MYSQL_PASSWORD: password
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql`);
  } else if (config.database === "postgresql") {
    services.push(`  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: ${config.name.replace(/-/g, "_")}
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data`);
  }

  const volumes = config.database !== "none" ? "\nvolumes:\n  db_data:" : "";

  return `services:\n${services.join("\n")}\n${volumes}\n`;
}

export function getDockerignore(): string {
  return `.dockerignore
Dockerfile
.git
.gitignore
.next
node_modules
npm-debug.log
README.md
.env
.env.*
!.env.example
`;
}

export function getGithubActionsWorkflow(config: ProjectConfig): string {
  const isIIS = config.deploy === "iis";
  const pm = config.packageManager;

  if (isIIS) {
    return `name: Deploy to IIS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Install ${pm}
        run: npm install -g ${pm}

      - name: Install dependencies
        run: ${pm} install --frozen-lockfile

      - name: Build
        run: ${pm} build
        env:
          NODE_ENV: production
${config.orm === "prisma" ? `\n      - name: Run migrations\n        run: ${pm} db:migrate\n        env:\n          DATABASE_URL: \${{ secrets.DATABASE_URL }}\n` : ""}
      - name: Restart app
        run: pm2 restart ${config.name}
`;
  }

  return `name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Install ${pm}
        run: npm install -g ${pm}

      - name: Install dependencies
        run: ${pm} install --frozen-lockfile

      - name: Build
        run: ${pm} build
        env:
          NODE_ENV: production
          DATABASE_URL: \${{ secrets.DATABASE_URL }}
${config.orm === "prisma" ? `\n      - name: Run migrations\n        run: ${pm} db:migrate\n        env:\n          DATABASE_URL: \${{ secrets.DATABASE_URL }}\n` : ""}
      - name: Restart app
        run: pm2 restart ${config.name}
`;
}

export function getStripeLib(isTS: boolean): string {
  if (isTS) {
    return `import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});
`;
  }
  return `const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

module.exports = { stripe };
`;
}

export function getResendLib(isTS: boolean): string {
  if (isTS) {
    return `import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
`;
  }
  return `const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = { resend };
`;
}
