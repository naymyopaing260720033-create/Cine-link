/*
 * MIDNIGHT MARQUEE — Genre page.
 * Same poster grid conventions as Browse; golden genre title headline.
 */
import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import ApiKeyBanner, { useApiKeyMissing } from "@/components/ApiKeyBanner";
import MovieCard from "@/components/MovieCard";
import {
  discoverByGenre,
  getGenres,
  fetchWithError,
  type TmdbMovie,
} from "@/lib/tmdb";

export default function GenrePage() {
  const { id } = useParams<{ id: string }>();
  const genreId = Number(id);
  const [genreName, setGenreName] = useState("Genre");
  const [movies, setMovies] = useState<TmdbMovie[] | null>(null);
  const [loading, setLoading] = useState(true);
  const noKey = useApiKeyMissing();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWithError(getGenres)
      .then((gs) => {
        const found = gs.find((g) => g.id === genreId);
        if (found) setGenreName(found.name);
        return fetchWithError(() => discoverByGenre(genreId, 1));
      })
      .then((data) => {
        if (!cancelled) setMovies(data.results);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [genreId]);

  return (
    <SiteLayout>
      <div className="container pt-10 pb-16">
        <h1 className="font-display font-black text-3xl md:text-4xl text-gold mb-8">
          {genreName}
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : movies && movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-8">
            {movies.map((movie, i) => (
              <MovieCard key={movie.id} movie={movie} index={i % 12} />
            ))}
          </div>
        ) : noKey ? (
          <ApiKeyBanner />
        ) : (
          <div className="text-center py-24 space-y-3">
            <p className="font-display font-bold text-xl">
              No films playing in this genre
            </p>
            <p className="text-sm text-muted-foreground">
              Check back later — the schedule updates daily. Or try another
              genre from the home page.
            </p>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
