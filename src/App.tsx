import Calendar from "./components/calendar/Calendar";
import { Sidebar } from "./components/Sidebar";
import { ThemeProvider } from "./components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="timesheet-theme">
      <TooltipProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-hidden bg-background">
            <Calendar />
          </div>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
