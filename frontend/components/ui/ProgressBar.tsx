import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const width = Math.min(Math.max(value, 0), 100);
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-red-100", className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-coral to-primary transition-all duration-500" style={{ width: `${width}%` }} />
    </div>
  );
}
