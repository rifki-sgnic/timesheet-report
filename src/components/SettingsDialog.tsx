import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import useTimesheet from "@/store/timesheet";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Settings, Eye, EyeOff } from "lucide-react";

interface SettingsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function SettingsDialog({ isOpen, setIsOpen }: SettingsDialogProps) {
  const { geminiApiKey, setGeminiApiKey, geminiModel, setGeminiModel } =
    useTimesheet();
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);
  const [modelInput, setModelInput] = useState(
    geminiModel || "gemini-2.5-flash",
  );
  const { theme, setTheme } = useTheme();
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl border border-border/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] bg-background">
        <DialogHeader className="pb-4 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground">
            <Settings className="w-5 h-5 text-primary animate-pulse" />
            <span>Settings</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Manage your interface appearance and Gemini API configurations.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Theme Section */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Appearance
            </label>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
              <span className="text-xs text-muted-foreground">
                Interface theme
              </span>
              <div className="flex gap-1 bg-muted/60 p-1 rounded-lg border border-border/20">
                <Button
                  variant={theme === "light" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className={`h-7 text-xs rounded-md px-3 font-medium transition-all duration-150 active:scale-[0.96] ${
                    theme === "light"
                      ? "bg-background text-foreground shadow-sm border border-border/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className={`h-7 text-xs rounded-md px-3 font-medium transition-all duration-150 active:scale-[0.96] ${
                    theme === "dark"
                      ? "bg-background text-foreground shadow-sm border border-border/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  className={`h-7 text-xs rounded-md px-3 font-medium transition-all duration-150 active:scale-[0.96] ${
                    theme === "system"
                      ? "bg-background text-foreground shadow-sm border border-border/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  System
                </Button>
              </div>
            </div>
          </div>

          {/* Gemini Model Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gemini Model
            </label>
            <Select value={modelInput} onValueChange={(e) => setModelInput(e)}>
              <SelectTrigger className="w-full text-sm h-10 px-3 border border-border/80 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border shadow-lg">
                <SelectItem value="gemini-2.5-flash" className="rounded-lg">
                  gemini-2.5-flash (Default)
                </SelectItem>
                <SelectItem value="gemini-2.5-pro" className="rounded-lg">
                  gemini-2.5-pro
                </SelectItem>
                <SelectItem value="gemini-2.0-flash" className="rounded-lg">
                  gemini-2.0-flash
                </SelectItem>
                <SelectItem
                  value="gemini-2.0-flash-lite"
                  className="rounded-lg"
                >
                  gemini-2.0-flash-lite
                </SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[10px] text-muted-foreground leading-normal mt-0.5">
              Select the active model to parse worklogs. Pro models are more
              capable but have stricter rate limits.
            </span>
          </div>

          {/* API Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gemini API Key
            </label>
            <div className="relative flex items-center">
              <Input
                type={showApiKey ? "text" : "password"}
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full h-10 pl-3 pr-10 border border-border/80 rounded-xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors duration-150 focus:outline-none"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground leading-normal mt-0.5">
              Used to generate timesheets. Get a free API key from the{" "}
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline hover:text-primary/90 font-medium transition-colors"
              >
                Google AI Studio
              </a>
              .
            </span>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border/60 gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="rounded-xl font-medium active:scale-[0.98] transition-all h-10 px-4 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setGeminiApiKey(apiKeyInput);
              setGeminiModel(modelInput);
              setIsOpen(false);
            }}
            className="rounded-xl font-semibold active:scale-[0.98] transition-all h-10 px-4 text-sm shadow-sm"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
