"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Mountain,
  Focus,
  Rocket,
  Tags,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  BookOpen,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useJournal } from "@/hooks/useJournal";
import { useGamification, useGamificationStore } from "@/hooks/useGamification";
import { useConfetti } from "@/hooks/use-confetti";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface FormData {
  concept: string;
  challenge: string;
  focus: number;
  improve: string;
  tags: string[];
}

interface StepConfig {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
}

interface GuidedJournalFormProps {
  onComplete?: () => void;
  className?: string;
  lastEntryImprovement?: string;
}

// ============================================================================
// Constants
// ============================================================================

const AVAILABLE_TAGS = [
  { id: "math", label: "Math", emoji: "🧮" },
  { id: "tech", label: "Tech", emoji: "💻" },
  { id: "business", label: "Business", emoji: "📊" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "language", label: "Language", emoji: "🌍" },
  { id: "art", label: "Art", emoji: "🎨" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "health", label: "Health", emoji: "💪" },
  { id: "productivity", label: "Productivity", emoji: "⚡" },
  { id: "personal", label: "Personal", emoji: "✨" },
];

const CHALLENGE_CHIPS = [
  "Distractions",
  "Complex Syntax",
  "Tired",
  "New Concept",
  "Time Management",
];

const STEPS: StepConfig[] = [
  {
    id: 0,
    title: "What concept did you learn today?",
    subtitle: "Describe the main idea or skill you explored",
    icon: Lightbulb,
    color: "text-amber-500",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: 1,
    title: "What was challenging?",
    subtitle: "Identify the difficult parts or obstacles",
    icon: Mountain,
    color: "text-rose-500",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    id: 2,
    title: "Rate your focus",
    subtitle: "How focused were you during your learning session?",
    icon: Focus,
    color: "text-violet-500",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    id: 3,
    title: "What will you improve tomorrow?",
    subtitle: "Set your intention for the next session",
    icon: Rocket,
    color: "text-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: 4,
    title: "Add tags",
    subtitle: "Categorize your learning for better tracking",
    icon: Tags,
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-500",
  },
];

const FOCUS_LABELS = [
  { value: 1, label: "Very Distracted", emoji: "😵" },
  { value: 2, label: "Distracted", emoji: "😕" },
  { value: 3, label: "Somewhat Focused", emoji: "😐" },
  { value: 4, label: "Focused", emoji: "🙂" },
  { value: 5, label: "Very Focused", emoji: "😊" },
  { value: 6, label: "Highly Focused", emoji: "😄" },
  { value: 7, label: "Deep Focus", emoji: "🎯" },
  { value: 8, label: "Flow State", emoji: "🔥" },
  { value: 9, label: "Peak Focus", emoji: "⚡" },
  { value: 10, label: "Transcendent", emoji: "🌟" },
];

const INITIAL_FORM_DATA: FormData = {
  concept: "",
  challenge: "",
  focus: 5,
  improve: "",
  tags: [],
};

const MAX_CHALLENGE_LENGTH = 1000;

// ============================================================================
// Helper Functions
// ============================================================================

function getFocusColorScheme(value: number): {
  track: string;
  gradient: string;
  glow: string;
} {
  if (value <= 3) {
    return {
      track: "bg-red-500",
      gradient: "from-red-500 to-rose-500",
      glow: "shadow-red-500/30",
    };
  }
  if (value <= 6) {
    return {
      track: "bg-amber-500",
      gradient: "from-amber-500 to-yellow-500",
      glow: "shadow-amber-500/30",
    };
  }
  if (value <= 8) {
    return {
      track: "bg-emerald-500",
      gradient: "from-emerald-500 to-green-500",
      glow: "shadow-emerald-500/30",
    };
  }
  return {
    track: "bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500",
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    glow: "shadow-amber-500/40",
  };
}

