import { pgTable, serial, varchar, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: integer("user_id").references(() => users.id),
  parentId: integer("parent_id"), // Null for root
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  size: integer("size").notNull(), // in bytes
  type: varchar("type", { length: 100 }).notNull(), // mime type
  folderId: integer("folder_id").references(() => folders.id, { onDelete: 'cascade' }),
  url: text("url"), // Storage URL
  isStarred: boolean("is_starred").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deploymentBookmarks = pgTable("deployment_bookmarks", {
  id: serial("id").primaryKey(),
  stepIndex: integer("step_index").notNull(),
  stepTitle: varchar("step_title", { length: 200 }).notNull(),
  notes: text("notes"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
