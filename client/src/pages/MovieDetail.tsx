/*
 * MIDNIGHT MARQUEE — Movie detail.
 * Split layout: 1/3 poster rail + 2/3 content zone.
 * Signature marquee "Watch on Telegram" CTA + copyable bot command.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  Star,
  Clock,
  Calendar,
  Play,
  ArrowLeft,
  Youtube,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import SiteLayout from "@/components/SiteLayout";
import ApiKeyBanner, { useApiKeyMissing } from "@/components/ApiKeyBanner";
import WatchButton, { WatchInstructions } from "@/components/WatchButton";
import {
  getMovie,
  getTrending,
  posterUrl,
  profileUrl,
  fetchWithError,
  type TmdbMovie,
  type TmdbMovieDetail,
} from "@/lib/tmdb";

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const movieId = Number(id);
  const [movie, setMovie] = useState<TmdbMovieDetail | null>(null);
  const [more, setMore] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchWithError(() => getMovie(movieId)),
      fetchWithError(getTrending),
    ])
      .then(([data, trend]) => {
        if (cancelled) return;
        setMovie(data);
        setMore(
          trend.results
            .filter((m) => m.id !== movieId)
            .slice(0, 12),
        );
        window.scrollTo(0, 0);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-12 grid md:grid-cols-[320px_1fr] gap-10">
          <Skeleton className="h-[480px] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  const noKey = useApiKeyMissing();

  if (!movie) {
    return (
      <SiteLayout>
        <div className="container py-24 text-center space-y-4">
          {noKey ? (
            <div className="max-w-2xl mx-auto">
              <ApiKeyBanner />
            </div>
          ) : (
            <>
              <p className="font-display font-bold text-xl">
                This reel went missing
              </p>
              <p className="text-sm text-muted-foreground">
                We couldn't find that film on the marquee.
              </p>
              <Link href="/" className="text-sm text-gold hover:underline">
                ← Back home
              </Link>
            </>
          )}
        </div>
      </SiteLayout>
    );
  }

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;
  const trailer = movie.videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"),
  );
  const cast = movie.credits?.cast?.slice(0, 6) ?? [];

  return (
    <SiteLayout>
      {/* backdrop wash */}
      {movie.backdrop_path && (
        <div className="fixed inset-0 -z-10">
          <img
            src={posterUrl(movie.backdrop_path)}
            alt=""
            className="w-full h-full object-cover opacity-20 blur-2xl"
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>
      )}

      <div className="container pt-10 pb-16">
        <Link
          href="javascript:void(0)"
          onClick={() => history.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </Link>

        <div className="grid md:grid-cols-[320px_1fr] gap-10 md:gap-14">
          {/* poster rail */}
          <div className="shrink-0">
            <img
              src={posterUrl(movie.poster_path, "w780") || ""}
              alt={movie.title}
              className="rounded-lg shadow-2xl border border-border w-full max-w-[320px] mx-auto"
            />
            <div className="mt-5">
              <WatchButton movieId={movie.id} movieTitle={movie.title} />
              <WatchInstructions movieId={movie.id} />
            </div>
          </div>

          {/* content zone */}
          <div className="space-y-6">
            {movie.tagline && (
              <p className="text-sm italic text-gold font-display">
                "{movie.tagline}"
              </p>
            )}
            <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl leading-tight">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 text-gold font-semibold">
                <Star className="h-4 w-4 fill-gold" />
                {movie.vote_average.toFixed(1)}
                <span className="text-muted-foreground/70 font-normal">
                  ({movie.vote_count.toLocaleString()} votes)
                </span>
              </span>
              {year && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {year}
                </span>
              )}
              {movie.runtime && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <Link
                  key={g.id}
                  href={`/genre/${g.id}`}
                  className="px-3 py-1 text-xs rounded-full border border-border text-muted-foreground hover:text-gold hover:border-primary/50 transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              {movie.overview || "No overview available."}
            </p>

            {/* trailer */}
            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-foreground transition-colors"
              >
                <Youtube className="h-4.5 w-4.5" />
                Watch trailer on YouTube
              </a>
            )}

            {/* cast */}
            {cast.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="font-display font-bold text-lg mb-4">Cast</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {cast.map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      {c.profile_path ? (
                        <img
                          src={profileUrl(c.profile_path)}
                          alt={c.name}
                          className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0 text-muted-foreground">
                          <Play className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {c.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.character}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* More movies */}
        {more.length > 0 && (
          <div className="mt-16 pt-10 border-t border-border">
            <h2 className="font-display font-bold text-xl mb-6">
              More to Watch
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-8">
              {more.map((m, i) => (
                <div key={m.id} className="w-full">
                  <MovieCardInner movie={m} index={i} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

/* small inline card to avoid circular layout issues with the main rail card */
import MovieCard from "@/components/MovieCard";

function MovieCardInner(props: { movie: TmdbMovie; index?: number }) {
  return <MovieCard {...props} />;
}
