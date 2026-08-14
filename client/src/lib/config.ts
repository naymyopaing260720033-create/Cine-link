/**
 * Midnight Marquee design — CineLink central configuration.
 *
 * EDIT THIS FILE to connect your own Telegram bot.
 * The site is fully static (no backend), so bot identity lives here.
 *
 * - TELEGRAM_BOT_USERNAME: your bot's username WITHOUT the @ (e.g. "MovieStreamBot")
 * - TELEGRAM_BOT_MESSAGE: default instruction shown to users
 *
 * A small in-browser admin panel (/admin) can also edit these values,
 * stored in localStorage for previewing (export/import JSON supported).
 */
export interface SiteConfig {
  telegramBotUsername: string;
  telegramMessage: string;
  customIntro: string;
}

export const DEFAULT_CONFIG: SiteConfig = {
  telegramBotUsername: "YourBotUsername", // <-- REPLACE with your real bot username
  telegramMessage:
    "Hi! I'd like to watch a movie. Please send me the streaming link.",
  customIntro: "",
};

export function loadConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem("cinelink-config");
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SiteConfig>;
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {
    /* use defaults */
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(cfg: SiteConfig) {
  localStorage.setItem("cinelink-config", JSON.stringify(cfg));
}

export function resetConfig() {
  localStorage.removeItem("cinelink-config");
}

export function telegramDeepLink(botUsername: string, message: string): string {
  const url = `https://t.me/${botUsername}`;
  return url;
}

export function telegramStartLink(botUsername: string, movieId: number): string {
  return `https://t.me/${botUsername}?start=movie_${movieId}`;
}

export function telegramSeriesStartLink(
  botUsername: string,
  seriesId: number,
  seasonNumber: number,
  episodeNumber: number,
): string {
  return `https://t.me/${botUsername}?start=series_${seriesId}_s${seasonNumber}_e${episodeNumber}`;
}
