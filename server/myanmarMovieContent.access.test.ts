import { describe, expect, it } from "vitest";
import { NOT_ADMIN_ERR_MSG } from "../shared/const";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type Role = "user" | "admin";

function createContext(role: Role): TrpcContext {
  return {
    user: {
      id: 1,
      openId: `${role}-editor`,
      email: `${role}@example.com`,
      name: `${role} editor`,
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("myanmarMovieContent admin access", () => {
  it("does not allow a signed-in non-admin to read the editorial library", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.myanmarMovieContent.list()).rejects.toMatchObject({
      message: NOT_ADMIN_ERR_MSG,
    });
  });

  it("does not allow a signed-in non-admin to create Myanmar content", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(
      caller.myanmarMovieContent.create({
        tmdbId: 550,
        title: "ဖိုက်ကလပ်",
        tagline: null,
        synopsis: "ဇာတ်လမ်းအကျဉ်း",
      }),
    ).rejects.toMatchObject({ message: NOT_ADMIN_ERR_MSG });
  });

  it("requires at least one editorial field before an admin write reaches the database", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(
      caller.myanmarMovieContent.create({
        tmdbId: 550,
        title: null,
        tagline: null,
        synopsis: null,
      }),
    ).rejects.toMatchObject({ message: "Add at least one Myanmar content field." });
  });

  it("does not allow a signed-in non-admin to upload an image", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(
      caller.myanmarMovieContent.uploadImage({
        id: 1,
        kind: "poster",
        dataUrl: "data:image/png;base64,aGVsbG8=",
      }),
    ).rejects.toMatchObject({ message: NOT_ADMIN_ERR_MSG });
  });

  it("rejects an unsupported image type before an admin upload reaches storage", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(
      caller.myanmarMovieContent.uploadImage({
        id: 1,
        kind: "poster",
        dataUrl: "data:text/plain;base64,aGVsbG8=",
      }),
    ).rejects.toMatchObject({ message: "Use a JPG, PNG, or WebP image file." });
  });
});
