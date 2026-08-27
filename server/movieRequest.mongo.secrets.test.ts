import { MongoClient } from "mongodb";
import { describe, expect, it } from "vitest";

describe("movie request MongoDB configuration", () => {
  it("connects to the configured MongoDB database without writing data", async () => {
    const uri = process.env.MONGODB_URI;
    const databaseName = process.env.MONGODB_DB_NAME || "cinelink";
    expect(uri, "MONGODB_URI must be configured").toBeTruthy();

    const client = new MongoClient(uri!, { serverSelectionTimeoutMS: 12_000 });
    try {
      const result = await client.db(databaseName).command({ ping: 1 });
      expect(result.ok).toBe(1);
    } finally {
      await client.close();
    }
  }, 20_000);
});
