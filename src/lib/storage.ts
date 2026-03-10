import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Group, Participant } from "@/types";

const COLLECTION = "groups";

/** Load a group from Firestore. Returns null if not found. */
export async function loadGroup(groupId: string): Promise<Group | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTION, groupId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Group;
  } catch {
    return null;
  }
}

/** Create a new group in Firestore. */
export async function createGroup(group: Group): Promise<void> {
  try {
    const { id, ...data } = group;
    await setDoc(doc(db, COLLECTION, id), data);
  } catch (err) {
    console.error("Failed to create group:", err);
  }
}

/** Add a participant to an existing group. */
export async function addParticipant(groupId: string, participant: Participant): Promise<void> {
  try {
    const group = await loadGroup(groupId);
    if (!group) return;
    await updateDoc(doc(db, COLLECTION, groupId), {
      participants: [...group.participants, participant],
    });
  } catch (err) {
    console.error("Failed to add participant:", err);
  }
}

/** Update an existing participant's availability blocks. */
export async function updateParticipant(
  groupId: string,
  participantId: string,
  blocks: Participant["blocks"],
): Promise<void> {
  try {
    const group = await loadGroup(groupId);
    if (!group) return;
    const updated = group.participants.map((p) =>
      p.id === participantId ? { ...p, blocks, submittedAt: new Date().toISOString() } : p,
    );
    await updateDoc(doc(db, COLLECTION, groupId), { participants: updated });
  } catch (err) {
    console.error("Failed to update participant:", err);
  }
}

/** Remove a participant from a group (owner only in UI). */
export async function removeParticipant(groupId: string, participantId: string): Promise<void> {
  try {
    const group = await loadGroup(groupId);
    if (!group) return;
    const filtered = group.participants.filter((p) => p.id !== participantId);
    await updateDoc(doc(db, COLLECTION, groupId), { participants: filtered });
  } catch (err) {
    console.error("Failed to remove participant:", err);
  }
}

/**
 * Subscribe to real-time updates for a group.
 * Returns an unsubscribe function.
 */
export function subscribeToGroup(
  groupId: string,
  callback: (group: Group | null) => void,
): () => void {
  return onSnapshot(
    doc(db, COLLECTION, groupId),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...snap.data() } as Group);
    },
    () => {
      callback(null);
    },
  );
}
