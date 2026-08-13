/*
 * MIDNIGHT MARQUEE — browser-persistent watchlist.
 * Favorites stay lightweight and local: no login or backend is required.
 * The normalized record supports both movie and series cards consistently.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { TmdbMovie, TmdbSeries } from "@/lib/tmdb";

const STORAGE_KEY = "cinelink-favorites";

export type FavoriteKind = "movie" | "series";

export interface FavoriteRecord {
  kind: FavoriteKind;
  id: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  date: string;
  voteAverage: number;
  voteCount: number;
  genreIds: number[];
  addedAt?: number;
}

function recordKey(item: Pick<FavoriteRecord, "kind" | "id">) {
  return `${item.kind}:${item.id}`;
}

function readFavorites(): FavoriteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FavoriteRecord =>
        !!item &&
        typeof item === "object" &&
        typeof (item as FavoriteRecord).id === "number" &&
        ((item as FavoriteRecord).kind === "movie" ||
          (item as FavoriteRecord).kind === "series"),
    );
  } catch {
    return [];
  }
}

function writeFavorites(items: FavoriteRecord[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* Private browsing or a full storage quota should not break the UI. */
  }
}

export function favoriteFromMovie(movie: TmdbMovie): FavoriteRecord {
  return {
    kind: "movie",
    id: movie.id,
    title: movie.title,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    overview: movie.overview,
    date: movie.release_date,
    voteAverage: movie.vote_average,
    voteCount: movie.vote_count,
    genreIds: movie.genre_ids ?? [],
  };
}

export function favoriteFromSeries(series: TmdbSeries): FavoriteRecord {
  return {
    kind: "series",
    id: series.id,
    title: series.name,
    posterPath: series.poster_path,
    backdropPath: series.backdrop_path,
    overview: series.overview,
    date: series.first_air_date,
    voteAverage: series.vote_average,
    voteCount: series.vote_count,
    genreIds: series.genre_ids ?? [],
  };
}

export function favoriteToMovie(item: FavoriteRecord): TmdbMovie {
  return {
    id: item.id,
    title: item.title,
    overview: item.overview,
    poster_path: item.posterPath,
    backdrop_path: item.backdropPath,
    release_date: item.date,
    vote_average: item.voteAverage,
    vote_count: item.voteCount,
    popularity: 0,
    genre_ids: item.genreIds,
    adult: false,
    original_language: "",
  };
}

export function favoriteToSeries(item: FavoriteRecord): TmdbSeries {
  return {
    id: item.id,
    name: item.title,
    overview: item.overview,
    poster_path: item.posterPath,
    backdrop_path: item.backdropPath,
    first_air_date: item.date,
    vote_average: item.voteAverage,
    vote_count: item.voteCount,
    popularity: 0,
    genre_ids: item.genreIds,
    origin_country: [],
  };
}

interface FavoritesContextValue {
  favorites: FavoriteRecord[];
  isFavorite: (kind: FavoriteKind, id: number) => boolean;
  toggleFavorite: (item: FavoriteRecord) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteRecord[]>(readFavorites);

  useEffect(() => {
    const syncFromAnotherTab = () => setFavorites(readFavorites());
    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
  }, []);

  const isFavorite = useCallback(
    (kind: FavoriteKind, id: number) =>
      favorites.some((item) => item.kind === kind && item.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback((item: FavoriteRecord) => {
    setFavorites((current) => {
      const exists = current.some((saved) => recordKey(saved) === recordKey(item));
      const next = exists
        ? current.filter((saved) => recordKey(saved) !== recordKey(item))
        : [{ ...item, addedAt: Date.now() }, ...current];
      writeFavorites(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite }),
    [favorites, isFavorite, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites must be used inside FavoritesProvider");
  return value;
}

