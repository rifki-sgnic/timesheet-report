import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import useTimesheet from "@/store/timesheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SettingsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function SettingsDialog({ isOpen, setIsOpen }: SettingsDialogProps) {
  const { geminiApiKey, setGeminiApiKey } = useTimesheet();
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your preferences and API integrations.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex flex-col gap-4">
          {/* Theme Section */}
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Appearance</span>
              <span className="text-xs text-muted-foreground">Select your interface theme</span>
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={theme === "light" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTheme("light")}
                className="h-8 text-xs rounded-md px-2.5"
              >
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="h-8 text-xs rounded-md px-2.5"
              >
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTheme("system")}
                className="h-8 text-xs rounded-md px-2.5"
              >
                System
              </Button>
            </div>
          </div>

          {/* API Section */}
          <div className="flex flex-col gap-2 py-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Gemini API Key</span>
              <span className="text-xs text-muted-foreground">
                Used to generate timesheet from rough logs. Get a key from{" "}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-semibold"
                >
                  Google AI Studio
                </a>.
              </span>
            </div>
            <Input
              type="password"
              placeholder="AIzaSy..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setGeminiApiKey(apiKeyInput);
              setIsOpen(false);
            }}
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
