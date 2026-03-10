"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { createGroup } from "@/lib/storage";
import { saveSession } from "@/lib/session";
import { defaultDateRange } from "@/lib/dates";
import type { Group } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const defaults = defaultDateRange();
  const [title, setTitle] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [creating, setCreating] = useState(false);
  const [groupLink, setGroupLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (creating || !ownerName.trim() || !ownerEmail.trim()) return;
    setCreating(true);
    const ownerId = uuidv4();
    const groupId = uuidv4();
    const group: Group = {
      id: groupId,
      title: title.trim() || "Untitled Group",
      createdAt: new Date().toISOString(),
      ownerId,
      startDate,
      endDate,
      participants: [],
    };
    await createGroup(group);
    saveSession(groupId, {
      participantId: ownerId,
      name: ownerName.trim(),
      email: ownerEmail.trim(),
    });
    setGroupLink(`${window.location.origin}/group/${groupId}`);
    setCreating(false);
  }

  if (groupLink) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Group Created!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share this link with your participants:
          </p>

          <div className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-3">
            <input
              type="text"
              readOnly
              value={groupLink}
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none"
            />
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(groupLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="shrink-0 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push(groupLink.replace(window.location.origin, ""))}
            className="w-full rounded-lg bg-gray-200 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Go to Group
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">MeetMerge</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find the best meeting time for your group.
        </p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Group name (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Your name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Your email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
              Date range
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 text-left mb-1">
                  Start
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={defaults.startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 text-left mb-1">
                  End
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !ownerName.trim() || !ownerEmail.trim()}
            className="w-full rounded-lg bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </main>
  );
}
