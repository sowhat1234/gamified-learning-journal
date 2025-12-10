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
  Brain,
  Link2,
  Zap,
  Trophy,
  Heart,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  simpleExplanation: string; // Feynman technique
  connection: string; // Connect to prior knowledge
  challenge: string;
  win: string; // What went well
  focus: number;
  energy: number; // Energy level
  confidence: number; // Understanding confidence
  keyTakeaways: string[]; // 3 key points
  improve: string;
  tags: string[];
}

interface StepConfig {
  id: number;
  title: string;
  subtitle: string;
  tip?: string;
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
  "Time Pressure",
  "Lack of Examples",
  "Abstract Ideas",
  "Information Overload",
];

const WIN_CHIPS = [
  "Had an 'Aha!' moment",
  "Stayed focused",
  "Made connections",
  "Solved a problem",
  "Asked good questions",
  "Taught someone",
];

const STEPS: StepConfig[] = [
  {
    id: 0,
    title: "What did you learn today?",
    subtitle: "Describe the main concept, idea, or skill",
    tip: "Be specific! Instead of 'React', try 'React useEffect cleanup functions'",
    icon: Lightbulb,
    color: "text-amber-500",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: 1,
    title: "Explain it simply",
    subtitle: "Feynman Technique: Explain like teaching a beginner",
    tip: "If you can't explain it simply, you don't understand it well enough",
    icon: Brain,
    color: "text-purple-500",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    id: 2,
    title: "Connect the dots",
    subtitle: "How does this relate to what you already know?",
    tip: "Linking new info to existing knowledge improves retention by 40%",
    icon: Link2,
    color: "text-cyan-500",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    id: 3,
    title: "What was challenging?",
    subtitle: "Identify obstacles and difficult parts",
    tip: "Struggle is where real learning happens!",
    icon: Mountain,
    color: "text-rose-500",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    id: 4,
    title: "Celebrate a win! 🎉",
    subtitle: "What went well in your learning session?",
    tip: "Acknowledging progress builds motivation",
    icon: Trophy,
    color: "text-yellow-500",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    id: 5,
    title: "Rate your session",
    subtitle: "How was your focus and energy?",
    icon: Focus,
    color: "text-violet-500",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    id: 6,
    title: "Key takeaways",
    subtitle: "3 most important points to remember",
    tip: "Writing summaries boosts recall by 50%",
    icon: Zap,
    color: "text-orange-500",
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: 7,
    title: "Tomorrow's mission",
    subtitle: "Set one specific, actionable goal",
    tip: "Specific goals are 2x more likely to be achieved",
    icon: Rocket,
    color: "text-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: 8,
    title: "Add tags",
    subtitle: "Categorize for tracking patterns",
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

const ENERGY_LABELS = [
  { value: 1, label: "Exhausted", emoji: "😴" },
  { value: 2, label: "Very Tired", emoji: "🥱" },
  { value: 3, label: "Tired", emoji: "😑" },
  { value: 4, label: "Low Energy", emoji: "😶" },
  { value: 5, label: "Neutral", emoji: "😐" },
  { value: 6, label: "Good", emoji: "🙂" },
  { value: 7, label: "Energized", emoji: "😊" },
  { value: 8, label: "Very Energized", emoji: "😃" },
  { value: 9, label: "High Energy", emoji: "🤩" },
  { value: 10, label: "Peak Energy", emoji: "⚡" },
];

const CONFIDENCE_LABELS = [
  { value: 1, label: "Completely Lost", color: "bg-red-500" },
  { value: 2, label: "Very Confused", color: "bg-red-400" },
  { value: 3, label: "Confused", color: "bg-orange-500" },
  { value: 4, label: "Somewhat Unclear", color: "bg-orange-400" },
  { value: 5, label: "Getting It", color: "bg-yellow-500" },
  { value: 6, label: "Understanding", color: "bg-yellow-400" },
  { value: 7, label: "Good Grasp", color: "bg-lime-500" },
  { value: 8, label: "Confident", color: "bg-green-500" },
  { value: 9, label: "Very Confident", color: "bg-emerald-500" },
  { value: 10, label: "Could Teach It", color: "bg-emerald-600" },
];

const INITIAL_FORM_DATA: FormData = {
  concept: "",
  simpleExplanation: "",
  connection: "",
  challenge: "",
  win: "",
  focus: 5,
  energy: 5,
  confidence: 5,
  keyTakeaways: ["", "", ""],
  improve: "",
  tags: [],
};

const MAX_TEXT_LENGTH = 1000;

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
            🎯 Yesterday&apos;s goal:
          </p>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            &ldquo;{improvement}&rdquo;
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Did you work on this? Reflect on your progress!
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Dismiss reminder"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Quick Chips Component
// ============================================================================

interface QuickChipsProps {
  chips: string[];
  onChipClick: (chip: string) => void;
  label: string;
}

function QuickChips({ chips, onChipClick, label }: QuickChipsProps) {
  return (
    <div className="mb-4">
      <Label className="mb-2 block text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <motion.button
            key={chip}
            type="button"
            onClick={() => onChipClick(chip)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-all hover:border-primary/50 hover:bg-primary/10"
          >
            {chip}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Rating Slider Component
// ============================================================================

interface RatingSliderProps {
  value: number;
  onChange: (value: number) => void;
  labels: { value: number; label: string; emoji: string }[];
  title: string;
  colorScheme?: ReturnType<typeof getFocusColorScheme>;
}

function RatingSlider({ value, onChange, labels, title, colorScheme }: RatingSliderProps) {
  const currentLabel = labels.find((l) => l.value === value) ?? labels[4];
  const colors = colorScheme ?? getFocusColorScheme(value);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <motion.div
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-2 text-5xl"
        >
          {currentLabel.emoji}
        </motion.div>
        <motion.p
          key={`label-${value}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base font-semibold"
        >
          {currentLabel.label}
        </motion.p>
        <p className="text-sm text-muted-foreground">
          {title}: {value}/10
        </p>
      </div>

      <div className="px-4">
        <div className="relative">
          <div className="absolute inset-0 h-2 top-1/2 -translate-y-1/2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", colors.track)}
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
      </div>
    </div>
  );
}

// ============================================================================
// Confidence Meter Component
// ============================================================================

interface ConfidenceMeterProps {
  value: number;
  onChange: (value: number) => void;
}

function ConfidenceMeter({ value, onChange }: ConfidenceMeterProps) {
  const currentLabel = CONFIDENCE_LABELS.find((l) => l.value === value) ?? CONFIDENCE_LABELS[4];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-lg font-semibold mb-1">{currentLabel.label}</p>
        <p className="text-sm text-muted-foreground">
          Understanding Level: {value}/10
        </p>
      </div>

      <div className="flex justify-center gap-1">
        {CONFIDENCE_LABELS.map((level) => (
          <motion.button
            key={level.value}
            onClick={() => onChange(level.value)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "h-8 w-8 rounded-lg transition-all",
              level.value <= value ? level.color : "bg-muted",
              level.value === value && "ring-2 ring-white ring-offset-2 ring-offset-background"
            )}
            aria-label={`Set confidence to ${level.value}: ${level.label}`}
          />
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>Lost</span>
        <span>Could teach it</span>
      </div>

      {value <= 4 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm"
        >
          <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <HelpCircle className="h-4 w-4" />
            <span className="font-medium">That&apos;s okay!</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Confusion is part of learning. Try re-reading, finding examples, or asking questions.
          </p>
        </motion.div>
      )}

      {value >= 9 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm"
        >
          <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">Amazing!</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Teaching others is the best way to solidify knowledge. Consider sharing what you learned!
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// Key Takeaways Component
// ============================================================================

interface KeyTakeawaysProps {
  takeaways: string[];
  onChange: (index: number, value: string) => void;
}

function KeyTakeaways({ takeaways, onChange }: KeyTakeawaysProps) {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-sm font-bold text-white">
            {index + 1}
          </div>
          <Input
            placeholder={
              index === 0
                ? "Most important concept..."
                : index === 1
                  ? "Key insight or pattern..."
                  : "Something to remember..."
            }
            value={takeaways[index]}
            onChange={(e) => onChange(index, e.target.value)}
            className="flex-1"
          />
        </motion.div>
      ))}
      <p className="text-xs text-center text-muted-foreground">
        💡 Writing summaries improves retention by 50%
      </p>
    </div>
  );
}

// ============================================================================
// Learning Tip Component
// ============================================================================

function LearningTip({ tip }: { tip?: string }) {
  if (!tip) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-4 flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs"
    >
      <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" />
      <p className="text-muted-foreground">{tip}</p>
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

  const { addEntry } = useJournal();
  const { xp: currentXP, level } = useGamification();
  const { fireCelebration } = useConfetti();

  const currentStepConfig = STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0: // Concept
        return formData.concept.trim().length >= 10;
      case 1: // Simple explanation
        return formData.simpleExplanation.trim().length >= 10;
      case 2: // Connection
        return formData.connection.trim().length >= 5;
      case 3: // Challenge
        return formData.challenge.trim().length >= 5;
      case 4: // Win
        return formData.win.trim().length >= 5;
      case 5: // Ratings
        return true;
      case 6: // Key takeaways
        return formData.keyTakeaways.filter((t) => t.trim().length > 0).length >= 1;
      case 7: // Improve
        return formData.improve.trim().length >= 10;
      case 8: // Tags
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

  const appendToField = useCallback((field: keyof FormData, text: string) => {
    setFormData((prev) => {
      const currentValue = prev[field];
      if (typeof currentValue !== "string") return prev;
      
      const currentText = currentValue.trim();
      if (currentText.toLowerCase().includes(text.toLowerCase())) return prev;
      
      let newText = currentText;
      if (newText.length > 0 && !newText.endsWith(" ") && !newText.endsWith(".")) {
        newText += ". ";
      } else if (newText.length > 0 && !newText.endsWith(" ")) {
        newText += " ";
      }
      newText += text;
      
      if (newText.length > MAX_TEXT_LENGTH) {
        newText = newText.substring(0, MAX_TEXT_LENGTH);
      }
      
      return { ...prev, [field]: newText };
    });
  }, []);

  const updateTakeaway = useCallback((index: number, value: string) => {
    setFormData((prev) => {
      const newTakeaways = [...prev.keyTakeaways];
      newTakeaways[index] = value;
      return { ...prev, keyTakeaways: newTakeaways };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const previousXP = currentXP;

    try {
      const focusMinutes = formData.focus * 6;
      
      // Combine all content for a rich entry
      const fullConcept = `${formData.concept}\n\n**Simple Explanation:**\n${formData.simpleExplanation}\n\n**Connection:**\n${formData.connection}`;
      const fullChallenge = `${formData.challenge}\n\n**What Went Well:**\n${formData.win}`;
      const fullImprove = `${formData.improve}\n\n**Key Takeaways:**\n${formData.keyTakeaways.filter(t => t.trim()).map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

      addEntry({
        concept: fullConcept,
        challenge: fullChallenge,
        focus: focusMinutes,
        focusLevel: formData.focus,
        improve: fullImprove,
        tags: formData.tags,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const newXP = useGamificationStore.getState()?.xp ?? currentXP;
      
      // Bonus XP for thorough entries
      let bonusXP = Math.max(newXP - previousXP, 10);
      if (formData.simpleExplanation.length > 50) bonusXP += 5; // Feynman bonus
      if (formData.connection.length > 30) bonusXP += 5; // Connection bonus
      if (formData.keyTakeaways.filter(t => t.trim()).length === 3) bonusXP += 5; // All takeaways bonus
      if (formData.confidence >= 8) bonusXP += 5; // High confidence bonus
      
      setEarnedXP(bonusXP);
      fireCelebration();
      setShowSuccess(true);

      setTimeout(() => {
        setFormData(INITIAL_FORM_DATA);
        setCurrentStep(0);
        setShowSuccess(false);
        setIsSubmitting(false);
        setReminderDismissed(false);
        onComplete?.();
      }, 3500);
    } catch (error) {
      console.error("Failed to save entry:", error);
      setIsSubmitting(false);
    }
  }, [formData, addEntry, currentXP, fireCelebration, isSubmitting, onComplete]);

  const focusColorScheme = useMemo(
    () => getFocusColorScheme(formData.focus),
    [formData.focus]
  );

  const showReminder = currentStep === 0 && lastEntryImprovement && !reminderDismissed;

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
              Excellent Reflection! 🌟
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 text-muted-foreground max-w-sm"
            >
              Your deep reflection strengthens neural pathways and improves long-term retention.
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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 space-y-1 text-sm text-muted-foreground"
            >
              <p>Level {level} • Keep building your knowledge!</p>
              <p className="text-xs">💡 Review your key takeaways tomorrow for spaced repetition</p>
            </motion.div>
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
              currentStep === 5 ? focusColorScheme.gradient : currentStepConfig.gradient
            )}
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1.5 border-b bg-muted/30 p-3 overflow-x-auto">
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
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  isActive && `bg-gradient-to-br ${step.gradient} text-white shadow-lg`,
                  isComplete && "bg-emerald-500 text-white",
                  !isActive && !isComplete && "bg-muted text-muted-foreground"
                )}
                whileHover={{ scale: index <= currentStep ? 1.1 : 1 }}
                whileTap={{ scale: index <= currentStep ? 0.95 : 1 }}
                disabled={index > currentStep}
                aria-label={`Step ${index + 1}: ${step.title}`}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Form content */}
        <div className="relative min-h-[420px] overflow-hidden">
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
                className="mb-6 text-center"
              >
                <div
                  className={cn(
                    "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
                    currentStep === 5 ? focusColorScheme.gradient : currentStepConfig.gradient,
                    currentStep === 5 && focusColorScheme.glow
                  )}
                >
                  <currentStepConfig.icon className="h-7 w-7 text-white" />
                </div>
                <h2 className="mb-1 text-lg font-bold md:text-xl">
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
                      placeholder="I learned about..."
                      value={formData.concept}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, concept: e.target.value }))
                      }
                      className="min-h-[120px] resize-none text-base"
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formData.concept.length}/10 characters minimum
                    </p>
                    <LearningTip tip={currentStepConfig.tip} />
                  </motion.div>
                )}

                {/* Step 1: Simple Explanation (Feynman) */}
                {currentStep === 1 && (
                  <motion.div variants={fadeInUp}>
                    <Textarea
                      placeholder="If I had to explain this to a beginner, I would say..."
                      value={formData.simpleExplanation}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, simpleExplanation: e.target.value }))
                      }
                      className="min-h-[120px] resize-none text-base"
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formData.simpleExplanation.length} characters
                    </p>
                    <LearningTip tip={currentStepConfig.tip} />
                  </motion.div>
                )}

                {/* Step 2: Connection */}
                {currentStep === 2 && (
                  <motion.div variants={fadeInUp}>
                    <Textarea
                      placeholder="This reminds me of... / This is similar to... / This connects to..."
                      value={formData.connection}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, connection: e.target.value }))
                      }
                      className="min-h-[100px] resize-none text-base"
                      autoFocus
                    />
                    <LearningTip tip={currentStepConfig.tip} />
                  </motion.div>
                )}

                {/* Step 3: Challenge */}
                {currentStep === 3 && (
                  <motion.div variants={fadeInUp}>
                    <QuickChips
                      chips={CHALLENGE_CHIPS}
                      onChipClick={(chip) => appendToField("challenge", chip)}
                      label="Quick add:"
                    />
                    <Textarea
                      placeholder="The hardest part was..."
                      value={formData.challenge}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, challenge: e.target.value }))
                      }
                      className="min-h-[100px] resize-none text-base"
                    />
                    <LearningTip tip={currentStepConfig.tip} />
                  </motion.div>
                )}

                {/* Step 4: Win */}
                {currentStep === 4 && (
                  <motion.div variants={fadeInUp}>
                    <QuickChips
                      chips={WIN_CHIPS}
                      onChipClick={(chip) => appendToField("win", chip)}
                      label="Quick add:"
                    />
                    <Textarea
                      placeholder="What went well? What am I proud of?"
                      value={formData.win}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, win: e.target.value }))
                      }
                      className="min-h-[100px] resize-none text-base"
                    />
                    <LearningTip tip={currentStepConfig.tip} />
                  </motion.div>
                )}

                {/* Step 5: Ratings */}
                {currentStep === 5 && (
                  <motion.div variants={fadeInUp} className="space-y-8">
                    <RatingSlider
                      value={formData.focus}
                      onChange={(val) => setFormData((prev) => ({ ...prev, focus: val }))}
                      labels={FOCUS_LABELS}
                      title="Focus"
                      colorScheme={focusColorScheme}
                    />
                    
                    <div className="border-t pt-6">
                      <RatingSlider
                        value={formData.energy}
                        onChange={(val) => setFormData((prev) => ({ ...prev, energy: val }))}
                        labels={ENERGY_LABELS}
                        title="Energy"
                      />
                    </div>

                    <div className="border-t pt-6">
                      <Label className="mb-4 block text-center text-sm font-medium">
                        How well do you understand this?
                      </Label>
                      <ConfidenceMeter
                        value={formData.confidence}
                        onChange={(val) => setFormData((prev) => ({ ...prev, confidence: val }))}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 6: Key Takeaways */}
                {currentStep === 6 && (
                  <motion.div variants={fadeInUp}>
                    <KeyTakeaways
                      takeaways={formData.keyTakeaways}
                      onChange={updateTakeaway}
                    />
                    <LearningTip tip={currentStepConfig.tip} />
                  </motion.div>
                )}

                {/* Step 7: Improve */}
                {currentStep === 7 && (
                  <motion.div variants={fadeInUp}>
                    <Textarea
                      placeholder="Tomorrow I will specifically..."
                      value={formData.improve}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, improve: e.target.value }))
                      }
                      className="min-h-[120px] resize-none text-base"
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formData.improve.length}/10 characters minimum
                    </p>
                    <LearningTip tip={currentStepConfig.tip} />
                  </motion.div>
                )}

                {/* Step 8: Tags */}
                {currentStep === 8 && (
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
                              "flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-lg"
                                : "border-border bg-card hover:border-primary/50 hover:bg-accent"
                            )}
                            aria-pressed={isSelected}
                          >
                            <span>{tag.emoji}</span>
                            <span>{tag.label}</span>
                            {isSelected && <Check className="h-4 w-4" />}
                          </motion.button>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      {formData.tags.length === 0
                        ? "Select tags (optional)"
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
              {currentStep + 1} / {STEPS.length}
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
                  currentStep === 5 ? focusColorScheme.gradient : currentStepConfig.gradient
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
