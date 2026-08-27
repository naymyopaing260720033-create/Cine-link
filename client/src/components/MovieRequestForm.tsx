/*
 * CINE LINK — public Movie/Series request modal.
 * MIDNIGHT TEAL & EMERALD: a ticket-like request prompt that never
 * exposes Telegram or database credentials to the browser.
 */
import { FormEvent, useState } from "react";
import { Film, Loader2, Send, Tv } from "lucide-react";
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
import { trpc } from "@/lib/trpc";

type MovieRequestFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const REQUEST_COOLDOWN_KEY = "cinelink:movie-request:last-submitted-at";
const REQUEST_COOLDOWN_MS = 60_000;

type RequestType = "movie" | "series";

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
  const submitRequest = trpc.movieRequests.submit.useMutation({
    onSuccess: (result) => {
      window.localStorage.setItem(REQUEST_COOLDOWN_KEY, String(Date.now()));
      setTitle("");
      setDescription("");
      setFeedback(
        result.duplicate
          ? `ဤ ${requestTypeCopy[requestType].singular} သည် request list တွင်ရှိပြီးသားဖြစ်၍ demand count ကို update လုပ်ပြီးပါပြီ။`
          : `${requestTypeCopy[requestType].singular} request ကို CineLink သို့ပို့ပြီးပါပြီ။`,
      );
    },
    onError: (error) => setFeedback(error.message),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
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
            onValueChange={(value) => setRequestType(value as RequestType)}
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
              onChange={(event) => setTitle(event.target.value)}
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
          <Button type="submit" disabled={submitRequest.isPending} className="marquee-chip teal-cta-glow h-11 w-full bg-primary text-base font-bold text-primary-foreground active:scale-[0.97]">
            {submitRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            တောင်းဆိုမည်
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
