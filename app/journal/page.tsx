"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  ChevronDown,
  Pencil,
  Trash2,
  Tag,
  Lightbulb,
  Mountain,
  Rocket,
  Focus,
  X,
  Check,
  AlertTriangle,
  Brain,
  Link2,
  Trophy,
  Zap,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GuidedJournalForm } from "@/components/GuidedJournalForm";
import { useJournal, type JournalEntry, type JournalEntryData } from "@/hooks/useJournal";
import { cn } from "@/lib/utils";

// ============================================================================
// Constants
// ============================================================================

const TAG_COLORS: Record<string, string> = {
  math: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  tech: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  business: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  science: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  language: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  art: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  music: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  health: "bg-green-500/10 text-green-500 border-green-500/20",
  productivity: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  personal: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

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

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFocusMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ============================================================================
// Content Parsing Helpers
// ============================================================================

interface ParsedContent {
  main: string;
  simpleExplanation?: string;
  connection?: string;
}

interface ParsedChallenge {
  main: string;
  win?: string;
}

interface ParsedImprove {
  main: string;
  takeaways?: string[];
}

function parseConceptContent(content: string): ParsedContent {
  const parts = content.split(/\*\*Simple Explanation:\*\*/i);
  if (parts.length === 1) {
    return { main: content };
  }
  
  const mainContent = parts[0].trim();
  const rest = parts[1];
  
  const connectionParts = rest.split(/\*\*Connection:\*\*/i);
  const simpleExplanation = connectionParts[0].trim();
  const connection = connectionParts[1]?.trim();
  
  return {
    main: mainContent,
    simpleExplanation: simpleExplanation || undefined,
    connection: connection || undefined,
  };
}

function parseChallengeContent(content: string): ParsedChallenge {
  const parts = content.split(/\*\*What Went Well:\*\*/i);
  return {
    main: parts[0].trim(),
    win: parts[1]?.trim() || undefined,
  };
}

function parseImproveContent(content: string): ParsedImprove {
  const parts = content.split(/\*\*Key Takeaways:\*\*/i);
  const main = parts[0].trim();
  
  if (parts.length === 1) {
    return { main };
  }
  
  const takeawaysText = parts[1].trim();
  const takeaways = takeawaysText
    .split(/\n/)
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(line => line.length > 0);
  
  return {
    main,
    takeaways: takeaways.length > 0 ? takeaways : undefined,
  };
}

function getEntryTitle(entry: JournalEntry): string {
  if (entry.title) return entry.title;
  
  // Extract first line or first 60 chars of concept
  const parsed = parseConceptContent(entry.concept);
  const firstLine = parsed.main.split('\n')[0];
  return firstLine.length > 60 ? firstLine.substring(0, 57) + '...' : firstLine;
}

// ============================================================================
// Entry Card Component
// ============================================================================

interface EntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
}

