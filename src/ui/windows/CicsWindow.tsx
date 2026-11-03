import Decimal from 'break_eternity.js';
import { buySubsystem } from '../../core/actions';
import { SUBSYSTEMS } from '../../core/content';
import { cost } from '../../core/costs';
import { formatNumber } from '../../core/format';
import { useGameStore } from '../../store/gameStore';
import { INSET, usePhosphor } from '../theme';
import { WindowFrame } from './WindowFrame';

export function CicsWindow() {
  const t = usePhosphor('cics');
  const apply = useGameStore((s) => s.apply);
  const mips = useGameStore((s) => s.game.run.mips);
  const levels = useGameStore((s) => s.game.run.subsystems);
  const multiplier = useGameStore((s) => s.stats.multiplier);
  const subsystemMips = useGameStore((s) => s.stats.subsystemMips);

  return (
    <WindowFrame id="cics">
      <div className="p-2.5 bg-taskbar border-b border-slate-800 flex justify-between items-center gap-2 text-xs">
        <span className="text-slate-400">
          Online Transaction Processing (No JES2 Initiator slot required)
        </span>
        <span className={`font-bold shrink-0 ${t.text}`}>
          +{formatNumber(subsystemMips)} MIPS/s
        </span>
      </div>

      <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
        {SUBSYSTEMS.map((sub) => {
          const level = levels[sub.id];
          const regionCost = cost.subsystem(sub, level);
          return (
            <div
              key={sub.id}
              className={`${INSET} p-2.5 flex items-center justify-between gap-2 text-xs`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-bold text-sm ${t.text}`}>{sub.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                    {sub.type}
                  </span>
                  <span className="text-[11px] text-slate-400">Region Lv.{level}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{sub.desc}</div>
                <div className="text-[11px] text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                  <span>
                    Output:{' '}
                    <strong className="text-term-green">
                      +{formatNumber(new Decimal(sub.baseMips).mul(level).mul(multiplier))} MIPS/s
                    </strong>
                  </span>
                  <span>
                    Throughput:{' '}
                    <strong className="text-term-cyan">
                      {formatNumber(level * sub.txPerLevel, 0)} TX/s
                    </strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => apply((game) => buySubsystem(game, sub.id))}
                disabled={mips.lt(regionCost)}
                className={`px-3 py-2 rounded text-xs font-bold border shrink-0 ${t.button} disabled:opacity-40`}
              >
                <div>{level === 0 ? 'Start Region' : 'Scale Region'}</div>
                <div className="text-[10px] opacity-80">{formatNumber(regionCost)} MIPS</div>
              </button>
            </div>
          );
        })}
      </div>
    </WindowFrame>
  );
}
