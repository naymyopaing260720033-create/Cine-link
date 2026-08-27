/*
 * CINE LINK — Manual Myanmar Movie Content Registry
 * MIDNIGHT TEAL & EMERALD: this registry supplies editorial Myanmar copy to
 * the cinematic Movie Detail page without changing TMDB catalogue metadata.
 *
 * Add one record per TMDB movie ID. Only fill fields you want to override;
 * empty or missing values automatically keep the original TMDB text visible.
 */

export type MyanmarMovieContent = {
  /** Display title in Myanmar, shown in the Movie Detail headline. */
  title?: string;
  /** Optional Myanmar tagline, shown above the title. */
  tagline?: string;
  /** Myanmar Synopsis, shown in the ticket-edged Synopsis panel. */
  synopsis?: string;
};

/**
 * Manual editorial overrides, keyed by TMDB movie ID.
 *
 * Copy the commented template below, replace `12345` with the movie's TMDB ID,
 * then write the Myanmar copy between the quotation marks. Keep commas after
 * each line and record. No database key, bot token, or API secret is needed.
 */
export const myanmarMovieDetails: Readonly<Record<number, MyanmarMovieContent>> = {
  550: {
    title: "ဖိုက်ကလပ်",
    tagline: "စည်းကမ်းနံပါတ်တစ် — ဖိုက်ကလပ်အကြောင်း မပြောရ။",
    synopsis:
      "အိပ်မပျော်ရောဂါနဲ့ နေ့စဉ်ဘဝကိုဖြတ်သန်းနေရတဲ့ ရုံးဝန်ထမ်းတစ်ယောက်ဟာ ဆပ်ပြာရောင်းသူ Tyler Durden နဲ့တွေ့ဆုံပြီးနောက် လျှို့ဝှက်ဖိုက်ကလပ်တစ်ခုကို စတင်တည်ထောင်လိုက်တယ်။ သူတို့ရဲ့ စည်းကမ်းမရှိသလိုထင်ရတဲ့ လှုပ်ရှားမှုက လူမှုဘဝကိုကျော်လွန်သွားချိန်မှာ သူ့ဘဝလည်း မထင်မှတ်ထားတဲ့လမ်းကြောင်းဆီ ဦးတည်သွားတယ်။",
  },

  // Template — uncomment and edit to add your next movie.
  // 12345: {
  //   title: "မြန်မာခေါင်းစဉ်",
  //   tagline: "လိုအပ်လျှင် tagline ထည့်ပါ",
  //   synopsis: "ဒီနေရာမှာ မြန်မာလို synopsis ကိုရေးပါ။",
  // },
};

export function getMyanmarMovieContent(tmdbId: number): MyanmarMovieContent | undefined {
  return myanmarMovieDetails[tmdbId];
}
