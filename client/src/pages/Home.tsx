/*
 * MIDNIGHT MARQUEE — Home.
 * Asymmetric hero with projector hero image bleeding off-canvas right,
 * Fraunces display headline, amber CTA. Rails with scroll snap below.
 * Amber glow = spotlight; everything else recedes.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Star, ArrowRight, Play, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SiteLayout from "@/components/SiteLayout";
import MovieCard, { MovieRailTitle } from "@/components/MovieCard";
import WatchButton from "@/components/WatchButton";
import {
  getTrending,
  getPopular,
  getNowPlaying,
  getTopRated,
  getGenres,
  posterUrl,
  fetchWithError,
  type TmdbMovie,
} from "@/lib/tmdb";
import { loadConfig } from "@/lib/config";
import ApiKeyBanner, { useApiKeyMissing } from "@/components/ApiKeyBanner";

const HERO = "/manus-storage/cinelink-hero_42b9247e.png";

function Rail({
  title,
  accent,
  fetchFn,
}: {
  title: string;
  accent?: boolean;
  fetchFn: () => Promise<{ results: TmdbMovie[] }>;
}) {
  const [movies, setMovies] = useState<TmdbMovie[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWithError(fetchFn)
      .then((data) => {
        if (!cancelled) setMovies(data.results);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fetchFn]);

  return (
    <section className="container py-10">
      <MovieRailTitle title={title} accent={accent} />
      <div
        className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "thin" }}
      >
        {movies ? (
          movies.slice(0, 18).map((movie, i) => (
            <div key={movie.id} className="snap-start">
              <MovieCard movie={movie} index={i} />
            </div>
          ))
        ) : (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] w-[185px] rounded-md shrink-0" />
          ))
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [trending, setTrending] = useState<TmdbMovie | null>(null);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchWithError(getTrending),
      fetchWithError(getGenres),
    ])
      .then(([trend, gs]) => {
        if (cancelled) return;
        const top = trend.results.find((m) => m.backdrop_path);
        setTrending(top ?? trend.results[0] ?? null);
        setGenres(gs.slice(0, 10));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const cfg = loadConfig();
  const noKey = useApiKeyMissing();

  return (
    <SiteLayout>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden film-grain border-b border-border"
      >
        <img
          src={HERO}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

        <div className="container relative py-20 md:py-28 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center min-h-[520px]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Tonight's Feature, Delivered by Telegram
            </p>
            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-foreground">
              Your cinema hall.
              <br />
              <span className="text-gold">In your pocket.</span>
            </h1>
            <p className="text-muted-foreground max-w-md text-base leading-relaxed">
              Browse thousands of films, then open Telegram — one command away
              from the stream. No sign-up, no clutter, just the show.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link href="/search">
                <Button
                  size="lg"
                  className="marquee-chip bg-primary text-primary-foreground font-bold gap-2 hover:shadow-[0_0_28px_oklch(0.78_0.15_70/0.4)] active:scale-[0.97] transition-all duration-200"
                >
                  <Play className="h-4.5 w-4.5" />
                  Start Watching
                </Button>
              </Link>
              <a
                href={`https://t.me/${cfg.telegramBotUsername}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="marquee-chip border-primary/60 text-primary hover:bg-primary/10 active:scale-[0.97]"
                >
                  <Send className="h-4 w-4" />
                  Go to Bot
                </Button>
              </a>
            </div>
          </div>

          {/* Asymmetric featured poster card bleeding right */}
          {trending && (
            <div className="hidden md:flex justify-end">
              <div className="relative -mr-24 lg:-mr-40 w-[320px] lg:w-[380px] animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="absolute -inset-3 rounded-lg bg-primary/10 blur-2xl" />
                <Link href={`/movie/${trending.id}`} className="block relative">
                  <img
                    src={posterUrl(trending.backdrop_path ?? trending.poster_path) || ""}
                    alt={trending.title}
                    className="rounded-lg shadow-2xl border border-border poster-hover aspect-video object-cover"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-gold">
                      Trending This Week
                    </p>
                    <h3 className="font-display font-bold text-2xl text-foreground">
                      {trending.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-gold font-semibold">
                        <Star className="h-3.5 w-3.5 fill-gold" />
                        {trending.vote_average.toFixed(1)}
                      </span>
                      <span>
                        {new Date(trending.release_date).getFullYear()}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Genre chips */}
        {genres.length > 0 && (
          <div className="container relative pb-8 flex flex-wrap gap-2">
            {genres.map((g) => (
              <Link
                key={g.id}
                href={`/genre/${g.id}`}
                className="px-3.5 py-1.5 text-xs font-medium rounded-full border border-border text-muted-foreground hover:text-gold hover:border-primary/50 hover:bg-accent transition-colors duration-150 active:scale-[0.97]"
              >
                {g.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Rails ────────────────────────────────────────────── */}
      {noKey && (
        <section className="container pt-8">
          <ApiKeyBanner />
        </section>
      )}
      <Rail title="Trending This Week" fetchFn={getTrending} />
      <Rail title="Now Playing" fetchFn={getNowPlaying} />
      <Rail title="Top Rated" accent fetchFn={getTopRated} />
      <Rail title="Popular" fetchFn={getPopular} />

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="border-t border-border bg-card/50">
        <div className="container py-16 grid md:grid-cols-3 gap-10">
          <div className="space-y-2">
            <p className="font-display font-black text-4xl text-primary/70">01</p>
            <h3 className="font-display font-bold text-lg text-foreground">
              Pick a film
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Browse trending, new releases and top-rated picks in our catalogue.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-display font-black text-4xl text-primary/70">02</p>
            <h3 className="font-display font-bold text-lg text-foreground">
              Tap the Telegram button
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              One click opens the CineLink bot in Telegram — pre-filled with the
              movie you picked.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-display font-black text-4xl text-primary/70">03</p>
            <h3 className="font-display font-bold text-lg text-foreground">
              Stream instantly
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The bot replies with a ready-to-play stream link. Lights down,
              show on.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
