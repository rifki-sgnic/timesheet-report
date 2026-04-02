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
  addEntry: (entry: Omit<TimesheetEntry, "id">) => void;
  removeEntry: (id: string) => void;
  setEntriesForDate: (date: string, newEntries: Omit<TimesheetEntry, "id" | "date">[]) => void;
  setCurrentDate: (date: Date) => void;
}

const useTimesheet = create<TimesheetState>()(
  persist(
    (set) => ({
      entries: [],
      currentDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      addEntry: (entry) =>
        set((state) => ({
          entries: [
            ...state.entries,
            { ...entry, id: Math.random().toString(36).substring(2, 9) },
          ],
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
            id: Math.random().toString(36).substring(2, 9),
          }));
          return { entries: [...filtered, ...added] };
        }),
      setCurrentDate: (date) => set({ currentDate: date }),
    }),
    {
      name: "timesheet-storage",
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);

export default useTimesheet;
