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

interface ExportDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  handleExport: () => Promise<void>;
  isExporting: boolean;
}

export function ExportDialog({
  isOpen,
  setIsOpen,
  selectedMonth,
  setSelectedMonth,
  handleExport,
  isExporting,
}: ExportDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Monthly Timesheet</DialogTitle>
          <DialogDescription>
            Select the month you want to export as an Excel spreadsheet.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!selectedMonth || isExporting}
          >
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
