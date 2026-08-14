/*
 * MIDNIGHT MARQUEE — Series detail.
 * Same split layout as movie detail; seasons/episodes metadata instead of runtime.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import {
  Star,
  Calendar,
  Play,
  ArrowLeft,
  Loader2,
  Clapperboard,
} from "lucide-react";
import MarqueeSkeleton from "@/components/MarqueeSkeleton";
import SiteLayout from "@/components/SiteLayout";
import ApiKeyBanner, { useApiKeyMissing } from "@/components/ApiKeyBanner";
import TrailerPanel from "@/components/TrailerPanel";
import WatchButton from "@/components/WatchButton";
import FavoriteButton from "@/components/FavoriteButton";
import { favoriteFromSeries } from "@/hooks/useFavorites";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import SeriesCard from "@/components/SeriesCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSeries,
  getSeriesSeason,
  getTrendingSeries,
  posterUrl,
  profileUrl,
  fetchWithError,
  type TmdbEpisode,
  type TmdbSeasonDetail,
  type TmdbSeries,
  type TmdbSeriesDetail,
} from "@/lib/tmdb";

export default function TvDetail() {
  const { id } = useParams<{ id: string }>();
  const seriesId = Number(id);
  const [series, setSeries] = useState<TmdbSeriesDetail | null>(null);
  const [more, setMore] = useState<TmdbSeries[]>([]);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
  const [season, setSeason] = useState<TmdbSeasonDetail | null>(null);
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState<number | null>(null);
  const [hasUserSelectedEpisode, setHasUserSelectedEpisode] = useState(false);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [seasonError, setSeasonError] = useState(false);
  const [loading, setLoading] = useState(true);
  const restoreTarget = useRef<{ seasonNumber: number; episodeNumber: number } | null>(null);
  const { entry: continueEntry, save: saveContinueWatching } = useContinueWatching();
  const noKey = useApiKeyMissing();
  const selectedEpisode: TmdbEpisode | undefined = season?.episodes.find(
    (episode) => episode.episode_number === selectedEpisodeNumber,
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchWithError(() => getSeries(seriesId)),
      fetchWithError(getTrendingSeries),
    ])
      .then(([data, trend]) => {
        if (cancelled) return;
        setSeries(data);
        setMore(trend.results.filter((s) => s.id !== seriesId).slice(0, 12));
        window.scrollTo(0, 0);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  useEffect(() => {
    if (!series) return;
    const firstSeason =
      series.seasons?.find((item) => item.season_number > 0) ?? series.seasons?.[0];
    const params = new URLSearchParams(window.location.search);
    const requestedSeason = Number(params.get("season"));
    const requestedEpisode = Number(params.get("episode"));
    const savedSeason = continueEntry?.seriesId === series.id
      ? continueEntry.seasonNumber
      : null;
    const savedEpisode = continueEntry?.seriesId === series.id
      ? continueEntry.episodeNumber
      : null;
    const requestedSeasonOption = series.seasons?.find(
      (item) => item.season_number === requestedSeason,
    );
    const savedSeasonOption = series.seasons?.find(
      (item) => item.season_number === savedSeason,
    );
    const seasonNumber =
      requestedSeasonOption?.season_number ??
      savedSeasonOption?.season_number ??
      firstSeason?.season_number ??
      null;

    restoreTarget.current = {
      seasonNumber: seasonNumber ?? 0,
      episodeNumber: requestedEpisode || savedEpisode || 0,
    };
    setHasUserSelectedEpisode(Boolean(requestedSeason || requestedEpisode));
    setSelectedSeasonNumber(seasonNumber);
  }, [series?.id]);

  useEffect(() => {
    if (!series || selectedSeasonNumber === null) {
      setSeason(null);
      setSelectedEpisodeNumber(null);
      return;
    }

    let cancelled = false;
    setSeasonLoading(true);
    setSeasonError(false);
    setSeason(null);
    setSelectedEpisodeNumber(null);

    fetchWithError(() => getSeriesSeason(series.id, selectedSeasonNumber))
      .then((data) => {
        if (cancelled) return;
        setSeason(data);
        const target = restoreTarget.current;
        const restoredEpisode = target?.seasonNumber === selectedSeasonNumber
          ? data.episodes.find((episode) => episode.episode_number === target.episodeNumber)
          : undefined;
        setSelectedEpisodeNumber(
          restoredEpisode?.episode_number ?? data.episodes[0]?.episode_number ?? null,
        );
        restoreTarget.current = null;
      })
      .catch(() => {
        if (!cancelled) setSeasonError(true);
      })
      .finally(() => {
        if (!cancelled) setSeasonLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [series, selectedSeasonNumber]);

  useEffect(() => {
    if (
      !hasUserSelectedEpisode ||
      !series ||
      !selectedEpisode ||
      selectedSeasonNumber === null
    ) return;
    if (continueEntry?.seriesId === series.id && continueEntry.updatedAt > 0) {
      const isRestoredSelection =
        continueEntry.seasonNumber === selectedSeasonNumber &&
        continueEntry.episodeNumber === selectedEpisode.episode_number;
      if (isRestoredSelection) return;
    }

    saveContinueWatching({
      seriesId: series.id,
      seriesTitle: series.name,
      posterPath: series.poster_path,
      seasonNumber: selectedSeasonNumber,
      episodeNumber: selectedEpisode.episode_number,
      episodeName: selectedEpisode.name || "Untitled episode",
      overview: selectedEpisode.overview || "",
      airDate: selectedEpisode.air_date,
    });
  }, [
    series?.id,
    series?.name,
    series?.poster_path,
    selectedSeasonNumber,
    selectedEpisode?.id,
    hasUserSelectedEpisode,
  ]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-12 grid md:grid-cols-[320px_1fr] gap-10">
          <MarqueeSkeleton className="h-[480px] w-full" />
          <div className="space-y-4">
            <MarqueeSkeleton className="h-10 w-3/4" />
            <MarqueeSkeleton className="h-5 w-1/3" />
            <MarqueeSkeleton className="h-24 w-full" />
            <MarqueeSkeleton className="h-12 w-1/2" />
            <MarqueeSkeleton className="h-6 w-1/4" />
            <MarqueeSkeleton className="h-6 w-1/5" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!series) {
    return (
      <SiteLayout>
        <div className="container py-24 text-center space-y-4">
          {noKey ? (
            <div className="max-w-2xl mx-auto">
              <ApiKeyBanner />
            </div>
          ) : (
            <>
              <p className="font-display font-bold text-xl">
                This series went missing
              </p>
              <p className="text-sm text-muted-foreground">
                We couldn't find that show on the marquee.
              </p>
              <Link href="/" className="text-sm text-gold hover:underline">
                ← Back home
              </Link>
            </>
          )}
        </div>
      </SiteLayout>
    );
  }

  const year = series.first_air_date
    ? new Date(series.first_air_date).getFullYear()
    : null;
  const trailer = series.videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"),
  );
  const cast = series.credits?.cast?.slice(0, 6) ?? [];
  const seasonLabel = (seasonNumber: number) =>
    seasonNumber === 0 ? "Specials" : `Season ${seasonNumber}`;

  return (
    <SiteLayout>
      {series.backdrop_path && (
        <div className="fixed inset-0 -z-10">
          <img
            src={posterUrl(series.backdrop_path)}
            alt=""
            className="w-full h-full object-cover opacity-20 blur-2xl"
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>
      )}

      <div
        className="container pt-10 pb-16"
        style={{ animation: "fadeUp 400ms var(--ease-out) both" }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>

        <div className="grid md:grid-cols-[320px_1fr] gap-10 md:gap-14">
          {/* poster rail */}
          <div className="shrink-0">
            <img
              src={posterUrl(series.poster_path, "w780") || ""}
              alt={series.name}
              className="rounded-lg shadow-2xl border border-border w-full max-w-[320px] mx-auto"
            />
            <div className="mt-5">
              <FavoriteButton item={favoriteFromSeries(series)} className="mb-3 w-full" />
              <WatchButton movieId={series.id} movieTitle={series.name} />
            </div>
          </div>

          {/* content zone */}
          <div className="space-y-6">
            {series.tagline && (
              <p className="text-sm italic text-gold font-display">
                "{series.tagline}"
              </p>
            )}
            <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl leading-tight">
              {series.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 text-gold font-semibold">
                <Star className="h-4 w-4 fill-gold" />
                {series.vote_average.toFixed(1)}
                <span className="text-muted-foreground/70 font-normal">
                  ({series.vote_count.toLocaleString()} votes)
                </span>
              </span>
              {year && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {year}
                </span>
              )}
              {series.number_of_seasons > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clapperboard className="h-4 w-4" />
                  {series.number_of_seasons} season
                  {series.number_of_seasons > 1 ? "s" : ""} ·{" "}
                  {series.number_of_episodes} episodes
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {series.genres.map((g) => (
                <span
                  key={g.id}
                  className="px-3 py-1 text-xs rounded-full border border-border text-muted-foreground"
                >
                  {g.name}
                </span>
              ))}
            </div>

            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              {series.overview || "No overview available."}
            </p>

            {/* trailer */}
            <TrailerPanel title={series.name} trailerKey={trailer?.key} />

            {/* season and episode picker */}
            <section className="pt-6 border-t border-border space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-gold font-semibold">
                    Series picker
                  </p>
                  <h2 className="font-display font-bold text-xl mt-1">
                    Choose a season & episode
                  </h2>
                </div>
                {(series.seasons?.length ?? 0) > 0 && (
                  <Select
                    value={
                      selectedSeasonNumber === null
                        ? undefined
                        : String(selectedSeasonNumber)
                    }
                    onValueChange={(value) => {
                      setHasUserSelectedEpisode(true);
                      setSelectedSeasonNumber(Number(value));
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[190px] border-primary/40 bg-secondary/40">
                      <SelectValue placeholder="Choose season" />
                    </SelectTrigger>
                    <SelectContent>
                      {series.seasons?.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={String(item.season_number)}
                        >
                          {seasonLabel(item.season_number)} · {item.episode_count} eps
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {(series.seasons?.length ?? 0) === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-5 text-sm text-muted-foreground">
                  Episode information is not available for this series yet.
                </div>
              ) : seasonLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <MarqueeSkeleton key={index} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : seasonError ? (
                <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-5 text-sm text-muted-foreground">
                  We couldn't load this season's episodes. Please try another season.
                </div>
              ) : season?.episodes.length ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {season.episodes.map((episode, index) => {
                      const isSelected =
                        episode.episode_number === selectedEpisodeNumber;
                      return (
                        <button
                          key={episode.id}
                          type="button"
                          onClick={() => {
                            setHasUserSelectedEpisode(true);
                            setSelectedEpisodeNumber(episode.episode_number);
                          }}
                          className={`text-left rounded-lg border p-3 transition-all duration-200 active:scale-[0.98] ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-[0_0_22px_oklch(0.78_0.15_70/0.12)]"
                              : "border-border bg-secondary/20 hover:border-primary/50 hover:bg-secondary/40"
                          }`}
                          style={{ animation: `fadeUp 320ms var(--ease-out) ${index * 35}ms both` }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`font-mono text-xs font-semibold ${
                                isSelected ? "text-gold" : "text-muted-foreground"
                              }`}
                            >
                              E{String(episode.episode_number).padStart(2, "0")}
                            </span>
                            {episode.air_date && (
                              <span className="text-[0.65rem] text-muted-foreground truncate">
                                {new Date(episode.air_date).getFullYear()}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm font-semibold line-clamp-2 min-h-10">
                            {episode.name || "Untitled episode"}
                          </p>
                          {episode.vote_average > 0 && (
                            <span className="mt-2 inline-flex items-center gap-1 text-xs text-gold">
                              <Star className="h-3 w-3 fill-gold" />
                              {episode.vote_average.toFixed(1)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedEpisode && selectedSeasonNumber !== null && (
                    <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[0.68rem] uppercase tracking-[0.2em] text-gold font-semibold">
                            Selected episode
                          </p>
                          <h3 className="font-display font-bold text-lg mt-1 truncate">
                            E{String(selectedEpisode.episode_number).padStart(2, "0")} · {selectedEpisode.name}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed mt-2 max-w-2xl line-clamp-3">
                            {selectedEpisode.overview || "No episode synopsis available."}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                            {selectedEpisode.air_date && (
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(selectedEpisode.air_date).toLocaleDateString()}
                              </span>
                            )}
                            {selectedEpisode.runtime && (
                              <span>{selectedEpisode.runtime} min</span>
                            )}
                          </div>
                        </div>
                        <WatchButton
                          movieId={series.id}
                          movieTitle={`${series.name} — ${selectedEpisode.name}`}
                          mediaType="series"
                          seasonNumber={selectedSeasonNumber}
                          episodeNumber={selectedEpisode.episode_number}
                          size="md"
                          className="w-full sm:w-auto shrink-0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-5 text-sm text-muted-foreground">
                  No episodes are listed for this season yet.
                </div>
              )}
            </section>

            {/* cast */}
            {cast.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="font-display font-bold text-lg mb-4">Cast</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {cast.map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      {c.profile_path ? (
                        <img
                          src={profileUrl(c.profile_path)}
                          alt={c.name}
                          className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0 text-muted-foreground">
                          <Play className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.character}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* More series */}
        {more.length > 0 && (
          <div className="mt-16 pt-10 border-t border-border">
            <h2 className="font-display font-bold text-xl mb-6">
              More to Watch
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-8">
              {more.map((s, i) => (
                <SeriesCard key={s.id} series={s} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
