/*
 * MIDNIGHT MARQUEE — personal watchlist page.
 * A local-only ticket wallet for saved movies and series, with no account wall.
 */
import { Heart, Search } from "lucide-react";
import { Link } from "wouter";
import SiteLayout from "@/components/SiteLayout";
import MovieCard from "@/components/MovieCard";
import SeriesCard from "@/components/SeriesCard";
import { Button } from "@/components/ui/button";
import {
  favoriteToMovie,
  favoriteToSeries,
  useFavorites,
} from "@/hooks/useFavorites";

export default function Favorites() {
  const { favorites } = useFavorites();
  const movies = favorites.filter((item) => item.kind === "movie");
  const series = favorites.filter((item) => item.kind === "series");

  return (
    <SiteLayout>
      <div className="container py-10 pb-16">
        <header className="mb-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.28em] text-gold font-semibold mb-3">
            Your ticket wallet
          </p>
          <div className="flex items-center gap-3">
            <Heart className="h-7 w-7 text-gold fill-gold/20" />
            <h1 className="font-display font-black text-3xl md:text-4xl text-foreground">
              Favorites
            </h1>
          </div>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Save the titles you want to find again. Your watchlist stays on this
            browser, ready for the next screening.
          </p>
        </header>

        {favorites.length === 0 ? (
          <div className="border border-dashed border-primary/40 bg-card/60 px-6 py-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-gold/70" />
            <h2 className="mt-5 font-display font-bold text-2xl text-foreground">
              Your marquee is waiting
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Tap the heart on any movie or series poster to build your personal
              watchlist.
            </p>
            <Link href="/">
              <Button className="marquee-chip mt-6 gap-2 bg-primary text-primary-foreground">
                <Search className="h-4 w-4" />
                Browse the catalogue
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {movies.length > 0 && (
              <section>
                <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
                  <h2 className="font-display font-bold text-2xl text-foreground">Movies</h2>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {movies.length} saved
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-8">
                  {movies.map((item, index) => (
                    <MovieCard key={`${item.kind}-${item.id}`} movie={favoriteToMovie(item)} index={index} />
                  ))}
                </div>
              </section>
            )}

            {series.length > 0 && (
              <section>
                <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
                  <h2 className="font-display font-bold text-2xl text-foreground">Series</h2>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {series.length} saved
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-8">
                  {series.map((item, index) => (
                    <SeriesCard key={`${item.kind}-${item.id}`} series={favoriteToSeries(item)} index={index} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

