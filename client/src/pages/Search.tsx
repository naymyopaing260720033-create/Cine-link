/*
 * MIDNIGHT MARQUEE — Browse & Search.
 * Full-width search bar, genre filter chips, poster grid.
 * Amber only appears on focus/CTAs.
 */
import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { Search as SearchIcon, Loader2, Filter, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SiteLayout from "@/components/SiteLayout";
import ApiKeyBanner, { useApiKeyMissing } from "@/components/ApiKeyBanner";
import MovieCard from "@/components/MovieCard";
import MarqueeSkeleton from "@/components/MarqueeSkeleton";
import SeriesCard from "@/components/SeriesCard";
import {
  searchMovies,
  searchSeries,
  discoverByGenre,
  discoverByYear,
  getGenres,
  getPopular,
  getPopularSeries,
  fetchWithError,
  type TmdbMovie,
  type TmdbSeries,
} from "@/lib/tmdb";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(TmdbMovie | TmdbSeries)[] | null>(
    null,
  );
  const [searching, setSearching] = useState(false);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const searchParams = useSearch();
  const noKey = useApiKeyMissing();
  const mode = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    return params.get("type") === "tv" ? "tv" : ("movie" as const);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const q = params.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    fetchWithError(getGenres)
      .then((gs) => setGenres(gs))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();

    // Reset results when starting new search
    if (page === 1 && !searching) {
      setResults(null);
    }

    if (!trimmed && !activeGenre && !activeYear) {
      const fn =
        mode === "tv"
          ? () => getPopularSeries(page)
          : () => getPopular(page);
      fetchWithError(fn as () => Promise<{ results: (TmdbMovie | TmdbSeries)[]; total_pages: number }>)
        .then((data) => {
          if (!cancelled) {
            setResults(data.results);
            setTotalPages(data.total_pages);
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    setSearching(true);
    
    let fn;
    if (trimmed) {
      fn = mode === "tv"
        ? () => searchSeries(trimmed, page)
        : () => searchMovies(trimmed, page);
    } else if (activeGenre) {
      fn = () => discoverByGenre(activeGenre, page, mode, activeYear || undefined);
    } else if (activeYear) {
      fn = () => discoverByYear(activeYear, page, mode);
    } else {
      fn = mode === "tv" ? () => getPopularSeries(page) : () => getPopular(page);
    }

    fn()
      .then((data: any) => {
        if (!cancelled) {
          setResults(data.results);
          setTotalPages(Math.min(data.total_pages, 500));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, activeGenre, activeYear, page, mode]);

  const title = useMemo(() => {
    const prefix = mode === "tv" ? "Series" : "Films";
    if (query.trim()) return `Results for "${query.trim()}"`;
    let parts = [];
    if (activeGenre) parts.push(genres.find((g) => g.id === activeGenre)?.name ?? "Genre");
    if (activeYear) parts.push(activeYear.toString());
    
    if (parts.length > 0) return parts.join(" · ");
    return `Popular ${prefix}`;
  }, [query, activeGenre, activeYear, genres, mode]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 1990; y--) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <SiteLayout>
      <section className="container pt-10 pb-6">
        <h1 className="font-display font-black text-3xl md:text-4xl text-foreground mb-6">
          Browse the {title}
        </h1>

        <div className="relative max-w-xl mb-4">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
              setActiveGenre(null);
            }}
            placeholder="Search movies by title…"
            className="pl-10 h-11 bg-card border-border focus-visible:ring-primary/60 text-foreground placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold/80 mb-2">
            <Filter className="h-3 w-3" />
            Filter by Genre
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <Button
                key={g.id}
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveGenre((prev) => (prev === g.id ? null : g.id));
                  setPage(1);
                  setQuery("");
                }}
                className={
                  activeGenre === g.id
                    ? "marquee-chip border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-gold hover:border-primary/50"
                }
              >
                {g.name}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold/80 mb-2 pt-2">
            <Calendar className="h-3 w-3" />
            Filter by Year
          </div>
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <Button
                key={y}
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveYear((prev) => (prev === y ? null : y));
                  setPage(1);
                  setQuery("");
                }}
                className={
                  activeYear === y
                    ? "marquee-chip border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-gold hover:border-primary/50"
                }
              >
                {y}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {noKey && (
        <section className="container pb-4">
          <ApiKeyBanner />
        </section>
      )}
      <section className="container pb-16">
        {searching && !results ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <MarqueeSkeleton className="aspect-[2/3] w-full" />
                <MarqueeSkeleton className="h-4 w-3/4 mt-2.5" />
                <MarqueeSkeleton className="h-3 w-1/2 mt-2" />
              </div>
            ))}
          </div>
        ) : results && results.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-8">
              {mode === "tv" ? (
                (results as TmdbSeries[]).map((series, i) => (
                  <SeriesCard key={series.id} series={series} index={i % 12} />
                ))
              ) : (
                (results as TmdbMovie[]).map((movie, i) => (
                  <MovieCard key={movie.id} movie={movie} index={i % 12} />
                ))
              )}
            </div>

            <div className="flex items-center justify-center gap-3 mt-12">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-border text-foreground"
              >
                ← Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-border text-foreground"
              >
                Next →
              </Button>
            </div>
          </>
        ) : noKey ? (
          <ApiKeyBanner />
        ) : (
          <div className="text-center py-24 space-y-3">
            <p className="font-display font-bold text-xl text-foreground">
              Nothing on the marquee
            </p>
            <p className="text-sm text-muted-foreground">
              No films matched that title — try a different title or genre.
            </p>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
