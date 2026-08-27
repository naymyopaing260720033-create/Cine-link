import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Editor-managed Myanmar copy for a TMDB movie. This deliberately stores only
 * editorial overrides; posters, ratings, cast, and all catalogue metadata
 * continue to come from TMDB.
 */
export const myanmarMovieContents = mysqlTable("myanmar_movie_contents", {
  id: int("id").autoincrement().primaryKey(),
  tmdbId: int("tmdbId").notNull().unique(),
  title: varchar("title", { length: 500 }),
  tagline: text("tagline"),
  synopsis: text("synopsis"),
  posterStorageKey: varchar("posterStorageKey", { length: 512 }),
  posterUrl: varchar("posterUrl", { length: 1024 }),
  backdropStorageKey: varchar("backdropStorageKey", { length: 512 }),
  backdropUrl: varchar("backdropUrl", { length: 1024 }),
  editorOpenId: varchar("editorOpenId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MyanmarMovieContent = typeof myanmarMovieContents.$inferSelect;
export type InsertMyanmarMovieContent = typeof myanmarMovieContents.$inferInsert;
