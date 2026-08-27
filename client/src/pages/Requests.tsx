import { CheckCircle2, CircleX, ClipboardList, Clock3, Film, Loader2, SearchCheck, Tv } from "lucide-react";
import { Link } from "wouter";
import SiteLayout from "@/components/SiteLayout";
import { getStoredBrowserRequestToken } from "@/lib/requestHistory";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

const statusCopy = {
  new: { label: "စောင့်ဆိုင်းနေသည်", detail: "Request ကို CineLink team မှစစ်ဆေးနေပါသည်။", icon: Clock3, className: "border-gold/45 bg-gold/10 text-gold" },
  searching: { label: "ရှာဖွေနေသည်", detail: "ဇာတ်ကားကိုရှာဖွေ/ပြင်ဆင်နေပါသည်။", icon: SearchCheck, className: "border-primary/45 bg-primary/10 text-primary" },
  available: { label: "တင်ပြီးပါပြီ", detail: "CineLink တွင်ကြည့်ရှုနိုင်ရန်တင်ပြီးပါပြီ။", icon: CheckCircle2, className: "border-emerald-400/45 bg-emerald-400/10 text-emerald-300" },
  declined: { label: "မရနိုင်ပါ", detail: "ဤ request ကိုလက်ရှိအချိန်တွင်မတင်နိုင်ပါ။", icon: CircleX, className: "border-destructive/45 bg-destructive/10 text-destructive" },
} as const;

export default function Requests() {
  const [browserToken, setBrowserToken] = useState<string | null>(null);

  useEffect(() => {
    setBrowserToken(getStoredBrowserRequestToken());
  }, []);

  const requestsQuery = trpc.movieRequests.mine.useQuery(
    { browserToken: browserToken ?? "" },
    { enabled: Boolean(browserToken) },
  );
  const requests = requestsQuery.data ?? [];

  return (
    <SiteLayout>
      <section className="container py-10 sm:py-14">
        <div className="max-w-3xl">
          <p className="detail-kicker">YOUR REQUEST HISTORY</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">မိမိတောင်းဆိုမှုများ</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">ဤ browser မှပေးပို့ထားသော Movie နှင့် Series requests များကိုသာပြထားပါသည်။ Account မလိုအပ်ဘဲ အခြေအနေပြောင်းလဲမှုကိုဒီနေရာမှကြည့်နိုင်ပါသည်။</p>
        </div>

        {!browserToken ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-gold" />
            <h2 className="mt-3 text-xl font-bold text-foreground">Request history မရှိသေးပါ</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">ဤ browser မှ request မပို့ရသေးပါ။ Header ရှိ Request ကိုနှိပ်ပြီး Movie သို့မဟုတ် Series တောင်းဆိုနိုင်ပါသည်။</p>
          </div>
        ) : requestsQuery.isLoading ? (
          <div className="mt-8 flex items-center gap-2 rounded-2xl border border-border bg-card/60 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Request history ကိုဖွင့်နေပါသည်…</div>
        ) : requestsQuery.isError ? (
          <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-muted-foreground">Request history ကိုမဖွင့်နိုင်သေးပါ။ ခဏနေရင်ထပ်ကြိုးစားပါ။</div>
        ) : requests.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-gold" />
            <h2 className="mt-3 text-xl font-bold text-foreground">Request မတွေ့ပါ</h2>
            <p className="mt-2 text-sm text-muted-foreground">အခြား browser မှပို့ထားသော request များကို privacy အတွက်ဒီနေရာတွင်မပြပါ။</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-3">
            {requests.map((request) => {
              const status = statusCopy[request.status];
              const StatusIcon = status.icon;
              const TypeIcon = request.requestType === "series" ? Tv : Film;
              return (
                <article key={request.id} className="rounded-2xl border border-border bg-card/75 p-4 transition-colors hover:border-primary/50 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"><TypeIcon className={`h-3 w-3 ${request.requestType === "series" ? "text-primary" : "text-gold"}`} />{request.requestType === "series" ? "Series" : "Movie"}</span>
                        <h2 className="font-display text-xl font-bold text-foreground">{request.requestedTitle}</h2>
                      </div>
                      {request.description ? <p className="mt-3 rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm leading-relaxed text-muted-foreground">{request.description}</p> : null}
                      <p className="mt-3 text-xs text-muted-foreground">နောက်ဆုံး update: {new Date(request.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${status.className}`}><StatusIcon className="h-4 w-4" />{status.label}</div>
                  </div>
                  <p className="mt-4 border-t border-border/70 pt-3 text-sm text-muted-foreground">{status.detail}</p>
                </article>
              );
            })}
          </div>
        )}
        <p className="mt-7 text-xs leading-relaxed text-muted-foreground">Browser data ကိုဖျက်ခြင်း သို့မဟုတ် အခြား device/browser သုံးခြင်းဖြင့် ဤ history ကိုပြန်မမြင်နိုင်ပါ။</p>
        <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-gold hover:text-primary">← Home သို့ပြန်ရန်</Link>
      </section>
    </SiteLayout>
  );
}
