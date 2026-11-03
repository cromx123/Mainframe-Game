import type { ReactNode } from 'react';

interface ModalShellProps {
  label: string;
  border: string;
  width?: string;
  children: ReactNode;
}

export function ModalShell({ label, border, width = 'max-w-md', children }: ModalShellProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
    >
      <div className={`bg-panel border-2 ${border} rounded ${width} w-full p-5 space-y-4 text-xs`}>
        {children}
      </div>
    </div>
  );
}
