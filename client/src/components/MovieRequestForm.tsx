/*
 * CINE LINK — public Movie/Series request modal.
 * MIDNIGHT TEAL & EMERALD: a ticket-like request prompt that never
 * exposes Telegram or database credentials to the browser.
 */
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Film, Loader2, Send, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { getOrCreateBrowserRequestToken } from "@/lib/requestHistory";
import { posterUrl } from "@/lib/tmdb";
import { trpc } from "@/lib/trpc";

type MovieRequestFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const REQUEST_COOLDOWN_KEY = "cinelink:movie-request:last-submitted-at";
const REQUEST_COOLDOWN_MS = 60_000;

type RequestType = "movie" | "series";
type AvailableCatalogMatch = { kind: RequestType; tmdbId: number; title: string; posterPath: string | null; releaseDate: string | null };

const requestTypeCopy: Record<RequestType, { label: string; singular: string }> = {
  movie: { label: "ရုပ်ရှင် (Movie)", singular: "ရုပ်ရှင်" },
  series: { label: "စီးရီး (Series)", singular: "စီးရီး" },
};

export default function MovieRequestForm({ open, onOpenChange }: MovieRequestFormProps) {
  const [requestType, setRequestType] = useState<RequestType>("movie");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [availableMatches, setAvailableMatches] = useState<AvailableCatalogMatch[]>([]);

  // Instant catalog lookup while typing
  const [debouncedTitle, setDebouncedTitle] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTitle(title.trim()), 600);
    return () => clearTimeout(timer);
  }, [title]);

  const lookup = trpc.movieRequests.lookupCatalog.useQuery(
    { title: debouncedTitle, type: requestType },
    { enabled: debouncedTitle.length >= 2 },
  );

  useEffect(() => {
    if (lookup.data && lookup.data.length > 0) {
      setAvailableMatches(lookup.data);
    } else if (debouncedTitle.length >= 2) {
      // If we looked it up and found nothing, clear previous matches
      setAvailableMatches([]);
    }
  }, [lookup.data, debouncedTitle]);

  const submitRequest = trpc.movieRequests.submit.useMutation({
    onSuccess: (result) => {
      if (result.resolution === "available") {
        setAvailableMatches(result.matches);
        setFeedback("တောင်းဆိုထားသော ဇာတ်ကားသည် CineLink တွင်ရှိပြီးသားဖြစ်ပါသည်။ အောက်မှရွေးပြီးကြည့်နိုင်ပါသည်။");
        return;
      }
      window.localStorage.setItem(REQUEST_COOLDOWN_KEY, String(Date.now()));
      setTitle("");
      setDescription("");
      setAvailableMatches([]);
      setFeedback(
        result.duplicate
          ? `ဤ ${requestTypeCopy[requestType].singular} သည် request list တွင်ရှိပြီးသားဖြစ်၍ demand count ကို update လုပ်ပြီးပါပြီ။`
          : `${requestTypeCopy[requestType].singular} request ကို CineLink သို့ပို့ပြီးပါပြီ။`,
      );
    },
    onError: (error) => {
      setAvailableMatches([]);
      setFeedback(error.message);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setAvailableMatches([]);
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2) {
      setFeedback("ဇာတ်ကားအမည်ကို အနည်းဆုံး စာလုံး ၂ လုံးဖြင့်ထည့်ပေးပါ။");
      return;
    }

    const lastSubmittedAt = Number(window.localStorage.getItem(REQUEST_COOLDOWN_KEY) || 0);
    const remainingSeconds = Math.ceil((REQUEST_COOLDOWN_MS - (Date.now() - lastSubmittedAt)) / 1000);
    if (remainingSeconds > 0) {
      setFeedback(`နောက် request တစ်ခုမပို့မီ ${remainingSeconds} စက္ကန့်စောင့်ပေးပါ။`);
      return;
    }

    submitRequest.mutate({
      title: trimmedTitle,
      type: requestType,
      description: description.trim() || undefined,
      browserToken: getOrCreateBrowserRequestToken(),
      website,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto border-primary/30 bg-card p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-5 pb-4 pt-5 text-left sm:px-6">
          <p className="detail-kicker">REQUEST THE NEXT SHOW</p>
          <DialogTitle className="text-2xl font-bold text-foreground">ဇာတ်ကား တောင်းဆိုရန်</DialogTitle>
          <DialogDescription className="leading-relaxed">Movie သို့မဟုတ် Series ကိုရွေးပြီး အမည်ပေးပို့ပါ။ Account နှင့်အဆက်အသွယ်အချက်အလက် မလိုအပ်ပါ။</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 px-5 pb-6 sm:px-6">
          <RadioGroup
            value={requestType}
            onValueChange={(value) => {
              setRequestType(value as RequestType);
              setAvailableMatches([]);
              setFeedback(null);
            }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
            aria-label="Request type"
            disabled={submitRequest.isPending}
          >
            {(["movie", "series"] as const).map((type) => {
              const selected = requestType === type;
              const Icon = type === "movie" ? Film : Tv;
              return (
                <label key={type} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${selected ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background/45 text-muted-foreground hover:border-primary/55"}`}>
                  <RadioGroupItem value={type} aria-label={requestTypeCopy[type].label} />
                  <Icon className={`h-5 w-5 ${selected ? "text-primary" : "text-gold"}`} />
                  <span className="font-semibold">{requestTypeCopy[type].label}</span>
                </label>
              );
            })}
          </RadioGroup>

          <label className="block text-sm font-semibold text-foreground" htmlFor="request-title">
            ဇာတ်ကားအမည် <span className="text-destructive">*</span>
            <Input
              id="request-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setAvailableMatches([]);
              }}
              maxLength={180}
              required
              placeholder={requestType === "movie" ? "ဥပမာ — Inception (2010)" : "ဥပမာ — Dark Season 3"}
              className="mt-2 h-11 bg-background/70 text-base text-foreground placeholder:text-muted-foreground"
              disabled={submitRequest.isPending}
            />
          </label>

          <label className="block text-sm font-semibold text-foreground" htmlFor="request-description">
            အခြားအချက်အလက် <span className="font-normal text-muted-foreground">(မထည့်လည်းရ)</span>
            <Textarea
              id="request-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={600}
              placeholder="ဥပမာ — မြန်မာစာတန်းထိုး/မြန်မာအသံထွက်၊ season/episode စသည်ဖြင့်ရေးနိုင်ပါသည်။"
              className="mt-2 min-h-28 resize-y bg-background/70 text-base text-foreground placeholder:text-muted-foreground"
              disabled={submitRequest.isPending}
            />
          </label>
          <input
            aria-hidden="true"
            autoComplete="off"
            className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px opacity-0"
            name="website"
            tabIndex={-1}
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">Request အသစ်တစ်ခုကို private CineLink request queue သို့သာပို့ပါမည်။ ထပ်တူ request များသည် demand count ကိုသာတိုးပေးပါမည်။</p>
          {feedback ? <p role="status" className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2.5 text-sm font-medium leading-relaxed text-foreground">{feedback} <a href="/requests" className="ml-1 font-bold text-primary underline underline-offset-2 hover:text-gold">မိမိတောင်းဆိုမှုများ</a></p> : null}
          {availableMatches.length ? (
            <div className="space-y-2 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-300">ဤဇာတ်ကားသည် CineLink တွင် ရှိပြီးသားဖြစ်ပါသည်</p>
              {availableMatches.map((match) => (
                <a key={`${match.kind}-${match.tmdbId}`} href={match.kind === "movie" ? `/movie/${match.tmdbId}` : `/tv/${match.tmdbId}`} onClick={() => onOpenChange(false)} className="group flex items-center gap-3 rounded-lg border border-border/70 bg-background/55 p-2.5 transition-colors hover:border-primary/60 hover:bg-accent">
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded border border-border bg-secondary">
                    {match.posterPath ? <img src={posterUrl(match.posterPath, "w342") || ""} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-secondary" />}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-foreground">{match.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{match.kind === "movie" ? "Movie" : "Series"}{match.releaseDate ? ` · ${match.releaseDate.slice(0, 4)}` : ""}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                </a>
              ))}
            </div>
          ) : null}
          <Button type="submit" disabled={submitRequest.isPending || availableMatches.length > 0} className="marquee-chip teal-cta-glow h-11 w-full bg-primary text-base font-bold text-primary-foreground active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed">
            {submitRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {availableMatches.length > 0 ? "ရှိပြီးသားဖြစ်ပါသည်" : "တောင်းဆိုမည်"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
