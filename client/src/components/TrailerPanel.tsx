/*
 * MIDNIGHT MARQUEE — Trailer panel.
 * Compact amber controls, dark cinema surfaces, and a calm empty state for titles
 * without an official YouTube trailer.
 */
import { useState } from "react";
import { VideoOff, Youtube, X } from "lucide-react";

type TrailerPanelProps = {
  title: string;
  trailerKey?: string;
};

export default function TrailerPanel({ title, trailerKey }: TrailerPanelProps) {
  const [showTrailer, setShowTrailer] = useState(false);

  if (!trailerKey) {
    return (
      <div className="flex max-w-3xl items-start gap-3 rounded-xl border border-border bg-card/40 px-4 py-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-gold">
          <VideoOff className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Trailer unavailable</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            An official trailer is not available for this title yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        aria-expanded={showTrailer}
        onClick={() => setShowTrailer((current) => !current)}
        className="inline-flex items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-foreground"
      >
        {showTrailer ? <X className="h-4 w-4" /> : <Youtube className="h-4 w-4" />}
        {showTrailer ? "Close trailer" : "Watch trailer on this page"}
      </button>

      {showTrailer && (
        <div className="relative aspect-video max-w-3xl overflow-hidden rounded-xl border border-border bg-black shadow-2xl">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0`}
            title={`${title} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}
