/*
 * MIDNIGHT MARQUEE — Home.
 * Simplified per user request: hero + Movies/Series tabs only.
 * No rails, no how-it-works. Poster grid per tab, cinematic marquee voice.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Play, Send, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SiteLayout from "@/components/SiteLayout";
import MovieCard from "@/components/MovieCard";
import ApiKeyBanner, { useApiKeyMissing } from "@/components/ApiKeyBanner";
import {
  getTrending,
  getPopularSeries,
  getTopRatedSeries,
  posterUrl,
  seriesYear,
  fetchWithError,
  type TmdbMovie,
  type TmdbSeries,
} from "@/lib/tmdb";
import { loadConfig } from "@/lib/config";

const HERO = "/manus-storage/cinelink-hero_42b9247e.png";

type Tab = "movies" | "series";

function SeriesCard({ series, index = 0 }: { series: TmdbSeries; index?: number }) {
  const year = seriesYear(series);
  const poster = posterUrl(series.poster_path);

  return (
    <Link
      href={`/tv/${series.id}`}
      className="group block relative shrink-0 w-[150px] sm:w-[185px] md:w-[200px]"
      style={{
        animationDelay: `${index * 40}ms`,
        animation: "fadeUp 320ms var(--ease-out) both",
      }}
    >
      <div className="poster-hover relative aspect-[2/3] rounded-md overflow-hidden bg-secondary">
        {poster ? (
          <img
            src={poster}
            alt={series.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Play className="h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="absolute bottom-2 left-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-black/60 backdrop-blur-sm rounded px-2 py-1">
            <Play className="h-3 w-3 text-gold" />
            Watch via Telegram
          </span>
        </div>
      </div>
      <div className="mt-2.5 space-y-1">
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
          {series.name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-gold font-semibold">
            <Star className="h-3 w-3 fill-gold" />
            {series.vote_average > 0 ? series.vote_average.toFixed(1) : "—"}
          </span>
          {year && <span>{year}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("movies");
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [series, setSeries] = useState<TmdbSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const noKey = useApiKeyMissing();
  const cfg = loadConfig();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchWithError(getTrending),
      fetchWithError(getPopularSeries),
    ])
      .then(([trend, tv]) => {
        if (cancelled) return;
        setMovies(trend.results);
        setSeries(tv.results);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = tab === "movies" ? movies : series;

  return (
    <SiteLayout>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden film-grain border-b border-border">
        <img
          src={HERO}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

        <div className="container relative py-14 md:py-20">
          <div className="space-y-4 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Tonight's Feature, Delivered by Telegram
            </p>
            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-foreground">
              Your cinema hall.
              <br />
              <span className="text-gold">In your pocket.</span>
            </h1>
            <p className="text-muted-foreground max-w-md text-base leading-relaxed">
              Pick a film or a series, then open Telegram — one command away
              from the stream.
            </p>
            <a
              href={`https://t.me/${cfg.telegramBotUsername}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                size="lg"
                className="marquee-chip bg-primary text-primary-foreground font-bold gap-2.5 hover:shadow-[0_0_28px_oklch(0.78_0.15_70/0.4)] active:scale-[0.97] transition-all duration-200"
              >
                <Send className="h-4.5 w-4.5" />
                Go to Bot
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Tab switcher ─────────────────────────────────────── */}
      <section className="container pt-10 pb-4">
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 w-fit">
          {(
            [
              { id: "movies", label: "Movies" },
              { id: "series", label: "Series" },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors duration-150 active:scale-[0.97] ${
                tab === t.id
                  ? "marquee-chip bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Grid ─────────────────────────────────────────────── */}
      <section className="container pb-16">
        {noKey ? (
          <ApiKeyBanner />
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-8">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="h-[280px] w-full rounded-md" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-8">
            {items.map((item, i) =>
              tab === "movies" ? (
                <MovieCard key={(item as TmdbMovie).id} movie={item as TmdbMovie} index={i % 12} />
              ) : (
                <SeriesCard key={(item as TmdbSeries).id} series={item as TmdbSeries} index={i % 12} />
              ),
            )}
          </div>
        ) : (
          <div className="text-center py-24 space-y-3">
            <p className="font-display font-bold text-xl text-foreground">
              Nothing on the marquee
            </p>
            <p className="text-sm text-muted-foreground">
              Check back later — the schedule updates daily.
            </p>
          </div>
        )}

        {tab === "movies" && movies.length > 0 && (
          <div className="text-center mt-10">
            <Link href="/search" className="text-sm text-gold hover:underline">
              Browse all movies →
            </Link>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
