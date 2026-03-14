import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function getRuntimeDatasourceUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(databaseUrl);
    const isSupabasePooler = parsedUrl.hostname.endsWith(".pooler.supabase.com");

    if (!isSupabasePooler) {
      return databaseUrl;
    }

    // Serverless SSR bursts are more stable against Supabase's transaction pooler.
    if (parsedUrl.port === "5432") {
      parsedUrl.port = "6543";
    }

    if (!parsedUrl.searchParams.has("connection_limit")) {
      parsedUrl.searchParams.set("connection_limit", "1");
    }

    if (parsedUrl.port === "6543" && !parsedUrl.searchParams.has("pgbouncer")) {
      parsedUrl.searchParams.set("pgbouncer", "true");
    }

    return parsedUrl.toString();
  } catch {
    return databaseUrl;
  }
}

function createPrismaClient() {
  const datasourceUrl = getRuntimeDatasourceUrl();

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(datasourceUrl ? { datasourceUrl } : {}),
  });
}

export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

globalThis.prismaGlobal = prisma;
