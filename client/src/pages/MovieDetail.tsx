/*
 * MIDNIGHT MARQUEE — Movie detail.
 * Split layout: 1/3 poster rail + 2/3 content zone.
 * Signature marquee "Watch on Telegram" CTA + inline trailer playback.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  Star,
  Clock,
  Calendar,
  Play,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import MarqueeSkeleton from "@/components/MarqueeSkeleton";
import SiteLayout from "@/components/SiteLayout";
import ApiKeyBanner, { useApiKeyMissing } from "@/components/ApiKeyBanner";
import TrailerPanel from "@/components/TrailerPanel";
import WatchButton from "@/components/WatchButton";
import FavoriteButton from "@/components/FavoriteButton";
import { favoriteFromMovie } from "@/hooks/useFavorites";
import HorizontalRail, { toRailItem, type RailItem } from "@/components/HorizontalRail";
import {
  getMovie,
  getSimilarMovies,
  posterUrl,
  profileUrl,
  fetchWithError,
  type TmdbMovieDetail,
} from "@/lib/tmdb";

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const movieId = Number(id);
  const [movie, setMovie] = useState<TmdbMovieDetail | null>(null);
  const [similar, setSimilar] = useState<RailItem[]>([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSimilarLoading(true);
    Promise.all([
      fetchWithError(() => getMovie(movieId)),
      fetchWithError(() => getSimilarMovies(movieId)),
    ])
      .then(([data, similarData]) => {
        if (cancelled) return;
        setMovie(data);
        setSimilar(
          similarData.results
            .filter((m) => m.id !== movieId && Boolean(m.poster_path))
            .slice(0, 12)
            .map(toRailItem),
        );
        window.scrollTo(0, 0);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setSimilarLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-12 grid md:grid-cols-[240px_minmax(0,1fr)] gap-8 md:gap-12">
          <div className="w-full max-w-[220px] md:max-w-[240px] mx-auto md:mx-0">
            <MarqueeSkeleton className="aspect-[2/3] w-full" />
          </div>
          <div className="space-y-4">
            <MarqueeSkeleton className="h-10 w-3/4" />
            <MarqueeSkeleton className="h-5 w-1/3" />
            <MarqueeSkeleton className="h-24 w-full" />
            <MarqueeSkeleton className="h-12 w-1/2" />
            <MarqueeSkeleton className="h-6 w-1/4" />
            <MarqueeSkeleton className="h-6 w-1/5" />
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

      <div
        className="container pt-10 pb-16"
        style={{ animation: "fadeUp 400ms var(--ease-out) both" }}
      >
        <Link
          href="javascript:void(0)"
          onClick={() => history.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </Link>

        <div className="grid gap-8 md:grid-cols-[240px_minmax(0,1fr)] md:gap-12">
          {/* poster rail */}
          <div className="w-full max-w-[220px] md:max-w-[240px] mx-auto md:mx-0">
            <img
              src={posterUrl(movie.poster_path, "w342") || ""}
              alt={movie.title}
              className="block aspect-[2/3] object-cover rounded-lg shadow-2xl border border-border w-full"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <WatchButton
                  movieId={movie.id}
                  movieTitle={movie.title}
                  size="sm"
                  className="flex-1 justify-center px-3 py-2 text-[0.72rem] leading-none"
                />
                <FavoriteButton
                  item={favoriteFromMovie(movie)}
                  iconOnly
                  className="h-9 w-9 shrink-0 p-0"
                />
              </div>
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
            <TrailerPanel title={movie.title} trailerKey={trailer?.key} />

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

      </div>
      <HorizontalRail
        title="Similar Movies"
        viewAllHref="/search"
        items={similar}
        loading={similarLoading}
      />
    </SiteLayout>
  );
}
