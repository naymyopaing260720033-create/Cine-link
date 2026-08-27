/*
 * CINE LINK EDITORIAL DESK — private request moderation panel.
 * MIDNIGHT TEAL & EMERALD: operational controls are teal/emerald; Marquee
 * Amber remains the count and editorial signal so the dashboard stays cinema-first.
 */
import { useState } from "react";
import { CheckCircle2, CircleX, ClipboardList, Loader2, Save, SearchCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const REQUEST_STATUSES = ["all", "new", "searching", "available", "declined"] as const;
type RequestFilter = (typeof REQUEST_STATUSES)[number];
type RequestStatus = Exclude<RequestFilter, "all">;

const statusLabels: Record<RequestStatus, string> = {
  new: "အသစ် (New)",
  searching: "ရှာဖွေနေ (Searching)",
  available: "ပြီးစီးပြီ (Fulfilled)",
  declined: "ပယ်ချပြီး (Rejected)",
};

const statusStyles: Record<RequestStatus, string> = {
  new: "border-gold/40 bg-gold/10 text-gold",
  searching: "border-primary/40 bg-primary/10 text-primary",
  available: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  declined: "border-destructive/40 bg-destructive/10 text-destructive",
};

type Draft = { status: RequestStatus; adminNote: string };

export default function MovieRequestModerationPanel() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<RequestFilter>("all");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const requestsQuery = trpc.movieRequests.list.useQuery(
    filter === "all" ? undefined : { status: filter },
  );
  const refreshRequests = () => utils.movieRequests.list.invalidate();
  const updateRequest = trpc.movieRequests.update.useMutation({
    onSuccess: async (_, variables) => {
      setDrafts((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
      await refreshRequests();
      toast.success(variables.status === "available" ? "Request ကို Fulfilled အဖြစ်သိမ်းပြီးပါပြီ" : variables.status === "declined" ? "Request ကို Rejected အဖြစ်သိမ်းပြီးပါပြီ" : "Request အခြေအနေကို update လုပ်ပြီးပါပြီ");
    },
    onError: (error) => toast.error(error.message),
  });
  const removeRequest = trpc.movieRequests.remove.useMutation({
    onSuccess: async () => {
      await refreshRequests();
      toast.success("Movie request removed");
    },
    onError: (error) => toast.error(error.message),
  });

  const requests = requestsQuery.data ?? [];
  const setDraft = (id: string, seed: Draft, patch: Partial<Draft>) => {
    setDrafts((current) => ({ ...current, [id]: { ...(current[id] ?? seed), ...patch } }));
  };
  const saveResponse = (id: string, status: RequestStatus, adminNote: string) => {
    updateRequest.mutate({ id, status, adminNote: adminNote.trim() || null });
  };
  const isBusy = updateRequest.isPending || removeRequest.isPending;

  return (
    <section className="space-y-4 border-t border-border pt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="detail-kicker">Audience requests</p>
          <h2 className="mt-1 font-display text-2xl font-bold">Movie Requests</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Anonymous title requests are stored in MongoDB. New titles are sent once to the private CineLink Requests channel; repeat requests only increase demand.
          </p>
        </div>
        <span className="marquee-count text-sm text-gold">{requests.length} shown</span>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filter movie requests">
        {REQUEST_STATUSES.map((status) => (
          <Button
            key={status}
            variant="outline"
            size="sm"
            onClick={() => setFilter(status)}
            className={
              filter === status
                ? "marquee-chip border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-gold"
            }
          >
            {status === "all" ? "အားလုံး (All)" : statusLabels[status]}
          </Button>
        ))}
      </div>

      {requestsQuery.isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading movie requests…</div>
      ) : requestsQuery.isError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-muted-foreground">Movie requests could not load. Please refresh and try again.</div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 p-8 text-center">
          <ClipboardList className="mx-auto h-7 w-7 text-gold" />
          <p className="mt-3 font-display text-lg font-bold">No {filter === "all" ? "movie requests" : statusLabels[filter].toLowerCase()} yet</p>
          <p className="mt-1 text-sm text-muted-foreground">New website requests will appear here for editorial review.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {requests.map((request) => {
            const seed: Draft = { status: request.status, adminNote: request.adminNote ?? "" };
            const draft = drafts[request.id] ?? seed;
            return (
              <article key={request.id} className="rounded-xl border border-border bg-card/80 p-4 transition-colors hover:border-primary/50">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="marquee-count text-xs text-gold">{request.requestCount} request{request.requestCount === 1 ? "" : "s"}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${statusStyles[request.status]}`}>{statusLabels[request.status]}</span>
                      <h3 className="font-display text-lg font-bold">{request.requestedTitle}</h3>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><SearchCheck className="h-3.5 w-3.5 text-primary" /> Last requested {new Date(request.lastRequestedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex min-w-[12rem] flex-col gap-2 sm:flex-row lg:w-[29rem]">
                    <select
                      aria-label={`Status for ${request.requestedTitle}`}
                      value={draft.status}
                      onChange={(event) => setDraft(request.id, seed, { status: event.target.value as RequestStatus })}
                      className="h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                      disabled={isBusy}
                    >
                      {(REQUEST_STATUSES.slice(1) as RequestStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                    </select>
                    <Input
                      aria-label={`Admin note for ${request.requestedTitle}`}
                      value={draft.adminNote}
                      onChange={(event) => setDraft(request.id, seed, { adminNote: event.target.value })}
                      placeholder="Admin မှတ်ချက် — Fulfilled / Rejected အတွက် (မထည့်လည်းရ)"
                      maxLength={500}
                      className="h-9 min-w-0 flex-1 bg-background/70 text-sm"
                      disabled={isBusy}
                    />
                    <Button size="sm" onClick={() => updateRequest.mutate({ id: request.id, status: draft.status, adminNote: draft.adminNote.trim() || null })} disabled={isBusy} className="marquee-chip h-9 bg-primary text-primary-foreground"><Save className="h-3.5 w-3.5" /> Save</Button>
                    <Button variant="outline" size="sm" onClick={() => { if (window.confirm(`Remove the request for ${request.requestedTitle}?`)) removeRequest.mutate({ id: request.id }); }} disabled={isBusy} className="h-9 border-destructive/40 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${request.requestedTitle}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center">
                  <Button size="sm" variant="outline" onClick={() => saveResponse(request.id, "available", draft.adminNote)} disabled={isBusy || request.status === "available"} className="h-8 border-emerald-400/45 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 hover:text-emerald-200"><CheckCircle2 className="h-3.5 w-3.5" /> Fulfilled လုပ်မည်</Button>
                  <Button size="sm" variant="outline" onClick={() => saveResponse(request.id, "declined", draft.adminNote)} disabled={isBusy || request.status === "declined"} className="h-8 border-destructive/45 bg-destructive/5 text-destructive hover:bg-destructive/15 hover:text-destructive"><CircleX className="h-3.5 w-3.5" /> ပယ်ချမည် (Reject)</Button>
                  <p className="text-xs text-muted-foreground">ပြောင်းလဲမှုကို shared request queue တွင်ချက်ချင်းသိမ်းပါမည်။ Anonymous request ဖြစ်သောကြောင့် user ကိုတိုက်ရိုက်စာပို့ရန် အဆက်အသွယ်မပါဝင်ပါ။</p>
                </div>
                {request.status === "available" ? <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Fulfilled — CineLink viewers အတွက် ယခုရရှိနိုင်ပါပြီ။</p> : null}
                {request.status === "declined" ? <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-destructive"><CircleX className="h-3.5 w-3.5" /> Rejected — ဤ request ကိုပိတ်သိမ်းထားပါသည်။</p> : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
