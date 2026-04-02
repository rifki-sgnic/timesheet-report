import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// Helpers for time calculation
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);

  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  if (isNaN(minutes)) return "00:00";

  let h = Math.floor(minutes / 60) % 24;
  if (h < 0) h += 24;

  let m = Math.round(minutes % 60);
  if (m < 0) m += 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Helper to get Monday of the date's week as a string identifier
export function getMonday(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  // If Sunday (0), Monday was 6 days ago. Otherwise, go back day-1 days.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export function getLocaleDateString(date: string | null): string {
  if (!date) return "";
  const event = new Date(date);
  const options = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  } as Intl.DateTimeFormatOptions;

  return event.toLocaleDateString("id-ID", options);
}
