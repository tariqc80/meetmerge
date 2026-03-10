import type { ParticipantSession } from "@/types";

/**
 * Get/set the participant session for a specific group in localStorage.
 * Keyed by `meetmerge:session:{groupId}`.
 */

function sessionKey(groupId: string): string {
  return `meetmerge:session:${groupId}`;
}

export function getSession(groupId: string): ParticipantSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(sessionKey(groupId));
    if (!raw) return null;
    return JSON.parse(raw) as ParticipantSession;
  } catch {
    return null;
  }
}

export function saveSession(groupId: string, session: ParticipantSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(sessionKey(groupId), JSON.stringify(session));
}
