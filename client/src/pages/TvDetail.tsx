/*
 * MIDNIGHT MARQUEE — Series detail.
 * Same split layout as movie detail; seasons/episodes metadata instead of runtime.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  Star,
  Calendar,
  Play,
  ArrowLeft,
  Youtube,
  X,
  Loader2,
  Clapperboard,
} from "lucide-react";
import MarqueeSkeleton from "@/components/MarqueeSkeleton";
import SiteLayout from "@/components/SiteLayout";
import ApiKeyBanner, { useApiKeyMissing } from "@/components/ApiKeyBanner";
import WatchButton, { WatchInstructions } from "@/components/WatchButton";
import FavoriteButton from "@/components/FavoriteButton";
import { favoriteFromSeries } from "@/hooks/useFavorites";
import SeriesCard from "@/components/SeriesCard";
import {
  getSeries,
  getTrendingSeries,
  posterUrl,
  profileUrl,
  fetchWithError,
  type TmdbSeries,
  type TmdbSeriesDetail,
} from "@/lib/tmdb";

export default function TvDetail() {
  const { id } = useParams<{ id: string }>();
  const seriesId = Number(id);
  const [series, setSeries] = useState<TmdbSeriesDetail | null>(null);
  const [more, setMore] = useState<TmdbSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const noKey = useApiKeyMissing();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setShowTrailer(false);
    Promise.all([
      fetchWithError(() => getSeries(seriesId)),
      fetchWithError(getTrendingSeries),
    ])
      .then(([data, trend]) => {
        if (cancelled) return;
        setSeries(data);
        setMore(trend.results.filter((s) => s.id !== seriesId).slice(0, 12));
        window.scrollTo(0, 0);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-12 grid md:grid-cols-[320px_1fr] gap-10">
          <MarqueeSkeleton className="h-[480px] w-full" />
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

  if (!series) {
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
                This series went missing
              </p>
              <p className="text-sm text-muted-foreground">
                We couldn't find that show on the marquee.
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

  const year = series.first_air_date
    ? new Date(series.first_air_date).getFullYear()
    : null;
  const trailer = series.videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"),
  );
  const cast = series.credits?.cast?.slice(0, 6) ?? [];

  return (
    <SiteLayout>
      {series.backdrop_path && (
        <div className="fixed inset-0 -z-10">
          <img
            src={posterUrl(series.backdrop_path)}
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
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>

        <div className="grid md:grid-cols-[320px_1fr] gap-10 md:gap-14">
          {/* poster rail */}
          <div className="shrink-0">
            <img
              src={posterUrl(series.poster_path, "w780") || ""}
              alt={series.name}
              className="rounded-lg shadow-2xl border border-border w-full max-w-[320px] mx-auto"
            />
            <div className="mt-5">
              <FavoriteButton item={favoriteFromSeries(series)} className="mb-3 w-full" />
              <WatchButton movieId={series.id} movieTitle={series.name} />
              <WatchInstructions movieId={series.id} />
            </div>
          </div>

          {/* content zone */}
          <div className="space-y-6">
            {series.tagline && (
              <p className="text-sm italic text-gold font-display">
                "{series.tagline}"
              </p>
            )}
            <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl leading-tight">
              {series.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 text-gold font-semibold">
                <Star className="h-4 w-4 fill-gold" />
                {series.vote_average.toFixed(1)}
                <span className="text-muted-foreground/70 font-normal">
                  ({series.vote_count.toLocaleString()} votes)
                </span>
              </span>
              {year && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {year}
                </span>
              )}
              {series.number_of_seasons > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clapperboard className="h-4 w-4" />
                  {series.number_of_seasons} season
                  {series.number_of_seasons > 1 ? "s" : ""} ·{" "}
                  {series.number_of_episodes} episodes
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {series.genres.map((g) => (
                <span
                  key={g.id}
                  className="px-3 py-1 text-xs rounded-full border border-border text-muted-foreground"
                >
                  {g.name}
                </span>
              ))}
            </div>

            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              {series.overview || "No overview available."}
            </p>

            {/* trailer */}
            {trailer && (
              <div className="space-y-3">
                <button
                  type="button"
                  aria-expanded={showTrailer}
                  onClick={() => setShowTrailer((current) => !current)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-foreground transition-colors"
                >
                  {showTrailer ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Youtube className="h-4 w-4" />
                  )}
                  {showTrailer ? "Close trailer" : "Watch trailer on this page"}
                </button>

                {showTrailer && (
                  <div className="relative overflow-hidden rounded-xl border border-border bg-black shadow-2xl aspect-video max-w-3xl">
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
                      title={`${series.name} trailer`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
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
                        <p className="text-sm font-medium truncate">{c.name}</p>
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

        {/* More series */}
        {more.length > 0 && (
          <div className="mt-16 pt-10 border-t border-border">
            <h2 className="font-display font-bold text-xl mb-6">
              More to Watch
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-8">
              {more.map((s, i) => (
                <SeriesCard key={s.id} series={s} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
