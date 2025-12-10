"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Flame,
  Zap,
  BookOpen,
  ArrowRight,
  Trophy,
  Target,
  Calendar,
  Sparkles,
  Quote,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XPBar } from "@/components/XPBar";
import { Heatmap } from "@/components/Heatmap";
import { useJournal } from "@/hooks/useJournal";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

// ============================================================================
// Constants
// ============================================================================

const MOTIVATIONAL_QUOTES = [
  {
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
  },
  {
    text: "Learning is not attained by chance, it must be sought for with ardor and diligence.",
    author: "Abigail Adams",
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
  },
  {
    text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    author: "Malcolm X",
  },
  {
    text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss",
  },
  {
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
  },
  {
    text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
    author: "Benjamin Franklin",
  },
  {
    text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert",
  },
  {
    text: "Anyone who stops learning is old, whether at twenty or eighty.",
    author: "Henry Ford",
  },
  {
    text: "Learning never exhausts the mind.",
    author: "Leonardo da Vinci",
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getDailyQuote(): (typeof MOTIVATIONAL_QUOTES)[0] {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ============================================================================
// Stat Pill Component
// ============================================================================

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card/50 px-4 py-3 backdrop-blur-sm">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br",
          color
        )}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Level Progress Ring
// ============================================================================

function LevelRing({ level, progress }: { level: number; progress: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {/* Background ring */}
      <svg className="absolute h-full w-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <motion.circle
          cx="64"
          cy="64"
          r="45"
          fill="none"
          stroke="url(#levelGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
        <defs>
          <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>
      </svg>
      {/* Level number */}
      <div className="text-center">
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="text-4xl font-bold"
        >
          {level}
        </motion.p>
        <p className="text-xs text-muted-foreground">LEVEL</p>
      </div>
      {/* Decorative stars */}
      <motion.div
        initial={{ opacity: 0, rotate: -30 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute -right-1 -top-1"
      >
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
      </motion.div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function DashboardPage() {
  const { entries, getStats } = useJournal();
  const {
    level,
    xp,
    xpProgress,
    streak,
    longestStreak,
    unlockedAchievements,
    achievements,
  } = useGamification();

  const stats = useMemo(() => getStats(), [getStats]);
  const quote = useMemo(() => getDailyQuote(), []);
  const greeting = useMemo(() => getGreeting(), []);

  const todayEntries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return entries.filter((e) => new Date(e.date) >= today).length;
  }, [entries]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}!</h1>
          <p className="text-sm text-muted-foreground">
            Ready to continue your learning journey?
          </p>
        </div>
      </motion.div>

      {/* Daily Quote */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-none bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/30">
                <Quote className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-medium italic leading-relaxed">
                  &ldquo;{quote.text}&rdquo;
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  — {quote.author}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Level & XP Card */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="flex h-full flex-col items-center justify-center p-6">
              <LevelRing level={level} progress={xpProgress.percentage} />
              <div className="mt-4 w-full">
                <XPBar variant="compact" showLevel={false} />
              </div>
              <p className="mt-3 text-center text-sm text-muted-foreground">
                {xpProgress.required - xpProgress.current} XP to Level {level + 1}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Card */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="group relative h-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <CardContent className="relative flex h-full flex-col justify-between p-6">
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    {todayEntries === 0 ? "Start Today" : `${todayEntries} Today`}
                  </Badge>
                </div>
                <h2 className="mb-2 text-2xl font-bold">
                  {todayEntries === 0
                    ? "Begin Your Learning Session"
                    : "Continue Your Journey"}
                </h2>
                <p className="text-muted-foreground">
                  {todayEntries === 0
                    ? "Capture today's insights and watch your knowledge grow. Every entry brings you closer to your goals."
                    : `You've made ${todayEntries} ${todayEntries === 1 ? "entry" : "entries"} today. Keep the momentum going!`}
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25"
                >
                  <Link href="/journal">
                    <BookOpen className="h-5 w-5" />
                    {todayEntries === 0 ? "Start Entry" : "New Entry"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href="/stats">
                    <TrendingUp className="h-5 w-5" />
                    View Stats
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Stats Row */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatPill
          icon={Flame}
          label="Current Streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          color="from-orange-500 to-red-500"
        />
        <StatPill
          icon={Target}
          label="Best Streak"
          value={`${longestStreak} days`}
          color="from-violet-500 to-purple-500"
        />
        <StatPill
          icon={Trophy}
          label="Achievements"
          value={`${unlockedAchievements.length}/${achievements.length}`}
          color="from-amber-500 to-yellow-500"
        />
        <StatPill
          icon={Clock}
          label="Total Focus"
          value={formatMinutes(stats.totalFocusMinutes)}
          color="from-blue-500 to-cyan-500"
        />
      </motion.div>

      {/* Heatmap & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Heatmap Preview */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                  Activity Overview
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="gap-1">
                  <Link href="/stats">
                    See all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Heatmap weeks={12} colorScheme="green" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Entries */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Recent
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="gap-1">
                  <Link href="/journal">
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stats.recentEntries.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentEntries.slice(0, 4).map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="group flex items-start gap-3 rounded-lg border bg-card/50 p-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                        {new Date(entry.date).getDate()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {entry.concept}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                          {entry.focus > 0 && ` • ${formatMinutes(entry.focus)}`}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center text-center">
                  <BookOpen className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No entries yet
                  </p>
                  <Button asChild variant="link" size="sm" className="mt-1">
                    <Link href="/journal">Create your first entry</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achievement Progress */}
      {unlockedAchievements.length < achievements.length && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/30">
                  <Trophy className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Achievement Progress</h3>
                    <Button asChild variant="ghost" size="sm" className="gap-1">
                      <Link href="/achievements">
                        View all
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {unlockedAchievements.length} of {achievements.length} unlocked
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(unlockedAchievements.length / achievements.length) * 100}%`,
                      }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
