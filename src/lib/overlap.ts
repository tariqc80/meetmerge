import type { Participant, OverlapBlock } from "@/types";
import { convertBlocks } from "@/lib/timezone";

/**
 * Compute overlap blocks from a list of participants.
 * All blocks are normalized to `viewerTimezone` before comparison,
 * so participants in different timezones are compared by actual time.
 * Returns an OverlapBlock for every (date, hour) that at least one participant selected.
 */
export function computeOverlap(
  participants: Participant[],
  viewerTimezone?: string,
): OverlapBlock[] {
  const map = new Map<string, OverlapBlock>();

  for (const participant of participants) {
    // Convert this participant's blocks to the viewer's timezone (or leave as-is)
    const blocks =
      viewerTimezone && participant.timezone
        ? convertBlocks(participant.blocks, participant.timezone, viewerTimezone)
        : participant.blocks;

    for (const block of blocks) {
      const key = `${block.date}-${block.hour}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.participantNames.push(participant.name);
      } else {
        map.set(key, {
          date: block.date,
          hour: block.hour,
          count: 1,
          participantNames: [participant.name],
        });
      }
    }
  }

  return Array.from(map.values());
}
