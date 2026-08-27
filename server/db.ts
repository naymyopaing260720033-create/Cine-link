import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertMyanmarMovieContent,
  InsertUser,
  myanmarMovieContents,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

type MyanmarMovieContentValues = Pick<
  InsertMyanmarMovieContent,
  "tmdbId" | "title" | "tagline" | "synopsis" | "editorOpenId"
>;

type EditorialImageKind = "poster" | "backdrop";
type EditorialImageValues = {
  storageKey: string;
  url: string;
};

async function getRequiredDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

/** Public read: detail pages can request only one movie's approved override. */
export async function getMyanmarMovieContentByTmdbId(tmdbId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      tmdbId: myanmarMovieContents.tmdbId,
      title: myanmarMovieContents.title,
      tagline: myanmarMovieContents.tagline,
      synopsis: myanmarMovieContents.synopsis,
      posterUrl: myanmarMovieContents.posterUrl,
      backdropUrl: myanmarMovieContents.backdropUrl,
      updatedAt: myanmarMovieContents.updatedAt,
    })
    .from(myanmarMovieContents)
    .where(eq(myanmarMovieContents.tmdbId, tmdbId))
    .limit(1);

  return result[0];
}

/** Admin read: includes editor and timestamps for the internal dashboard. */
export async function listMyanmarMovieContents() {
  const db = await getRequiredDb();
  return db
    .select()
    .from(myanmarMovieContents)
    .orderBy(desc(myanmarMovieContents.updatedAt));
}

export async function createMyanmarMovieContent(values: MyanmarMovieContentValues) {
  const db = await getRequiredDb();
  await db.insert(myanmarMovieContents).values(values);
}

export async function updateMyanmarMovieContent(
  id: number,
  values: Pick<MyanmarMovieContentValues, "tmdbId" | "title" | "tagline" | "synopsis">,
) {
  const db = await getRequiredDb();
  await db.update(myanmarMovieContents).set(values).where(eq(myanmarMovieContents.id, id));
}

export async function deleteMyanmarMovieContent(id: number) {
  const db = await getRequiredDb();
  await db.delete(myanmarMovieContents).where(eq(myanmarMovieContents.id, id));
}

export async function setMyanmarMovieImage(
  id: number,
  kind: EditorialImageKind,
  image: EditorialImageValues | null,
) {
  const db = await getRequiredDb();
  const values =
    kind === "poster"
      ? {
          posterStorageKey: image?.storageKey ?? null,
          posterUrl: image?.url ?? null,
        }
      : {
          backdropStorageKey: image?.storageKey ?? null,
          backdropUrl: image?.url ?? null,
        };

  await db.update(myanmarMovieContents).set(values).where(eq(myanmarMovieContents.id, id));
}
