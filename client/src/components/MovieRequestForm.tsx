/*
 * CINE LINK — public, name-only movie request form.
 * MIDNIGHT TEAL & EMERALD: a compact ticket-like request prompt that never
 * exposes Telegram or database credentials to the browser.
 */
import { FormEvent, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

type MovieRequestFormProps = {
  variant?: "footer" | "inline";
};

const REQUEST_COOLDOWN_KEY = "cinelink:movie-request:last-submitted-at";
const REQUEST_COOLDOWN_MS = 60_000;

export default function MovieRequestForm({ variant = "footer" }: MovieRequestFormProps) {
  const [title, setTitle] = useState("");
  const [website, setWebsite] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const submitRequest = trpc.movieRequests.submit.useMutation({
    onSuccess: (result) => {
      window.localStorage.setItem(REQUEST_COOLDOWN_KEY, String(Date.now()));
      setTitle("");
      setFeedback(
        result.duplicate
          ? "This title is already on our request list. We updated its demand count."
          : "Your movie request has been sent to CineLink.",
      );
    },
    onError: (error) => setFeedback(error.message),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2) {
      setFeedback("Please enter a movie name with at least 2 characters.");
      return;
    }

    const lastSubmittedAt = Number(window.localStorage.getItem(REQUEST_COOLDOWN_KEY) || 0);
    const remainingSeconds = Math.ceil((REQUEST_COOLDOWN_MS - (Date.now() - lastSubmittedAt)) / 1000);
    if (remainingSeconds > 0) {
      setFeedback(`Please wait ${remainingSeconds} seconds before sending another request.`);
      return;
    }

    submitRequest.mutate({ title: trimmedTitle, website });
  };

  const isFooter = variant === "footer";
  return (
    <form
      onSubmit={handleSubmit}
      className={
        isFooter
          ? "marquee-request-panel w-full max-w-xl rounded-2xl border border-primary/25 bg-background/45 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.18)]"
          : "marquee-request-panel mt-5 max-w-xl rounded-xl border border-primary/20 bg-card/60 p-4"
      }
    >
      <p className="detail-kicker">REQUEST THE NEXT SHOW</p>
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-semibold text-foreground" htmlFor={`movie-request-${variant}`}>
          Movie name
          <Input
            id={`movie-request-${variant}`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={180}
            required
            placeholder="e.g. Inception"
            className="mt-2 h-10 bg-background/70 text-foreground placeholder:text-muted-foreground"
            disabled={submitRequest.isPending}
          />
        </label>
        <Button
          type="submit"
          disabled={submitRequest.isPending}
          className="marquee-chip teal-cta-glow h-10 shrink-0 bg-primary px-4 font-semibold text-primary-foreground active:scale-[0.97]"
        >
          {submitRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send request
        </Button>
      </div>
      <input
        aria-hidden="true"
        autoComplete="off"
        className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px opacity-0"
        name="website"
        tabIndex={-1}
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
      />
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Just the title is enough. CineLink will review your request; no account or contact details are needed.
      </p>
      {feedback ? (
        <p role="status" className="mt-3 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-medium leading-relaxed text-foreground">
          {feedback}
        </p>
      ) : null}
    </form>
  );
}
