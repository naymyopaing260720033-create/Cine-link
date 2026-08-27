# Manual Myanmar Movie Content

CineLink now supports manual Myanmar movie copy without changing the TMDB API data. The content file is:

```text
client/src/content/myanmarMovieDetails.ts
```

Each entry is identified by the movie's TMDB ID. When a field exists in this file, the Movie Detail page displays it; when it does not exist, CineLink continues to display the original TMDB title, tagline, or synopsis. This gives every movie a safe fallback.

## Add a Movie

Open `client/src/content/myanmarMovieDetails.ts`, copy the template, replace `12345` with the TMDB ID, and write your Myanmar copy.

```ts
12345: {
  title: "မြန်မာခေါင်းစဉ်",
  tagline: "လိုအပ်လျှင် tagline ထည့်ပါ",
  synopsis: "ဒီနေရာမှာ မြန်မာလို synopsis ကိုရေးပါ။",
},
```

Save the file and publish a new deployment. The Movie Detail page for `/movie/12345` will then use the manual fields. You may omit `tagline`, or even leave all fields except `synopsis`; CineLink will use TMDB values for any omitted field.

> This first version is an **editor-managed source file**. It is suitable for carefully curated titles and contains no secrets. A future authenticated admin panel with MongoDB can replace this workflow when you want to edit content from the website without changing code.

## Included Example

The registry includes TMDB ID `550` as a working example. Its `/movie/550` detail page presents a Myanmar title, tagline, and synopsis while all other movie metadata continues to come from TMDB.

## Verification

The `/movie/550` page was verified with loaded TMDB data. It displayed the manually supplied Myanmar title, tagline, and Synopsis inside the existing poster-led Movie Detail composition. The rating, release year, runtime, genres, trailer, cast, and similar-movie rail remained sourced from TMDB.
