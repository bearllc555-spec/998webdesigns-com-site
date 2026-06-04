import { describe, expect, it } from "vitest";
import {
  appendRecipient,
  recipientsFromParallel,
  removeRecipient,
  serializeRecipients,
  updateRecipient,
} from "./telegram-recipients";

describe("telegram-recipients", () => {
  it("keeps label aligned per chat id", () => {
    const r = recipientsFromParallel(["1", "2"], ["Anthony", "Ops"]);
    expect(r).toEqual([
      { chatId: "1", label: "Anthony" },
      { chatId: "2", label: "Ops" },
    ]);
  });

  it("serializes and removes", () => {
    const r = recipientsFromParallel(["1", "2"], ["A", "B"]);
    const next = removeRecipient(r, "1");
    expect(serializeRecipients(next)).toEqual({ chatIds: "2", chatLabels: "B" });
  });

  it("updates chat id and label", () => {
    const r = recipientsFromParallel(["1"], ["A"]);
    const next = updateRecipient(r, "1", { chatId: "2", label: "B" });
    expect(next).toEqual([{ chatId: "2", label: "B" }]);
  });

  it("appends without duplicate", () => {
    const r = recipientsFromParallel(["1"], ["A"]);
    expect(appendRecipient(r, "1", "X")).toHaveLength(1);
    expect(appendRecipient(r, "2", "B")).toEqual([
      { chatId: "1", label: "A" },
      { chatId: "2", label: "B" },
    ]);
  });
});
