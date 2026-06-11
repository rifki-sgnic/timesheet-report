import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TimesheetEntry {
  id: string;
  date: string; // Format: YYYY-MM-DD
  startTime: string;
  endTime: string;
  activity: string;
}

interface TimesheetState {
  entries: TimesheetEntry[];
  currentDate: Date;
  geminiApiKey: string;
  addEntry: (entry: Omit<TimesheetEntry, "id">) => void;
  removeEntry: (id: string) => void;
  setEntriesForDate: (
    date: string,
    newEntries: Omit<TimesheetEntry, "id" | "date">[],
  ) => void;
  setCurrentDate: (date: Date) => void;
  setGeminiApiKey: (key: string) => void;
}

const useTimesheet = create<TimesheetState>()(
  persist(
    (set) => ({
      entries: [],
      currentDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      geminiApiKey: "",
      addEntry: (entry) =>
        set((state) => ({
          entries: [...state.entries, { ...entry, id: crypto.randomUUID() }],
        })),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      setEntriesForDate: (date, newEntries) =>
        set((state) => {
          const filtered = state.entries.filter((e) => e.date !== date);
          const added = newEntries.map((e) => ({
            ...e,
            date,
            id: crypto.randomUUID(),
          }));
          return { entries: [...filtered, ...added] };
        }),
      setCurrentDate: (date) => set({ currentDate: date }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
    }),
    {
      name: "timesheet-storage",
      partialize: (state) => ({ 
        entries: state.entries, 
        geminiApiKey: state.geminiApiKey 
      }),
    },
  ),
);

export default useTimesheet;
