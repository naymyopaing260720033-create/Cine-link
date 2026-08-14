/*
 * MIDNIGHT MARQUEE — shared layout.
 * Fixed top nav (amber CineLink wordmark + logo), Telegram CTA chip in header.
 * Footer with marquee branding. Amber accents stay sparse & deliberate.
 */
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Search, Send, Menu, X, Heart, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadConfig } from "@/lib/config";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";
import { useTheme } from "@/contexts/ThemeContext";

const LOGO = "/manus-storage/cinelink-logo_12bdb54e.png";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const cfg = loadConfig();
  const { favorites } = useFavorites();
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const themeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/search", label: "Movies" },
    { href: "/search?type=tv", label: "Series" },
  ];

  const isNavItemActive = (href: string) => {
    if (href === "/") return location === "/";
    if (href === "/search") return location === "/search";
    return location.startsWith("/search?type=tv");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src={LOGO}
              alt="CineLink logo"
              className="h-9 w-9 object-contain"
            />
            <span className="font-display font-black text-xl tracking-tight text-foreground">
              Cine<span className="text-gold">Link</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors duration-150 ${
                  isNavItemActive(item.href)
                    ? "text-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/favorites"
              aria-label={`Favorites${favorites.length ? ` (${favorites.length})` : ""}`}
              className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                location === "/favorites"
                  ? "text-gold bg-accent"
                  : "text-muted-foreground hover:text-gold"
              }`}
            >
              <Heart className="h-4.5 w-4.5" />
              {favorites.length > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-bold leading-4 text-primary-foreground">
                  {favorites.length > 9 ? "9+" : favorites.length}
                </span>
              )}
            </Link>
            <Link href="/search">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search movies"
                className="text-muted-foreground hover:text-gold"
              >
                <Search className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label={themeLabel}
              aria-pressed={theme === "light"}
              title={themeLabel}
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-gold"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </Button>
            <a
              href={`https://t.me/${cfg.telegramBotUsername}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button
                size="sm"
                className="marquee-chip bg-primary text-primary-foreground font-semibold gap-1.5 hover:shadow-[0_0_20px_oklch(0.78_0.15_70/0.35)] transition-shadow duration-200 active:scale-[0.97]"
              >
                <Send className="h-3.5 w-3.5" />
                Telegram
              </Button>
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-foreground"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
            <div className="container py-3 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`py-2.5 px-2 rounded-md text-sm font-medium ${
                    isNavItemActive(item.href)
                      ? "text-gold bg-accent"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={toggleTheme}
                aria-pressed={theme === "light"}
                className="flex items-center gap-2 rounded-md px-2 py-2.5 text-left text-sm font-medium text-foreground hover:bg-accent"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-gold" /> : <Moon className="h-4 w-4 text-gold" />}
                Use {nextTheme} mode
              </button>
              <a
                href={`https://t.me/${cfg.telegramBotUsername}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-2 text-sm font-semibold text-gold flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Watch on Telegram
              </a>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">{children}</main>

      <footer className="border-t border-border bg-card/60">
        <div className="container py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={LOGO} alt="" className="h-7 w-7 object-contain" />
            <span className="font-display font-bold text-foreground">
              Cine<span className="text-gold">Link</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Movie data by TMDB · Streams delivered via Telegram · This site is
            not affiliated with or endorsed by TMDB.
          </p>
        </div>
      </footer>
    </div>
  );
}
