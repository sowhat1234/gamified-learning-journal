"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Focus,
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Download,
  ChevronDown,
  X,
  FileText,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { InsightFeed } from "@/components/InsightFeed";
import { XPBar } from "@/components/XPBar";
import { useJournal, JournalEntry } from "@/hooks/useJournal";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type SortField = "date" | "focus";
type SortOrder = "asc" | "desc";

interface FilterState {
  search: string;
  tag: string | null;
  sortField: SortField;
  sortOrder: SortOrder;
}

// ============================================================================
// Constants
// ============================================================================

const AVAILABLE_TAGS = [
  "math",
  "tech",
  "business",
  "science",
  "language",
  "art",
  "music",
  "health",
  "productivity",
  "personal",
];

// ============================================================================
// Animation Variants
// ============================================================================

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
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
  exit: {
    opacity: 0,
    x: -100,
    transition: { duration: 0.2 },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getFocusColor(focusLevel: number): string {
  if (focusLevel <= 3) return "bg-red-500";
  if (focusLevel <= 5) return "bg-amber-500";
  if (focusLevel <= 7) return "bg-emerald-500";
  return "bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500";
}

function getFocusLabel(focusLevel: number): string {
  if (focusLevel <= 3) return "Low";
  if (focusLevel <= 5) return "Medium";
  if (focusLevel <= 7) return "High";
  return "Peak";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function exportEntry(entry: JournalEntry): void {
  const dataStr = JSON.stringify(entry, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `journal-entry-${entry.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Entry Card Component
// ============================================================================

interface EntryCardProps {
  entry: JournalEntry;
  isPinned: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onExport: () => void;
}

function EntryCard({
  entry,
  isPinned,
  onEdit,
  onDelete,
  onTogglePin,
  onExport,
}: EntryCardProps) {
  const focusLevel = entry.focusLevel || Math.round(entry.focus / 6);

  return (
    <motion.div variants={itemVariants} layout>
      <Card
        className={cn(
          "group relative overflow-hidden transition-all hover:shadow-lg",
          isPinned && "ring-2 ring-amber-500/50"
        )}
      >
        {/* Focus color stripe */}
        <div className={cn("absolute left-0 top-0 h-full w-1", getFocusColor(focusLevel))} />

        {/* Pin indicator */}
        {isPinned && (
          <div className="absolute right-3 top-3">
            <Pin className="h-4 w-4 fill-amber-500 text-amber-500" />
          </div>
        )}

        <CardHeader className="pb-2 pl-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold">{entry.title}</h3>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(entry.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(entry.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Focus className="h-3 w-3" />
                  {focusLevel}/10 ({getFocusLabel(focusLevel)})
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                  aria-label="Entry actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onTogglePin}>
                  {isPinned ? (
                    <>
                      <PinOff className="mr-2 h-4 w-4" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="mr-2 h-4 w-4" />
                      Pin
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-4 pl-5">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {entry.concept}
          </p>

          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {entry.xpEarned > 0 && (
            <div className="mt-3 text-xs text-muted-foreground">
              +{entry.xpEarned} XP earned
            </div>
          )}
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
  onClose: () => void;
  onSave: (data: Partial<JournalEntry>) => void;
}

function EditDialog({ entry, open, onClose, onSave }: EditDialogProps) {
  const [formData, setFormData] = useState({
    title: entry?.title ?? "",
    concept: entry?.concept ?? "",
    challenge: entry?.challenge ?? "",
    improve: entry?.improve ?? "",
    focusLevel: entry?.focusLevel ?? 5,
  });

  // Reset form when entry changes
  useMemo(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        concept: entry.concept,
        challenge: entry.challenge,
        improve: entry.improve,
        focusLevel: entry.focusLevel,
      });
    }
  }, [entry]);

  const handleSave = () => {
    onSave({
      title: formData.title,
      concept: formData.concept,
      challenge: formData.challenge,
      improve: formData.improve,
      focusLevel: formData.focusLevel,
      focus: formData.focusLevel * 6,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-concept">What did you learn?</Label>
            <Textarea
              id="edit-concept"
              value={formData.concept}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, concept: e.target.value }))
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-challenge">What was challenging?</Label>
            <Textarea
              id="edit-challenge"
              value={formData.challenge}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, challenge: e.target.value }))
              }
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-improve">What will you improve?</Label>
            <Textarea
              id="edit-improve"
              value={formData.improve}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, improve: e.target.value }))
              }
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Focus Level: {formData.focusLevel}/10</Label>
            <Slider
              value={[formData.focusLevel]}
              onValueChange={([val]) =>
                setFormData((prev) => ({ ...prev, focusLevel: val }))
              }
              min={1}
              max={10}
              step={1}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function JournalReviewPage() {
  const { entries, deleteEntry, editEntry } = useJournal();
  const { xp, level, streak } = useGamification();

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    tag: null,
    sortField: "date",
    sortOrder: "desc",
  });

  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [deleteDialogEntry, setDeleteDialogEntry] = useState<JournalEntry | null>(null);
  const [editDialogEntry, setEditDialogEntry] = useState<JournalEntry | null>(null);

  // Get all unique tags from entries
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((entry) => {
      entry.tags?.forEach((tag) => tagSet.add(tag.toLowerCase()));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Filter by search
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (entry) =>
          entry.title.toLowerCase().includes(searchLower) ||
          entry.concept.toLowerCase().includes(searchLower) ||
          entry.challenge.toLowerCase().includes(searchLower) ||
          entry.improve.toLowerCase().includes(searchLower)
      );
    }

    // Filter by tag
    if (filters.tag) {
      result = result.filter((entry) =>
        entry.tags?.some((t) => t.toLowerCase() === filters.tag?.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      // Pinned entries first
      const aPinned = pinnedIds.has(a.id);
      const bPinned = pinnedIds.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // Then by sort field
      let comparison = 0;
      if (filters.sortField === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        comparison = (a.focusLevel || 0) - (b.focusLevel || 0);
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });

    return result;
  }, [entries, filters, pinnedIds]);

  const handleTogglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDelete = useCallback(() => {
    if (deleteDialogEntry) {
      deleteEntry(deleteDialogEntry.id);
      setDeleteDialogEntry(null);
    }
  }, [deleteDialogEntry, deleteEntry]);

  const handleEdit = useCallback(
    (data: Partial<JournalEntry>) => {
      if (editDialogEntry) {
        editEntry(editDialogEntry.id, data);
      }
    },
    [editDialogEntry, editEntry]
  );

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      tag: null,
      sortField: "date",
      sortOrder: "desc",
    });
  }, []);

  const hasActiveFilters = filters.search || filters.tag;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold md:text-3xl">Journal Review</h1>
          <p className="mt-1 text-muted-foreground">
            Browse, filter, and manage your learning entries
          </p>
        </motion.div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Filter Controls */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search entries..."
                        value={filters.search}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, search: e.target.value }))
                        }
                        className="pl-9"
                      />
                      {filters.search && (
                        <button
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, search: "" }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Tag Filter */}
                    <Select
                      value={filters.tag ?? "all"}
                      onValueChange={(val) =>
                        setFilters((prev) => ({
                          ...prev,
                          tag: val === "all" ? null : val,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[160px]">
                        <Tag className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="All tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All tags</SelectItem>
                        {availableTags.map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {tag.charAt(0).toUpperCase() + tag.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Sort */}
                    <div className="flex gap-2">
                      <Select
                        value={filters.sortField}
                        onValueChange={(val: SortField) =>
                          setFilters((prev) => ({ ...prev, sortField: val }))
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Date
                            </span>
                          </SelectItem>
                          <SelectItem value="focus">
                            <span className="flex items-center gap-2">
                              <Focus className="h-4 w-4" />
                              Focus
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
                          }))
                        }
                        aria-label={`Sort ${filters.sortOrder === "asc" ? "descending" : "ascending"}`}
                      >
                        {filters.sortOrder === "asc" ? (
                          <SortAsc className="h-4 w-4" />
                        ) : (
                          <SortDesc className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Active filters indicator */}
                  {hasActiveFilters && (
                    <div className="mt-3 flex items-center gap-2 border-t pt-3">
                      <span className="text-xs text-muted-foreground">
                        {filteredEntries.length} of {entries.length} entries
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-6 text-xs"
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Entry List */}
            {filteredEntries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center"
              >
                <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-medium">No entries found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : "Start journaling to see your entries here"}
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="space-y-3"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="popLayout">
                  {filteredEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      isPinned={pinnedIds.has(entry.id)}
                      onEdit={() => setEditDialogEntry(entry)}
                      onDelete={() => setDeleteDialogEntry(entry)}
                      onTogglePin={() => handleTogglePin(entry.id)}
                      onExport={() => exportEntry(entry)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Right Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full space-y-4 lg:w-80"
          >
            {/* XP Summary */}
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-medium">Progress Summary</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <XPBar variant="compact" showLevel />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-2xl font-bold">{level}</div>
                    <div className="text-xs text-muted-foreground">Level</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-2xl font-bold">{streak}</div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {entries.length} total entries • {xp.toLocaleString()} XP
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-medium">Insights</h3>
              </CardHeader>
              <CardContent>
                <InsightFeed maxCards={3} className="grid-cols-1" />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteDialogEntry}
        onOpenChange={() => setDeleteDialogEntry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialogEntry?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <EditDialog
        entry={editDialogEntry}
        open={!!editDialogEntry}
        onClose={() => setEditDialogEntry(null)}
        onSave={handleEdit}
      />
    </div>
  );
}

