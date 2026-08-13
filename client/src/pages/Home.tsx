/*
 * MIDNIGHT MARQUEE — Home (reference: teleTV style).
 * Featured hero (full-bleed backdrop, meta row, Watch Now + Details),
 * then horizontal scroll rails: Trending Now + Latest Update.
 * Movies/Series tab switcher picks which catalogue to show.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Play,
  Info,
  Send,
  Star,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SiteLayout from "@/components/SiteLayout";
import WatchButton from "@/components/WatchButton";
import HorizontalRail, {
  toRailItem,
  toRailSeries,
  type RailItem,
} from "@/components/HorizontalRail";
import ApiKeyBanner, { useApiKeyMissing } from "@/components/ApiKeyBanner";
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

type Tab = "movies" | "series";

export default function Home() {
  const [tab, setTab] = useState<Tab>("movies");
  const [featured, setFeatured] = useState<RailItem | null>(null);
  const [trending, setTrending] = useState<RailItem[]>([]);
  const [latest, setLatest] = useState<RailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const noKey = useApiKeyMissing();
  const cfg = loadConfig();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const isMovies = tab === "movies";
    const jobs = isMovies
      ? [fetchWithError(getTrending), fetchWithError(getPopular)]
      : [
          fetchWithError(getTrendingSeries),
          fetchWithError(getPopularSeries),
        ];

    Promise.all(jobs)
      .then(([trend, pop]) => {
        if (cancelled) return;
        if (isMovies) {
          const t = trend.results as TmdbMovie[];
          setFeatured(
            t[0] ? { kind: "movie", data: t[0] } : null,
          );
          setTrending(
            t.slice(1, 21).map((m) => toRailItem(m)),
          );
          setLatest(
            (pop.results as TmdbMovie[])
              .slice(0, 20)
              .map((m) => toRailItem(m)),
          );
        } else {
          const t = trend.results as TmdbSeries[];
          setFeatured(
            t[0] ? { kind: "series", data: t[0] } : null,
          );
          setTrending(
            t.slice(1, 21).map((s) => toRailSeries(s)),
          );
          setLatest(
            (pop.results as TmdbSeries[])
              .slice(0, 20)
              .map((s) => toRailSeries(s)),
          );
        }
        window.scrollTo(0, 0);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const f = featured?.data as (TmdbMovie & TmdbSeries) | undefined;
  const fYear =
    tab === "movies"
      ? movieYear(f as TmdbMovie)
      : seriesYear(f as TmdbSeries);

  if (!f && !loading) {
    return (
      <SiteLayout>
        <div className="container py-24 text-center space-y-3">
          <p className="font-display font-bold text-xl">Nothing on the marquee</p>
          <p className="text-sm text-muted-foreground">
            Check back later — the schedule updates daily.
          </p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      {/* ── Tab switcher ─────────────────────────────────────── */}
      <div className="border-b border-border bg-background/90 backdrop-blur-xl sticky top-16 z-40">
        <div className="container flex items-center gap-1 py-2">
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
      </div>

      {noKey && (
        <div className="container pt-6">
          <ApiKeyBanner />
        </div>
      )}

      {/* ── Featured hero ────────────────────────────────────── */}
      {loading || !f ? (
        <section className="container py-10">
          <Skeleton className="h-[420px] md:h-[520px] w-full rounded-lg" />
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

          <div className="container relative py-12 md:py-20">
            <div className="max-w-xl space-y-4">
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
                <span className="text-muted-foreground">
                  {tab === "movies" ? "Featured Film" : "Featured Series"}
                </span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl leading-[1.05] text-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                {tab === "movies" ? (f as TmdbMovie).title : (f as TmdbSeries).name}
              </h1>

              <p className="text-muted-foreground leading-relaxed max-w-lg line-clamp-3 drop-shadow-sm">
                {f.overview || "No overview available."}
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <WatchButton
                  movieId={f.id}
                  movieTitle={
                    tab === "movies"
                      ? (f as TmdbMovie).title
                      : (f as TmdbSeries).name
                  }
                  size="lg"
                />
                <a
                  href={
                    tab === "movies"
                      ? `/movie/${f.id}`
                      : `/tv/${f.id}`
                  }
                >
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

      {/* ── Rails ────────────────────────────────────────────── */}
      <HorizontalRail
        title="Trending Now"
        viewAllHref="/search"
        items={trending}
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
