interface MeterProps {
  percent: number;
  barClass: string;
  className?: string;
}

export function Meter({ percent, barClass, className = 'h-2.5' }: MeterProps) {
  return (
    <div
      className={`w-full bg-slate-900 rounded-sm overflow-hidden border border-slate-700 ${className}`}
    >
      <div
        className={`h-full transition-all duration-200 ${barClass}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
