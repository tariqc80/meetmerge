/**
 * A single hour block of availability on a specific date.
 * `date` is an ISO date string (YYYY-MM-DD), `hour` is 0-23.
 */
export interface TimeBlock {
  date: string; // "2026-03-10"
  hour: number; // 0-23
}

/** A participant's submitted availability */
export interface Participant {
  id: string;
  name: string;
  email: string;
  blocks: TimeBlock[];
  submittedAt: string; // ISO date string
}

/** A group scheduling session */
export interface Group {
  id: string;
  title: string;
  createdAt: string; // ISO date string
  ownerId: string; // participant ID of the group creator
  startDate: string; // YYYY-MM-DD — first day of the availability range
  endDate: string; // YYYY-MM-DD — last day of the availability range
  participants: Participant[];
}

/** Overlap info for a given time block */
export interface OverlapBlock extends TimeBlock {
  count: number;
  participantNames: string[];
}

/** Session info stored in localStorage per group */
export interface ParticipantSession {
  participantId: string;
  name: string;
  email: string;
}
