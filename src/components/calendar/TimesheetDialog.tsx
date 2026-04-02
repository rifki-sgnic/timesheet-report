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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getLocaleDateString, minutesToTime, timeToMinutes } from "@/lib/utils";
import useTimesheet from "@/store/timesheet";
import {
  Copy,
  MoreHorizontal,
  PlusIcon,
  RotateCcw,
  Save,
  Trash,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimesheetDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedDate: string | null;
  holiday?: string;
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
  holiday,
}: TimesheetDialogProps) {
  const { entries, setEntriesForDate } = useTimesheet();

  const [rows, setRows] = useState<TimesheetFormRow[]>([]);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);

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

  const handleReset = () => {
    if (selectedDate) {
      setEntriesForDate(selectedDate, []);
    }
    setRows([
      {
        id: crypto.randomUUID(),
        startTime: "08:00",
        endTime: "10:00",
        activity: "",
      },
    ]);
    setIsResetAlertOpen(false);
    setIsOpen(false);
  };

  const handleDuplicate = () => {
    if (!selectedDate) return;

    const validRows = rows.filter(
      (r) => r.startTime && r.endTime && r.activity,
    );

    if (validRows.length === 0) return;

    const [y, m, d] = selectedDate.split("-").map(Number);
    const currentDate = new Date(y, m - 1, d);

    currentDate.setDate(currentDate.getDate() + 1);

    if (currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 2);
    } else if (currentDate.getDay() === 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const nextDate = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

    setEntriesForDate(
      nextDate,
      validRows.map((r) => ({
        startTime: r.startTime,
        endTime: r.endTime,
        activity: r.activity,
      })),
    );

    setIsOpen(false);
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
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>Add Timesheet for {getLocaleDateString(selectedDate)}</span>
              {holiday && (
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Badge className="bg-green-600 hover:bg-green-600/90 text-white cursor-help opacity-90 hover:opacity-100">
                      Holiday
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent align="center" className="z-50">
                    <p>{holiday}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </DialogTitle>
            <DialogDescription>
              Input multiple timesheet entries below.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {rows.map((row) => {
              const totalHours = calculateTotalHours(
                row.startTime,
                row.endTime,
              );
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
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="w-fit border-dashed"
            disabled={rows.length === 5}
          >
            <PlusIcon className="w-4 h-4" /> Add Another Time Block
          </Button>

          <DialogFooter className="sm:justify-between items-center w-full mt-4">
            <div className="flex flex-1 justify-start">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onSelect={() => setIsResetAlertOpen(true)}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleDuplicate}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isResetAlertOpen} onOpenChange={setIsResetAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all timesheet entries for{" "}
              <span className="font-semibold text-foreground">
                {getLocaleDateString(selectedDate)}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleReset}
            >
              Reset & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
