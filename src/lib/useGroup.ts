"use client";

import { useState, useEffect } from "react";
import { subscribeToGroup } from "@/lib/storage";
import type { Group } from "@/types";

/**
 * Subscribe to a Firestore group document in real time.
 * Returns the current group (or null if not found / still loading)
 * and a loading flag.
 *
 * Note: setState is called inside onSnapshot's callback, not synchronously
 * within the effect body, so this does not violate react-hooks/set-state-in-effect.
 */
export function useGroup(groupId: string): { group: Group | null; loading: boolean } {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToGroup(groupId, (g) => {
      setGroup(g);
      setLoading(false);
    });
    return unsubscribe;
  }, [groupId]);

  return { group, loading };
}
