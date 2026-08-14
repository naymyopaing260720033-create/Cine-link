/*
 * MIDNIGHT MARQUEE — favorite control.
 * A small amber heart acts like a cinema ticket stamp: quiet when unsaved,
 * warm and filled when the title is on the user's personal marquee.
 */
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFavorites, type FavoriteRecord } from "@/hooks/useFavorites";

export default function FavoriteButton({
  item,
  iconOnly = false,
  className,
}: {
  item: FavoriteRecord;
  iconOnly?: boolean;
  className?: string;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(item.kind, item.id);

  return (
    <button
      type="button"
      aria-label={saved ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`}
      title={saved ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`}
      aria-pressed={saved}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(item);
        toast(saved ? "Removed from your watchlist" : "Added to your watchlist", {
          description: item.title,
        });
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.97]",
        saved
          ? "border-primary/60 bg-primary/15 text-gold"
          : "border-border bg-background/80 text-muted-foreground hover:border-primary/60 hover:text-gold",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-current")} />
      {!iconOnly && (saved ? "Saved" : "Add to Favorites")}
    </button>
  );
}
