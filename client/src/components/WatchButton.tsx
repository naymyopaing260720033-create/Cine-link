/*
 * MIDNIGHT MARQUEE — signature "Watch on Telegram" marquee chip.
 * Amber fill, dark ink text, corner notches, subtle glow on hover.
 * Links to the configured bot (optionally with a deep-link payload).
 */
import { Send, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  loadConfig,
  telegramDeepLink,
  telegramStartLink,
} from "@/lib/config";

export default function WatchButton({
  movieId,
  movieTitle,
  size = "lg",
  // note: button size prop accepts 'lg' | 'default' | 'sm' (others mapped below)
  variant = "solid",
  className = "",
}: {
  movieId?: number;
  movieTitle: string;
  size?: "lg" | "md" | "sm";
  variant?: "solid" | "outline";
  className?: string;
}) {
  const cfg = loadConfig();
  const [copied, setCopied] = useState(false);

  const href = movieId
    ? telegramStartLink(cfg.telegramBotUsername, movieId)
    : telegramDeepLink(cfg.telegramBotUsername, cfg.telegramMessage);

  const sendCommand = movieId ? `/movie ${movieId}` : `/movie`;

  const btnSize =
    size === "lg" ? ("lg" as const) : size === "md" ? ("default" as const) : ("sm" as const);
  const sizes = {
    lg: "px-8 py-4 text-base",
    md: "px-6 py-3 text-sm",
    sm: "px-4 py-2 text-xs",
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sendCommand);
      setCopied(true);
      toast.success("Command copied — paste it into Telegram");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  if (variant === "outline") {
    return (
      <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
        <a href={href} target="_blank" rel="noreferrer">
          <Button
            size={btnSize}
            variant="outline"
            className={`marquee-chip border-primary/60 text-primary hover:bg-primary/10 active:scale-[0.97] ${className}`}
          >
            <Send className="h-4 w-4" />
            Open Telegram
          </Button>
        </a>
        <Button
          size={btnSize}
          variant="outline"
          className="border-border text-muted-foreground hover:text-foreground hover:bg-accent active:scale-[0.97]"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-gold" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Copy command
        </Button>
      </div>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-block">
              <Button
        size={btnSize}
        className={`marquee-chip bg-primary text-primary-foreground font-bold gap-2.5 hover:shadow-[0_0_28px_oklch(0.78_0.15_70/0.4)] hover:brightness-105 active:scale-[0.97] transition-all duration-200 ${sizes[size]} ${className}`}
      >
        <Send className="h-4.5 w-4.5" />
        Watch on Telegram
      </Button>
    </a>
  );
}

export function WatchInstructions({ movieId }: { movieId?: number }) {
  const cmd = movieId ? `/movie ${movieId}` : "/movie";
  return (
    <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
      <span>Or send</span>
      <code className="bg-secondary text-gold px-2 py-0.5 rounded font-mono text-[0.8rem] select-all">
        {cmd}
      </code>
      <span>to the bot to get this movie's stream link.</span>
    </div>
  );
}
