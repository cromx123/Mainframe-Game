import { Eye, EyeOff, Lock, Monitor } from 'lucide-react';
import { toggleWindow, unlockWindow } from '../../core/actions';
import { WINDOWS } from '../../core/content';
import { formatNumber } from '../../core/format';
import { useGameStore } from '../../store/gameStore';

export function Taskbar() {
  const apply = useGameStore((s) => s.apply);
  const mips = useGameStore((s) => s.game.run.mips);
  const unlocked = useGameStore((s) => s.game.meta.unlockedWindows);
  const open = useGameStore((s) => s.game.run.openWindows);

  return (
    <nav aria-label="3270 session manager" className="bg-taskbar border-b border-edge px-3 py-2">
      <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Monitor className="w-4 h-4 text-term-cyan" />
          <span className="font-bold text-slate-200">VTAM 3270 SESSION MANAGER:</span>
          <span className="hidden md:inline text-[11px] text-slate-400">
            (Each open session consumes ASID CPU% &amp; RAM. Close windows to free CPU for Batch
            Initiators!)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {WINDOWS.map((win) => {
            if (!unlocked[win.id]) {
              const canAfford = mips.gte(win.unlockCost);
              return (
                <button
                  key={win.id}
                  onClick={() => apply((game) => unlockWindow(game, win.id))}
                  disabled={!canAfford}
                  className={`px-2.5 py-1 rounded text-xs font-bold border flex items-center gap-1.5 transition ${
                    canAfford
                      ? 'bg-term-amber/15 border-term-amber text-term-amber hover:bg-term-amber/25 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>UNLOCK {win.shortTitle}</span>
                  <span className="text-[10px] px-1 bg-black/50 rounded">
                    {formatNumber(win.unlockCost)} MIPS
                  </span>
                </button>
              );
            }

            const isOpen = open[win.id];
            return (
              <button
                key={win.id}
                onClick={() => apply((game) => toggleWindow(game, win.id))}
                aria-pressed={isOpen}
                className={`px-2.5 py-1 rounded text-xs font-bold border flex items-center gap-1.5 transition ${
                  isOpen
                    ? 'bg-term-green/15 border-term-green text-term-green'
                    : 'bg-panel border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                {isOpen ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>
                  [{win.asid}] {win.shortTitle}
                </span>
                <span className="text-[10px] opacity-75 font-normal">
                  ({win.cpuUpkeep}% CPU | {win.ramUpkeep}G)
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
