import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getLocaleDateString } from "@/lib/utils";
import useTimesheet from "@/store/timesheet";
import { GoogleGenAI, Type } from "@google/genai";
import { ArrowLeft, Calendar, Check, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AiGeneratorDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface GeneratedEntry {
  startTime: string;
  endTime: string;
  activity: string;
}

export function AiGeneratorDialog({
  isOpen,
  setIsOpen,
}: AiGeneratorDialogProps) {
  const { setEntriesForDate, geminiApiKey } = useTimesheet();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
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

    setIsGenerating(true);

    const generatePromise = (async () => {
      const prompt = `
      You are a professional assistant. Convert the following rough worklog into structured timesheet entries.
      The output MUST be a JSON object with a key "days" containing a list of date groups.
      If the input worklog does not specify dates, default to mapping all generated entries to the selected date "${selectedDate}".

      Constraints:
      1. For each date, divide the worklog into standard working hours (usually starting from 08:00 until 17:00, with a 1-hour break between 12:00 and 13:00 if the time span covers it).
      2. The maximum number of entries (array length) per date is 5.
      3. Make the activity descriptions detailed, formal, and professional.

      Selected Date: ${selectedDate}

      Rough Worklog Input:
      ${aiWorklog}

      JSON Output (match the exact schema specified):
`;

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    entries: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          startTime: { type: Type.STRING },
                          endTime: { type: Type.STRING },
                          activity: { type: Type.STRING },
                        },
                        required: ["startTime", "endTime", "activity"],
                      },
                    },
                  },
                  required: ["date", "entries"],
                },
              },
            },
            required: ["days"],
          },
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("No response text returned from AI model");
      }

      const parsed = JSON.parse(resultText);
      const days = parsed.days || [];
      const entriesMap: Record<string, GeneratedEntry[]> = {};
      days.forEach((day: any) => {
        if (day.date && Array.isArray(day.entries)) {
          entriesMap[day.date] = day.entries;
        }
      });
      return entriesMap;
    })();

    toast.promise(generatePromise, {
      loading: "AI is parsing your worklogs...",
      success: (data) => {
        setPreviewData(data);
        setIsGenerating(false);
        return `Successfully parsed timesheets!`;
      },
      error: (err) => {
        setIsGenerating(false);
        let errorMsg = "Failed to parse timesheet.";
        if (err instanceof Error) {
          try {
            const parsed = JSON.parse(err.message);
            errorMsg = parsed?.error?.message || err.message;
          } catch {
            errorMsg = err.message;
          }
        } else if (typeof err === "string") {
          errorMsg = err;
        }
        return `Error: ${errorMsg}`;
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
        cleanEntries.map((e) => ({
          startTime: e.startTime,
          endTime: e.endTime,
          activity: e.activity,
        })),
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
            <div className="flex flex-col gap-5">
              {Object.entries(previewData).map(([date, entriesArray]) => (
                <div
                  key={date}
                  className="border border-border rounded-xl p-4 bg-muted/20"
                >
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">
                      {getLocaleDateString(date)}
                    </span>
                  </div>
                  {entriesArray.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No tasks generated for this date.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {entriesArray.map((entry, index) => (
                        <div
                          key={index}
                          className="flex gap-3 text-xs bg-background p-2.5 rounded-lg border border-border/50"
                        >
                          <span className="font-mono font-medium text-primary shrink-0 bg-primary/5 px-2 py-0.5 rounded h-fit">
                            {entry.startTime} - {entry.endTime}
                          </span>
                          <p className="text-muted-foreground leading-normal">
                            {entry.activity}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Target Date (Fallback)
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-sm h-9"
                />
                <span className="text-[10px] text-muted-foreground">
                  If your worklog doesn't specify any date prefix, entries will
                  be assigned to this date.
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Rough Worklog Input
                </label>
                <Textarea
                  value={aiWorklog}
                  onChange={(e) => setAiWorklog(e.target.value)}
                  placeholder={`Example multi-date log:
2026-06-01:
- fix checksheet pagination
- enhance grouped checksheet view

2026-06-02:
- create early schedule generator`}
                  className="min-h-[180px] text-sm"
                />
              </div>
            </div>
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
