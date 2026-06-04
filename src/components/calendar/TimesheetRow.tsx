import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash } from "lucide-react";

interface TimesheetRowProps {
  row: {
    id: string;
    startTime: string;
    endTime: string;
    activity: string;
  };
  totalHours: string;
  onRowChange: (id: string, field: "startTime" | "endTime" | "activity", value: string) => void;
  onTotalHoursChange: (id: string, value: string) => void;
  onRemoveRow: (id: string) => void;
  disableRemove: boolean;
}

export function TimesheetRow({
  row,
  totalHours,
  onRowChange,
  onTotalHoursChange,
  onRemoveRow,
  disableRemove,
}: TimesheetRowProps) {
  return (
    <div className="flex items-start gap-3 bg-muted/30 p-3 rounded-lg border border-border">
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={row.startTime}
            onChange={(e) => onRowChange(row.id, "startTime", e.target.value)}
            className="w-[100px]"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="time"
            value={row.endTime}
            onChange={(e) => onRowChange(row.id, "endTime", e.target.value)}
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
            onChange={(e) => onTotalHoursChange(row.id, e.target.value)}
            className="w-[80px] h-8 text-sm"
            placeholder="Hrs"
          />
        </div>
      </div>

      <div className="flex-1 flex gap-2 h-full">
        <Textarea
          value={row.activity}
          onChange={(e) => onRowChange(row.id, "activity", e.target.value)}
          placeholder="Activity detail..."
          className="flex-1 resize-none h-[72px]"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemoveRow(row.id)}
          disabled={disableRemove}
          className="shrink-0 text-destructive hover:bg-destructive/10 h-full w-[40px]"
        >
          <Trash className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
