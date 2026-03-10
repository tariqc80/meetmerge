import { describe, it, expect } from "vitest";
import { computeOverlap } from "./overlap";
import type { Participant } from "@/types";

describe("computeOverlap", () => {
  it("returns empty array for no participants", () => {
    expect(computeOverlap([])).toEqual([]);
  });

  it("counts overlapping blocks without timezone conversion", () => {
    const participants: Participant[] = [
      {
        id: "1",
        name: "Alice",
        email: "alice@example.com",
        timezone: "America/New_York",
        blocks: [{ date: "2026-03-10", hour: 9 }],
        submittedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Bob",
        email: "bob@example.com",
        timezone: "America/New_York",
        blocks: [
          { date: "2026-03-10", hour: 9 },
          { date: "2026-03-10", hour: 10 },
        ],
        submittedAt: new Date().toISOString(),
      },
    ];

    // Same timezone, no conversion needed
    const result = computeOverlap(participants, "America/New_York");
    const mar10at9 = result.find((b) => b.date === "2026-03-10" && b.hour === 9);
    const mar10at10 = result.find((b) => b.date === "2026-03-10" && b.hour === 10);

    expect(mar10at9?.count).toBe(2);
    expect(mar10at9?.participantNames).toEqual(["Alice", "Bob"]);
    expect(mar10at10?.count).toBe(1);
  });

  it("normalizes blocks across timezones for the viewer", () => {
    // Alice: 2 PM in New York (UTC-4 in March) = 18:00 UTC
    // Bob: 1 PM in Chicago (UTC-5 in March) = 18:00 UTC — same actual time
    const participants: Participant[] = [
      {
        id: "1",
        name: "Alice",
        email: "alice@example.com",
        timezone: "America/New_York",
        blocks: [{ date: "2026-03-10", hour: 14 }],
        submittedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Bob",
        email: "bob@example.com",
        timezone: "America/Chicago",
        blocks: [{ date: "2026-03-10", hour: 13 }],
        submittedAt: new Date().toISOString(),
      },
    ];

    // View in UTC: both should appear at hour 18
    const resultUtc = computeOverlap(participants, "UTC");
    const overlapAt18 = resultUtc.find((b) => b.date === "2026-03-10" && b.hour === 18);
    expect(overlapAt18?.count).toBe(2);
    expect(overlapAt18?.participantNames).toEqual(["Alice", "Bob"]);

    // View in New York: both should appear at hour 14
    const resultNy = computeOverlap(participants, "America/New_York");
    const overlapAt14 = resultNy.find((b) => b.date === "2026-03-10" && b.hour === 14);
    expect(overlapAt14?.count).toBe(2);
  });

  it("handles blocks on different dates", () => {
    const participants: Participant[] = [
      {
        id: "1",
        name: "Alice",
        email: "alice@example.com",
        timezone: "America/New_York",
        blocks: [
          { date: "2026-03-10", hour: 9 },
          { date: "2026-03-11", hour: 9 },
        ],
        submittedAt: new Date().toISOString(),
      },
    ];

    const result = computeOverlap(participants, "America/New_York");
    expect(result).toHaveLength(2);
    expect(result.find((b) => b.date === "2026-03-10")).toBeDefined();
    expect(result.find((b) => b.date === "2026-03-11")).toBeDefined();
  });

  it("shifts date when timezone conversion crosses midnight", () => {
    // Alice selects 11 PM in New York (UTC-4) = 03:00 UTC next day
    const participants: Participant[] = [
      {
        id: "1",
        name: "Alice",
        email: "alice@example.com",
        timezone: "America/New_York",
        blocks: [{ date: "2026-03-10", hour: 23 }],
        submittedAt: new Date().toISOString(),
      },
    ];

    const result = computeOverlap(participants, "UTC");
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-03-11");
    expect(result[0].hour).toBe(3);
  });
});
