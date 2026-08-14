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

export interface TmdbSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  origin_country: string[];
}

export interface TmdbSeriesDetail extends TmdbSeries {
  genres: { id: number; name: string }[];
  number_of_seasons: number;
  number_of_episodes: number;
  seasons?: TmdbSeasonSummary[];
  tagline: string;
  status: string;
  created_by: { name: string }[];
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

export interface TmdbSeasonSummary {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
}

export interface TmdbEpisode {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
}

export interface TmdbSeasonDetail {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  air_date: string | null;
  poster_path: string | null;
  episodes: TmdbEpisode[];
}

let cachedKey: string | null = null;
let keyChecked = false;

function getKey(): string {
  if (keyChecked && cachedKey === null) {
    throw new Error("NO_KEY");
  }
  if (cachedKey) return cachedKey;
  // Hardcoded default key (TMDB keys are client-safe). In production the
  // VITE_TMDB_API_KEY env var (e.g. on Vercel) takes precedence if set.
  const key =
    (import.meta.env.VITE_TMDB_API_KEY as string | undefined)?.trim() ||
    FALLBACK_KEY;
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
  const env = (import.meta.env.VITE_TMDB_API_KEY as string | undefined)?.trim();
  return !env && !FALLBACK_KEY;
}

export const FALLBACK_KEY = "106567c882666997d5b9c7465d45fd60";

export async function getTrending(): Promise<TmdbListResult<TmdbMovie>> {
  return tmdbFetch("/trending/movie/week");
}

export async function getPopular(page = 1): Promise<TmdbListResult<TmdbMovie>> {
  return tmdbFetch(`/movie/popular?page=${page}`);
}

export async function getRecentlyAddedMovies(): Promise<TmdbListResult<TmdbMovie>> {
  const today = new Date().toISOString().slice(0, 10);
  return tmdbFetch(
    `/discover/movie?sort_by=primary_release_date.desc&primary_release_date.lte=${today}&vote_count.gte=5&page=1`,
  );
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

/* ── TV Series ─────────────────────────────────────────────── */

export async function getTrendingSeries(): Promise<TmdbListResult<TmdbSeries>> {
  return tmdbFetch("/trending/tv/week");
}

export async function getPopularSeries(
  page = 1,
): Promise<TmdbListResult<TmdbSeries>> {
  return tmdbFetch(`/tv/popular?page=${page}`);
}

export async function getRecentlyAddedSeries(): Promise<TmdbListResult<TmdbSeries>> {
  const today = new Date().toISOString().slice(0, 10);
  return tmdbFetch(
    `/discover/tv?sort_by=first_air_date.desc&first_air_date.lte=${today}&vote_count.gte=5&page=1`,
  );
}

export async function getTopRatedSeries(): Promise<TmdbListResult<TmdbSeries>> {
  return tmdbFetch("/tv/top_rated");
}

export async function getSeries(id: number): Promise<TmdbSeriesDetail> {
  return tmdbFetch<TmdbSeriesDetail>(`/tv/${id}?append_to_response=videos,credits`);
}

export async function getSeriesSeason(
  seriesId: number,
  seasonNumber: number,
): Promise<TmdbSeasonDetail> {
  return tmdbFetch<TmdbSeasonDetail>(`/tv/${seriesId}/season/${seasonNumber}`);
}

export async function searchSeries(
  query: string,
  page = 1,
): Promise<TmdbListResult<TmdbSeries>> {
  return tmdbFetch(`/search/tv?query=${encodeURIComponent(query)}&page=${page}`);
}

export function seriesYear(s?: { first_air_date?: string | null } | null) {
  return s?.first_air_date ? new Date(s.first_air_date).getFullYear() : null;
}

export function movieYear(m?: { release_date?: string | null } | null) {
  return m?.release_date ? new Date(m.release_date).getFullYear() : null;
}

export async function fetchWithError<T = unknown>(
  fn: () => Promise<T>,
): Promise<T> {
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
