/*
 * MIDNIGHT MARQUEE — local Recently Added viewing memory.
 * Keeps NEW badges personal to the browser and removes them after a movie detail page is opened.
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cinelink-viewed-movies";

function readViewedMovies(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(
        parsed.filter(
          (value): value is number =>
            typeof value === "number" && Number.isInteger(value) && value > 0,
        ),
      ),
    );
  } catch {
    return [];
  }
}

function writeViewedMovies(movieIds: number[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(movieIds));
  } catch {
    /* Private browsing or storage limits should never block browsing. */
  }
}

export function useViewedMovies() {
  const [viewedMovieIds, setViewedMovieIds] = useState<number[]>(readViewedMovies);

  useEffect(() => {
    const syncFromAnotherTab = () => setViewedMovieIds(readViewedMovies());
    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
  }, []);

  const markMovieViewed = useCallback((movieId: number) => {
    if (!Number.isInteger(movieId) || movieId <= 0) return;

    const next = Array.from(new Set([...readViewedMovies(), movieId]));
    writeViewedMovies(next);
    setViewedMovieIds(next);
  }, []);

  return { viewedMovieIds, markMovieViewed };
}
