"use client";

import { motion } from "framer-motion";
import { Check, Clock, Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useJournal,
  JOURNAL_TEMPLATES,
  type TemplateId,
  type JournalTemplate,
} from "@/hooks/useJournal";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface TemplateSelectorProps {
  className?: string;
  variant?: "cards" | "compact";
  onSelect?: (templateId: TemplateId) => void;
}

interface TemplateCardProps {
  template: JournalTemplate;
  isSelected: boolean;
  onSelect: () => void;
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getTemplateIcon(templateId: TemplateId) {
  switch (templateId) {
    case "quick":
      return Clock;
    case "deep":
      return Sparkles;
    case "full":
    default:
      return BookOpen;
  }
}

function getTemplateColorClasses(color: string, isSelected: boolean) {
  const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    violet: {
      bg: isSelected ? "bg-violet-500/10" : "bg-card",
      border: isSelected ? "border-violet-500" : "border-border",
      text: "text-violet-500",
      badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    amber: {
      bg: isSelected ? "bg-amber-500/10" : "bg-card",
      border: isSelected ? "border-amber-500" : "border-border",
      text: "text-amber-500",
      badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    emerald: {
      bg: isSelected ? "bg-emerald-500/10" : "bg-card",
      border: isSelected ? "border-emerald-500" : "border-border",
      text: "text-emerald-500",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  };

  return colorMap[color] || colorMap.violet;
}

// ============================================================================
// Template Card Component
// ============================================================================

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const Icon = getTemplateIcon(template.id);
  const colors = getTemplateColorClasses(template.color, isSelected);
  const stepCount = template.steps.length;
  const requiredSteps = template.steps.filter((s) => s.required).length;

  return (
    <motion.div variants={cardVariants}>
      <Card
        className={cn(
          "group relative cursor-pointer overflow-hidden border-2 transition-all hover:shadow-lg",
          colors.bg,
          colors.border,
          isSelected && "ring-2 ring-offset-2 ring-offset-background",
          isSelected && template.color === "violet" && "ring-violet-500",
          isSelected && template.color === "amber" && "ring-amber-500",
          isSelected && template.color === "emerald" && "ring-emerald-500"
        )}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`Select ${template.name} template`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
      >
        {/* Selected indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full",
              template.color === "violet" && "bg-violet-500",
              template.color === "amber" && "bg-amber-500",
              template.color === "emerald" && "bg-emerald-500"
            )}
          >
            <Check className="h-4 w-4 text-white" />
          </motion.div>
        )}

        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-transform group-hover:scale-110",
                template.color === "violet" && "bg-violet-500/20",
                template.color === "amber" && "bg-amber-500/20",
                template.color === "emerald" && "bg-emerald-500/20"
              )}
            >
              {template.icon}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{template.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {template.description}
              </p>

              {/* Meta info */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={cn("text-xs", colors.badge)}>
                  {stepCount} steps
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {requiredSteps} required
                </Badge>
                {template.bonusXP !== 0 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      template.bonusXP > 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {template.bonusXP > 0 ? "+" : ""}
                    {template.bonusXP} XP
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Steps preview */}
          <div className="mt-4 space-y-1.5">
            {template.steps.slice(0, 3).map((step, index) => (
              <div
                key={step.id}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium",
                    colors.badge
                  )}
                >
                  {index + 1}
                </span>
                <span className="truncate">{step.title}</span>
                {!step.required && (
                  <span className="shrink-0 text-[10px] italic opacity-60">
                    optional
                  </span>
                )}
              </div>
            ))}
            {template.steps.length > 3 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-5 w-5" />
                <span className="italic">+{template.steps.length - 3} more</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Compact Template Button
// ============================================================================

interface CompactTemplateButtonProps {
  template: JournalTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function CompactTemplateButton({
  template,
  isSelected,
  onSelect,
}: CompactTemplateButtonProps) {
  const colors = getTemplateColorClasses(template.color, isSelected);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
        colors.bg,
        colors.border,
        isSelected && "shadow-md"
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${template.name} template`}
    >
      <span className="text-base">{template.icon}</span>
      <span>{template.name}</span>
      {isSelected && <Check className={cn("h-4 w-4", colors.text)} />}
    </motion.button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TemplateSelector({
  className,
  variant = "cards",
  onSelect,
}: TemplateSelectorProps) {
  const { getActiveTemplateId, setActiveTemplate, getAllTemplates } = useJournal();
  const activeTemplateId = getActiveTemplateId();
  const templates = getAllTemplates();

  const handleSelect = (templateId: TemplateId) => {
    setActiveTemplate(templateId);
    onSelect?.(templateId);
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {templates.map((template) => (
          <CompactTemplateButton
            key={template.id}
            template={template}
            isSelected={activeTemplateId === template.id}
            onSelect={() => handleSelect(template.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={activeTemplateId === template.id}
          onSelect={() => handleSelect(template.id)}
        />
      ))}
    </motion.div>
  );
}

// ============================================================================
// Template Info Display
// ============================================================================

interface TemplateInfoProps {
  className?: string;
}

export function TemplateInfo({ className }: TemplateInfoProps) {
  const { getActiveTemplate } = useJournal();
  const template = getActiveTemplate();
  const colors = getTemplateColorClasses(template.color, true);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-lg">{template.icon}</span>
      <div>
        <p className="text-sm font-medium">{template.name}</p>
        <p className="text-xs text-muted-foreground">
          {template.steps.length} steps
          {template.bonusXP !== 0 && (
            <span className={cn("ml-2", template.bonusXP > 0 ? "text-emerald-500" : "text-amber-500")}>
              {template.bonusXP > 0 ? "+" : ""}{template.bonusXP} XP
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export default TemplateSelector;