function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Parse the rich content
  const parsedConcept = parseConceptContent(entry.concept);
  const parsedChallenge = parseChallengeContent(entry.challenge);
  const parsedImprove = parseImproveContent(entry.improve);
  const title = getEntryTitle(entry);
  
  // Check if this is an enhanced entry (has structured content)
  const isEnhancedEntry = !!(parsedConcept.simpleExplanation || parsedChallenge.win || parsedImprove.takeaways);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "group cursor-pointer overflow-hidden transition-all hover:shadow-lg focus-within:ring-2 focus-within:ring-primary/20",
          isExpanded && "ring-2 ring-primary/20"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`Journal entry: ${title}`}
      >
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-start justify-between p-4 pb-3">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(entry.date)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatTime(entry.date)}</span>
                </div>
                {entry.focus > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Focus className="h-3.5 w-3.5" />
                    <span>{formatFocusMinutes(entry.focus)}</span>
                  </div>
                )}
                {entry.focusLevel && (
                  <div className="flex items-center gap-1 text-sm">
                    <Target className="h-3.5 w-3.5 text-violet-500" />
                    <span className="text-violet-500 font-medium">{entry.focusLevel}/10</span>
                  </div>
                )}
              </div>
              <h3 className="line-clamp-2 font-medium leading-snug">
                {title}
              </h3>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-4 mt-1"
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </div>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-3">
              {entry.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn(
                    "text-xs",
                    TAG_COLORS[tag.toLowerCase()] || "bg-muted"
                  )}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="border-t bg-muted/30 p-4 space-y-4">
                  {/* Main Concept */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                      <Lightbulb className="h-4 w-4" />
                      <span>What I Learned</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {parsedConcept.main}
                    </p>
                  </div>

                  {/* Simple Explanation (Feynman) */}
                  {parsedConcept.simpleExplanation && (
                    <div className="space-y-1.5 pl-4 border-l-2 border-purple-500/30">
                      <div className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                        <Brain className="h-4 w-4" />
                        <span>Simple Explanation</span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {parsedConcept.simpleExplanation}
                      </p>
                    </div>
                  )}

                  {/* Connection */}
                  {parsedConcept.connection && (
                    <div className="space-y-1.5 pl-4 border-l-2 border-cyan-500/30">
                      <div className="flex items-center gap-2 text-sm font-medium text-cyan-600 dark:text-cyan-400">
                        <Link2 className="h-4 w-4" />
                        <span>Connection</span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {parsedConcept.connection}
                      </p>
                    </div>
                  )}

                  {/* Challenge */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400">
                      <Mountain className="h-4 w-4" />
                      <span>Challenges</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {parsedChallenge.main}
                    </p>
                  </div>

                  {/* Win */}
                  {parsedChallenge.win && (
                    <div className="space-y-1.5 pl-4 border-l-2 border-yellow-500/30">
                      <div className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        <Trophy className="h-4 w-4" />
                        <span>What Went Well</span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {parsedChallenge.win}
                      </p>
                    </div>
                  )}

                  {/* Improve / Goal */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      <Rocket className="h-4 w-4" />
                      <span>Tomorrow&apos;s Goal</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {parsedImprove.main}
                    </p>
                  </div>

                  {/* Key Takeaways */}
                  {parsedImprove.takeaways && parsedImprove.takeaways.length > 0 && (
                    <div className="space-y-2 rounded-lg bg-orange-500/5 border border-orange-500/20 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
                        <Zap className="h-4 w-4" />
                        <span>Key Takeaways</span>
                      </div>
                      <ul className="space-y-1">
                        {parsedImprove.takeaways.map((takeaway, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-600 dark:text-orange-400">
                              {index + 1}
                            </span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* XP Earned Badge */}
                  {entry.xpEarned && entry.xpEarned > 0 && (
                    <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        +{entry.xpEarned} XP earned
                      </Badge>
                      {isEnhancedEntry && (
                        <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 dark:text-violet-400">
                          Deep Reflection
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(entry);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(entry);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Edit Dialog Component
// ============================================================================

interface EditDialogProps {
  entry: JournalEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Partial<JournalEntryData>) => void;
}

function EditDialog({ entry, open, onOpenChange, onSave }: EditDialogProps) {
  const [formData, setFormData] = useState<Partial<JournalEntryData>>({});

  // Reset form when entry changes
  useEffect(() => {
    if (entry) {
      setFormData({
        concept: entry.concept,
        challenge: entry.challenge,
        focus: entry.focus,
        improve: entry.improve,
        tags: entry.tags || [],
      });
    }
  }, [entry]);

  const handleSave = () => {
    if (entry) {
      onSave(entry.id, formData);
      onOpenChange(false);
    }
  };

  const toggleTag = (tagId: string) => {
    const currentTags = formData.tags || [];
    setFormData({
      ...formData,
      tags: currentTags.includes(tagId)
        ? currentTags.filter((t) => t !== tagId)
        : [...currentTags, tagId],
    });
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Entry
          </DialogTitle>
          <DialogDescription>
            Make changes to your journal entry below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Concept */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Lightbulb className="h-4 w-4" />
              What I Learned
            </Label>
            <Textarea
              value={formData.concept || entry.concept}
              onChange={(e) =>
                setFormData({ ...formData, concept: e.target.value })
              }
              className="min-h-[80px]"
            />
          </div>

          {/* Challenge */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Mountain className="h-4 w-4" />
              Challenges
            </Label>
            <Textarea
              value={formData.challenge || entry.challenge}
              onChange={(e) =>
                setFormData({ ...formData, challenge: e.target.value })
              }
              className="min-h-[80px]"
            />
          </div>

          {/* Focus */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <Focus className="h-4 w-4" />
              Focus Time: {formData.focus ?? entry.focus} minutes
            </Label>
            <Slider
              value={[formData.focus ?? entry.focus]}
              onValueChange={([value]) =>
                setFormData({ ...formData, focus: value })
              }
              min={0}
              max={120}
              step={5}
            />
          </div>

          {/* Improve */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Rocket className="h-4 w-4" />
              Tomorrow&apos;s Goal
            </Label>
            <Textarea
              value={formData.improve || entry.improve}
              onChange={(e) =>
                setFormData({ ...formData, improve: e.target.value })
              }
              className="min-h-[80px]"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => {
                const currentTags = formData.tags ?? entry.tags ?? [];
                const isSelected = currentTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-all",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-1.5">
            <Check className="h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function JournalPage() {
  const { entries, editEntry, deleteEntry, getLastEntryImprovement } = useJournal();
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<JournalEntry | null>(null);
  
  // Get the last entry's improvement goal to show as accountability reminder
  const lastImprovement = getLastEntryImprovement();

  const handleEdit = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
  }, []);

  const handleSaveEdit = useCallback(
    (id: string, data: Partial<JournalEntryData>) => {
      editEntry(id, data);
      setEditingEntry(null);
    },
    [editEntry]
  );

  const handleDelete = useCallback((entry: JournalEntry) => {
    setDeletingEntry(entry);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deletingEntry) {
      deleteEntry(deletingEntry.id);
      setDeletingEntry(null);
    }
  }, [deletingEntry, deleteEntry]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Journal</h1>
            <p className="text-sm text-muted-foreground">
              {entries.length} {entries.length === 1 ? "entry" : "entries"} total
            </p>
          </div>
        </div>

        {!showNewEntry && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              onClick={() => setShowNewEntry(true)}
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25"
            >
              <Plus className="h-4 w-4" />
              New Entry
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* New Entry Form */}
      <AnimatePresence mode="wait">
        {showNewEntry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 right-0 z-10"
                onClick={() => setShowNewEntry(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <GuidedJournalForm
                onComplete={() => setShowNewEntry(false)}
                className="mb-8"
                lastEntryImprovement={lastImprovement}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Previous Entries</h2>
          {entries.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Click to expand
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-semibold">No entries yet</h3>
                <p className="mb-4 max-w-sm text-sm text-muted-foreground">
                  Start documenting your learning journey by creating your first
                  journal entry.
                </p>
                {!showNewEntry && (
                  <Button
                    onClick={() => setShowNewEntry(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create First Entry
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditDialog
        entry={editingEntry}
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingEntry}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Entry?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              journal entry from {deletingEntry && formatDate(deletingEntry.date)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
