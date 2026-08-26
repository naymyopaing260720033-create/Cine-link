/*
 * CINE LINK COLOR DIRECTIONS — deterministic color comparison gallery.
 * Each board preserves the public streaming layout, but isolates a distinct
 * palette so the user can choose color/material direction before site-wide work.
 */
import type { CSSProperties } from "react";
import { Link } from "wouter";

type Direction = {
  key: string;
  name: string;
  note: string;
  canvas: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  edge: string;
  hero: string;
  posters: string[];
};

const directions: Direction[] = [
  {
    key: "D",
    name: "Cobalt Copper",
    note: "Grand modern cinema · inky blue, oxidised copper, parchment",
    canvas: "#08142b",
    surface: "#102343",
    ink: "#f5f0df",
    muted: "#aab7cb",
    accent: "#c77c4a",
    accentInk: "#160c08",
    edge: "rgba(199,124,74,.45)",
    hero: "radial-gradient(ellipse at 78% 36%, rgba(199,124,74,.29), transparent 43%), linear-gradient(112deg, #071226 0%, #0c1e3b 52%, #162c52 100%)",
    posters: ["linear-gradient(148deg,#d2b07a,#293e7d 48%,#071125)", "linear-gradient(150deg,#3e6393,#0a1530 60%,#bf714a)", "linear-gradient(155deg,#c57d4e,#19284d 48%,#d7c692)", "linear-gradient(155deg,#0b1d3d,#55759f 55%,#bd7149)"],
  },
  {
    key: "E",
    name: "Signal Red Noir",
    note: "Editorial thriller · graphite, vermilion, cold white",
    canvas: "#101113",
    surface: "#1b1d20",
    ink: "#f2f4f5",
    muted: "#afb4b8",
    accent: "#e64c3b",
    accentInk: "#190604",
    edge: "rgba(230,76,59,.5)",
    hero: "radial-gradient(ellipse at 76% 38%, rgba(230,76,59,.25), transparent 38%), linear-gradient(112deg, #0d0e10 0%, #17191d 53%, #272124 100%)",
    posters: ["linear-gradient(145deg,#df4337,#160f12 54%,#f1efeb)", "linear-gradient(150deg,#dedbd1,#30343a 45%,#b33630)", "linear-gradient(155deg,#2d3037,#b9322d 49%,#101115)", "linear-gradient(150deg,#efe9de,#7a211f 42%,#131417)"],
  },
  {
    key: "F",
    name: "Sandstone Indigo",
    note: "Daytime repertory cinema · paper, indigo ink, burnt orange",
    canvas: "#eee5d2",
    surface: "#f8f2e6",
    ink: "#18254d",
    muted: "#5b647a",
    accent: "#c75d2c",
    accentInk: "#fff6e8",
    edge: "rgba(199,93,44,.46)",
    hero: "radial-gradient(ellipse at 75% 35%, rgba(199,93,44,.22), transparent 40%), linear-gradient(112deg, #f3ead7 0%, #e6d7b8 54%, #bbc6d8 100%)",
    posters: ["linear-gradient(150deg,#e9c47b,#203361 52%,#e3713e)", "linear-gradient(145deg,#223867,#d7c8a8 48%,#b95231)", "linear-gradient(150deg,#e97843,#f2dcaf 42%,#192a55)", "linear-gradient(150deg,#213c70,#adbdd3 48%,#d56b39)"],
  },
];

function PreviewBoard({ direction }: { direction: Direction }) {
  const boardStyle = {
    background: direction.canvas,
    color: direction.ink,
  } as CSSProperties;

  return (
    <section className="overflow-hidden rounded-[1.25rem] border shadow-2xl" style={{ ...boardStyle, borderColor: direction.edge }}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6" style={{ borderColor: direction.edge }}>
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em]" style={{ color: direction.accent }}>
            Direction {direction.key}
          </p>
          <h2 className="mt-0.5 font-display text-xl font-black sm:text-2xl">{direction.name}</h2>
        </div>
        <div className="flex gap-1.5" aria-label={`${direction.name} palette`}>
          {[direction.canvas, direction.surface, direction.accent, direction.ink].map((color) => (
            <span key={color} className="h-5 w-5 rounded-full border border-black/15" style={{ background: color }} />
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-5" style={{ background: direction.hero }}>
        <div className="rounded-xl border p-3 sm:p-5" style={{ background: `${direction.canvas}d9`, borderColor: direction.edge }}>
          <div className="flex items-center justify-between border-b pb-3 text-[0.66rem] font-bold uppercase tracking-[0.12em]" style={{ borderColor: direction.edge }}>
            <span className="font-display text-base normal-case tracking-tight">CineLink</span>
            <span style={{ color: direction.accent }}>Home · Movies · Series</span>
          </div>

          <div className="grid gap-4 py-5 sm:grid-cols-[1.4fr_.55fr] sm:gap-7">
            <div className="space-y-3 self-center">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.25em]" style={{ color: direction.accent }}>CineLink presents</p>
              <h3 className="max-w-sm font-display text-3xl font-black leading-[.95] sm:text-4xl">Tonight&apos;s Feature</h3>
              <p className="max-w-md text-xs leading-relaxed" style={{ color: direction.muted }}>A deliberate cinema color system for posters, rails and Telegram-forward viewing.</p>
              <button className="mt-1 rounded-md px-3 py-2 text-xs font-black" style={{ background: direction.accent, color: direction.accentInk }}>Watch Here</button>
            </div>
            <div className="mx-auto aspect-[2/3] w-24 rounded-md border shadow-xl sm:w-28" style={{ background: direction.posters[0], borderColor: direction.edge }} />
          </div>

          <div className="border-t pt-3" style={{ borderColor: direction.edge }}>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-display text-base font-bold">Recently Added</span>
              <span style={{ color: direction.accent }}>View All</span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {direction.posters.map((poster, index) => (
                <div key={poster} className="space-y-1.5">
                  <div className="aspect-[2/3] rounded-md border" style={{ background: poster, borderColor: direction.edge }} />
                  <div className="h-1.5 rounded-full" style={{ width: `${72 - index * 9}%`, background: direction.ink, opacity: 0.8 }} />
                  <div className="h-1 rounded-full" style={{ width: "48%", background: direction.muted, opacity: 0.65 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="px-4 py-3 text-xs sm:px-6" style={{ color: direction.muted }}>{direction.note}</p>
    </section>
  );
}

export default function ColorDirections() {
  return (
    <main className="min-h-screen bg-[#090d16] px-4 py-10 text-[#f8f3e9] sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-semibold text-[#e3a746] hover:text-white">← Back to CineLink</Link>
        <p className="mt-8 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#e3a746]">Color Direction Gallery</p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl font-black leading-tight sm:text-5xl">Choose the next CineLink screening.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">The content layout stays the same. Each board changes only the emotional color system, material tone, and accent behavior.</p>
        <div className="mt-10 space-y-8">
          {directions.map((direction) => <PreviewBoard key={direction.key} direction={direction} />)}
        </div>
      </div>
    </main>
  );
}
