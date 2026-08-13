/*
 * MIDNIGHT MARQUEE — poster-led movie card.
 * Hover: scale 1.04 + amber rim glow (signature). Golden rating badge.
 */
import { Link } from "wouter";
import { Star, Play } from "lucide-react";
import type { TmdbMovie } from "@/lib/tmdb";
import { posterUrl } from "@/lib/tmdb";

export default function MovieCard({
  movie,
  index = 0,
}: {
  movie: TmdbMovie;
  index?: number;
}) {
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;
  const poster = posterUrl(movie.poster_path);

  return (
    <Link
      href={`/movie/${movie.id}`}
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
            alt={movie.title}
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
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-gold font-semibold">
            <Star className="h-3 w-3 fill-gold" />
            {movie.vote_average > 0 ? movie.vote_average.toFixed(1) : "—"}
          </span>
          {year && <span>{year}</span>}
        </div>
      </div>
    </Link>
  );
}

export function MovieRailTitle({
  title,
  accent,
}: {
  title: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {accent && (
        <span className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
      )}
      <h2 className="font-display font-bold text-lg md:text-xl text-foreground tracking-wide">
        {title}
      </h2>
      {!accent && (
        <span className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
      )}
    </div>
  );
}
