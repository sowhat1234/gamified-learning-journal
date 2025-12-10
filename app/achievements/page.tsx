"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  Lock,
  Flame,
  Target,
  Crown,
  Award,
  Sparkles,
  Calendar,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XPBar } from "@/components/XPBar";
import {
  useGamification,
  type Achievement,
  type AchievementId,
} from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

// ============================================================================
// Constants
// ============================================================================

const ACHIEVEMENT_ICONS: Record<AchievementId, React.ComponentType<{ className?: string }>> = {
  "streak-warrior": Flame,
  "math-mastery": Target,
  "deep-focus": Zap,
  "consistency-king": Crown,
};

const ACHIEVEMENT_COLORS: Record<AchievementId, { gradient: string; shadow: string; bg: string }> = {
  "streak-warrior": {
    gradient: "from-orange-500 to-red-500",
    shadow: "shadow-orange-500/30",
    bg: "bg-orange-500/10",
  },
  "math-mastery": {
    gradient: "from-blue-500 to-cyan-500",
    shadow: "shadow-blue-500/30",
    bg: "bg-blue-500/10",
  },
  "deep-focus": {
    gradient: "from-violet-500 to-purple-500",
    shadow: "shadow-violet-500/30",
    bg: "bg-violet-500/10",
  },
  "consistency-king": {
    gradient: "from-amber-500 to-yellow-500",
    shadow: "shadow-amber-500/30",
    bg: "bg-amber-500/10",
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatProgress(achievement: Achievement): string {
  if (achievement.id === "deep-focus") {
    // Convert minutes to hours for display
    const hours = Math.floor(achievement.progress / 60);
    const mins = achievement.progress % 60;
    const reqHours = Math.floor(achievement.requirement / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m / ${reqHours}h`;
    }
    return `${achievement.progress}m / ${reqHours}h`;
  }
  return `${achievement.progress} / ${achievement.requirement}`;
}

// ============================================================================
// Achievement Badge Component
// ============================================================================

interface AchievementBadgeProps {
  achievement: Achievement;
  index: number;
}

function AchievementBadge({ achievement, index }: AchievementBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = ACHIEVEMENT_ICONS[achievement.id] || Award;
  const colors = ACHIEVEMENT_COLORS[achievement.id] || {
    gradient: "from-gray-500 to-gray-600",
    shadow: "shadow-gray-500/30",
    bg: "bg-gray-500/10",
  };

  const progressPercentage = Math.min(
    (achievement.progress / achievement.requirement) * 100,
    100
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{ scale: achievement.unlocked ? 1.02 : 1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          achievement.unlocked
            ? "border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 shadow-lg"
            : "border-dashed opacity-60 grayscale hover:opacity-80 hover:grayscale-0"
        )}
      >
        <CardContent className="p-6">
          {/* Unlocked indicator */}
          {achievement.unlocked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
              className="absolute -right-2 -top-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </motion.div>
          )}

          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <motion.div
              animate={
                achievement.unlocked && isHovered
                  ? { rotate: [0, -10, 10, -10, 0] }
                  : {}
              }
              transition={{ duration: 0.5 }}
              className={cn(
                "relative flex h-20 w-20 items-center justify-center rounded-2xl",
                achievement.unlocked
                  ? `bg-gradient-to-br ${colors.gradient} shadow-xl ${colors.shadow}`
                  : "bg-muted"
              )}
            >
              {achievement.unlocked ? (
                <>
                  <Icon className="h-10 w-10 text-white" />
                  {/* Sparkle effects */}
                  <motion.div
                    className="absolute -right-1 -top-1"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" />
                  </motion.div>
                </>
              ) : (
                <Lock className="h-10 w-10 text-muted-foreground" />
              )}
            </motion.div>
          </div>

          {/* Content */}
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center gap-2">
              <span className="text-2xl">{achievement.icon}</span>
              <h3 className="font-bold">{achievement.title}</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {achievement.description}
            </p>

            {/* Progress */}
            {!achievement.unlocked && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {formatProgress(achievement)}
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                      colors.gradient
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                  />
                </div>
              </div>
            )}

            {/* Unlocked date */}
            {achievement.unlocked && achievement.unlockedAt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.4 }}
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"
              >
                <Calendar className="h-3 w-3" />
                <span>Unlocked {formatDate(achievement.unlockedAt)}</span>
              </motion.div>
            )}
          </div>

          {/* Background glow for unlocked */}
          {achievement.unlocked && (
            <div
              className={cn(
                "absolute -bottom-8 -right-8 h-32 w-32 rounded-full blur-3xl",
                colors.bg
              )}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Stats Card Component
// ============================================================================

function StatsCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-none bg-gradient-to-br from-card to-muted/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
              color
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function AchievementsPage() {
  const {
    achievements,
    unlockedAchievements,
    lockedAchievements,
    level,
    xp,
    streak,
    longestStreak,
  } = useGamification();

  const completionPercentage = Math.round(
    (unlockedAchievements.length / achievements.length) * 100
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/25">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <p className="text-sm text-muted-foreground">
            {unlockedAchievements.length} of {achievements.length} unlocked
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

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={Trophy}
          label="Completion"
          value={`${completionPercentage}%`}
          color="from-amber-500 to-yellow-500 shadow-amber-500/30"
          delay={0.2}
        />
        <StatsCard
          icon={Star}
          label="Total XP"
          value={xp}
          color="from-violet-500 to-purple-500 shadow-violet-500/30"
          delay={0.25}
        />
        <StatsCard
          icon={Flame}
          label="Current Streak"
          value={`${streak} days`}
          color="from-orange-500 to-red-500 shadow-orange-500/30"
          delay={0.3}
        />
        <StatsCard
          icon={Crown}
          label="Best Streak"
          value={`${longestStreak} days`}
          color="from-emerald-500 to-teal-500 shadow-emerald-500/30"
          delay={0.35}
        />
      </div>

      {/* Trophy Case */}
      <div className="space-y-6">
        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2"
            >
              <Star className="h-5 w-5 text-amber-500" fill="currentColor" />
              <h2 className="text-lg font-semibold">Unlocked</h2>
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-500"
              >
                {unlockedAchievements.length}
              </Badge>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              {unlockedAchievements.map((achievement, index) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2"
            >
              <Lock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Locked</h2>
              <Badge variant="secondary">{lockedAchievements.length}</Badge>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              {lockedAchievements.map((achievement, index) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  index={index + unlockedAchievements.length}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {achievements.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Trophy className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No Achievements Yet</h3>
              <p className="max-w-sm text-muted-foreground">
                Start your learning journey to unlock achievements and earn XP!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Motivation Card */}
      {lockedAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="overflow-hidden bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/30">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Keep Going!</h3>
                <p className="text-sm text-muted-foreground">
                  You&apos;re {completionPercentage}% of the way to completing
                  all achievements. Unlock the next one by staying consistent!
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
