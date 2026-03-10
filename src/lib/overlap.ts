import type { Participant, OverlapBlock } from "@/types";

/**
 * Compute overlap blocks from a list of participants.
 * Returns an OverlapBlock for every (date, hour) that at least one participant selected.
 */
export function computeOverlap(participants: Participant[]): OverlapBlock[] {
  const map = new Map<string, OverlapBlock>();

  for (const participant of participants) {
    for (const block of participant.blocks) {
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
