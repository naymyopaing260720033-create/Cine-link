/*
 * MIDNIGHT MARQUEE — shimmering skeleton wrapper.
 * Applies the amber shimmer sweep to any block, keeping the cinematic mood
 * alive while TMDB data is fetching.
 */
import { cn } from "@/lib/utils";

export default function MarqueeSkeleton({
  className,
  pulse = false,
}: {
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "block skeleton-shimmer rounded-md bg-secondary",
        pulse && "pulse-subtle",
        className,
      )}
      aria-hidden
    />
  );
}

/** Full-page center loader: flickering projector bulb + optional label. */
export function ProjectorLoader({
  label = "Loading the programme…",
}: {
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <span className="projector-loader text-sm font-semibold text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
