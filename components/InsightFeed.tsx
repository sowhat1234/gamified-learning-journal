"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Tag,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  Flame,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInsights } from "@/hooks/useInsights";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface InsightCardData {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  stat: string;
  subtext?: string;
  tooltip: string;
  trend?: "up" | "down" | "neutral";
}

interface InsightFeedProps {
  className?: string;
  maxCards?: number;
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
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

// ============================================================================
// Insight Card Component
// ============================================================================

interface InsightCardProps {
  data: InsightCardData;
}

function InsightCard({ data }: InsightCardProps) {
  const Icon = data.icon;

  const TrendIcon =
    data.trend === "up"
      ? TrendingUp
      : data.trend === "down"
        ? TrendingDown
        : null;

  const trendColor =
    data.trend === "up"
      ? "text-emerald-500"
      : data.trend === "down"
        ? "text-rose-500"
        : "text-muted-foreground";

  return (
    <motion.div variants={cardVariants}>
      <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:bg-card hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                  data.iconBg
                )}
              >
                <Icon className={cn("h-5 w-5", data.iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {data.title}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <p className="truncate text-base font-semibold">{data.stat}</p>
                  {TrendIcon && (
                    <TrendIcon className={cn("h-4 w-4 shrink-0", trendColor)} />
                  )}
                </div>
                {data.subtext && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {data.subtext}
                  </p>
                )}
              </div>
            </div>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="shrink-0 rounded-full p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="Why this matters"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-[200px] text-center text-xs"
                >
                  <p>{data.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function InsightFeed({ className, maxCards = 4 }: InsightFeedProps) {
  const insights = useInsights();
  const gamification = useGamification();

  const insightCards = useMemo((): InsightCardData[] => {
    const cards: InsightCardData[] = [];

    // 1. Top Tag This Week
    const topTags = insights.topTags(7);
    if (topTags.length > 0) {
      const topTag = topTags[0];
      cards.push({
        id: "top-tag",
        icon: Tag,
        iconColor: "text-blue-500",
        iconBg: "bg-blue-500/10",
        title: "Top Tag This Week",
        stat: topTag.tag.charAt(0).toUpperCase() + topTag.tag.slice(1),
        subtext: `${topTag.count} ${topTag.count === 1 ? "entry" : "entries"}`,
        tooltip:
          "Your most-used tag shows where you're focusing your learning. Consistency in a topic leads to mastery.",
      });
    }

    // 2. Average Focus Change
    const focusChange = insights.weeklyChangeFocus();
    const hasFocusData = focusChange.to > 0 || focusChange.from > 0;
    if (hasFocusData) {
      const trend: "up" | "down" | "neutral" =
        focusChange.percentChange > 5
          ? "up"
          : focusChange.percentChange < -5
            ? "down"
            : "neutral";

      const changeText =
        Math.abs(focusChange.percentChange) > 0
          ? `${focusChange.percentChange > 0 ? "+" : ""}${focusChange.percentChange}%`
          : "No change";

      cards.push({
        id: "focus-change",
        icon: trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus,
        iconColor:
          trend === "up"
            ? "text-emerald-500"
            : trend === "down"
              ? "text-rose-500"
              : "text-amber-500",
        iconBg:
          trend === "up"
            ? "bg-emerald-500/10"
            : trend === "down"
              ? "bg-rose-500/10"
              : "bg-amber-500/10",
        title: "Focus Trend",
        stat: `${focusChange.to.toFixed(1)}/10`,
        subtext: changeText + " vs last week",
        trend,
        tooltip:
          trend === "up"
            ? "Your focus is improving! Keep up the great work and maintain your routine."
            : trend === "down"
              ? "Focus dipped this week. Consider shorter, more frequent sessions."
              : "Steady focus level. Try challenging yourself with deeper focus sessions.",
      });
    }

    // 3. Most Recurring Challenge
    const challenges = insights.recurringChallenges(1);
    if (challenges.length > 0) {
      const topChallenge = challenges[0];
      cards.push({
        id: "challenge",
        icon: AlertTriangle,
        iconColor: "text-amber-500",
        iconBg: "bg-amber-500/10",
        title: "Recurring Challenge",
        stat: topChallenge.text.charAt(0).toUpperCase() + topChallenge.text.slice(1),
        subtext: `Mentioned ${topChallenge.occurrences}× in entries`,
        tooltip:
          "Identifying recurring challenges is the first step to overcoming them. Consider dedicating focused time to address this.",
      });
    }

    // 4. Current Streak
    if (gamification.streak > 0) {
      cards.push({
        id: "streak",
        icon: Flame,
        iconColor: "text-orange-500",
        iconBg: "bg-orange-500/10",
        title: "Current Streak",
        stat: `${gamification.streak} ${gamification.streak === 1 ? "day" : "days"}`,
        subtext:
          gamification.streak >= gamification.longestStreak
            ? "🎉 Personal best!"
            : `Best: ${gamification.longestStreak} days`,
        trend: gamification.streak >= 3 ? "up" : "neutral",
        tooltip:
          "Streaks build momentum. Each day you journal reinforces the habit and compounds your learning.",
      });
    }

    // 5. Suggested Action
    const suggestions = insights.suggestedNextActions();
    if (suggestions.length > 0) {
      // Remove emoji from suggestion for cleaner display
      const suggestion = suggestions[0].replace(/^[^\w\s]+\s*/, "");
      cards.push({
        id: "suggestion",
        icon: Lightbulb,
        iconColor: "text-violet-500",
        iconBg: "bg-violet-500/10",
        title: "Try This",
        stat: suggestion,
        tooltip:
          "Personalized suggestions based on your patterns help you optimize your learning journey.",
      });
    }

    return cards.slice(0, maxCards);
  }, [insights, gamification, maxCards]);

  if (insightCards.length === 0) {
    return (
      <div className={cn("text-center text-sm text-muted-foreground", className)}>
        <p>Add journal entries to unlock insights</p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn("grid gap-3 sm:grid-cols-2", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {insightCards.map((card) => (
        <InsightCard key={card.id} data={card} />
      ))}
    </motion.div>
  );
}

export default InsightFeed;

