import { getDaysInMonth, getFirstDayOfMonth } from "./utils";

export interface DayCell {
  date: number;
  month: number; // 0-indexed
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateString: string; // YYYY-MM-DD
}

export function buildCalendarGrid(currentDate: Date): DayCell[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Previous month fill
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  const cells: DayCell[] = [];

  const formatDateString = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  // Fill in previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    cells.push({
      date: d,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday: false,
      dateString: formatDateString(prevYear, prevMonth, d),
    });
  }

  // Fill in current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    cells.push({
      date: d,
      month,
      year,
      isCurrentMonth: true,
      isToday,
      dateString: formatDateString(year, month, d),
    });
  }

  // Calculate how many rows are needed (4, 5, or 6)
  const totalRows = Math.ceil(cells.length / 7);
  const totalCells = totalRows * 7;

  // Fill remaining cells to complete the last row
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const remaining = totalCells - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      date: d,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isToday: false,
      dateString: formatDateString(nextYear, nextMonth, d),
    });
  }

  return cells;
}
