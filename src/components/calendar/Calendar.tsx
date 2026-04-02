import { useCallback } from "react";
import CalendarHeader from "./CalendarHeader";
import MonthGrid from "./MonthGrid";
import useTimesheet from "@/store/timesheet";

export default function Calendar() {
  const { currentDate, setCurrentDate } = useTimesheet();

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }, [currentDate, setCurrentDate]);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }, [currentDate, setCurrentDate]);

  const handleToday = useCallback(() => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }, [setCurrentDate]);

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />
      <MonthGrid currentDate={currentDate} />
    </div>
  );
}
