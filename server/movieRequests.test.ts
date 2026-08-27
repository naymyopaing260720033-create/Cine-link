import { describe, expect, it } from "vitest";
import {
  MovieRequestInputError,
  cleanMovieRequestTitle,
  formatMovieRequestTelegramMessage,
  normalizeMovieRequestTitle,
} from "./movieRequests";

describe("movie request input handling", () => {
  it("normalizes duplicate titles while retaining Myanmar characters", () => {
    expect(normalizeMovieRequestTitle("  The   Matrix!!!  ")).toBe("the matrix");
    expect(normalizeMovieRequestTitle("  မြန်မာ   ဇာတ်ကား  ")).toBe("မြန်မာ ဇာတ်ကား");
  });

  it("rejects missing and overly long movie names", () => {
    expect(() => cleanMovieRequestTitle(" ")).toThrow(MovieRequestInputError);
    expect(() => cleanMovieRequestTitle("x".repeat(181))).toThrow(MovieRequestInputError);
  });

  it("formats a plain-text private channel notification without user identifiers", () => {
    const timestamp = new Date("2026-08-27T07:30:00.000Z");
    expect(formatMovieRequestTelegramMessage("Inception", 3, timestamp)).toBe(
      [
        "NEW MOVIE REQUEST",
        "",
        "Title: Inception",
        "Requests: 3",
        "Source: CineLink website",
        "Received: 2026-08-27T07:30:00.000Z",
      ].join("\n"),
    );
  });
});
