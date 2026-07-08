// scripts/migrate-neon.ts
// Run ONCE to create tables on Neon.tech after deployment
// Usage: DATABASE_URL=postgresql://... npx tsx scripts/migrate-neon.ts

import { config } from "dotenv";
config({ path: ".env.local" });

async function migrate() {
  // We need to set DB_DRIVER to force neon-http mode for migration
  process.env.DB_DRIVER = "neon-http";

  const { db } = await import("../src/db/index");
  const { sql } = await import("drizzle-orm");

  console.log("🔧 Creating tables on Neon...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      storage_used BIGINT NOT NULL DEFAULT 0,
      storage_limit BIGINT NOT NULL DEFAULT 26843545600,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS folders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
      name VARCHAR(500) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS folders_user_id_idx ON folders(user_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id)`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS files (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
      name VARCHAR(500) NOT NULL,
      original_name VARCHAR(500) NOT NULL,
      mime_type VARCHAR(255) NOT NULL DEFAULT 'application/octet-stream',
      size BIGINT NOT NULL DEFAULT 0,
      storage_path VARCHAR(1000) NOT NULL,
      file_data TEXT,
      is_public BOOLEAN NOT NULL DEFAULT false,
      share_token VARCHAR(64),
      download_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS files_user_id_idx ON files(user_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS files_folder_id_idx ON files(folder_id)`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS files_share_token_idx ON files(share_token)`);

  console.log("✅ Tables created successfully on Neon!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
