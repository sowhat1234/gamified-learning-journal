"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  Lock,
  Flame,
  Target,
  Crown,
  Zap,
  Award,
  Sparkles,
  BookOpen,
  Clock,
  Heart,
  Rocket,
  Medal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type IconName =
  | "trophy"
  | "star"
  | "flame"
  | "target"
  | "crown"
  | "zap"
  | "award"
  | "sparkles"
  | "book"
  | "clock"
  | "heart"
  | "rocket"
  | "medal";

type ColorScheme =
  | "amber"
  | "orange"
  | "red"
  | "rose"
  | "pink"
  | "violet"
  | "purple"
  | "blue"
  | "cyan"
  | "teal"
  | "emerald"
  | "green";

interface AchievementBadgeProps {
  title: string;
  description: string;
  unlocked: boolean;
  icon?: IconName;
  color?: ColorScheme;
  emoji?: string;
  progress?: number;
  total?: number;
  unlockedAt?: string;
  className?: string;
  size?: "default" | "small" | "large";
  animationDelay?: number;
}

// ============================================================================
// Constants
// ============================================================================

const ICONS: Record<IconName, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  target: Target,
  crown: Crown,
  zap: Zap,
  award: Award,
  sparkles: Sparkles,
  book: BookOpen,
  clock: Clock,
  heart: Heart,
  rocket: Rocket,
  medal: Medal,
};

const COLORS: Record<ColorScheme, { gradient: string; shadow: string; bg: string; text: string }> = {
  amber: {
    gradient: "from-amber-400 to-yellow-500",
    shadow: "shadow-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
  },
  orange: {
    gradient: "from-orange-500 to-amber-500",
    shadow: "shadow-orange-500/30",
    bg: "bg-orange-500/10",
    text: "text-orange-500",
  },
  red: {
    gradient: "from-red-500 to-orange-500",
    shadow: "shadow-red-500/30",
    bg: "bg-red-500/10",
    text: "text-red-500",
  },
  rose: {
    gradient: "from-rose-500 to-pink-500",
    shadow: "shadow-rose-500/30",
    bg: "bg-rose-500/10",
    text: "text-rose-500",
  },
  pink: {
    gradient: "from-pink-500 to-rose-500",
    shadow: "shadow-pink-500/30",
    bg: "bg-pink-500/10",
    text: "text-pink-500",
  },
  violet: {
    gradient: "from-violet-500 to-purple-500",
    shadow: "shadow-violet-500/30",
    bg: "bg-violet-500/10",
    text: "text-violet-500",
  },
  purple: {
    gradient: "from-purple-500 to-violet-500",
    shadow: "shadow-purple-500/30",
    bg: "bg-purple-500/10",
    text: "text-purple-500",
  },
  blue: {
    gradient: "from-blue-500 to-cyan-500",
    shadow: "shadow-blue-500/30",
    bg: "bg-blue-500/10",
    text: "text-blue-500",
  },
  cyan: {
    gradient: "from-cyan-500 to-teal-500",
    shadow: "shadow-cyan-500/30",
    bg: "bg-cyan-500/10",
    text: "text-cyan-500",
  },
  teal: {
    gradient: "from-teal-500 to-emerald-500",
    shadow: "shadow-teal-500/30",
    bg: "bg-teal-500/10",
    text: "text-teal-500",
  },
  emerald: {
    gradient: "from-emerald-500 to-green-500",
    shadow: "shadow-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
  },
  green: {
    gradient: "from-green-500 to-emerald-500",
    shadow: "shadow-green-500/30",
    bg: "bg-green-500/10",
    text: "text-green-500",
  },
};

