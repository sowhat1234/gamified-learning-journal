"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { JournalEntry } from "@/hooks/useJournal";

// ============================================================================
// Types
// ============================================================================

export interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface ChartProps {
  data: DataPoint[];
  className?: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
  emptyMessage?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
}

// ============================================================================
// Constants
// ============================================================================

const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };
const DEFAULT_HEIGHT = 160;

// ============================================================================
// Helper Functions
// ============================================================================

function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getLast14Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(getDateKey(date));
  }

  return days;
}

// ============================================================================
// Data Generation Helper
// ============================================================================

export interface ChartData {
  focusData: DataPoint[];
  entriesData: DataPoint[];
}

export function generateChartData(entries: JournalEntry[]): ChartData {
  const days = getLast14Days();

  // Group entries by day
  const entriesByDay: Record<string, JournalEntry[]> = {};
  entries.forEach((entry) => {
    const dateKey = getDateKey(new Date(entry.date));
    if (!entriesByDay[dateKey]) {
      entriesByDay[dateKey] = [];
    }
    entriesByDay[dateKey].push(entry);
  });

  // Generate focus data (average focus level per day)
  const focusData: DataPoint[] = days.map((day) => {
    const dayEntries = entriesByDay[day] || [];
    let avgFocus = 0;

    if (dayEntries.length > 0) {
      const totalFocus = dayEntries.reduce(
        (sum, e) => sum + (e.focusLevel || Math.round(e.focus / 6) || 5),
        0
      );
      avgFocus = Math.round((totalFocus / dayEntries.length) * 10) / 10;
    }

    return {
      date: day,
      value: avgFocus,
      label: `${formatDateLabel(day)}: ${avgFocus > 0 ? `${avgFocus}/10 focus` : "No entries"}`,
    };
  });

  // Generate entries count data
  const entriesData: DataPoint[] = days.map((day) => {
    const count = entriesByDay[day]?.length || 0;
    return {
      date: day,
      value: count,
      label: `${formatDateLabel(day)}: ${count} ${count === 1 ? "entry" : "entries"}`,
    };
  });

  return { focusData, entriesData };
}

// ============================================================================
// Tooltip Component
// ============================================================================

interface TooltipProps {
  state: TooltipState;
}

function Tooltip({ state }: TooltipProps) {
  if (!state.visible) return null;

  return (
    <div
      className="pointer-events-none absolute z-50 rounded-md bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md"
      style={{
        left: state.x,
        top: state.y,
        transform: "translate(-50%, -100%)",
      }}
      role="tooltip"
    >
      {state.content}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-popover" />
    </div>
  );
}

// ============================================================================
// Line Chart Component
// ============================================================================

