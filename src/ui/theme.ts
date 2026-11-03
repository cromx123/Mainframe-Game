import type { Theme, WindowId } from '../core/content';
import { useGameStore } from '../store/gameStore';

export interface Phosphor {
  text: string;
  border: string;
  button: string;
  badge: string;
  color: string;
}

// Full class names must appear literally so Tailwind can generate them.
export const PHOSPHOR: Record<Theme, Phosphor> = {
  green: {
    text: 'text-term-green',
    border: 'border-term-green/30',
    button: 'border-term-green/50 text-term-green hover:bg-term-green/20',
    badge: 'bg-term-green/20 text-term-green',
    color: 'var(--color-term-green)',
  },
  cyan: {
    text: 'text-term-cyan',
    border: 'border-term-cyan/30',
    button: 'border-term-cyan/50 text-term-cyan hover:bg-term-cyan/20',
    badge: 'bg-term-cyan/20 text-term-cyan',
    color: 'var(--color-term-cyan)',
  },
  amber: {
    text: 'text-term-amber',
    border: 'border-term-amber/30',
    button: 'border-term-amber/50 text-term-amber hover:bg-term-amber/20',
    badge: 'bg-term-amber/20 text-term-amber',
    color: 'var(--color-term-amber)',
  },
};

export function usePhosphor(id: WindowId): Phosphor {
  return PHOSPHOR[useGameStore((s) => s.settings.themes[id])];
}

export const INSET = 'bg-panel-inset border border-slate-800 rounded';

export function levelColor(percent: number, warnAt: number, dangerAt: number) {
  if (percent >= dangerAt) return { text: 'text-term-red', bar: 'bg-term-red' };
  if (percent >= warnAt) return { text: 'text-term-amber', bar: 'bg-term-amber' };
  return { text: 'text-term-green', bar: 'bg-term-green' };
}
