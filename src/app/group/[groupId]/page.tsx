"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { WeekGrid } from "@/components/WeekGrid";
import { SubmissionCounter } from "@/components/SubmissionCounter";
import { addParticipant, updateParticipant } from "@/lib/storage";
import { useGroup } from "@/lib/useGroup";
import { getSession, saveSession } from "@/lib/session";
import {
  detectTimezoneByIP,
  getBrowserTimezone,
  getTimezoneOptions,
  formatTimezone,
} from "@/lib/timezone";
import type { TimeBlock } from "@/types";

export default function AvailabilityPage() {
  const params = useParams<{ groupId: string }>();
  const { group, loading } = useGroup(params.groupId);

  // Check if this participant already has a session for this group
  const session = useMemo(() => getSession(params.groupId), [params.groupId]);
  const existingParticipant = useMemo(
    () =>
      session && group ? group.participants.find((p) => p.id === session.participantId) : null,
    [session, group],
  );
  const isReturning = !!existingParticipant;

  // Join form state — pre-fill from session if owner visiting for first time
  const [name, setName] = useState(session?.name ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [timezone, setTimezone] = useState(getBrowserTimezone());
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);

  // Auto-detect timezone from IP on mount
  useEffect(() => {
    detectTimezoneByIP().then(setTimezone);
  }, []);

  // Grid state — initialize with existing blocks if returning
  const [selectedBlocks, setSelectedBlocks] = useState<TimeBlock[]>(
    existingParticipant?.blocks ?? [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync existing blocks when group data loads for returning users
  const [synced, setSynced] = useState(false);
  if (existingParticipant && !synced) {
    setSelectedBlocks(existingParticipant.blocks);
    setSynced(true);
  }

  const handleToggleBlock = useCallback((block: TimeBlock) => {
    setSelectedBlocks((prev) => {
      const exists = prev.some((b) => b.date === block.date && b.hour === block.hour);
      if (exists) {
        return prev.filter((b) => !(b.date === block.date && b.hour === block.hour));
      }
      return [...prev, block];
    });
    setSaved(false);
  }, []);

  const handleBulkUpdate = useCallback((toAdd: TimeBlock[], toRemove: TimeBlock[]) => {
    setSelectedBlocks((prev) => {
      let next = prev.filter((b) => !toRemove.some((r) => r.date === b.date && r.hour === b.hour));
      for (const block of toAdd) {
        if (!next.some((b) => b.date === block.date && b.hour === block.hour)) {
          next = [...next, block];
        }
      }
      return next;
    });
    setSaved(false);
  }, []);

  async function handleSubmitNew() {
    if (!group || !name.trim() || !email.trim()) return;
    setSubmitting(true);
    // Reuse session ID if owner, otherwise generate new
    const participantId = session?.participantId ?? uuidv4();
    await addParticipant(group.id, {
      id: participantId,
      name: name.trim(),
      email: email.trim(),
      timezone,
      blocks: selectedBlocks,
      submittedAt: new Date().toISOString(),
    });
    saveSession(group.id, {
      participantId,
      name: name.trim(),
      email: email.trim(),
    });
    setSubmitting(false);
    setSaved(true);
  }

  async function handleUpdate() {
    if (!group || !session) return;
    setSubmitting(true);
    await updateParticipant(group.id, session.participantId, selectedBlocks);
    setSubmitting(false);
    setSaved(true);
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

  // New participant: show join form before the grid
  if (!isReturning && !saved) {
    return (
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">{group.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your details to add your availability
          </p>
        </div>

        <div className="max-w-xs space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Your timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timezoneOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {formatTimezone(tz)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Click to select hours, or click and drag to select a range.
        </p>

        <WeekGrid
          startDate={group.startDate}
          endDate={group.endDate}
          selectedBlocks={selectedBlocks}
          onToggleBlock={handleToggleBlock}
          onBulkUpdate={handleBulkUpdate}
        />

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSubmitNew}
            disabled={!name.trim() || !email.trim() || selectedBlocks.length === 0 || submitting}
            className="rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Availability"}
          </button>
          <SubmissionCounter count={group.participants.length} />
        </div>

        <a href={`/group/${group.id}/view`} className="text-sm text-blue-500 hover:underline">
          View group availability
        </a>
      </main>
    );
  }

  // Returning participant or just submitted: show grid for editing
  const displayName = isReturning ? session!.name : name;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{group.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome back, {displayName}. Edit your availability below.
          </p>
        </div>
        <SubmissionCounter count={group.participants.length} />
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Click to select hours, or click and drag to select a range.
      </p>

      <WeekGrid
        startDate={group.startDate}
        endDate={group.endDate}
        selectedBlocks={selectedBlocks}
        onToggleBlock={handleToggleBlock}
        onBulkUpdate={handleBulkUpdate}
      />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleUpdate}
          disabled={submitting || saved}
          className="rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saved ? "Saved" : submitting ? "Saving..." : "Save Changes"}
        </button>
        <a href={`/group/${group.id}/view`} className="text-sm text-blue-500 hover:underline">
          View group availability
        </a>
      </div>
    </main>
  );
}
