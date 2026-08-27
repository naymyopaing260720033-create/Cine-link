import { describe, expect, it } from "vitest";

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const requestChannelId = process.env.TELEGRAM_REQUESTS_CHANNEL_ID;

type TelegramResponse = {
  ok: boolean;
  result?: { id?: number; type?: string };
};

async function telegramRequest(method: "getMe" | "getChat", body?: Record<string, string>) {
  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status,
    payload: (await response.json()) as TelegramResponse,
  };
}

describe("movie request environment configuration", () => {
  it("authenticates the configured bot and can access the private request channel", async () => {
    expect(telegramBotToken, "TELEGRAM_BOT_TOKEN must be configured").toBeTruthy();
    expect(requestChannelId, "TELEGRAM_REQUESTS_CHANNEL_ID must be configured").toMatch(/^-?\d+$/);

    const bot = await telegramRequest("getMe");
    expect(bot.status).toBe(200);
    expect(bot.payload.ok).toBe(true);
    expect(bot.payload.result?.id).toEqual(expect.any(Number));

    const channel = await telegramRequest("getChat", { chat_id: requestChannelId! });
    expect(channel.status).toBe(200);
    expect(channel.payload.ok).toBe(true);
    expect(["channel", "supergroup"]).toContain(channel.payload.result?.type);
  }, 20_000);
});
