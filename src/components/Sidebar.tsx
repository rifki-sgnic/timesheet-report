import { Button } from "@/components/ui/button";
import holidaysDataRaw from "@/data/holidays.json";
import { exportTimesheetToExcel } from "@/lib/excelExport";
import { getDaysInMonth, timeToMinutes } from "@/lib/utils";
import useTimesheet from "@/store/timesheet";
import {
  Briefcase,
  CalendarDays,
  Clock,
  Download,
  Loader2,
  Settings,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AiGeneratorDialog } from "./AiGeneratorDialog";
import { ExportDialog } from "./ExportDialog";
import { SettingsDialog } from "./SettingsDialog";

export function Sidebar() {
  const { entries, currentDate } = useTimesheet();
  const [isExporting, setIsExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  });

  // Calculate stats for current month
  const stats = useMemo(() => {
    const yearStr = currentYear.toString();
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const prefix = `${yearStr}-${monthStr}`;

    const monthEntries = entries.filter((e) => e.date.startsWith(prefix));

    // Get holidays for this year/month
    const holidays = new Set<string>();
    const vEvents = (holidaysDataRaw as any).VCALENDAR?.[0]?.VEVENT || [];
    vEvents.forEach((event: any) => {
      const dtStart = event["DTSTART;VALUE=DATE"];
      if (dtStart && dtStart.startsWith(yearStr + monthStr)) {
        holidays.add(
          `${dtStart.slice(0, 4)}-${dtStart.slice(4, 6)}-${dtStart.slice(6, 8)}`,
        );
      }
    });

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    let totalWorkDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const dayOfWeek = date.getDay();
      const dateStr = `${yearStr}-${monthStr}-${String(d).padStart(2, "0")}`;

      // Weekday (1-5) and not a holiday
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(dateStr)) {
        totalWorkDays++;
      }
    }

    const actualWorkDays = new Set(monthEntries.map((e) => e.date)).size;
    const actualWorkMinutes = monthEntries.reduce((acc, entry) => {
      const duration =
        timeToMinutes(entry.endTime) - timeToMinutes(entry.startTime);
      return acc + (duration > 0 ? duration : 0);
    }, 0);

    const actualWorkHours = parseFloat(
      (actualWorkMinutes / 60).toFixed(1).replace(/\.0$/, ""),
    );
    const totalWorkHours = totalWorkDays * 8;

    return {
      actualWorkDays,
      totalWorkDays,
      actualWorkHours,
      totalWorkHours,
    };
  }, [entries, currentDate]);

  const handleExport = async () => {
    if (!selectedMonth) {
      toast.error("Please select a month first.");
      return;
    }

    const filteredEntries = entries.filter((e) =>
      e.date.startsWith(selectedMonth),
    );

    if (filteredEntries.length === 0) {
      toast.warning(`No timesheet entries found for ${selectedMonth}!`);
      return;
    }

    try {
      setIsExporting(true);
      await exportTimesheetToExcel(filteredEntries);
      setExportDialogOpen(false);
      toast.success("Timesheet exported successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="w-64 border-r border-border bg-muted/20 flex flex-col h-full p-4 gap-6">
        <div className="flex items-center gap-2 px-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h1 className="font-semibold text-lg tracking-tight">Timesheet</h1>
        </div>

        <div className="flex-1 flex flex-col gap-4 mt-4 overflow-y-auto hidden-scrollbar">
          <div className="flex flex-col gap-3 px-2">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Monthly Summary
            </h2>
            <div className="bg-muted/40 rounded-lg p-3 border border-border flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-md">
                  <Briefcase className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Work Days
                  </span>
                  <span className="text-sm font-semibold">
                    {stats.actualWorkDays}/{stats.totalWorkDays}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-md">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Work Hours
                  </span>
                  <span className="text-sm font-semibold">
                    {stats.actualWorkHours}/{stats.totalWorkHours}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-2">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              General
            </h2>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2.5 text-sm h-9 px-3 font-medium hover:bg-muted/50"
              onClick={() => setAiGeneratorOpen(true)}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              Generate with AI
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2.5 text-sm h-9 px-3 font-medium hover:bg-muted/50"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4 text-primary" />
              Settings
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border mt-auto">
          <Button
            variant="default"
            className="w-full justify-start gap-2"
            onClick={() => setExportDialogOpen(true)}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? "Exporting..." : "Export Timesheet"}
          </Button>
        </div>
      </div>

      <ExportDialog
        isOpen={exportDialogOpen}
        setIsOpen={setExportDialogOpen}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        handleExport={handleExport}
        isExporting={isExporting}
      />

      {settingsOpen ? (
        <SettingsDialog isOpen={settingsOpen} setIsOpen={setSettingsOpen} />
      ) : null}

      {aiGeneratorOpen ? (
        <AiGeneratorDialog
          isOpen={aiGeneratorOpen}
          setIsOpen={setAiGeneratorOpen}
        />
      ) : null}
    </>
  );
}
