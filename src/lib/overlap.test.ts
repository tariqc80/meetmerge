import { describe, it, expect } from "vitest";
import { computeOverlap } from "./overlap";
import type { Participant } from "@/types";

describe("computeOverlap", () => {
  it("returns empty array for no participants", () => {
    expect(computeOverlap([])).toEqual([]);
  });

  it("counts overlapping blocks from multiple participants", () => {
    const participants: Participant[] = [
      {
        id: "1",
        name: "Alice",
        email: "alice@example.com",
        blocks: [{ date: "2026-03-10", hour: 9 }],
        submittedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Bob",
        email: "bob@example.com",
        blocks: [
          { date: "2026-03-10", hour: 9 },
          { date: "2026-03-10", hour: 10 },
        ],
        submittedAt: new Date().toISOString(),
      },
    ];

    const result = computeOverlap(participants);
    const mar10at9 = result.find((b) => b.date === "2026-03-10" && b.hour === 9);
    const mar10at10 = result.find((b) => b.date === "2026-03-10" && b.hour === 10);

    expect(mar10at9?.count).toBe(2);
    expect(mar10at9?.participantNames).toEqual(["Alice", "Bob"]);
    expect(mar10at10?.count).toBe(1);
  });

  it("handles blocks on different dates", () => {
    const participants: Participant[] = [
      {
        id: "1",
        name: "Alice",
        email: "alice@example.com",
        blocks: [
          { date: "2026-03-10", hour: 9 },
          { date: "2026-03-11", hour: 9 },
        ],
        submittedAt: new Date().toISOString(),
      },
    ];

    const result = computeOverlap(participants);
    expect(result).toHaveLength(2);
    expect(result.find((b) => b.date === "2026-03-10")).toBeDefined();
    expect(result.find((b) => b.date === "2026-03-11")).toBeDefined();
  });
});