// ============================================================================
// Animation Variants
// ============================================================================

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const pulseAnimation = {
  scale: [1, 1.02, 1],
  boxShadow: [
    "0 0 0 0 rgba(16, 185, 129, 0)",
    "0 0 0 8px rgba(16, 185, 129, 0.2)",
    "0 0 0 0 rgba(16, 185, 129, 0)",
  ],
};

// ============================================================================
// Accountability Reminder Component
// ============================================================================

interface AccountabilityReminderProps {
  improvement: string;
  onDismiss: () => void;
}

function AccountabilityReminder({
  improvement,
  onDismiss,
}: AccountabilityReminderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <div
        className="relative flex items-start gap-3 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 p-4"
        role="alert"
        aria-label="Reminder from your previous journal entry"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/30">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
            Remember your goal from yesterday:
          </p>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            &ldquo;{improvement}&rdquo;
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          aria-label="Dismiss reminder"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Challenge Chips Component
// ============================================================================

interface ChallengeChipsProps {
  onChipClick: (chip: string) => void;
  lastClicked: string | null;
}

function ChallengeChips({ onChipClick, lastClicked }: ChallengeChipsProps) {
  return (
    <div className="mb-4">
      <Label className="mb-2 block text-xs text-muted-foreground">
        Quick add challenges:
      </Label>
      <div className="flex flex-wrap gap-2">
        {CHALLENGE_CHIPS.map((chip) => {
          const isLastClicked = lastClicked === chip;
          return (
            <motion.button
              key={chip}
              type="button"
              onClick={() => onChipClick(chip)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isLastClicked ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.2 }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500",
                isLastClicked
                  ? "border-rose-500 bg-rose-500 text-white shadow-md"
                  : "border-border bg-card hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
              )}
              aria-label={`Add "${chip}" to challenges`}
            >
              {chip}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Focus Slider Component
// ============================================================================

interface FocusSliderProps {
  value: number;
  onChange: (value: number) => void;
}

function FocusSlider({ value, onChange }: FocusSliderProps) {
  const colorScheme = getFocusColorScheme(value);
  const focusLabel = FOCUS_LABELS.find((l) => l.value === value) ?? FOCUS_LABELS[4];

  return (
    <motion.div variants={fadeInUp} className="space-y-8">
      <div className="text-center">
        <motion.div
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-2 text-6xl"
        >
          {focusLabel.emoji}
        </motion.div>
        <motion.p
          key={`label-${value}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-semibold"
        >
          {focusLabel.label}
        </motion.p>
        <p className="text-sm text-muted-foreground">
          Focus Level: {value}/10
        </p>
      </div>

      <div className="px-4">
        <div className="relative">
          {/* Custom colored track overlay */}
          <div className="absolute inset-0 h-2 top-1/2 -translate-y-1/2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", colorScheme.track)}
              initial={{ width: 0 }}
              animate={{ width: `${(value / 10) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <Slider
            value={[value]}
            onValueChange={([val]) => onChange(val)}
            min={1}
            max={10}
            step={1}
            className="relative w-full [&>span:first-child]:bg-transparent"
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Distracted</span>
          <span>Transcendent</span>
        </div>
      </div>

      {/* Flow state indicator */}
      {value >= 7 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mx-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg",
            `bg-gradient-to-r ${colorScheme.gradient} ${colorScheme.glow}`
          )}
        >
          <Sparkles className="h-4 w-4" />
          {value >= 9 ? "🔥 Peak Performance!" : "Great focus session!"}
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function GuidedJournalForm({
  onComplete,
  className,
  lastEntryImprovement,
}: GuidedJournalFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [lastClickedChip, setLastClickedChip] = useState<string | null>(null);

  const { addEntry } = useJournal();
  const { xp: currentXP, level } = useGamification();
  const { fireCelebration } = useConfetti();

  const currentStepConfig = STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return formData.concept.trim().length >= 10;
      case 1:
        return formData.challenge.trim().length >= 10;
      case 2:
        return true;
      case 3:
        return formData.improve.trim().length >= 10;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const canProceedValue = canProceed();

  const goToNextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const toggleTag = useCallback((tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((t) => t !== tagId)
        : [...prev.tags, tagId],
    }));
  }, []);

  const handleChipClick = useCallback((chip: string) => {
    setLastClickedChip(chip);
    setFormData((prev) => {
      const currentText = prev.challenge.trim();
      
      // Check if chip already exists in text
      if (currentText.toLowerCase().includes(chip.toLowerCase())) {
        return prev;
      }

      // Build new text with proper spacing
      let newText = currentText;
      if (newText.length > 0 && !newText.endsWith(" ")) {
        newText += " ";
      }
      newText += chip;

      // Enforce max length
      if (newText.length > MAX_CHALLENGE_LENGTH) {
        newText = newText.substring(0, MAX_CHALLENGE_LENGTH);
      }

      return { ...prev, challenge: newText };
    });

    // Clear the last clicked state after animation
    setTimeout(() => setLastClickedChip(null), 300);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const previousXP = currentXP;

    try {
      const focusMinutes = formData.focus * 6;

      addEntry({
        concept: formData.concept.trim(),
        challenge: formData.challenge.trim(),
        focus: focusMinutes,
        improve: formData.improve.trim(),
        tags: formData.tags,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const newXP = useGamificationStore.getState()?.xp ?? currentXP;
      setEarnedXP(Math.max(newXP - previousXP, 10));

      fireCelebration();
      setShowSuccess(true);

      setTimeout(() => {
        setFormData(INITIAL_FORM_DATA);
        setCurrentStep(0);
        setShowSuccess(false);
        setIsSubmitting(false);
        setReminderDismissed(false);
        onComplete?.();
      }, 3000);
    } catch (error) {
      console.error("Failed to save entry:", error);
      setIsSubmitting(false);
    }
  }, [formData, addEntry, currentXP, fireCelebration, isSubmitting, onComplete]);

  const focusColorScheme = useMemo(
    () => getFocusColorScheme(formData.focus),
    [formData.focus]
  );

  // Show accountability reminder
  const showReminder =
    currentStep === 0 &&
    lastEntryImprovement &&
    !reminderDismissed;

  // Success screen
  if (showSuccess) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-h-[500px] flex-col items-center justify-center bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
              className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-2xl shadow-emerald-500/30"
            >
              <Check className="h-12 w-12 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-2 text-3xl font-bold"
            >
              Entry Saved!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 text-muted-foreground"
            >
              Great job reflecting on your learning today!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-white shadow-lg"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-lg font-bold">+{earnedXP} XP</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 text-sm text-muted-foreground"
            >
              Level {level} • Keep up the momentum!
            </motion.p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Progress bar */}
        <div className="relative h-1 w-full bg-muted">
          <motion.div
            className={cn(
              "absolute left-0 top-0 h-full bg-gradient-to-r",
              currentStep === 2 ? focusColorScheme.gradient : currentStepConfig.gradient
            )}
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 border-b bg-muted/30 p-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            return (
              <motion.button
                key={step.id}
                onClick={() => {
                  if (index < currentStep) {
                    setDirection(-1);
                    setCurrentStep(index);
                  }
                }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                  isActive && `bg-gradient-to-br ${step.gradient} text-white shadow-lg`,
                  isComplete && "bg-emerald-500 text-white",
                  !isActive && !isComplete && "bg-muted text-muted-foreground"
                )}
                whileHover={{ scale: index <= currentStep ? 1.1 : 1 }}
                whileTap={{ scale: index <= currentStep ? 0.95 : 1 }}
                disabled={index > currentStep}
                aria-label={`Step ${index + 1}: ${step.title}${isComplete ? " (completed)" : isActive ? " (current)" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Form content */}
        <div className="relative min-h-[400px] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-6 md:p-8"
            >
              {/* Accountability Reminder */}
              <AnimatePresence>
                {showReminder && (
                  <AccountabilityReminder
                    improvement={lastEntryImprovement!}
                    onDismiss={() => setReminderDismissed(true)}
                  />
                )}
              </AnimatePresence>

              {/* Step header */}
              <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="mb-8 text-center"
              >
                <div
                  className={cn(
                    "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
                    currentStep === 2 ? focusColorScheme.gradient : currentStepConfig.gradient,
                    currentStep === 2 && focusColorScheme.glow
                  )}
                >
                  <currentStepConfig.icon className="h-8 w-8 text-white" />
                </div>
                <h2 className="mb-2 text-xl font-bold md:text-2xl">
                  {currentStepConfig.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentStepConfig.subtitle}
                </p>
              </motion.div>

              {/* Step content */}
              <div className="mx-auto max-w-lg">
                {/* Step 0: Concept */}
                {currentStep === 0 && (
                  <motion.div variants={fadeInUp}>
                    <Textarea
                      placeholder="Today I learned about..."
                      value={formData.concept}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          concept: e.target.value,
                        }))
                      }
                      className="min-h-[150px] resize-none text-base"
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formData.concept.length}/10 characters minimum
                    </p>
                  </motion.div>
                )}

                {/* Step 1: Challenge with chips */}
                {currentStep === 1 && (
                  <motion.div variants={fadeInUp}>
                    <ChallengeChips
                      onChipClick={handleChipClick}
                      lastClicked={lastClickedChip}
                    />
                    <Textarea
                      placeholder="The hardest part was..."
                      value={formData.challenge}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          challenge: e.target.value.substring(0, MAX_CHALLENGE_LENGTH),
                        }))
                      }
                      className="min-h-[150px] resize-none text-base"
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formData.challenge.length}/{MAX_CHALLENGE_LENGTH} characters
                      {formData.challenge.length < 10 && " (10 minimum)"}
                    </p>
                  </motion.div>
                )}

                {/* Step 2: Focus Rating */}
                {currentStep === 2 && (
                  <FocusSlider
                    value={formData.focus}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, focus: value }))
                    }
                  />
                )}

                {/* Step 3: Improve */}
                {currentStep === 3 && (
                  <motion.div variants={fadeInUp}>
                    <Textarea
                      placeholder="Tomorrow I will..."
                      value={formData.improve}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          improve: e.target.value,
                        }))
                      }
                      className="min-h-[150px] resize-none text-base"
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formData.improve.length}/10 characters minimum
                    </p>
                  </motion.div>
                )}

                {/* Step 4: Tags */}
                {currentStep === 4 && (
                  <motion.div variants={fadeInUp}>
                    <div className="flex flex-wrap justify-center gap-3">
                      {AVAILABLE_TAGS.map((tag) => {
                        const isSelected = formData.tags.includes(tag.id);
                        return (
                          <motion.button
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-lg"
                                : "border-border bg-card hover:border-primary/50 hover:bg-accent"
                            )}
                            aria-pressed={isSelected}
                            aria-label={`${tag.label} tag${isSelected ? " (selected)" : ""}`}
                          >
                            <span aria-hidden="true">{tag.emoji}</span>
                            <span>{tag.label}</span>
                            {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
                          </motion.button>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      {formData.tags.length === 0
                        ? "Select tags to categorize your entry (optional)"
                        : `${formData.tags.length} tag${formData.tags.length > 1 ? "s" : ""} selected`}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t bg-muted/30 p-4">
          <Button
            variant="ghost"
            onClick={goToPrevStep}
            disabled={isFirstStep}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                "gap-2 bg-gradient-to-r shadow-lg",
                currentStepConfig.gradient
              )}
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                  Saving...
                </>
              ) : (
                <>
                  Complete
                  <Check className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <motion.div
              animate={canProceedValue ? pulseAnimation : {}}
              transition={{
                duration: 2,
                repeat: canProceedValue ? Infinity : 0,
                ease: "easeInOut",
              }}
            >
              <Button
                onClick={goToNextStep}
                disabled={!canProceedValue}
                className={cn(
                  "gap-2 bg-gradient-to-r shadow-lg",
                  currentStep === 2 ? focusColorScheme.gradient : currentStepConfig.gradient
                )}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