export function FocusLineChart({
  data,
  className,
  height = DEFAULT_HEIGHT,
  color = "#8b5cf6",
  showGrid = true,
  emptyMessage = "No focus data yet",
}: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });

  const hasData = data.some((d) => d.value > 0);

  const chartDimensions = useMemo(() => {
    const width = 100; // Percentage-based for responsiveness
    const chartWidth = width;
    const chartHeight = height - PADDING.top - PADDING.bottom;
    return { width, chartWidth, chartHeight };
  }, [height]);

  const { points, pathD, areaD, yTicks } = useMemo(() => {
    if (!hasData) {
      return { points: [], pathD: "", areaD: "", yTicks: [] };
    }

    const maxValue = Math.max(10, ...data.map((d) => d.value));
    const minValue = 0;
    const yRange = maxValue - minValue || 1;

    const yTicks = [0, 2, 4, 6, 8, 10];

    const pts = data.map((d, i) => {
      const x = PADDING.left + (i / (data.length - 1)) * (100 - PADDING.left - PADDING.right);
      const y =
        PADDING.top +
        chartDimensions.chartHeight -
        ((d.value - minValue) / yRange) * chartDimensions.chartHeight;
      return { x, y, data: d };
    });

    // Generate path
    const pathParts = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`));
    const pathD = pathParts.join(" ");

    // Generate area path
    const areaD = `${pathD} L ${pts[pts.length - 1].x} ${height - PADDING.bottom} L ${pts[0].x} ${height - PADDING.bottom} Z`;

    return { points: pts, pathD, areaD, yTicks };
  }, [data, hasData, chartDimensions.chartHeight, height]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || !hasData) return;

      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const relativeX = (x / rect.width) * 100;

      // Find closest point
      let closestIdx = 0;
      let closestDist = Infinity;

      points.forEach((p, i) => {
        const dist = Math.abs(p.x - relativeX);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      });

      const point = points[closestIdx];
      if (point && closestDist < 10) {
        setTooltip({
          visible: true,
          x: (point.x / 100) * rect.width,
          y: (point.y / height) * rect.height - 10,
          content: point.data.label || `${point.data.value}`,
        });
      } else {
        setTooltip((prev) => ({ ...prev, visible: false }));
      }
    },
    [points, hasData, height]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Focus level over the last 14 days"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        {showGrid &&
          yTicks.map((tick) => {
            const y =
              PADDING.top +
              chartDimensions.chartHeight -
              (tick / 10) * chartDimensions.chartHeight;
            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={100 - PADDING.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeWidth={0.5}
                />
                <text
                  x={PADDING.left - 5}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[8px]"
                >
                  {tick}
                </text>
              </g>
            );
          })}

        {/* X-axis labels */}
        {data.length > 0 && (
          <>
            <text
              x={PADDING.left}
              y={height - 8}
              textAnchor="start"
              className="fill-muted-foreground text-[7px]"
            >
              {formatDateShort(data[0].date)}
            </text>
            <text
              x={100 - PADDING.right}
              y={height - 8}
              textAnchor="end"
              className="fill-muted-foreground text-[7px]"
            >
              {formatDateShort(data[data.length - 1].date)}
            </text>
          </>
        )}

        {hasData ? (
          <>
            {/* Area fill */}
            <path d={areaD} fill={color} fillOpacity={0.1} />

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Data points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={p.data.value > 0 ? 3 : 0}
                fill={color}
                className="transition-all hover:r-4"
              />
            ))}
          </>
        ) : (
          <text
            x="50"
            y={height / 2}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {emptyMessage}
          </text>
        )}
      </svg>

      <Tooltip state={tooltip} />
    </div>
  );
}

// ============================================================================
// Bar Chart Component
// ============================================================================

export function EntriesBarChart({
  data,
  className,
  height = DEFAULT_HEIGHT,
  color = "#10b981",
  showGrid = true,
  emptyMessage = "No entries yet",
}: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const hasData = data.some((d) => d.value > 0);
  const maxValue = Math.max(1, ...data.map((d) => d.value));

  const chartDimensions = useMemo(() => {
    const chartHeight = height - PADDING.top - PADDING.bottom;
    const barWidth = (100 - PADDING.left - PADDING.right) / data.length;
    const barPadding = barWidth * 0.2;
    return { chartHeight, barWidth, barPadding };
  }, [height, data.length]);

  const bars = useMemo(() => {
    return data.map((d, i) => {
      const x = PADDING.left + i * chartDimensions.barWidth + chartDimensions.barPadding / 2;
      const barHeight = (d.value / maxValue) * chartDimensions.chartHeight;
      const y = PADDING.top + chartDimensions.chartHeight - barHeight;
      const width = chartDimensions.barWidth - chartDimensions.barPadding;

      return { x, y, width, height: barHeight, data: d };
    });
  }, [data, maxValue, chartDimensions]);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = maxValue <= 5 ? 1 : Math.ceil(maxValue / 4);
    for (let i = 0; i <= maxValue; i += step) {
      ticks.push(i);
    }
    if (ticks[ticks.length - 1] < maxValue) {
      ticks.push(maxValue);
    }
    return ticks;
  }, [maxValue]);

  const handleBarHover = useCallback(
    (index: number, e: React.MouseEvent<SVGRectElement>) => {
      if (!svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const bar = bars[index];

      setHoveredIndex(index);
      setTooltip({
        visible: true,
        x: ((bar.x + bar.width / 2) / 100) * rect.width,
        y: (bar.y / height) * rect.height - 10,
        content: bar.data.label || `${bar.data.value}`,
      });
    },
    [bars, height]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Journal entries over the last 14 days"
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        {showGrid &&
          yTicks.map((tick) => {
            const y =
              PADDING.top +
              chartDimensions.chartHeight -
              (tick / maxValue) * chartDimensions.chartHeight;
            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={100 - PADDING.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeWidth={0.5}
                />
                <text
                  x={PADDING.left - 5}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[8px]"
                >
                  {tick}
                </text>
              </g>
            );
          })}

        {/* X-axis labels */}
        {data.length > 0 && (
          <>
            <text
              x={PADDING.left}
              y={height - 8}
              textAnchor="start"
              className="fill-muted-foreground text-[7px]"
            >
              {formatDateShort(data[0].date)}
            </text>
            <text
              x={100 - PADDING.right}
              y={height - 8}
              textAnchor="end"
              className="fill-muted-foreground text-[7px]"
            >
              {formatDateShort(data[data.length - 1].date)}
            </text>
          </>
        )}

        {hasData ? (
          <>
            {/* Bars */}
            {bars.map((bar, i) => (
              <rect
                key={i}
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={Math.max(0, bar.height)}
                fill={color}
                fillOpacity={hoveredIndex === i ? 1 : 0.7}
                rx={1}
                className="cursor-pointer transition-all"
                onMouseEnter={(e) => handleBarHover(i, e)}
                aria-label={bar.data.label}
              />
            ))}
          </>
        ) : (
          <text
            x="50"
            y={height / 2}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {emptyMessage}
          </text>
        )}
      </svg>

      <Tooltip state={tooltip} />
    </div>
  );
}

// ============================================================================
// Combined Chart Component
// ============================================================================

interface SimpleChartsProps {
  entries: JournalEntry[];
  className?: string;
}

export function SimpleCharts({ entries, className }: SimpleChartsProps) {
  const chartData = useMemo(() => generateChartData(entries), [entries]);

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
          Focus Level (14 days)
        </h4>
        <FocusLineChart data={chartData.focusData} color="#8b5cf6" />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
          Entries Per Day (14 days)
        </h4>
        <EntriesBarChart data={chartData.entriesData} color="#10b981" />
      </div>
    </div>
  );
}

export default SimpleCharts;

