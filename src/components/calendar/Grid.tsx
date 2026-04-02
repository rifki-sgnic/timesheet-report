const hours = Array.from({ length: 24 });

export default function Grid() {
  return (
    <div className="grid grid-cols-7 relative">
      {Array.from({ length: 7 }).map((_, dayIndex) => (
        <div key={dayIndex} className="border-1 relative">
          {hours.map((_, h) => (
            <div key={h} className="h-[60px] border-b" />
          ))}
        </div>
      ))}
    </div>
  );
}
