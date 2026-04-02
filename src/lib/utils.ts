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
