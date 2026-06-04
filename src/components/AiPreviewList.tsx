import { Calendar } from "lucide-react";
import { getLocaleDateString } from "@/lib/utils";
import type { GeneratedEntry } from "@/lib/timesheetAi";

interface AiPreviewListProps {
  previewData: Record<string, GeneratedEntry[]>;
}

export function AiPreviewList({ previewData }: AiPreviewListProps) {
  return (
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
                  className="flex flex-col sm:flex-row sm:items-start gap-3 text-xs bg-background p-3 rounded-lg border border-border/50 hover:border-border transition-colors duration-200"
                >
                  <div className="flex items-center shrink-0">
                    <span className="font-mono font-medium text-primary bg-primary/5 px-2 py-0.5 rounded">
                      {entry.startTime} - {entry.endTime}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {entry.project && (
                        <span className="bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider shrink-0">
                          {entry.project}
                        </span>
                      )}
                      <span className="font-semibold text-foreground truncate">
                        {entry.task}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed break-words">
                      {entry.activity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
