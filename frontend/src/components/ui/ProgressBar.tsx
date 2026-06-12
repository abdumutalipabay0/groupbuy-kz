import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const width = Math.min(Math.max(value, 0), 100);
  return (
    <div className={cn("h-2.5 overflow-hidden rounded-full bg-stone-100", className)}>
      <div
        className="relative h-full overflow-hidden rounded-full bg-fire-gradient transition-all duration-700 ease-out"
        style={{ width: `${width}%` }}
      >
        <div className="progress-shine" />
      </div>
    </div>
  );
}
