"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimeLeft {
  h: number;
  m: number;
  s: number;
  totalMs: number;
}

function calc(expiresAt: string): TimeLeft | null {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000),
    totalMs: diff,
  };
}

interface CountdownTimerProps {
  expiresAt: string;
  className?: string;
}

export function CountdownTimer({ expiresAt, className }: CountdownTimerProps) {
  const [time, setTime] = useState<TimeLeft | null>(() => calc(expiresAt));

  useEffect(() => {
    const id = setInterval(() => setTime(calc(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!time) {
    return <span className={cn("text-stone-400", className)}>истёк</span>;
  }

  const urgent = time.totalMs < 3_600_000;
  const critical = time.totalMs < 600_000;

  const display =
    time.h > 0
      ? `${time.h}ч ${String(time.m).padStart(2, "0")}:${String(time.s).padStart(2, "0")}`
      : `${String(time.m).padStart(2, "0")}:${String(time.s).padStart(2, "0")}`;

  return (
    <span
      className={cn(
        "tabular-nums transition-colors",
        critical ? "animate-pulse text-red-600" : urgent ? "text-orange-600" : "",
        className
      )}
    >
      {display}
    </span>
  );
}
