// ── Platform-aware database client ──
// On Vercel/Neon: uses @neondatabase/serverless with WebSocket Pool (robust)
// On local/standard: uses node-postgres with Pool

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// Detect Neon URL
const isNeon = databaseUrl.includes("neon.tech") || process.env.DB_DRIVER === "neon";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

if (isNeon) {
  // Neon serverless driver with Pool (WebSocket) — robust for all Drizzle operations
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool, neonConfig } = require("@neondatabase/serverless");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle: neonDrizzle } = require("drizzle-orm/neon-serverless");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ws = require("ws");

  // Required for Node.js runtime (Vercel uses Node, not Edge)
  neonConfig.webSocketConstructor = ws;

  const pool = new Pool({ connectionString: databaseUrl });
  db = neonDrizzle(pool);
} else {
  // Standard node-postgres driver — for local dev and traditional servers
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle: pgDrizzle } = require("drizzle-orm/node-postgres");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg");

  const globalForDb = globalThis as typeof globalThis & {
    __nebuladrivePool?: import("pg").Pool;
  };

  const pool =
    globalForDb.__nebuladrivePool ??
    new Pool({ connectionString: databaseUrl });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__nebuladrivePool = pool;
  }

  db = pgDrizzle(pool);
}

export { db };
