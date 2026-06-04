import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AiInputFormProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  aiWorklog: string;
  setAiWorklog: (log: string) => void;
}

export function AiInputForm({
  selectedDate,
  setSelectedDate,
  projectName,
  setProjectName,
  aiWorklog,
  setAiWorklog,
}: AiInputFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <span className="text-[10px] text-muted-foreground leading-tight">
            Assigns entries to this date if no date prefix is found.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Project Name (Optional)
          </label>
          <Input
            type="text"
            placeholder="e.g. internal-project"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full text-sm h-9"
          />
          <span className="text-[10px] text-muted-foreground leading-tight">
            Enforces this project name across all generated slots.
          </span>
        </div>
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
  );
}
