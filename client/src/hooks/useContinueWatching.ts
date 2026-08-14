/*
 * MIDNIGHT MARQUEE — local Continue Watching memory.
 * Keeps the latest selected series episode lightweight, private, and login-free.
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cinelink-continue-watching";

export interface ContinueWatchingRecord {
  seriesId: number;
  seriesTitle: string;
  posterPath: string | null;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  overview: string;
  airDate: string | null;
  updatedAt: number;
}

function readContinueWatching(): ContinueWatchingRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ContinueWatchingRecord>;
    if (
      !parsed ||
      typeof parsed.seriesId !== "number" ||
      typeof parsed.seasonNumber !== "number" ||
      typeof parsed.episodeNumber !== "number" ||
      typeof parsed.seriesTitle !== "string"
    ) {
      return null;
    }
    return {
      seriesId: parsed.seriesId,
      seriesTitle: parsed.seriesTitle,
      posterPath: parsed.posterPath ?? null,
      seasonNumber: parsed.seasonNumber,
      episodeNumber: parsed.episodeNumber,
      episodeName: parsed.episodeName ?? "Untitled episode",
      overview: parsed.overview ?? "",
      airDate: parsed.airDate ?? null,
      updatedAt: parsed.updatedAt ?? Date.now(),
    };
  } catch {
    return null;
  }
}

function writeContinueWatching(entry: ContinueWatchingRecord | null) {
  try {
    if (entry) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* Private browsing or storage limits should never block browsing. */
  }
}

export function useContinueWatching() {
  const [entry, setEntry] = useState<ContinueWatchingRecord | null>(
    readContinueWatching,
  );

  useEffect(() => {
    const syncFromAnotherTab = () => setEntry(readContinueWatching());
    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
  }, []);

  const save = useCallback((next: Omit<ContinueWatchingRecord, "updatedAt">) => {
    const record: ContinueWatchingRecord = { ...next, updatedAt: Date.now() };
    writeContinueWatching(record);
    setEntry(record);
  }, []);

  const clear = useCallback(() => {
    writeContinueWatching(null);
    setEntry(null);
  }, []);

  return { entry, save, clear };
}
