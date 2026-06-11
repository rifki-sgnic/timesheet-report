import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";

interface AiGeneratorPanelProps {
  showAiInput: boolean;
  setShowAiInput: (show: boolean) => void;
  geminiApiKey: string;
  aiWorklog: string;
  setAiWorklog: (log: string) => void;
  isGenerating: boolean;
  aiStatus: string;
  setAiStatus: (status: string) => void;
  handleGenerateAi: () => Promise<void>;
}

export function AiGeneratorPanel({
  showAiInput,
  setShowAiInput,
  geminiApiKey,
  aiWorklog,
  setAiWorklog,
  isGenerating,
  aiStatus,
  setAiStatus,
  handleGenerateAi,
}: AiGeneratorPanelProps) {
  if (!showAiInput) return null;

  return (
    <div className="bg-primary/5 border border-primary/10 rounded-xl p-3.5 flex flex-col gap-3">
      {!geminiApiKey ? (
        <div className="flex flex-col gap-2 py-2">
          <p className="text-sm text-muted-foreground">
            To use the AI generator, please configure your <strong>Gemini API Key</strong> in the sidebar settings first (look for the key icon 🔑 in the top-right of the sidebar).
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setShowAiInput(false)}
          >
            Close
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                AI Timesheet Generator
              </span>
              <span className="text-[10px] text-muted-foreground">
                Supports multi-date log inputs
              </span>
            </div>
            <Textarea
              value={aiWorklog}
              onChange={(e) => setAiWorklog(e.target.value)}
              placeholder={`Paste your rough worklog here... (e.g. 
- fix checksheet pagination
- enhance grouped checksheet view)`}
              className="min-h-[100px] text-sm bg-background"
            />
          </div>
          <div className="flex justify-between items-center">
            {aiStatus && (
              <span className="text-xs text-muted-foreground italic">
                {aiStatus}
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAiInput(false);
                  setAiStatus("");
                }}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleGenerateAi}
                disabled={isGenerating || !aiWorklog.trim()}
                className="gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
