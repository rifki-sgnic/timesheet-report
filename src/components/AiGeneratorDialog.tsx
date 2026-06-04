import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useTimesheet from "@/store/timesheet";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  InputSchema,
  generateTimesheetFromAi,
  formatAiError,
} from "@/lib/timesheetAi";
import type { GeneratedEntry } from "@/lib/timesheetAi";
import { AiInputForm } from "./AiInputForm";
import { AiPreviewList } from "./AiPreviewList";

interface AiGeneratorDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AiGeneratorDialog({
  isOpen,
  setIsOpen,
}: AiGeneratorDialogProps) {
  const { setEntriesForDate, geminiApiKey, geminiModel } = useTimesheet();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [projectName, setProjectName] = useState("");
  const [aiWorklog, setAiWorklog] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<Record<
    string,
    GeneratedEntry[]
  > | null>(null);

  const handleGenerateAi = async () => {
    if (!geminiApiKey) {
      toast.error("Please set your Gemini API Key in Settings first.");
      return;
    }

    try {
      InputSchema.parse(aiWorklog);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error("Invalid worklog input.");
      }
      return;
    }

    setIsGenerating(true);

    const generatePromise = generateTimesheetFromAi(
      aiWorklog,
      selectedDate,
      projectName,
      geminiApiKey,
      geminiModel
    );

    toast.promise(generatePromise, {
      loading: "AI is parsing your worklogs...",
      success: (data) => {
        setPreviewData(data);
        setIsGenerating(false);
        return `Successfully parsed timesheets!`;
      },
      error: (err) => {
        setIsGenerating(false);
        return formatAiError(err);
      },
    });
  };

  const handleApplyTimesheets = () => {
    if (!previewData) return;

    let totalSaved = 0;
    Object.entries(previewData).forEach(([date, entriesArray]) => {
      const cleanEntries = entriesArray.slice(0, 5);
      setEntriesForDate(
        date,
        cleanEntries.map((e) => {
          const combinedActivity = [
            e.project.trim(),
            e.task.trim(),
            e.activity.trim(),
          ].filter(Boolean).join("\n");
          return {
            startTime: e.startTime,
            endTime: e.endTime,
            activity: combinedActivity,
          };
        }),
      );
      totalSaved++;
    });

    toast.success(
      `Successfully saved timesheets for ${totalSaved} date(s) to your calendar!`,
    );

    // Close dialog and reset state
    setIsOpen(false);
    setPreviewData(null);
    setAiWorklog("");
    setProjectName("");
    const now = new Date();
    setSelectedDate(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setPreviewData(null);
          setAiWorklog("");
          setProjectName("");
          const now = new Date();
          setSelectedDate(
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
          );
        }
      }}
    >
      <DialogContent
        className={
          previewData
            ? "sm:max-w-[650px] max-h-[85vh] flex flex-col"
            : "sm:max-w-[500px] flex flex-col"
        }
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>
              {previewData
                ? "Review AI Generated Timesheets"
                : "AI Timesheet Generator"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {previewData
              ? "Verify the parsed time blocks and activity descriptions below before saving them to the calendar."
              : "Paste your rough worklog to convert it into a structured timesheet. You can input tasks for multiple dates."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex-1 overflow-y-auto min-h-0 pr-1">
          {!geminiApiKey ? (
            <p className="text-sm text-muted-foreground">
              To use the AI generator, please configure your{" "}
              <strong>Gemini API Key</strong> in settings first.
            </p>
          ) : previewData ? (
            <AiPreviewList previewData={previewData} />
          ) : (
            <AiInputForm
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              projectName={projectName}
              setProjectName={setProjectName}
              aiWorklog={aiWorklog}
              setAiWorklog={setAiWorklog}
            />
          )}
        </div>

        <DialogFooter className="items-center justify-between w-full border-t border-border pt-4 shrink-0">
          <span className="text-[11px] text-muted-foreground">
            {previewData
              ? "Review all changes carefully."
              : "If no date is specified, it defaults to the Target Date."}
          </span>
          <div className="flex gap-2">
            {previewData ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setPreviewData(null)}
                  className="gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back & Edit
                </Button>
                <Button onClick={handleApplyTimesheets} className="gap-1.5">
                  <Check className="w-4 h-4" />
                  Save to Calendar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                {geminiApiKey ? (
                  <Button
                    onClick={handleGenerateAi}
                    disabled={isGenerating || !aiWorklog.trim()}
                    className="gap-1.5"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
