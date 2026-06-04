import { afterEach, describe, expect, it } from "vitest";
import {
  getTelegramChatIds,
  getTelegramChatLabels,
  isTelegramNotifyConfiguredFromEnv,
  parseChatIdsFromRaw,
} from "./telegram-destinations";

const env = process.env;

afterEach(() => {
  process.env = { ...env };
});

describe("getTelegramChatIds", () => {
  it("parses comma-separated TELEGRAM_CHAT_ID", () => {
    process.env.TELEGRAM_CHAT_ID = "111, -100222 ,333";
    expect(getTelegramChatIds()).toEqual(["111", "-100222", "333"]);
  });

  it("merges TELEGRAM_CHAT_IDS and dedupes", () => {
    process.env.TELEGRAM_CHAT_ID = "111";
    process.env.TELEGRAM_CHAT_IDS = "222,111";
    expect(getTelegramChatIds()).toEqual(["111", "222"]);
  });
});

describe("getTelegramChatLabels", () => {
  it("parses comma-separated labels", () => {
    process.env.TELEGRAM_CHAT_LABELS = "Anthony, Ops";
    expect(getTelegramChatLabels()).toEqual(["Anthony", "Ops"]);
  });
});

describe("parseChatIdsFromRaw", () => {
  it("parses and dedupes", () => {
    expect(parseChatIdsFromRaw("1, 2; 1")).toEqual(["1", "2"]);
  });
});

describe("isTelegramNotifyConfiguredFromEnv", () => {
  it("requires token and at least one chat id", () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    expect(isTelegramNotifyConfiguredFromEnv()).toBe(false);

    process.env.TELEGRAM_BOT_TOKEN = "tok";
    process.env.TELEGRAM_CHAT_ID = "1,2";
    expect(isTelegramNotifyConfiguredFromEnv()).toBe(true);
  });
});
