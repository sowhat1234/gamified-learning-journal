"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJournal } from "@/hooks/useJournal";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface DayData {
  date: Date;
  dateKey: string;
  count: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

interface HeatmapProps {
  weeks?: number;
  className?: string;
  showLabels?: boolean;
  showLegend?: boolean;
  colorScheme?: "green" | "blue" | "purple" | "orange";
}

interface TooltipData {
  x: number;
  y: number;
  date: Date;
  count: number;
}

// ============================================================================
// Constants
// ============================================================================

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const COLOR_SCHEMES = {
  green: {
    0: "bg-muted hover:bg-muted/80",
    1: "bg-emerald-200 dark:bg-emerald-900 hover:bg-emerald-300 dark:hover:bg-emerald-800",
    2: "bg-emerald-400 dark:bg-emerald-700 hover:bg-emerald-500 dark:hover:bg-emerald-600",
    3: "bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500",
    4: "bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400",
  },
  blue: {
    0: "bg-muted hover:bg-muted/80",
    1: "bg-blue-200 dark:bg-blue-900 hover:bg-blue-300 dark:hover:bg-blue-800",
    2: "bg-blue-400 dark:bg-blue-700 hover:bg-blue-500 dark:hover:bg-blue-600",
    3: "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500",
    4: "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400",
  },
  purple: {
    0: "bg-muted hover:bg-muted/80",
    1: "bg-violet-200 dark:bg-violet-900 hover:bg-violet-300 dark:hover:bg-violet-800",
    2: "bg-violet-400 dark:bg-violet-700 hover:bg-violet-500 dark:hover:bg-violet-600",
    3: "bg-violet-500 dark:bg-violet-600 hover:bg-violet-600 dark:hover:bg-violet-500",
    4: "bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 dark:hover:bg-violet-400",
  },
  orange: {
    0: "bg-muted hover:bg-muted/80",
    1: "bg-orange-200 dark:bg-orange-900 hover:bg-orange-300 dark:hover:bg-orange-800",
    2: "bg-orange-400 dark:bg-orange-700 hover:bg-orange-500 dark:hover:bg-orange-600",
    3: "bg-orange-500 dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-500",
    4: "bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-400",
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getIntensityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// ============================================================================
// Component
// ============================================================================

export function Heatmap({
  weeks = 12,
  className,
  showLabels = true,
  showLegend = true,
  colorScheme = "green",
}: HeatmapProps) {
  const { entries } = useJournal();
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Build entry counts by date
  const entryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((entry) => {
      const dateKey = formatDateKey(new Date(entry.date));
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return counts;
  }, [entries]);

  // Generate grid data
  const { gridData, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalDays = weeks * 7;
    const startDate = new Date(today);
    
    // Go back to start, aligned to Sunday
    startDate.setDate(startDate.getDate() - totalDays + 1);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const data: DayData[][] = [];
    const months: { label: string; column: number }[] = [];
    let currentMonth = -1;

    // Create 7 rows (one for each day of week)
    for (let row = 0; row < 7; row++) {
      data[row] = [];
    }

    // Fill in days
    const currentDate = new Date(startDate);
    let column = 0;

    while (currentDate <= today || data[0].length < weeks) {
      const dayOfWeek = currentDate.getDay();
      const dateKey = formatDateKey(currentDate);
      const month = currentDate.getMonth();

      // Track month changes for labels
      if (dayOfWeek === 0 && month !== currentMonth) {
        currentMonth = month;
        months.push({ label: MONTHS[month], column });
      }

      data[dayOfWeek].push({
        date: new Date(currentDate),
        dateKey,
        count: entryCounts[dateKey] || 0,
        isCurrentMonth: month === today.getMonth(),
        isToday: isSameDay(currentDate, today),
        isFuture: currentDate > today,
      });

      if (dayOfWeek === 6) {
        column++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { gridData: data, monthLabels: months };
  }, [weeks, entryCounts]);

  const colors = COLOR_SCHEMES[colorScheme];

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    day: DayData
  ) => {
    if (day.isFuture) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top,
      date: day.date,
      count: day.count,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const totalEntries = entries.length;
  const activeDays = Object.keys(entryCounts).length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Stats summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground">{totalEntries}</strong> entries
        </span>
        <span>
          <strong className="text-foreground">{activeDays}</strong> active days
        </span>
      </div>

      {/* Heatmap grid */}
      <div className="relative overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {/* Month labels */}
          {showLabels && (
            <div className="flex h-4 pl-8">
              {monthLabels.map((month, idx) => (
                <div
                  key={`${month.label}-${idx}`}
                  className="text-xs text-muted-foreground"
                  style={{
                    marginLeft: idx === 0 ? month.column * 14 : undefined,
                    width: idx < monthLabels.length - 1
                      ? (monthLabels[idx + 1].column - month.column) * 14
                      : undefined,
                  }}
                >
                  {month.label}
                </div>
              ))}
            </div>
          )}

          {/* Grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            {showLabels && (
              <div className="flex flex-col gap-1 pr-2">
                {WEEKDAYS.map((day, idx) => (
                  <div
                    key={day}
                    className={cn(
                      "flex h-3 w-6 items-center justify-end text-[10px] text-muted-foreground",
                      idx % 2 === 1 && "invisible"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>
            )}

            {/* Cells */}
            <div className="flex gap-[3px]">
              {gridData[0]?.map((_, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-[3px]">
                  {gridData.map((row, rowIdx) => {
                    const day = row[colIdx];
                    if (!day) return <div key={rowIdx} className="h-3 w-3" />;

                    const level = day.isFuture ? 0 : getIntensityLevel(day.count);

                    return (
                      <motion.div
                        key={day.dateKey}
                        role="gridcell"
                        aria-label={`${formatDate(day.date)}: ${day.count} ${day.count === 1 ? "entry" : "entries"}`}
                        tabIndex={day.isFuture ? -1 : 0}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: (colIdx * 7 + rowIdx) * 0.002,
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className={cn(
                          "h-3 w-3 rounded-sm transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                          colors[level],
                          day.isToday && "ring-1 ring-foreground ring-offset-1 ring-offset-background",
                          day.isFuture && "opacity-30 cursor-default"
                        )}
                        onMouseEnter={(e) => handleMouseEnter(e, day)}
                        onMouseLeave={handleMouseLeave}
                        onFocus={(e) => handleMouseEnter(e as unknown as React.MouseEvent<HTMLDivElement>, day)}
                        onBlur={handleMouseLeave}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-[3px]">
              {([0, 1, 2, 3, 4] as const).map((level) => (
                <div
                  key={level}
                  className={cn("h-3 w-3 rounded-sm", colors[level])}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y - 8,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-lg">
              <div className="font-medium">
                {tooltip.count === 0
                  ? "No entries"
                  : `${tooltip.count} ${tooltip.count === 1 ? "entry" : "entries"}`}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(tooltip.date)}
              </div>
              {/* Arrow */}
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-popover" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

