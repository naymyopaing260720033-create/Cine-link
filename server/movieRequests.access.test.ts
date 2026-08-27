import { describe, expect, it } from "vitest";
import { NOT_ADMIN_ERR_MSG } from "../shared/const";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "user" | "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: `${role}-request-editor`,
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

describe("movieRequests access", () => {
  it("accepts a filled honeypot without storing or notifying", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.movieRequests.submit({ title: "Bot title", website: "https://bot.invalid" })).resolves.toEqual({
      accepted: true,
      duplicate: false,
      resolution: "queued",
      matches: [],
    });
  });

  it("does not allow a signed-in non-admin to list movie requests", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.movieRequests.list()).rejects.toMatchObject({ message: NOT_ADMIN_ERR_MSG });
  });

  it("does not allow a signed-in non-admin to fulfill or reject a movie request", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.movieRequests.update({
      id: "507f1f77bcf86cd799439011",
      status: "available",
      adminNote: "Ready to watch",
    })).rejects.toMatchObject({ message: NOT_ADMIN_ERR_MSG });
    await expect(caller.movieRequests.update({
      id: "507f1f77bcf86cd799439011",
      status: "declined",
      adminNote: "Unavailable",
    })).rejects.toMatchObject({ message: NOT_ADMIN_ERR_MSG });
  });

  it("rejects an invalid request title before connecting to external services", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.movieRequests.submit({ title: " " })).rejects.toMatchObject({
      message: expect.stringContaining("expected string to have >=2 characters"),
    });
  });

  it("rejects a short browser token before loading visitor request history", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.movieRequests.mine({ browserToken: "not-a-valid-browser-token" })).rejects.toMatchObject({
      message: expect.stringContaining("expected string to have >=32 characters"),
    });
  });
});
