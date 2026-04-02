const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DayHeader() {
  return (
    <div className="grid grid-cols-7 border-b ml-16">
      {days.map((day) => (
        <div key={day} className="text-sm font-medium p-2 text-center border-l">
          {day}
        </div>
      ))}
    </div>
  );
}
