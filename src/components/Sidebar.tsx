import { Button } from "@/components/ui/button";
import useTimesheet from "@/store/timesheet";
import { Download, CalendarDays, Loader2 } from "lucide-react";
import { exportTimesheetToExcel } from "@/lib/excelExport";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { ThemeToggle } from "@/components/ThemeToggle";

export function Sidebar() {
  const { entries } = useTimesheet();
  const [isExporting, setIsExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const handleExport = async () => {
    if (!selectedMonth) {
      alert("Please select a month first.");
      return;
    }

    const filteredEntries = entries.filter((e) =>
      e.date.startsWith(selectedMonth),
    );

    if (filteredEntries.length === 0) {
      alert(`No timesheet entries found for ${selectedMonth}!`);
      return;
    }

    try {
      setIsExporting(true);
      await exportTimesheetToExcel(filteredEntries);
      setExportDialogOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to export.");
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
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2 mt-4">
          <Button
            variant="secondary"
            className="justify-start gap-2 w-full shadow-none border-dashed bg-transparent"
          >
            <CalendarDays className="w-4 h-4" />
            Calendar
          </Button>
        </nav>

        <div className="pt-4 border-t border-border">
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

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export Monthly Timesheet</DialogTitle>
            <DialogDescription>
              Select the month you want to export as an Excel spreadsheet.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={!selectedMonth || isExporting}
            >
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
