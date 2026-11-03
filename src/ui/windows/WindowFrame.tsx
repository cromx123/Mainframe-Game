import type { ReactNode } from 'react';
import { toggleWindow } from '../../core/actions';
import { WINDOW_BY_ID, type WindowId } from '../../core/content';
import { useGameStore } from '../../store/gameStore';
import { usePhosphor } from '../theme';

interface WindowFrameProps {
  id: WindowId;
  alert?: boolean;
  children: ReactNode;
}

export function WindowFrame({ id, alert = false, children }: WindowFrameProps) {
  const def = WINDOW_BY_ID[id];
  const t = usePhosphor(id);
  const cycleTheme = useGameStore((s) => s.cycleTheme);
  const apply = useGameStore((s) => s.apply);

  return (
    <section
      aria-label={def.title}
      className={`bg-panel border-2 ${alert ? 'border-term-red' : t.border} rounded flex flex-col h-[470px] shadow-2xl relative overflow-hidden`}
    >
      <div className="bg-panel-head border-b border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded shrink-0 ${t.badge}`}>
            ASID {def.asid}
          </span>
          <span className={`font-bold tracking-wide truncate ${t.text}`}>{def.title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {def.alwaysOpen && (
            <span className="text-[10px] text-slate-400">UPKEEP: {def.cpuUpkeep}% CPU</span>
          )}
          <button
            onClick={() => cycleTheme(id)}
            title="Switch 3270 phosphor color (green / cyan / amber)"
            className={`text-[10px] px-1.5 py-0.5 rounded border ${t.button}`}
          >
            COLOR
          </button>
          {!def.alwaysOpen && (
            <button
              onClick={() => apply((game) => toggleWindow(game, id))}
              title={`Close session to free ${def.cpuUpkeep}% CPU & ${def.ramUpkeep}GB RAM`}
              className="text-[10px] px-1.5 py-0.5 rounded bg-term-red/20 text-term-red border border-term-red/40 hover:bg-term-red/30"
            >
              CLOSE (-{def.cpuUpkeep}% CPU)
            </button>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
