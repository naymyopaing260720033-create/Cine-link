/*
 * MIDNIGHT MARQUEE — API key missing banner.
 * Shown in-site when VITE_TMDB_API_KEY is not set.
 * Explains in CineLink voice how to add a free TMDB key on Vercel.
 */
import { AlertTriangle, ExternalLink } from "lucide-react";
import { isApiKeyMissing } from "@/lib/tmdb";

export function useApiKeyMissing() {
  return isApiKeyMissing();
}

export default function ApiKeyBanner() {
  return (
    <div className="bg-card border border-primary/40 rounded-lg px-5 py-4 my-6 flex items-start gap-3 max-w-2xl">
      <AlertTriangle className="h-5 w-5 text-gold shrink-0 mt-0.5" />
      <div className="text-sm leading-relaxed">
        <p className="font-display font-bold text-foreground mb-1">
          The marquee lights are off — no TMDB API key yet.
        </p>
        <p className="text-muted-foreground mb-2">
          CineLink pulls its catalogue from{" "}
          <a
            href="https://developer.themoviedb.org/reference/introduction/getting-started"
            target="_blank"
            rel="noreferrer"
            className="text-gold hover:underline inline-flex items-center gap-1"
          >
            TMDB <ExternalLink className="h-3 w-3" />
          </a>
          . To turn the lights on: get a free key from TMDB, then add it in
          Vercel as{" "}
          <code className="bg-secondary text-gold px-1.5 py-0.5 rounded text-xs font-mono">
            VITE_TMDB_API_KEY
          </code>{" "}
          and redeploy.
        </p>
        <ol className="text-muted-foreground list-decimal list-inside space-y-0.5">
          <li>Sign up at themoviedb.org → Settings → API → request a key.</li>
          <li>
            In Vercel: Project → Settings → Environment Variables → add{" "}
            <code className="bg-secondary text-gold px-1 py-0.5 rounded text-xs font-mono">
              VITE_TMDB_API_KEY
            </code>
            .
          </li>
          <li>Redeploy — the catalogue appears automatically.</li>
        </ol>
      </div>
    </div>
  );
}
