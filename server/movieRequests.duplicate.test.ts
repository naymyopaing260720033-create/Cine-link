import { beforeEach, describe, expect, it, vi } from "vitest";

const { collection, FakeMongoClient, FakeObjectId } = vi.hoisted(() => {
  const collection = {
    createIndex: vi.fn().mockResolvedValue("index"),
    findOneAndUpdate: vi.fn(),
    insertOne: vi.fn(),
    updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    find: vi.fn(),
  };

  class FakeObjectId {
    constructor(private readonly value = "507f1f77bcf86cd799439011") {}
    toHexString() {
      return this.value;
    }
    static isValid() {
      return true;
    }
  }

  class FakeMongoClient {
    db() {
      return { collection: () => collection };
    }
  }

  return { collection, FakeMongoClient, FakeObjectId };
});

vi.mock("mongodb", () => ({ MongoClient: FakeMongoClient, ObjectId: FakeObjectId }));

import { hashBrowserRequestToken, listVisitorMovieRequests, submitMovieRequest } from "./movieRequests";

describe("movie request duplicates", () => {
  beforeEach(() => {
    process.env.MONGODB_URI = "mongodb://test.invalid/cinelink";
    process.env.MONGODB_DB_NAME = "cinelink";
    process.env.TELEGRAM_BOT_TOKEN = "test-token";
    process.env.TELEGRAM_REQUESTS_CHANNEL_ID = "-1001234567890";
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
  });

  it("increments a matching active request without sending another channel notification", async () => {
    const insertedId = new FakeObjectId("507f1f77bcf86cd799439012");
    const now = new Date("2026-08-27T18:00:00.000Z");
    collection.findOneAndUpdate
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        _id: insertedId,
        requestedTitle: "Inception",
        normalizedTitle: "inception",
        status: "new",
        requestCount: 2,
        adminNote: null,
        notificationStatus: "sent",
        telegramNotificationSentAt: now,
        createdAt: now,
        updatedAt: now,
        lastRequestedAt: now,
      });
    collection.insertOne.mockResolvedValue({ insertedId });

    const first = await submitMovieRequest("Inception");
    const second = await submitMovieRequest("  inception! ");

    expect(first).toMatchObject({ duplicate: false, notificationSent: true });
    expect(second).toMatchObject({ duplicate: true, notificationSent: false });
    expect(collection.insertOne).toHaveBeenCalledTimes(1);
    expect(collection.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(collection.findOneAndUpdate.mock.calls[1]?.[1]).toMatchObject({ $inc: { requestCount: 1 } });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("returns only non-sensitive request records associated with the calling browser token", async () => {
    const browserToken = "local-browser-token-for-request-history-0001";
    const now = new Date("2026-08-28T00:00:00.000Z");
    collection.find.mockReturnValue({
      sort: () => ({
        toArray: async () => [{
          _id: new FakeObjectId("507f1f77bcf86cd799439013"),
          requestedTitle: "Inception",
          normalizedTitle: "inception",
          requestType: "movie",
          description: "Myanmar subtitle",
          requesterTokenHashes: [hashBrowserRequestToken(browserToken)],
          status: "available",
          requestCount: 4,
          adminNote: "Internal delivery note",
          notificationStatus: "sent",
          telegramNotificationSentAt: now,
          createdAt: now,
          updatedAt: now,
          lastRequestedAt: now,
        }],
      }),
    });

    const records = await listVisitorMovieRequests(browserToken);

    expect(collection.find).toHaveBeenCalledWith({ requesterTokenHashes: hashBrowserRequestToken(browserToken) });
    expect(records).toEqual([expect.objectContaining({ id: "507f1f77bcf86cd799439013", status: "available", description: "Myanmar subtitle" })]);
    expect(records[0]).not.toHaveProperty("adminNote");
    expect(records[0]).not.toHaveProperty("notificationStatus");
  });
});
