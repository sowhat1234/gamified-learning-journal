"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Flame,
  Calendar,
  Tag,
  BookOpen,
  Target,
  Award,
  Zap,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heatmap } from "@/components/Heatmap";
import { XPBar } from "@/components/XPBar";
import { useJournal } from "@/hooks/useJournal";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

// ============================================================================
// Constants
// ============================================================================

const TAG_COLORS: Record<string, string> = {
  math: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  tech: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  business: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  science: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  language: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  art: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  music: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  health: "bg-green-500/10 text-green-600 dark:text-green-400",
  productivity: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  personal: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatTrend(current: number, previous: number): {
  value: string;
  direction: "up" | "down" | "neutral";
} {
  if (previous === 0) {
    return { value: current > 0 ? "+100%" : "0%", direction: current > 0 ? "up" : "neutral" };
  }
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 1) {
    return { value: "0%", direction: "neutral" };
  }
  return {
    value: `${change > 0 ? "+" : ""}${Math.round(change)}%`,
    direction: change > 0 ? "up" : "down",
  };
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  delay?: number;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  trend,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                {trend && (
                  <span
                    className={cn(
                      "flex items-center text-sm font-medium",
                      trend.direction === "up" && "text-emerald-500",
                      trend.direction === "down" && "text-red-500",
                      trend.direction === "neutral" && "text-muted-foreground"
                    )}
                  >
                    {trend.direction === "up" && (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                    {trend.direction === "down" && (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {trend.direction === "neutral" && (
                      <Minus className="h-4 w-4" />
                    )}
                    {trend.value}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
                gradient
              )}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Focus Distribution Component
// ============================================================================

function FocusDistribution({
  data,
}: {
  data: { label: string; value: number; percentage: number }[];
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + index * 0.05 }}
          className="space-y-1"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="text-muted-foreground">
              {formatMinutes(item.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function StatsPage() {
  const { entries, getStats } = useJournal();
  const { level, xp, streak, longestStreak, achievements, unlockedAchievements } =
    useGamification();

  const stats = useMemo(() => getStats(), [getStats]);

  // Calculate weekly comparison
  const weeklyComparison = useMemo(() => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(-1);

    const thisWeekEntries = entries.filter(
      (e) => new Date(e.date) >= thisWeekStart
    ).length;
    const lastWeekEntries = entries.filter((e) => {
      const date = new Date(e.date);
      return date >= lastWeekStart && date <= lastWeekEnd;
    }).length;

    return formatTrend(thisWeekEntries, lastWeekEntries);
  }, [entries]);

  // Focus by day of week
  const focusByDayOfWeek = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const totals = new Array(7).fill(0);
    const counts = new Array(7).fill(0);

    entries.forEach((entry) => {
      const day = new Date(entry.date).getDay();
      totals[day] += entry.focus || 0;
      counts[day]++;
    });

    return days.map((label, idx) => ({
      label,
      value: counts[idx] > 0 ? Math.round(totals[idx] / counts[idx]) : 0,
      percentage: 0,
    }));
  }, [entries]);

  // Recent activity (last 7 days)
  const recentActivity = useMemo(() => {
    const days: { date: Date; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = entries.filter((e) => {
        const entryDate = new Date(e.date);
        return entryDate >= date && entryDate < nextDate;
      }).length;

      days.push({ date, count });
    }

    return days;
  }, [entries]);

  const maxRecentActivity = Math.max(...recentActivity.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stats</h1>
          <p className="text-sm text-muted-foreground">
            Track your learning progress
          </p>
        </div>
      </motion.div>

      {/* XP Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <XPBar variant="detailed" />
      </motion.div>

      {/* Key Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Entries"
          value={stats.totalEntries}
          subtitle={`${stats.entriesThisWeek} this week`}
          icon={BookOpen}
          gradient="from-blue-500 to-cyan-500 shadow-blue-500/30"
          trend={weeklyComparison}
          delay={0.15}
        />
        <StatCard
          title="Current Streak"
          value={`${streak} days`}
          subtitle={`Best: ${longestStreak} days`}
          icon={Flame}
          gradient="from-orange-500 to-red-500 shadow-orange-500/30"
          delay={0.2}
        />
        <StatCard
          title="Total Focus"
          value={formatMinutes(stats.totalFocusMinutes)}
          subtitle={`Avg: ${formatMinutes(stats.averageFocusMinutes)}/entry`}
          icon={Clock}
          gradient="from-violet-500 to-purple-500 shadow-violet-500/30"
          delay={0.25}
        />
        <StatCard
          title="Achievements"
          value={`${unlockedAchievements.length}/${achievements.length}`}
          subtitle={`${Math.round((unlockedAchievements.length / achievements.length) * 100)}% complete`}
          icon={Trophy}
          gradient="from-amber-500 to-yellow-500 shadow-amber-500/30"
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Heatmap - Takes 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-emerald-500" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Heatmap weeks={16} colorScheme="green" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Last 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-32 items-end justify-between gap-2">
                {recentActivity.map((day, index) => (
                  <motion.div
                    key={day.date.toISOString()}
                    initial={{ height: 0 }}
                    animate={{
                      height: `${(day.count / maxRecentActivity) * 100}%`,
                    }}
                    transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                    className="group relative flex-1"
                  >
                    <div
                      className={cn(
                        "absolute inset-x-0 bottom-0 rounded-t-md transition-colors",
                        day.count > 0
                          ? "bg-gradient-to-t from-blue-500 to-cyan-500 group-hover:from-blue-400 group-hover:to-cyan-400"
                          : "bg-muted"
                      )}
                      style={{
                        height: day.count > 0 ? "100%" : "4px",
                      }}
                    />
                  </motion.div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                {recentActivity.map((day) => (
                  <span key={day.date.toISOString()} className="flex-1 text-center">
                    {day.date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Secondary Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Focus by Day */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-violet-500" />
                Focus by Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FocusDistribution data={focusByDayOfWeek} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-5 w-5 text-pink-500" />
                Top Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.mostUsedTags.length > 0 ? (
                <div className="space-y-3">
                  {stats.mostUsedTags.map((tag, index) => (
                    <motion.div
                      key={tag.tag}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + index * 0.05 }}
                      className="flex items-center justify-between"
                    >
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-medium",
                          TAG_COLORS[tag.tag.toLowerCase()] || "bg-muted"
                        )}
                      >
                        {tag.tag}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {tag.count} {tag.count === 1 ? "entry" : "entries"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  No tags used yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Level</span>
                <span className="font-bold">{level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total XP</span>
                <span className="font-bold">{xp}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="font-bold">{stats.entriesThisMonth} entries</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Focus</span>
                <span className="font-bold">
                  {formatMinutes(stats.averageFocusMinutes)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Empty State */}
      {entries.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-semibold">No Data Yet</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Start journaling to see your stats and track your progress over
                time.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
