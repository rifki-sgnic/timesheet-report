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
import { minutesToTime, timeToMinutes } from "@/lib/utils";
import useTimesheet from "@/store/timesheet";
import { Trash } from "lucide-react";
import { useState } from "react";

interface TimesheetDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedDate: string | null;
}

interface TimesheetFormRow {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
}

export function TimesheetDialog({
  isOpen,
  setIsOpen,
  selectedDate,
}: TimesheetDialogProps) {
  const { entries, setEntriesForDate } = useTimesheet();

  const [rows, setRows] = useState<TimesheetFormRow[]>([]);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  if (isOpen && selectedDate !== editingDate) {
    setEditingDate(selectedDate);
    const existing = entries.filter((e) => e.date === selectedDate);
    if (existing.length > 0) {
      setRows(existing.map((e) => ({ ...e, id: e.id || crypto.randomUUID() })));
    } else {
      setRows([
        {
          id: crypto.randomUUID(),
          startTime: "08:00",
          endTime: "10:00",
          activity: "",
        },
      ]);
    }
  }

  const handleAddRow = () => {
    const lastRow = rows[rows.length - 1];
    let newStartTime = "08:00";
    let newEndTime = "10:00";

    if (lastRow && lastRow.endTime) {
      newStartTime = lastRow.endTime;
      // Default to 2 hours later
      newEndTime = minutesToTime(timeToMinutes(newStartTime) + 120);
    }

    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        startTime: newStartTime,
        endTime: newEndTime,
        activity: "",
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const handleRowChange = (
    id: string,
    field: keyof TimesheetFormRow,
    value: string,
  ) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleTotalHoursChange = (id: string, totalHoursRaw: string) => {
    const val = parseFloat(totalHoursRaw);
    if (isNaN(val)) return; // Let user clear it or type weirdly without crashing

    setRows(
      rows.map((r) => {
        if (r.id === id && r.startTime) {
          const mins = Math.round(val * 60);
          const newEndTime = minutesToTime(timeToMinutes(r.startTime) + mins);
          return { ...r, endTime: newEndTime };
        }
        return r;
      }),
    );
  };

  const calculateTotalHours = (start: string, end: string): string => {
    if (!start || !end) return "";
    const diff = timeToMinutes(end) - timeToMinutes(start);
    const hrs = diff / 60;
    return hrs.toFixed(1).replace(/\.0$/, ""); // e.g. 2.0 -> 2, 2.5 -> 2.5
  };

  const handleSave = () => {
    if (!selectedDate) return;

    // Filter out rows that are completely empty or missing required fields
    const validRows = rows.filter(
      (r) => r.startTime && r.endTime && r.activity,
    );

    setEntriesForDate(
      selectedDate,
      validRows.map((r) => ({
        startTime: r.startTime,
        endTime: r.endTime,
        activity: r.activity,
      })),
    );

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add Timesheet for {selectedDate}</DialogTitle>
          <DialogDescription>
            Input multiple timesheet entries below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {rows.map((row) => {
            const totalHours = calculateTotalHours(row.startTime, row.endTime);
            return (
              <div
                key={row.id}
                className="flex items-start gap-3 bg-muted/30 p-3 rounded-lg border border-border"
              >
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={row.startTime}
                      onChange={(e) =>
                        handleRowChange(row.id, "startTime", e.target.value)
                      }
                      className="w-[100px]"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={row.endTime}
                      onChange={(e) =>
                        handleRowChange(row.id, "endTime", e.target.value)
                      }
                      className="w-[100px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium pl-1 w-[40px]">
                      Total:
                    </span>
                    <Input
                      type="number"
                      step="0.5"
                      value={totalHours}
                      onChange={(e) =>
                        handleTotalHoursChange(row.id, e.target.value)
                      }
                      className="w-[80px] h-8 text-sm"
                      placeholder="Hrs"
                    />
                  </div>
                </div>

                <div className="flex-1 flex gap-2 h-full">
                  <Textarea
                    value={row.activity}
                    onChange={(e) =>
                      handleRowChange(row.id, "activity", e.target.value)
                    }
                    placeholder="Activity detail..."
                    className="flex-1 resize-none h-[72px]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRow(row.id)}
                    disabled={rows.length === 1}
                    className="shrink-0 text-destructive hover:bg-destructive/10 h-full w-[40px]"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="w-fit border-dashed"
          >
            + Add Another Time Block
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Timesheets</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
