import type { ProjectConfig } from "../types";

export function getBetterAuthServer(config: ProjectConfig): string | null {
  if (config.auth !== "better-auth") return null;
  const isTS = config.language === "typescript";
  const hasPrisma = config.orm === "prisma";
  const provider = config.database === "mysql" ? "mysql" : "postgresql";

  if (hasPrisma) {
    return `import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "${provider}" }),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
  },
});
`;
  }

  return `import { betterAuth } from "better-auth";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET${isTS ? "!" : ""},
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
  },
});
`;
}

export function getBetterAuthClient(): string | null {
  return `import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
`;
}

export function getBetterAuthRoute(): string | null {
  return `import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
`;
}

export function getNextAuthConfig(config: ProjectConfig): string | null {
  if (config.auth !== "next-auth") return null;
  const isTS = config.language === "typescript";

  return `import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

export const config${isTS ? ": NextAuthConfig" : ""} = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) return isLoggedIn;
      return true;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
`;
}

export function getNextAuthRoute(): string | null {
  return `import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
`;
}

export function getMiddleware(config: ProjectConfig): string | null {
  if (config.framework !== "nextjs" || config.auth === "none") return null;
  const isTS = config.language === "typescript";

  if (config.auth === "better-auth") {
    return `import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request${isTS ? ": NextRequest" : ""}) {
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
`;
  }

  return `export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*"],
};
`;
}
