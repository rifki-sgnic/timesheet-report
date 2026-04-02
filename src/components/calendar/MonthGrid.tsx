import { useMemo, useState } from "react";
import useTimesheet from "@/store/timesheet";
import { buildCalendarGrid } from "@/lib/calendar";
import { TimesheetDialog } from "./TimesheetDialog";
import holidaysDataRaw from "@/data/holidays.json";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MonthGridProps {
  currentDate: Date;
}

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function MonthGrid({ currentDate }: MonthGridProps) {
  const cells = useMemo(() => buildCalendarGrid(currentDate), [currentDate]);
  const rows = cells.length / 7;

  const { entries } = useTimesheet();

  const currentYearStr = currentDate.getFullYear().toString();
  const holidaysMap = useMemo(() => {
    const map = new Map<string, string>();
    const vEvents = (holidaysDataRaw as any).VCALENDAR?.[0]?.VEVENT || [];
    vEvents.forEach((event: any) => {
      const dtStart = event["DTSTART;VALUE=DATE"];
      if (dtStart && dtStart.startsWith(currentYearStr)) {
        const y = dtStart.slice(0, 4);
        const m = dtStart.slice(4, 6);
        const d = dtStart.slice(6, 8);
        const dateString = `${y}-${m}-${d}`;
        map.set(dateString, event.SUMMARY);
      }
    });
    return map;
  }, [currentYearStr]);

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleCellClick = (dateString: string) => {
    setSelectedDate(dateString);
    setIsOpen(true);
  };

  return (
    <>
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Day labels header */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-2 text-center text-[11px] font-medium tracking-wider text-muted-foreground select-none"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          className="grid grid-cols-7 flex-1"
          style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}
        >
          {cells.map((cell, index) => {
            const dayEntries = entries.filter(
              (e) => e.date === cell.dateString,
            );

            // Sort entries based on start time
            const sortedEntries = [...dayEntries].sort((a, b) =>
              a.startTime.localeCompare(b.startTime),
            );

            const isWeekend = index % 7 === 0 || index % 7 === 6;
            const isSunday = index % 7 === 0;
            const holiday = holidaysMap.get(cell.dateString);

            return (
              <div
                key={`${cell.year}-${cell.month}-${cell.date}-${index}`}
                onClick={
                  isWeekend ? undefined : () => handleCellClick(cell.dateString)
                }
                className={`
                  relative border-b border-r border-border min-h-0 p-1 flex flex-col gap-1
                  transition-colors duration-100
                  ${isWeekend ? "cursor-default" : "hover:bg-muted/50 cursor-pointer"} overflow-hidden
                  ${!cell.isCurrentMonth ? "bg-muted/20" : "bg-background"}
                `}
              >
                <div className="flex flex-col items-center pt-1 shrink-0 w-full">
                  <span
                    className={`
                      inline-flex items-center justify-center text-xs font-medium
                      w-6 h-6 rounded-full select-none transition-colors
                      ${
                        cell.isToday
                          ? "bg-primary text-primary-foreground"
                          : cell.isCurrentMonth
                            ? isSunday
                              ? "text-red-500"
                              : holiday
                                ? "text-green-600"
                                : "text-foreground"
                            : isSunday
                              ? "text-red-500/50"
                              : holiday
                                ? "text-green-600/50"
                                : "text-muted-foreground/50"
                      }
                    `}
                  >
                    {cell.date}
                  </span>
                  {holiday && (
                    <div className="w-full px-1 mt-1 flex justify-center z-10 hidden-scrollbar">
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Badge 
                            className="bg-green-600 hover:bg-green-600/90 text-white h-4 text-[9px] w-full px-1 justify-center rounded-[3px] font-medium leading-none truncate cursor-help opacity-90 hover:opacity-100 transition-opacity whitespace-nowrap"
                          >
                            <span className="truncate max-w-full">{holiday}</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{holiday}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>

                {/* Timesheet Entries */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-1 no-scrollbar">
                  {(() => {
                    if (sortedEntries.length <= 2) {
                      return sortedEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {entry.startTime}-{entry.endTime} {entry.activity}
                        </div>
                      ));
                    }

                    const firstEntry = sortedEntries[0];
                    const lastEntry = sortedEntries[sortedEntries.length - 1];
                    const hiddenCount = sortedEntries.length - 2;

                    return (
                      <>
                        <div
                          key={firstEntry.id}
                          className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded truncate"
                        >
                          {firstEntry.startTime}-{firstEntry.endTime}{" "}
                          {firstEntry.activity}
                        </div>
                        <div className="text-[10px] text-muted-foreground text-center font-medium">
                          +{hiddenCount} more
                        </div>
                        <div
                          key={lastEntry.id}
                          className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded truncate"
                        >
                          {lastEntry.startTime}-{lastEntry.endTime}{" "}
                          {lastEntry.activity}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TimesheetDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        selectedDate={selectedDate}
        holiday={selectedDate ? holidaysMap.get(selectedDate) : undefined}
      />
    </>
  );
}
