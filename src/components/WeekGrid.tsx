"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { TimeBlock } from "@/types";
import { getDateRange, groupDatesByWeek, formatDateLabel, formatHour, GRID_HOURS } from "@/lib/dates";

interface WeekGridProps {
  startDate: string;
  endDate: string;
  selectedBlocks: TimeBlock[];
  onToggleBlock: (block: TimeBlock) => void;
  onBulkUpdate: (toAdd: TimeBlock[], toRemove: TimeBlock[]) => void;
}

function isSelected(blocks: TimeBlock[], date: string, hour: number): boolean {
  return blocks.some((b) => b.date === date && b.hour === hour);
}

interface DragState {
  /** Which week index the drag started in */
  weekIdx: number;
  /** Start cell coords within that week */
  startDateIdx: number;
  startHourIdx: number;
  /** Current cell coords */
  currentDateIdx: number;
  currentHourIdx: number;
  /** true = selecting, false = deselecting (based on start cell state) */
  adding: boolean;
}

function getDragRect(drag: DragState) {
  const minDate = Math.min(drag.startDateIdx, drag.currentDateIdx);
  const maxDate = Math.max(drag.startDateIdx, drag.currentDateIdx);
  const minHour = Math.min(drag.startHourIdx, drag.currentHourIdx);
  const maxHour = Math.max(drag.startHourIdx, drag.currentHourIdx);
  return { minDate, maxDate, minHour, maxHour };
}

function isInDragRect(drag: DragState, dateIdx: number, hourIdx: number): boolean {
  const { minDate, maxDate, minHour, maxHour } = getDragRect(drag);
  return dateIdx >= minDate && dateIdx <= maxDate && hourIdx >= minHour && hourIdx <= maxHour;
}

export function WeekGrid({ startDate, endDate, selectedBlocks, onToggleBlock, onBulkUpdate }: WeekGridProps) {
  const dates = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate]);
  const weeks = useMemo(() => groupDatesByWeek(dates), [dates]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const handleMouseDown = useCallback(
    (weekIdx: number, dateIdx: number, hourIdx: number, weekDates: string[]) => {
      const date = weekDates[dateIdx];
      const hour = GRID_HOURS[hourIdx];
      const alreadySelected = isSelected(selectedBlocks, date, hour);
      const state: DragState = {
        weekIdx,
        startDateIdx: dateIdx,
        startHourIdx: hourIdx,
        currentDateIdx: dateIdx,
        currentHourIdx: hourIdx,
        adding: !alreadySelected,
      };
      dragRef.current = state;
      setDrag(state);
    },
    [selectedBlocks],
  );

  const handleMouseEnter = useCallback(
    (weekIdx: number, dateIdx: number, hourIdx: number) => {
      if (!dragRef.current || dragRef.current.weekIdx !== weekIdx) return;
      const updated = { ...dragRef.current, currentDateIdx: dateIdx, currentHourIdx: hourIdx };
      dragRef.current = updated;
      setDrag(updated);
    },
    [],
  );

  const handleMouseUp = useCallback(
    (weekDates: string[]) => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      setDrag(null);

      // Single cell click — use toggle
      if (d.startDateIdx === d.currentDateIdx && d.startHourIdx === d.currentHourIdx) {
        onToggleBlock({ date: weekDates[d.startDateIdx], hour: GRID_HOURS[d.startHourIdx] });
        return;
      }

      // Multi-cell drag — bulk add or remove
      const { minDate, maxDate, minHour, maxHour } = getDragRect(d);
      const blocks: TimeBlock[] = [];
      for (let di = minDate; di <= maxDate; di++) {
        for (let hi = minHour; hi <= maxHour; hi++) {
          blocks.push({ date: weekDates[di], hour: GRID_HOURS[hi] });
        }
      }
      if (d.adding) {
        onBulkUpdate(blocks, []);
      } else {
        onBulkUpdate([], blocks);
      }
    },
    [onToggleBlock, onBulkUpdate],
  );

  // Determine visual state of a cell during drag
  const getCellState = useCallback(
    (weekIdx: number, dateIdx: number, hourIdx: number, date: string, hour: number): boolean => {
      const base = isSelected(selectedBlocks, date, hour);
      if (!drag || drag.weekIdx !== weekIdx) return base;
      if (!isInDragRect(drag, dateIdx, hourIdx)) return base;
      return drag.adding;
    },
    [selectedBlocks, drag],
  );

  return (
    <div
      className="space-y-8 select-none"
      onMouseLeave={() => {
        if (dragRef.current) {
          dragRef.current = null;
          setDrag(null);
        }
      }}
    >
      {weeks.map((weekDates, weekIdx) => (
        <div key={weekIdx} className="overflow-x-auto">
          <div
            className="grid gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden"
            style={{ gridTemplateColumns: `80px repeat(${weekDates.length}, 1fr)` }}
            onMouseUp={() => handleMouseUp(weekDates)}
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
            {GRID_HOURS.map((hour, hourIdx) => (
              <>
                <div
                  key={`label-${hour}`}
                  className="bg-white dark:bg-gray-900 p-2 text-xs text-gray-500 text-right pr-3"
                >
                  {formatHour(hour)}
                </div>
                {weekDates.map((date, dateIdx) => {
                  const selected = getCellState(weekIdx, dateIdx, hourIdx, date, hour);
                  const inDrag =
                    drag && drag.weekIdx === weekIdx && isInDragRect(drag, dateIdx, hourIdx);
                  return (
                    <div
                      key={`${date}-${hour}`}
                      role="gridcell"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleMouseDown(weekIdx, dateIdx, hourIdx, weekDates);
                      }}
                      onMouseEnter={() => handleMouseEnter(weekIdx, dateIdx, hourIdx)}
                      className={`h-8 cursor-pointer transition-colors ${
                        selected
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-white dark:bg-gray-900 hover:bg-blue-100 dark:hover:bg-gray-800"
                      } ${inDrag ? "opacity-80" : ""}`}
                      aria-label={`${formatDateLabel(date)} ${formatHour(hour)} ${selected ? "selected" : "not selected"}`}
                    />
                  );
                })}
              </>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
