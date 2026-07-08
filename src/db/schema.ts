import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  bigint,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ── Users ──
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  storageUsed: bigint("storage_used", { mode: "number" }).notNull().default(0),
  storageLimit: bigint("storage_limit", { mode: "number" }).notNull().default(25 * 1024 * 1024 * 1024), // 25 GB
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Folders ──
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id").references((): any => folders.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 500 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("folders_user_id_idx").on(table.userId),
  parentIdx: index("folders_parent_id_idx").on(table.parentId),
}));

// ── Files ──
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  folderId: integer("folder_id").references(() => folders.id, { onDelete: "set null" }),
  name: varchar("name", { length: 500 }).notNull(),
  originalName: varchar("original_name", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull().default("application/octet-stream"),
  size: bigint("size", { mode: "number" }).notNull().default(0),
  storagePath: varchar("storage_path", { length: 1000 }).notNull(),
  fileData: text("file_data"),   // Base64-encoded file content for Vercel/Neon serverless
  isPublic: boolean("is_public").notNull().default(false),
  shareToken: varchar("share_token", { length: 64 }),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("files_user_id_idx").on(table.userId),
  folderIdIdx: index("files_folder_id_idx").on(table.folderId),
  shareTokenIdx: uniqueIndex("files_share_token_idx").on(table.shareToken),
}));
