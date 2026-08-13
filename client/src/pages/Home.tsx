/*
 * MIDNIGHT MARQUEE — Home (reference: teleTV style).
 * Featured hero (full-bleed backdrop, meta row, Watch Now + Details),
 * then horizontal scroll sections: Movies, Series, Latest Update.
 * No tab switcher — movies and series show as their own rails.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Play, Info, Send, Star, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarqueeSkeleton from "@/components/MarqueeSkeleton";
import SiteLayout from "@/components/SiteLayout";
import WatchButton from "@/components/WatchButton";
import HorizontalRail, {
  toRailItem,
  toRailSeries,
  type RailItem,
} from "@/components/HorizontalRail";
import {
  getTrending,
  getPopular,
  getTrendingSeries,
  getPopularSeries,
  posterUrl,
  movieYear,
  seriesYear,
  fetchWithError,
  type TmdbMovie,
  type TmdbSeries,
} from "@/lib/tmdb";
import { loadConfig } from "@/lib/config";

export default function Home() {
  const [featured, setFeatured] = useState<RailItem | null>(null);
  const [movies, setMovies] = useState<RailItem[]>([]);
  const [series, setSeries] = useState<RailItem[]>([]);
  const [latest, setLatest] = useState<RailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const cfg = loadConfig();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchWithError(getTrending),
      fetchWithError(getPopular),
      fetchWithError(getTrendingSeries),
      fetchWithError(getPopularSeries),
    ])
      .then(([trend, pop, trendSeries, popSeries]) => {
        if (cancelled) return;
        const t = trend.results as TmdbMovie[];
        setFeatured(t[0] ? { kind: "movie", data: t[0] } : null);
        setMovies(
          t.slice(1, 21).map((m) => toRailItem(m)),
        );
        setSeries(
          (trendSeries.results as TmdbSeries[])
            .slice(0, 20)
            .map((s) => toRailSeries(s)),
        );
        setLatest(
          (pop.results as TmdbMovie[])
            .slice(0, 20)
            .map((m) => toRailItem(m)),
        );
        void popSeries; // reserved for future section
        window.scrollTo(0, 0);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const f = featured?.data as TmdbMovie | undefined;
  const fYear = movieYear(f);

  return (
    <SiteLayout>
      {/* ── Featured hero ────────────────────────────────────── */}
      {loading || !f ? (
        <section className="container relative overflow-hidden py-10">
          <div className="relative h-[420px] md:h-[520px] w-full rounded-lg bg-secondary">
            <MarqueeSkeleton className="absolute inset-0 rounded-lg" />
            <div className="absolute bottom-8 left-6 space-y-3 max-w-md">
              <MarqueeSkeleton className="h-4 w-2/3" />
              <MarqueeSkeleton className="h-10 w-4/5" />
              <MarqueeSkeleton className="h-4 w-full" />
              <div className="flex gap-3 pt-2">
                <MarqueeSkeleton className="h-10 w-36" />
                <MarqueeSkeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden">
          {f.backdrop_path && (
            <>
              <img
                src={posterUrl(f.backdrop_path) || ""}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/60" />
            </>
          )}

          <div className="container relative py-10 sm:py-12 md:py-20">
            <div className="max-w-xl space-y-3 sm:space-y-4">
              {/* meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
                <span className="px-2 py-0.5 text-xs font-bold rounded border border-primary/60 text-primary bg-primary/10">
                  1080p
                </span>
                {fYear && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> {fYear}
                  </span>
                )}
                {f.vote_average > 0 && (
                  <span className="inline-flex items-center gap-1 text-gold">
                    <Star className="h-3.5 w-3.5 fill-current" />{" "}
                    {f.vote_average.toFixed(1)}
                  </span>
                )}
                <span className="text-muted-foreground">Featured Film</span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl leading-[1.05] text-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                {f.title}
              </h1>

              <p className="text-muted-foreground leading-relaxed max-w-lg text-sm sm:text-base line-clamp-2 sm:line-clamp-3 drop-shadow-sm">
                {f.overview || "No overview available."}
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <WatchButton movieId={f.id} movieTitle={f.title} size="lg" />
                <a href={`/movie/${f.id}`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="marquee-chip border-border bg-background/70 text-foreground hover:bg-accent hover:text-foreground backdrop-blur-sm gap-2 active:scale-[0.97]"
                  >
                    <Info className="h-4.5 w-4.5" />
                    Details
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Horizontal sections ──────────────────────────────── */}
      <HorizontalRail
        title="Movies"
        viewAllHref="/search"
        items={movies}
        loading={loading}
      />
      <HorizontalRail
        title="Series"
        viewAllHref="/search?type=tv"
        items={series}
        loading={loading}
      />
      <HorizontalRail
        title="Latest Update"
        viewAllHref="/search"
        items={latest}
        loading={loading}
      />

      {/* ── Bot footer CTA ───────────────────────────────────── */}
      <section className="border-t border-border bg-card/60">
        <div className="container py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display font-bold text-lg text-foreground">
            Stream it from Telegram —{" "}
            <span className="text-gold">@{cfg.telegramBotUsername}</span>
          </p>
          <a
            href={`https://t.me/${cfg.telegramBotUsername}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button
              size="sm"
              className="marquee-chip bg-primary text-primary-foreground font-semibold gap-1.5 hover:shadow-[0_0_20px_oklch(0.78_0.15_70/0.35)] transition-shadow duration-200 active:scale-[0.97]"
            >
              <Send className="h-3.5 w-3.5" />
              Go to Bot
            </Button>
          </a>
        </div>
      </section>
    </SiteLayout>
  );
}
