/**
 * Timezone detection and utilities.
 * Uses the browser's Intl API as the primary source, with an optional
 * IP-based lookup as a fallback/confirmation via worldtimeapi.org.
 */

/** Get the browser's local timezone via Intl API */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/** Detect timezone via IP geolocation (worldtimeapi.org). Falls back to browser timezone. */
export async function detectTimezoneByIP(): Promise<string> {
  try {
    const res = await fetch("https://worldtimeapi.org/api/ip", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return getBrowserTimezone();
    const data = (await res.json()) as { timezone: string };
    return data.timezone || getBrowserTimezone();
  } catch {
    return getBrowserTimezone();
  }
}

/** Get a list of common IANA timezone identifiers for the selector */
export function getTimezoneOptions(): string[] {
  // Use Intl.supportedValuesOf if available (modern browsers), otherwise fallback
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    try {
      return (Intl as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf(
        "timeZone",
      );
    } catch {
      // fall through to static list
    }
  }
  return COMMON_TIMEZONES;
}

/** Format a timezone for display, e.g. "America/New_York" -> "America/New York (UTC-5)" */
export function formatTimezone(tz: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const label = tz.replace(/_/g, " ");
    return `${label} (${offset})`;
  } catch {
    return tz.replace(/_/g, " ");
  }
}

import type { TimeBlock } from "@/types";

/**
 * Convert a time block from one timezone to another.
 * Uses Intl.DateTimeFormat to resolve the actual local time in each zone,
 * accounting for DST transitions.
 */
export function convertBlock(block: TimeBlock, fromTz: string, toTz: string): TimeBlock {
  if (fromTz === toTz) return block;

  const year = parseInt(block.date.slice(0, 4), 10);
  const month = parseInt(block.date.slice(5, 7), 10) - 1;
  const day = parseInt(block.date.slice(8, 10), 10);

  // Treat the block's date/hour as if it were UTC to get a reference timestamp
  const fakeUtcMs = Date.UTC(year, month, day, block.hour, 0, 0);

  // Find the UTC offset of fromTz at approximately this instant
  const fromOffset = getTimezoneOffsetMinutes(new Date(fakeUtcMs), fromTz);

  // The real UTC instant: fakeUtc - fromOffset
  const realUtcMs = fakeUtcMs - fromOffset * 60_000;

  // Find the UTC offset of toTz at the real UTC instant
  const toOffset = getTimezoneOffsetMinutes(new Date(realUtcMs), toTz);

  // Compute local time in toTz by adding its offset to UTC
  const targetMs = realUtcMs + toOffset * 60_000;
  const target = new Date(targetMs);

  const tYear = target.getUTCFullYear();
  const tMonth = String(target.getUTCMonth() + 1).padStart(2, "0");
  const tDay = String(target.getUTCDate()).padStart(2, "0");

  return { date: `${tYear}-${tMonth}-${tDay}`, hour: target.getUTCHours() };
}

/**
 * Get the UTC offset in minutes for a timezone at a given instant.
 * Positive = ahead of UTC (e.g. +60 for CET), negative = behind (e.g. -300 for EST).
 */
function getTimezoneOffsetMinutes(date: Date, tz: string): number {
  // Format the date in the target timezone and parse the components
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string): number =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

  // Build a UTC timestamp from the local components in that timezone
  const localAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  // The difference between localAsUtc and the real UTC time is the offset
  return Math.round((localAsUtc - date.getTime()) / 60_000);
}

/**
 * Convert all of a participant's blocks from their timezone to a target timezone.
 */
export function convertBlocks(blocks: TimeBlock[], fromTz: string, toTz: string): TimeBlock[] {
  if (fromTz === toTz) return blocks;
  return blocks.map((b) => convertBlock(b, fromTz, toTz));
}

const COMMON_TIMEZONES = [
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Atlantic/Reykjavik",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];
