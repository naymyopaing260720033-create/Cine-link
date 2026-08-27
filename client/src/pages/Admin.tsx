/*
 * CINE LINK EDITORIAL DESK — authenticated shared Myanmar movie content editor.
 * MIDNIGHT TEAL & EMERALD: emerald actions manage content; Marquee Amber keeps
 * editorial labels and publishing context clearly cinema-first.
 */
import { useMemo, useState } from "react";
import { Edit3, FileText, ImageIcon, Loader2, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import MovieRequestModerationPanel from "@/components/MovieRequestModerationPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type EditorForm = {
  tmdbId: string;
  title: string;
  tagline: string;
  synopsis: string;
};

const emptyForm: EditorForm = {
  tmdbId: "",
  title: "",
  tagline: "",
  synopsis: "",
};

function nullableCopy(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function AdminEditor() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const contentQuery = trpc.myanmarMovieContent.list.useQuery(undefined, {
    enabled: isAdmin,
  });

  const refreshContent = () => utils.myanmarMovieContent.list.invalidate();
  const createContent = trpc.myanmarMovieContent.create.useMutation({
    onSuccess: async () => {
      await refreshContent();
      setForm(emptyForm);
      toast.success("Myanmar content published");
    },
    onError: (error) => toast.error(error.message),
  });
  const updateContent = trpc.myanmarMovieContent.update.useMutation({
    onSuccess: async () => {
      await refreshContent();
      setForm(emptyForm);
      setEditingId(null);
      toast.success("Myanmar content updated");
    },
    onError: (error) => toast.error(error.message),
  });
  const removeContent = trpc.myanmarMovieContent.remove.useMutation({
    onSuccess: async () => {
      await refreshContent();
      toast.success("Editorial record removed");
    },
    onError: (error) => toast.error(error.message),
  });

  const uploadImage = trpc.myanmarMovieContent.uploadImage.useMutation({
    onSuccess: async () => {
      await Promise.all([
        refreshContent(),
        utils.myanmarMovieContent.byTmdbId.invalidate({ tmdbId: Number(form.tmdbId) }),
      ]);
      toast.success("Movie image updated");
    },
    onError: (error) => toast.error(error.message),
  });
  const removeImage = trpc.myanmarMovieContent.removeImage.useMutation({
    onSuccess: async () => {
      await Promise.all([
        refreshContent(),
        utils.myanmarMovieContent.byTmdbId.invalidate({ tmdbId: Number(form.tmdbId) }),
      ]);
      toast.success("Movie image removed — TMDB artwork will be used");
    },
    onError: (error) => toast.error(error.message),
  });

  const isBusy = createContent.isPending || updateContent.isPending || removeContent.isPending || uploadImage.isPending || removeImage.isPending;
  const sortedContent = useMemo(() => contentQuery.data ?? [], [contentQuery.data]);
  const editingEntry = sortedContent.find((entry) => entry.id === editingId);

  const updateField = (field: keyof EditorForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetEditor = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = () => {
    const tmdbId = Number(form.tmdbId);
    const title = nullableCopy(form.title);
    const tagline = nullableCopy(form.tagline);
    const synopsis = nullableCopy(form.synopsis);

    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
      toast.error("Enter a valid TMDB movie ID");
      return;
    }
    if (!title && !tagline && !synopsis) {
      toast.error("Add at least one Myanmar content field");
      return;
    }

    const values = { tmdbId, title, tagline, synopsis };
    if (editingId) {
      updateContent.mutate({ id: editingId, ...values });
    } else {
      createContent.mutate(values);
    }
  };

  const startEditing = (entry: NonNullable<typeof contentQuery.data>[number]) => {
    setEditingId(entry.id);
    setForm({
      tmdbId: String(entry.tmdbId),
      title: entry.title ?? "",
      tagline: entry.tagline ?? "",
      synopsis: entry.synopsis ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = (id: number) => {
    if (!window.confirm("Remove this Myanmar editorial record? The public page will fall back to its static or TMDB content.")) return;
    removeContent.mutate({ id });
  };

  const uploadEditorialImage = (kind: "poster" | "backdrop", file: File | undefined) => {
    if (!editingId) {
      toast.error("Save the text record first, then add its images");
      return;
    }
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Use a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image files must be smaller than 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      uploadImage.mutate({ id: editingId, kind, dataUrl: reader.result });
    };
    reader.onerror = () => toast.error("This image could not be read");
    reader.readAsDataURL(file);
  };

  const clearEditorialImage = (kind: "poster" | "backdrop") => {
    if (!editingId) return;
    removeImage.mutate({ id: editingId, kind });
  };

  if (authLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparing the editorial desk…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-xl rounded-xl border border-primary/30 bg-card p-7 shadow-xl">
        <p className="detail-kicker">Restricted access</p>
        <h1 className="mt-2 font-display text-3xl font-black">Editorial Desk</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This editor is available only to CineLink administrators. Sign in with the owner account, or promote the required account to the admin role in the project database.
        </p>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
        <div>
          <p className="detail-kicker">CineLink editorial desk</p>
          <h1 className="mt-1 font-display text-3xl font-black md:text-4xl">Myanmar Movie Content</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Save a Myanmar title, tagline, or Synopsis by TMDB movie ID. Public Movie Detail pages update from this shared database and retain static/TMDB fallbacks when no editor copy exists.
          </p>
        </div>
        <div className="marquee-count text-sm text-gold">{sortedContent.length} editor record{sortedContent.length === 1 ? "" : "s"}</div>
      </header>

      <section className="detail-feature-shell rounded-2xl p-5 sm:p-7">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="detail-kicker">{editingId ? "Edit a screening" : "New screening"}</p>
            <h2 className="mt-1 font-display text-2xl font-bold">{editingId ? "Update Myanmar copy" : "Add Myanmar copy"}</h2>
          </div>
          {editingId ? (
            <Button variant="outline" onClick={resetEditor} disabled={isBusy}>Cancel edit</Button>
          ) : null}
        </div>

        <div className="relative z-10 mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="tmdb-id" className="text-sm font-semibold">TMDB movie ID <span className="text-gold">*</span></label>
              <Input id="tmdb-id" inputMode="numeric" value={form.tmdbId} onChange={(event) => updateField("tmdbId", event.target.value)} placeholder="e.g. 550" className="bg-background/70" disabled={isBusy} />
              <p className="text-xs text-muted-foreground">Use the number from the movie URL, such as `/movie/550`.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="myanmar-title" className="text-sm font-semibold">Myanmar title</label>
              <Input id="myanmar-title" lang="my" value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="ဥပမာ — ဖိုက်ကလပ်" className="bg-background/70" disabled={isBusy} />
            </div>
            <div className="space-y-2">
              <label htmlFor="myanmar-tagline" className="text-sm font-semibold">Myanmar tagline</label>
              <Input id="myanmar-tagline" lang="my" value={form.tagline} onChange={(event) => updateField("tagline", event.target.value)} placeholder="ရွေးချယ်စရာ — short theatre line" className="bg-background/70" disabled={isBusy} />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="myanmar-synopsis" className="text-sm font-semibold">Myanmar Synopsis</label>
            <Textarea id="myanmar-synopsis" lang="my" value={form.synopsis} onChange={(event) => updateField("synopsis", event.target.value)} placeholder="ဇာတ်လမ်းအကျဉ်းကို မြန်မာလိုရေးပါ…" className="min-h-[222px] resize-y bg-background/70 leading-relaxed" disabled={isBusy} />
            <p className="text-xs text-muted-foreground">အနည်းဆုံး field တစ်ခုရေးပြီး save လုပ်နိုင်ပါတယ်။ မရေးထားသော field များသည် TMDB/static fallback ကိုဆက်ပြပါမယ်။</p>
          </div>
        </div>

        <div className="relative z-10 mt-6 flex flex-wrap gap-3">
          <Button onClick={submit} disabled={isBusy} className="marquee-chip teal-cta-glow bg-primary text-primary-foreground font-bold active:scale-[0.97]">
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? "Save changes" : "Publish Myanmar copy"}
          </Button>
          {!editingId ? <Button variant="outline" onClick={resetEditor} disabled={isBusy}>Clear form</Button> : null}
        </div>

        {editingId ? (
          <div className="relative z-10 mt-8 border-t border-border pt-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="detail-kicker">Artwork overrides</p>
                <h3 className="mt-1 font-display text-xl font-bold">Poster &amp; hero backdrop</h3>
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG, or WebP · maximum 5 MB</p>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {([
                {
                  kind: "poster" as const,
                  label: "Movie poster",
                  hint: "Vertical artwork looks best (2:3)",
                  url: editingEntry?.posterUrl,
                  aspect: "aspect-[2/3]",
                },
                {
                  kind: "backdrop" as const,
                  label: "Hero backdrop",
                  hint: "Wide artwork looks best (16:9)",
                  url: editingEntry?.backdropUrl,
                  aspect: "aspect-video",
                },
              ]).map((image) => (
                <div key={image.kind} className="overflow-hidden rounded-xl border border-border bg-background/50 p-3">
                  <div className={`relative overflow-hidden rounded-lg border border-border bg-secondary/40 ${image.aspect}`}>
                    {image.url ? (
                      <img src={image.url} alt={`${image.label} preview`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-5 text-center text-xs text-muted-foreground">
                        <ImageIcon className="h-5 w-5 text-gold" />
                        {image.hint}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{image.label}</p>
                      <p className="text-xs text-muted-foreground">{image.url ? "Custom image active" : "Using TMDB fallback"}</p>
                    </div>
                    <div className="flex gap-2">
                      <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
                        <Upload className="h-3.5 w-3.5" /> {image.url ? "Replace" : "Upload"}
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isBusy} onChange={(event) => {
                          uploadEditorialImage(image.kind, event.target.files?.[0]);
                          event.currentTarget.value = "";
                        }} />
                      </label>
                      {image.url ? <Button variant="outline" size="sm" className="h-8 border-destructive/40 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => clearEditorialImage(image.kind)} disabled={isBusy} aria-label={`Remove ${image.label}`}><X className="h-3.5 w-3.5" /></Button> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <p className="detail-kicker">Published copy</p>
          <h2 className="mt-1 font-display text-2xl font-bold">Editorial library</h2>
        </div>

        {contentQuery.isLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading editor records…</div>
        ) : contentQuery.isError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-muted-foreground">The editorial library could not load. Please refresh and try again.</div>
        ) : sortedContent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/60 p-8 text-center">
            <FileText className="mx-auto h-7 w-7 text-gold" />
            <p className="mt-3 font-display text-lg font-bold">No shared Myanmar copy yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create your first record above. Static file entries still remain available as fallbacks.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sortedContent.map((entry) => (
              <article key={entry.id} className="rounded-xl border border-border bg-card/80 p-4 transition-colors hover:border-primary/50 sm:flex sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="marquee-count text-xs text-gold">TMDB #{entry.tmdbId}</span>
                    <p className="font-display text-lg font-bold" lang="my">{entry.title || "Myanmar title မထည့်ရသေးပါ"}</p>
                  </div>
                  {entry.synopsis ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground" lang="my">{entry.synopsis}</p> : <p className="mt-2 text-sm italic text-muted-foreground">Synopsis မထည့်ရသေးပါ</p>}
                  <p className="mt-3 text-xs text-muted-foreground">Updated {new Date(entry.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">
                  <Button variant="outline" size="sm" onClick={() => startEditing(entry)} disabled={isBusy} className="gap-1.5"><Edit3 className="h-3.5 w-3.5" /> Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => remove(entry.id)} disabled={isBusy} className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <MovieRequestModerationPanel />
    </div>
  );
}

export default function Admin() {
  return (
    <DashboardLayout>
      <AdminEditor />
    </DashboardLayout>
  );
}
