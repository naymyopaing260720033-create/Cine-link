/**
 * TMDB API service — Midnight Marquee design (CineLink).
 *
 * Uses the free TMDB API. Set VITE_TMDB_API_KEY in your env (or .env file)
 * to a valid key from https://developer.themoviedb.org/reference/introduction/getting-started
 * The site will refuse to fetch if no key is configured.
 */
import { toast } from "sonner";

const IMG_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size: "w342" | "w780" = "w342") {
  if (!path) return "";
  return `${IMG_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null) {
  if (!path) return "";
  return `${IMG_BASE}/original${path}`;
}

export function profileUrl(path: string | null) {
  if (!path) return "";
  return `${IMG_BASE}/w185${path}`;
}

export interface TmdbVideo {
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
}

export interface TmdbMovieDetail extends TmdbMovie {
  genres: { id: number; name: string }[];
  runtime: number | null;
  tagline: string;
  budget: number;
  revenue: number;
  status: string;
  videos?: { results: TmdbVideo[] };
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }[];
  };
}

export interface TmdbListResult<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

let cachedKey: string | null = null;
let keyChecked = false;

function getKey(): string {
  if (keyChecked && cachedKey === null) {
    throw new Error("NO_KEY");
  }
  if (cachedKey) return cachedKey;
  const key = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
  if (!key) {
    keyChecked = true;
    cachedKey = null;
    throw new Error("NO_KEY");
  }
  cachedKey = key;
  return key;
}

async function tmdbFetch<T>(endpoint: string): Promise<T> {
  const key = getKey();
  const res = await fetch(
    `https://api.themoviedb.org/3${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${key}&language=en-US`,
  );
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return (await res.json()) as T;
}

export function isApiKeyMissing(): boolean {
  return !import.meta.env.VITE_TMDB_API_KEY;
}

export async function getTrending(): Promise<TmdbListResult<TmdbMovie>> {
  return tmdbFetch("/trending/movie/week");
}

export async function getPopular(page = 1): Promise<TmdbListResult<TmdbMovie>> {
  return tmdbFetch(`/movie/popular?page=${page}`);
}

export async function getNowPlaying(): Promise<TmdbListResult<TmdbMovie>> {
  return tmdbFetch("/movie/now_playing");
}

export async function getTopRated(): Promise<TmdbListResult<TmdbMovie>> {
  return tmdbFetch("/movie/top_rated");
}

export async function getUpcoming(): Promise<TmdbListResult<TmdbMovie>> {
  return tmdbFetch("/movie/upcoming");
}

export async function getMovie(id: number): Promise<TmdbMovieDetail> {
  return tmdbFetch<TmdbMovieDetail>(`/movie/${id}?append_to_response=videos,credits`);
}

export async function searchMovies(
  query: string,
  page = 1,
): Promise<TmdbListResult<TmdbMovie>> {
  return tmdbFetch(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`);
}

export async function discoverByGenre(
  genreId: number,
  page = 1,
): Promise<TmdbListResult<TmdbMovie>> {
  return tmdbFetch(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=${page}`);
}

export async function getGenres(): Promise<Genre[]> {
  const data = (await tmdbFetch<{ genres: Genre[] }>("/genre/movie/list")) as {
    genres: Genre[];
  };
  return data.genres;
}

export async function fetchWithError<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Error && e.message === "NO_KEY") {
      toast.error("TMDB API key not configured");
    } else {
      toast.error("Something went wrong fetching data");
    }
    throw e;
  }
}
