import type { ProjectConfig } from "../types";

export function getPrismaSchema(config: ProjectConfig): string | null {
  if (config.orm !== "prisma") return null;
  const provider = config.database === "mysql" ? "mysql" : "postgresql";
  const urlEnv = config.database === "mysql" ? 'env("DATABASE_URL")' : 'env("DATABASE_URL")';

  return `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "${provider}"

}
`;
}

export function getPrismaClient(isTS: boolean): string | null {
  if (!isTS) {
    return `const { PrismaClient } = require("@prisma/client");

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

module.exports = { prisma };
`;
  }

  return `import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
`;
}

export function getDrizzleSchema(config: ProjectConfig): string | null {
  if (config.orm !== "drizzle") return null;
  const isTS = config.language === "typescript";

  if (config.database === "mysql") {
    return `${isTS ? 'import { mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";\n' : 'const { mysqlTable, varchar, timestamp } = require("drizzle-orm/mysql-core");\n'}
export const users = mysqlTable("users", {
  id: varchar("id", { length: 128 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").onUpdateNow().notNull(),
});
`;
  }

  return `${isTS ? 'import { pgTable, text, timestamp } from "drizzle-orm/pg-core";\n' : 'const { pgTable, text, timestamp } = require("drizzle-orm/pg-core");\n'}
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});
`;
}

export function getDrizzleIndex(config: ProjectConfig): string | null {
  if (config.orm !== "drizzle") return null;
  const isTS = config.language === "typescript";

  if (config.database === "mysql") {
    return isTS
      ? `import { drizzle } from "drizzle-orm/mysql2";\nimport mysql from "mysql2/promise";\nimport * as schema from "./schema";\n\nconst connection = await mysql.createConnection(process.env.DATABASE_URL!);\n\nexport const db = drizzle(connection, { schema, mode: "default" });\n`
      : `const { drizzle } = require("drizzle-orm/mysql2");\nconst mysql = require("mysql2/promise");\nconst schema = require("./schema");\n\nconst connection = await mysql.createConnection(process.env.DATABASE_URL);\n\nmodule.exports.db = drizzle(connection, { schema, mode: "default" });\n`;
  }

  return isTS
    ? `import { drizzle } from "drizzle-orm/node-postgres";\nimport * as schema from "./schema";\n\nexport const db = drizzle(process.env.DATABASE_URL!, { schema });\n`
    : `const { drizzle } = require("drizzle-orm/node-postgres");\nconst schema = require("./schema");\n\nmodule.exports.db = drizzle(process.env.DATABASE_URL, { schema });\n`;
}

export function getDrizzleConfig(config: ProjectConfig): string | null {
  if (config.orm !== "drizzle") return null;
  const isTS = config.language === "typescript";
  const dialect = config.database === "mysql" ? "mysql" : "postgresql";

  if (isTS) {
    return `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/drizzle/schema.ts",
  dialect: "${dialect}",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
`;
  }

  return `/** @type {import('drizzle-kit').Config} */
export default {
  out: "./drizzle",
  schema: "./src/drizzle/schema.js",
  dialect: "${dialect}",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
`;
}

export function getEnvExample(config: ProjectConfig): string {
  const lines: string[] = ["# Environment variables — copy to .env.local and fill in the values", ""];

  if (config.database !== "none" && config.orm !== "none") {
    const example =
      config.database === "mysql"
        ? "mysql://user:password@localhost:3306/dbname"
        : "postgresql://user:password@localhost:5432/dbname";
    lines.push("# Database");
    lines.push(`DATABASE_URL="${example}"`);
    lines.push("");
  }

  if (config.auth === "better-auth") {
    lines.push("# Better Auth");
    lines.push('BETTER_AUTH_SECRET="your-secret-here-min-32-chars"');
    lines.push('BETTER_AUTH_URL="http://localhost:3000"');
    lines.push('NEXT_PUBLIC_APP_URL="http://localhost:3000"');
    lines.push("");
  }

  if (config.auth === "next-auth") {
    lines.push("# NextAuth");
    lines.push('AUTH_SECRET="your-secret-here"');
    lines.push('NEXTAUTH_URL="http://localhost:3000"');
    lines.push("");
  }

  if (config.extras.includes("stripe")) {
    lines.push("# Stripe");
    lines.push('STRIPE_SECRET_KEY="sk_test_..."');
    lines.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."');
    lines.push('STRIPE_WEBHOOK_SECRET="whsec_..."');
    lines.push("");
  }

  if (config.extras.includes("resend")) {
    lines.push("# Resend");
    lines.push('RESEND_API_KEY="re_..."');
    lines.push("");
  }

  return lines.join("\n");
}
