"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileJson,
  Shield,
  RefreshCw,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  exportAll,
  importAll,
  resetAllData,
  readFileAsJSON,
  gatherExportData,
  validateImportData,
  type ImportOptions,
  type ExportData,
} from "@/utils/export";
import { useGamification } from "@/hooks/useGamification";
import { useJournal } from "@/hooks/useJournal";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface StatusMessage {
  type: "success" | "error" | "warning" | "info";
  message: string;
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
// Status Message Component
// ============================================================================

interface StatusAlertProps {
  status: StatusMessage | null;
  onDismiss: () => void;
}

function StatusAlert({ status, onDismiss }: StatusAlertProps) {
  if (!status) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    error: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  };

  const Icon = icons[status.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex items-center gap-3 rounded-lg border p-4", colors[status.type])}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-sm">{status.message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Dismiss"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ============================================================================
// Data Stats Card
// ============================================================================

function DataStatsCard() {
  const { xp, level, streak, totalEntries } = useGamification();
  const { entries } = useJournal();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-violet-500" />
          Current Data Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{entries.length}</div>
            <div className="text-xs text-muted-foreground">Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{xp.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">XP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{level}</div>
            <div className="text-xs text-muted-foreground">Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{streak}</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function SettingsPage() {
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [pendingImport, setPendingImport] = useState<ExportData | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setStatus(null);

    try {
      exportAll();
      setStatus({
        type: "success",
        message: "Data exported successfully! Check your downloads folder.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Export failed",
      });
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setStatus(null);

      try {
        const data = (await readFileAsJSON(file)) as ExportData;
        const validation = validateImportData(data);

        if (!validation.valid) {
          setStatus({
            type: "error",
            message: `Invalid file: ${validation.errors.join(", ")}`,
          });
          return;
        }

        if (validation.warnings.length > 0) {
          setStatus({
            type: "warning",
            message: `Warnings: ${validation.warnings.join(", ")}`,
          });
        }

        setPendingImport(data);
        setShowImportConfirm(true);
      } catch (error) {
        setStatus({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to read file",
        });
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  // Confirm import
  const handleConfirmImport = useCallback(() => {
    if (!pendingImport) return;

    setIsImporting(true);
    setShowImportConfirm(false);

    try {
      const result = importAll(pendingImport, { mode: importMode });

      if (result.success) {
        setStatus({
          type: "success",
          message: result.message,
        });
        // Reload page to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setStatus({
          type: "error",
          message: result.message,
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Import failed",
      });
    } finally {
      setIsImporting(false);
      setPendingImport(null);
    }
  }, [pendingImport, importMode]);

  // Handle reset
  const handleReset = useCallback(() => {
    try {
      resetAllData();
      setStatus({
        type: "success",
        message: "All data has been reset. Reloading...",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setStatus({
        type: "error",
        message: "Failed to reset data",
      });
    }
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <Settings className="h-7 w-7 text-violet-500" />
            Settings
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your data, export backups, and configure preferences
          </p>
        </motion.div>

        {/* Status Alert */}
        <div className="mb-6">
          <StatusAlert status={status} onDismiss={() => setStatus(null)} />
        </div>

        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Data Summary */}
          <motion.div variants={itemVariants}>
            <DataStatsCard />
          </motion.div>

          {/* Export Section */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-emerald-500" />
                  Export Data
                </CardTitle>
                <CardDescription>
                  Download all your journal entries, achievements, and progress as a JSON file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileJson className="h-4 w-4" />
                    <span>Includes: Entries, XP, Achievements, Shop Items, Settings</span>
                  </div>
                  <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Export Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Import Section */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-500" />
                  Import Data
                </CardTitle>
                <CardDescription>
                  Restore your data from a previously exported backup file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Import mode selection */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <Label htmlFor="import-mode" className="shrink-0">
                    Import Mode:
                  </Label>
                  <Select
                    value={importMode}
                    onValueChange={(v) => setImportMode(v as "replace" | "merge")}
                  >
                    <SelectTrigger id="import-mode" className="w-full sm:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="replace">
                        <div className="flex flex-col">
                          <span>Replace All</span>
                          <span className="text-xs text-muted-foreground">
                            Overwrites existing data
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="merge">
                        <div className="flex flex-col">
                          <span>Merge</span>
                          <span className="text-xs text-muted-foreground">
                            Combines with existing data
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {importMode === "replace"
                      ? "Warning: This will overwrite all existing data. Make sure to export a backup first."
                      : "Merge mode will add new entries and keep higher XP/stats values."}
                  </span>
                </div>

                {/* File input */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="import-file"
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileJson className="h-4 w-4" />
                    <span>Accepts: .json backup files</span>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    variant="outline"
                    className="gap-2"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Select File
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Separator />

          {/* Danger Zone */}
          <motion.div variants={itemVariants}>
            <Card className="border-red-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Permanently delete all local data. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>
                      This will delete all entries, achievements, XP, and shop purchases.
                      Export your data first if you want to keep a backup.
                    </span>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="shrink-0 gap-2">
                        <Trash2 className="h-4 w-4" />
                        Reset All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          Reset All Data?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your journal entries, XP, achievements,
                          streak progress, and shop purchases. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleReset}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Yes, Reset Everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Version info */}
          <motion.div variants={itemVariants} className="text-center text-xs text-muted-foreground">
            <p>Learning Journal v1.0.0</p>
            <p className="mt-1">Data stored locally in your browser</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to import data from a backup file.
                  {importMode === "replace"
                    ? " This will replace all existing data."
                    : " This will merge with your existing data."}
                </p>
                {pendingImport && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Entries: </span>
                        <span className="font-medium">
                          {pendingImport.journal?.entries?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">XP: </span>
                        <span className="font-medium">
                          {pendingImport.gamification?.xp || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">From: </span>
                        <span className="font-medium">
                          {pendingImport.exportedAt
                            ? new Date(pendingImport.exportedAt).toLocaleDateString()
                            : "Unknown"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Version: </span>
                        <span className="font-medium">{pendingImport.version || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingImport(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              {importMode === "replace" ? "Replace & Import" : "Merge & Import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