const SIZE_CONFIG = {
  small: {
    card: "p-4",
    icon: "h-12 w-12",
    iconInner: "h-6 w-6",
    title: "text-sm",
    description: "text-xs",
    checkmark: "h-5 w-5 -right-1 -top-1",
    checkIcon: "h-2.5 w-2.5",
  },
  default: {
    card: "p-6",
    icon: "h-16 w-16",
    iconInner: "h-8 w-8",
    title: "text-base",
    description: "text-sm",
    checkmark: "h-6 w-6 -right-1.5 -top-1.5",
    checkIcon: "h-3 w-3",
  },
  large: {
    card: "p-8",
    icon: "h-20 w-20",
    iconInner: "h-10 w-10",
    title: "text-lg",
    description: "text-base",
    checkmark: "h-8 w-8 -right-2 -top-2",
    checkIcon: "h-4 w-4",
  },
};

// ============================================================================
// Component
// ============================================================================

export function AchievementBadge({
  title,
  description,
  unlocked,
  icon = "trophy",
  color = "amber",
  emoji,
  progress,
  total,
  unlockedAt,
  className,
  size = "default",
  animationDelay = 0,
}: AchievementBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = ICONS[icon];
  const colors = COLORS[color];
  const sizeConfig = SIZE_CONFIG[size];

  const hasProgress = typeof progress === "number" && typeof total === "number";
  const progressPercentage = hasProgress
    ? Math.min((progress / total) * 100, 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: animationDelay,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{ scale: unlocked ? 1.02 : 1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={className}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          unlocked
            ? `border-2 border-${color}-500/50 bg-gradient-to-br ${colors.bg} shadow-lg`
            : "border-dashed opacity-50 grayscale hover:opacity-70 hover:grayscale-[50%]"
        )}
        role="article"
        aria-label={`${title} achievement${unlocked ? " - Unlocked" : ` - Locked, ${hasProgress ? `${progress} of ${total}` : "not started"}`}`}
      >
        <CardContent className={cn(sizeConfig.card)}>
          {/* Unlocked checkmark */}
          {unlocked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: animationDelay + 0.2, type: "spring" }}
              className={cn(
                "absolute flex items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30",
                sizeConfig.checkmark
              )}
            >
              <svg
                className={cn("text-white", sizeConfig.checkIcon)}
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
            </motion.div>
          )}

          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <motion.div
              animate={
                unlocked && isHovered
                  ? { rotate: [0, -10, 10, -10, 0] }
                  : {}
              }
              transition={{ duration: 0.5 }}
              className={cn(
                "relative flex items-center justify-center rounded-2xl",
                sizeConfig.icon,
                unlocked
                  ? `bg-gradient-to-br ${colors.gradient} shadow-xl ${colors.shadow}`
                  : "bg-muted"
              )}
            >
              {unlocked ? (
                <>
                  <Icon className={cn("text-white", sizeConfig.iconInner)} />
                  {/* Sparkle effect */}
                  <motion.div
                    className="absolute -right-1 -top-1"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Star
                      className="h-3 w-3 text-white/80"
                      fill="currentColor"
                    />
                  </motion.div>
                </>
              ) : (
                <Lock
                  className={cn("text-muted-foreground", sizeConfig.iconInner)}
                />
              )}
            </motion.div>
          </div>

          {/* Content */}
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center gap-2">
              {emoji && <span className="text-xl">{emoji}</span>}
              <h3 className={cn("font-bold", sizeConfig.title)}>{title}</h3>
            </div>
            <p
              className={cn(
                "text-muted-foreground",
                sizeConfig.description,
                size === "small" ? "line-clamp-2" : ""
              )}
            >
              {description}
            </p>

            {/* Progress bar (when locked and has progress) */}
            {!unlocked && hasProgress && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {progress} / {total}
                  </span>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                      colors.gradient
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ delay: animationDelay + 0.1, duration: 0.6 }}
                  />
                </div>
              </div>
            )}

            {/* Unlocked date */}
            {unlocked && unlockedAt && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: animationDelay + 0.3 }}
                className="mt-3 text-xs text-muted-foreground"
              >
                Unlocked{" "}
                {new Date(unlockedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </motion.p>
            )}
          </div>

          {/* Background glow */}
          {unlocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: animationDelay + 0.2 }}
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

