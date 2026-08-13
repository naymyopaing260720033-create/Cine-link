/*
 * MIDNIGHT MARQUEE — Admin (/admin).
 * In-browser configuration for the Telegram bot identity.
 * Static site, so config persists in localStorage (export/import JSON).
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { Save, RotateCcw, Download, Upload, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SiteLayout from "@/components/SiteLayout";
import {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  resetConfig,
  type SiteConfig,
} from "@/lib/config";

export default function Admin() {
  const [cfg, setCfg] = useState<SiteConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    setCfg(loadConfig());
  }, []);

  const update = (patch: Partial<SiteConfig>) => {
    setCfg((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    const username = cfg.telegramBotUsername.trim().replace(/^@/, "");
    if (!username) {
      toast.error("Bot username cannot be empty");
      return;
    }
    saveConfig({ ...cfg, telegramBotUsername: username });
    toast.success("Configuration saved — Telegram links updated");
  };

  const handleReset = () => {
    resetConfig();
    setCfg(DEFAULT_CONFIG);
    toast.success("Reset to default configuration");
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cinelink-config.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Config exported");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as SiteConfig;
        update({
          telegramBotUsername: parsed.telegramBotUsername ?? "",
          telegramMessage: parsed.telegramMessage ?? "",
          customIntro: parsed.customIntro ?? "",
        });
        toast.success("Config imported — press Save to apply");
      } catch {
        toast.error("Invalid config file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <SiteLayout>
      <div className="container pt-10 pb-16 max-w-2xl">
        <h1 className="font-display font-black text-3xl mb-2">
          Bot <span className="text-gold">Configuration</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          This site is fully static — the Telegram bot identity is stored in
          your browser below. Edit once, share the exported JSON with your team,
          or set the values permanently in{" "}
          <code className="text-gold text-xs">client/src/lib/config.ts</code>.
        </p>

        <div className="space-y-6 bg-card border border-border rounded-lg p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Telegram bot username
            </label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">@</span>
              <Input
                value={cfg.telegramBotUsername}
                onChange={(e) => update({ telegramBotUsername: e.target.value })}
                placeholder="YourBotUsername"
                className="bg-background"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Without the @ sign. Create one via @BotFather on Telegram.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Default message sent to bot
            </label>
            <Textarea
              value={cfg.telegramMessage}
              onChange={(e) => update({ telegramMessage: e.target.value })}
              placeholder="Hi! I'd like to watch a movie…"
              className="bg-background min-h-[80px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              className="marquee-chip bg-primary text-primary-foreground font-bold gap-2 active:scale-[0.97]"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-border text-muted-foreground gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="border-border text-muted-foreground gap-2"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <label
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              Import JSON
              <input
                type="file"
                accept="application/json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mt-8 space-y-4 bg-card/60 border border-border rounded-lg p-6">
          <h2 className="font-display font-bold text-lg">Preview</h2>
          <div className="flex items-center gap-3 text-sm">
            <Send className="h-4 w-4 text-gold shrink-0" />
            <span className="text-muted-foreground">
              Your "Watch on Telegram" buttons now link to:
            </span>
            <a
              href={`https://t.me/${cfg.telegramBotUsername.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-gold hover:underline truncate"
            >
              t.me/{cfg.telegramBotUsername.replace(/^@/, "")}
            </a>
          </div>
          <Link
            href="/"
            className="inline-block text-sm text-gold hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
