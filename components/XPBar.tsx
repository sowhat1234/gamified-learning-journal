"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Sparkles, Star, Zap, TrendingUp } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface XPBarProps {
  className?: string;
  variant?: "default" | "compact" | "detailed";
  showLevel?: boolean;
  showXPText?: boolean;
  animated?: boolean;
}

// ============================================================================
// Animated Number Component
// ============================================================================

function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return display.on("change", (latest) => {
      setDisplayValue(latest);
    });
  }, [display]);

  return <span className={className}>{displayValue}</span>;
}

// ============================================================================
// Level Badge Component
// ============================================================================

function LevelBadge({
  level,
  size = "default",
}: {
  level: number;
  size?: "default" | "small";
}) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        "relative flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 font-bold text-white shadow-lg shadow-amber-500/30",
        size === "default" ? "h-12 w-12 text-lg" : "h-8 w-8 text-sm"
      )}
    >
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500"
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(251, 191, 36, 0.4)",
            "0 0 0 8px rgba(251, 191, 36, 0)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      <span className="relative z-10">{level}</span>
      <Star
        className={cn(
          "absolute -right-1 -top-1 text-amber-300",
          size === "default" ? "h-4 w-4" : "h-3 w-3"
        )}
        fill="currentColor"
      />
    </motion.div>
  );
}

// ============================================================================
// XP Bar Component
// ============================================================================

export function XPBar({
  className,
  variant = "default",
  showLevel = true,
  showXPText = true,
  animated = true,
}: XPBarProps) {
  const { xp, level, xpProgress } = useGamification();
  const [mounted, setMounted] = useState(false);
  const [prevProgress, setPrevProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setPrevProgress(xpProgress.percentage);
    }
  }, [mounted, xpProgress.percentage]);

  if (!mounted) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-12 rounded-xl bg-muted" />
      </div>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <LevelBadge level={level} size="small" />
        <div className="flex-1">
          <div className="relative h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress.percentage}%` }}
              transition={{ duration: animated ? 0.8 : 0, ease: "easeOut" }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {xpProgress.current}/{xpProgress.required}
        </span>
      </div>
    );
  }

  // Detailed variant
  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "rounded-2xl border bg-card p-4 shadow-sm",
          className
        )}
      >
        <div className="flex items-center gap-4">
          {showLevel && <LevelBadge level={level} />}

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="font-semibold">Level {level}</span>
              </div>
              {showXPText && (
                <div className="flex items-center gap-1 text-sm">
                  <AnimatedNumber
                    value={xpProgress.current}
                    className="font-bold text-amber-500"
                  />
                  <span className="text-muted-foreground">
                    / {xpProgress.required} XP
                  </span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div 
              className="relative h-4 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={xpProgress.current}
              aria-valuemin={0}
              aria-valuemax={xpProgress.required}
              aria-label={`XP Progress: ${xpProgress.current} of ${xpProgress.required} XP`}
            >
              {/* Background shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Progress fill */}
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500"
                initial={{ width: `${prevProgress}%` }}
                animate={{ width: `${xpProgress.percentage}%` }}
                transition={{ duration: animated ? 0.8 : 0, ease: "easeOut" }}
              >
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 1,
                  }}
                />
              </motion.div>
            </div>

            {/* Extra stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-500" />
                <span>{xp} Total XP</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span>
                  {xpProgress.required - xpProgress.current} XP to Level{" "}
                  {level + 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-card/50 p-3 backdrop-blur-sm",
        className
      )}
    >
      {showLevel && <LevelBadge level={level} size="small" />}

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Level {level}</span>
          {showXPText && (
            <span className="text-muted-foreground">
              <AnimatedNumber
                value={xpProgress.current}
                className="font-semibold text-foreground"
              />{" "}
              / {xpProgress.required} XP
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div 
          className="relative h-2.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={xpProgress.current}
          aria-valuemin={0}
          aria-valuemax={xpProgress.required}
          aria-label={`XP Progress: ${xpProgress.current} of ${xpProgress.required} XP`}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress.percentage}%` }}
            transition={{ duration: animated ? 0.8 : 0, ease: "easeOut" }}
          >
            {/* Animated shine */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 2,
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

