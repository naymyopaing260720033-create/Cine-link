/*
 * MIDNIGHT MARQUEE — horizontal scroll rail section.
 * Reference: teleTV style — section title with play glyph + "View All" link,
 * horizontally draggable cards with quality badge, rating chip, year + genre.
 * Amber accents + marquee serif headings kept on brand.
 */
import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, Star, Calendar, Play } from "lucide-react";
import type { TmdbMovie, TmdbSeries } from "@/lib/tmdb";
import { posterUrl, movieYear, seriesYear, getGenres } from "@/lib/tmdb";
import MarqueeSkeleton from "@/components/MarqueeSkeleton";
import FavoriteButton from "@/components/FavoriteButton";
import { favoriteFromMovie, favoriteFromSeries } from "@/hooks/useFavorites";

export type RailItem =
  | { kind: "movie"; data: TmdbMovie }
  | { kind: "series"; data: TmdbSeries };

export function toRailItem(m: TmdbMovie): RailItem {
  return { kind: "movie", data: m };
}

export function toRailSeries(s: TmdbSeries): RailItem {
  return { kind: "series", data: s };
}

/* deterministic quality badge so the same title keeps one badge */
const BADGES = ["1080p", "1080p", "1080p", "4K", "720p", "1080p"];
function badgeFor(item: RailItem, index: number) {
  const seed = item.data.id + index;
  return BADGES[Math.abs(seed) % BADGES.length];
}

function itemTitle(item: RailItem) {
  return item.kind === "movie"
    ? (item.data as TmdbMovie).title
    : (item.data as TmdbSeries).name;
}

function itemHref(item: RailItem) {
  return item.kind === "movie" ? `/movie/${item.data.id}` : `/tv/${item.data.id}`;
}

function itemYear(item: RailItem) {
  return item.kind === "movie"
    ? movieYear(item.data as TmdbMovie)
    : seriesYear(item.data as TmdbSeries);
}

export default function HorizontalRail({
  title,
  viewAllHref,
  items,
  loading = false,
}: {
  title: string;
  viewAllHref?: string;
  items: RailItem[];
  loading?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = () => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    updateArrows();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [items]);

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({
      left: dir * (scroller.current.clientWidth * 0.7),
      behavior: "smooth",
    });
  };

  return (
    <section className="py-6">
      <div className="container">
        {/* section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Play className="h-4 w-4 fill-current" />
            </span>
            <h2 className="font-display font-black text-xl md:text-2xl text-foreground">
              {title}
            </h2>
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-sm font-semibold text-gold hover:text-foreground transition-colors"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* scrollable track */}
        <div className="relative">
          {canLeft && (
            <button
              aria-label="Scroll left"
              onClick={() => scrollBy(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center hover:text-gold active:scale-[0.95] transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {canRight && (
            <button
              aria-label="Scroll right"
              onClick={() => scrollBy(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center hover:text-gold active:scale-[0.95] transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div
            ref={scroller}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
          >
            {loading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="shrink-0 w-[120px] sm:w-[165px]">
                    <MarqueeSkeleton className="h-[200px] sm:h-[280px] w-full" />
                    <MarqueeSkeleton className="h-4 w-3/4 mt-2.5" />
                    <MarqueeSkeleton className="h-3 w-1/2 mt-2" />
                  </div>
                ))
              : items.map((item, i) => (
                  <RailCard key={`${item.kind}-${item.data.id}`} item={item} index={i} />
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RailCard({ item, index = 0 }: { item: RailItem; index?: number }) {
  const [genres, setGenres] = useState<string[]>([]);
  const title = itemTitle(item);
  const year = itemYear(item);
  const rating = item.data.vote_average;
  const poster = posterUrl(item.data.poster_path);
  const badge = badgeFor(item, index);

  useEffect(() => {
    let cancelled = false;
    if (item.kind === "movie" && (item.data as TmdbMovie).genre_ids?.length) {
      getGenres().then((g) => {
        if (cancelled) return;
        const ids = (item.data as TmdbMovie).genre_ids;
        setGenres(ids.slice(0, 2).map((id) => g.find((x) => x.id === id)?.name ?? ""));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [item]);

  return (
    <div
      className="group relative shrink-0 w-[120px] sm:w-[165px] snap-start"
      style={{
        animationDelay: `${index * 40}ms`,
        animation: "fadeUp 320ms var(--ease-out) both",
      }}
    >
      <Link href={itemHref(item)} className="block">
        <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-secondary [&>*:first-child]:object-cover">
          {poster ? (
            <img
              src={poster}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Play className="h-8 w-8" />
            </div>
          )}
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded bg-black/75 text-gold border border-gold/40 backdrop-blur-sm">
            {badge}
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="absolute bottom-2 left-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-black/60 backdrop-blur-sm rounded px-2 py-1">
              <Play className="h-3 w-3 text-gold" />
              Watch via Telegram
            </span>
          </div>
        </div>

        <h3 className="mt-2.5 text-sm font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.6em]">
          {title}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
          {rating > 0 && (
            <span className="inline-flex items-center gap-1 rounded border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-gold font-semibold">
              <Star className="h-3 w-3 fill-current" />
              {rating.toFixed(1)}
            </span>
          )}
          {year && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {year}
            </span>
          )}
          {genres.length > 0 && (
            <span className="truncate">{genres.join(", ")}</span>
          )}
        </div>
      </Link>
      <FavoriteButton
        item={item.kind === "movie" ? favoriteFromMovie(item.data as TmdbMovie) : favoriteFromSeries(item.data as TmdbSeries)}
        iconOnly
        className="absolute right-2 top-2 z-10 h-7 w-7 rounded-full p-0 bg-background/75 backdrop-blur-sm"
      />
    </div>
  );
}
