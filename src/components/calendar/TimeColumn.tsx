const hours = Array.from({ length: 24 });

export default function TimeColumn() {
  return (
    <div className="w-16 border-r">
      {hours.map((_, i) => (
        <div
          key={i}
          className="h-[60px] text-xs text-right pr-2 text-muted-foreground"
        >
          {i}:00
        </div>
      ))}
    </div>
  );
}
