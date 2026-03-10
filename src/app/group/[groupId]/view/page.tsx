"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { OverlapGrid } from "@/components/OverlapGrid";
import { SubmissionCounter } from "@/components/SubmissionCounter";
import { useGroup } from "@/lib/useGroup";
import { getSession } from "@/lib/session";
import { computeOverlap } from "@/lib/overlap";
import { removeParticipant, updateParticipant } from "@/lib/storage";
import { getBrowserTimezone, convertBlocks, formatTimezone } from "@/lib/timezone";
import type { TimeBlock } from "@/types";

export default function GroupViewPage() {
  const params = useParams<{ groupId: string }>();
  const { group, loading } = useGroup(params.groupId);
  const session = useMemo(() => getSession(params.groupId), [params.groupId]);
  const isOwner = !!(session && group && group.ownerId === session.participantId);
  const viewerTimezone = useMemo(() => getBrowserTimezone(), []);

  const overlapBlocks = useMemo(
    () => (group ? computeOverlap(group.participants, viewerTimezone) : []),
    [group, viewerTimezone],
  );

  const currentUserBlocks = useMemo(() => {
    if (!group || !session) return undefined;
    const me = group.participants.find((p) => p.id === session.participantId);
    if (!me) return undefined;
    // Convert current user's blocks to viewer timezone for consistent highlighting
    return me.timezone ? convertBlocks(me.blocks, me.timezone, viewerTimezone) : me.blocks;
  }, [group, session, viewerTimezone]);

  // Admin editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBlocks, setEditBlocks] = useState<TimeBlock[]>([]);

  async function handleRemove(participantId: string) {
    if (!group) return;
    await removeParticipant(group.id, participantId);
  }

  function handleStartEdit(participantId: string) {
    if (!group) return;
    const participant = group.participants.find((p) => p.id === participantId);
    if (!participant) return;
    setEditingId(participantId);
    setEditBlocks(participant.blocks);
  }

  async function handleSaveEdit() {
    if (!group || !editingId) return;
    await updateParticipant(group.id, editingId, editBlocks);
    setEditingId(null);
    setEditBlocks([]);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Group not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{group.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Group availability overview
            {isOwner ? " (Owner)" : ""}
          </p>
        </div>
        <SubmissionCounter count={group.participants.length} />
      </div>

      {group.participants.length === 0 ? (
        <p className="text-gray-500">No one has submitted availability yet.</p>
      ) : (
        <>
          {/* Participant list with admin controls */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Participants:
            </span>
            <div className="flex flex-wrap gap-2">
              {group.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-1">
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      session && p.id === session.participantId
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                    title={p.timezone ? p.timezone.replace(/_/g, " ") : undefined}
                  >
                    {p.name}
                    {session && p.id === session.participantId ? " (you)" : ""}
                    {p.timezone && (
                      <span className="ml-1 text-xs opacity-60">
                        {p.timezone.split("/").pop()?.replace(/_/g, " ")}
                      </span>
                    )}
                  </span>
                  {isOwner && p.id !== session!.participantId && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(p.id)}
                        className="rounded px-1.5 py-0.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                        title="Edit availability"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(p.id)}
                        className="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        title="Remove participant"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Admin edit panel */}
          {editingId && (
            <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950 p-4 space-y-3">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Editing availability for {group.participants.find((p) => p.id === editingId)?.name}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                {editBlocks.length} blocks selected
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-md bg-yellow-600 px-4 py-2 text-xs font-semibold text-white hover:bg-yellow-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditBlocks([]);
                  }}
                  className="rounded-md bg-gray-200 dark:bg-gray-700 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Times shown in your timezone: {formatTimezone(viewerTimezone)}
          </p>

          <OverlapGrid
            startDate={group.startDate}
            endDate={group.endDate}
            blocks={overlapBlocks}
            totalParticipants={group.participants.length}
            currentUserBlocks={currentUserBlocks}
          />
        </>
      )}

      <a
        href={`/group/${group.id}`}
        className="inline-block rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
      >
        {session ? "Edit Your Availability" : "Add Your Availability"}
      </a>
    </main>
  );
}
