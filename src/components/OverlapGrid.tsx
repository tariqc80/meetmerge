"use client";

import { Fragment, useMemo } from "react";
import type { OverlapBlock, TimeBlock } from "@/types";
import {
  getDateRange,
  groupDatesByWeek,
  formatDateLabel,
  formatHour,
  GRID_HOURS,
} from "@/lib/dates";

interface OverlapGridProps {
  startDate: string;
  endDate: string;
  blocks: OverlapBlock[];
  totalParticipants: number;
  /** The current participant's blocks — shown with a subtle distinct background */
  currentUserBlocks?: TimeBlock[];
}

function getBlockAt(blocks: OverlapBlock[], date: string, hour: number): OverlapBlock | undefined {
  return blocks.find((b) => b.date === date && b.hour === hour);
}

function isCurrentUser(blocks: TimeBlock[] | undefined, date: string, hour: number): boolean {
  if (!blocks) return false;
  return blocks.some((b) => b.date === date && b.hour === hour);
}

/**
 * Returns an inline style with a computed background color.
 * Gradient: empty (white) -> gray -> blue-gray -> light green at full overlap.
 */
/**
 * Returns an inline style with a computed background color.
 * Green is applied to blocks with the highest overlap count (maxCount),
 * not only when all participants overlap.
 */
function intensityStyle(count: number, maxCount: number, isMine: boolean): React.CSSProperties {
  // Empty cell
  if (count === 0 && !isMine) return {};

  // Only the current user, no one else
  if (count === 0 && isMine) return { backgroundColor: "rgba(148, 163, 184, 0.15)" };

  if (maxCount <= 1) {
    // Only one person max — show green for their blocks
    return { backgroundColor: "rgba(74, 222, 128, 0.85)" };
  }

  // Highest overlap gets green
  if (count >= maxCount) {
    return { backgroundColor: "rgba(74, 222, 128, 0.85)" }; // green-400
  }

  // Everything else: slate -> blue-teal gradient scaled to maxCount
  const t = (count - 1) / (maxCount - 1);

  // Interpolate from slate-200 (226,232,240) to a blue-teal (120,180,200)
  const r = Math.round(226 + (120 - 226) * t);
  const g = Math.round(232 + (180 - 232) * t);
  const b = Math.round(240 + (200 - 240) * t);
  const alpha = 0.15 + 0.7 * t;

  return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})` };
}

export function OverlapGrid({
  startDate,
  endDate,
  blocks,
  totalParticipants,
  currentUserBlocks,
}: OverlapGridProps) {
  const dates = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate]);
  const weeks = useMemo(() => groupDatesByWeek(dates), [dates]);
  const maxCount = useMemo(() => Math.max(0, ...blocks.map((b) => b.count)), [blocks]);

  return (
    <div className="space-y-8">
      {weeks.map((weekDates, weekIdx) => (
        <div key={weekIdx} className="overflow-x-auto">
          <div
            className="grid gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden"
            style={{ gridTemplateColumns: `80px repeat(${weekDates.length}, 1fr)` }}
          >
            {/* Header row */}
            <div className="bg-white dark:bg-gray-900 p-2 text-xs font-medium text-gray-500" />
            {weekDates.map((date) => (
              <div
                key={date}
                className="bg-white dark:bg-gray-900 p-1 text-center text-xs font-semibold text-gray-700 dark:text-gray-300"
              >
                {formatDateLabel(date)}
              </div>
            ))}

            {/* Time rows */}
            {GRID_HOURS.map((hour) => (
              <Fragment key={`row-${hour}`}>
                <div className="bg-white dark:bg-gray-900 p-2 text-xs text-gray-500 text-right pr-3">
                  {formatHour(hour)}
                </div>
                {weekDates.map((date) => {
                  const block = getBlockAt(blocks, date, hour);
                  const count = block?.count ?? 0;
                  const isMine = isCurrentUser(currentUserBlocks, date, hour);
                  const style = intensityStyle(count, maxCount, isMine);

                  return (
                    <div
                      key={`${date}-${hour}`}
                      className={`h-8 flex items-center justify-center text-xs font-medium bg-white dark:bg-gray-900 ${count > 1 ? "text-gray-700 dark:text-gray-200" : count > 0 ? "text-gray-400 dark:text-gray-500" : ""}`}
                      style={style}
                      title={
                        block
                          ? `${block.participantNames.join(", ")} (${count}/${totalParticipants})`
                          : isMine
                            ? "Your availability"
                            : ""
                      }
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="flex">
            <div
              className="h-4 w-4 rounded-l border border-gray-200"
              style={{ backgroundColor: "rgba(226,232,240,0.15)" }}
            />
            <div
              className="h-4 w-4 border-y border-gray-200"
              style={{ backgroundColor: "rgba(173,206,220,0.42)" }}
            />
            <div
              className="h-4 w-4 border-y border-gray-200"
              style={{ backgroundColor: "rgba(120,180,200,0.85)" }}
            />
            <div
              className="h-4 w-4 rounded-r border border-gray-200"
              style={{ backgroundColor: "rgba(74,222,128,0.85)" }}
            />
          </div>
          <span>Less overlap → more → best overlap</span>
        </div>
      </div>
    </div>
  );
}
