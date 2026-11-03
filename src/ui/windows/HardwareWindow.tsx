import { buyCooling, buyDasd, buyRam } from '../../core/actions';
import { BALANCE } from '../../core/balance';
import { cost } from '../../core/costs';
import { formatNumber } from '../../core/format';
import { useGameStore } from '../../store/gameStore';
import { INSET, usePhosphor } from '../theme';
import { WindowFrame } from './WindowFrame';

const { ram: RAM, cpu: CPU, costs: C } = BALANCE;

export function HardwareWindow() {
  const t = usePhosphor('hardware');
  const apply = useGameStore((s) => s.apply);
  const mips = useGameStore((s) => s.game.run.mips);
  const ramLevel = useGameStore((s) => s.game.run.ramLevel);
  const coolingLevel = useGameStore((s) => s.game.run.coolingLevel);
  const ramTotal = useGameStore((s) => s.stats.ramTotal);
  const ramUsed = useGameStore((s) => s.stats.ramUsed);
  const dasd = useGameStore((s) => s.stats.dasd);
  const nextDasd = useGameStore((s) => s.stats.nextDasd);

  const ramCost = cost.ram(ramLevel);
  const coolingCost = cost.cooling(coolingLevel);
  const coolingMaxed = coolingLevel >= C.cooling.maxLevel;

  return (
    <WindowFrame id="hardware">
      <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
        <div className={`${INSET} p-3 flex items-center justify-between gap-2`}>
          <div>
            <div className={`font-bold text-sm ${t.text}`}>
              Central Storage Drawer (+{RAM.gbPerUpgrade} GB RAM)
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Current Capacity: <strong className="text-white">{ramTotal} GB</strong> (Used:{' '}
              {ramUsed} GB)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Required to keep all 6 management sessions and CICS regions open simultaneously.
            </div>
          </div>
          <button
            onClick={() => apply(buyRam)}
            disabled={mips.lt(ramCost)}
            className={`px-3 py-2 rounded font-bold border shrink-0 ${t.button} disabled:opacity-40`}
          >
            +{RAM.gbPerUpgrade} GB ({formatNumber(ramCost)} MIPS)
          </button>
        </div>

        <div className={`${INSET} p-3 flex items-center justify-between gap-2`}>
          <div>
            <div className="font-bold text-sm text-term-green">
              WLM Sub-Capacity Tuning (Lv.{coolingLevel}/{C.cooling.maxLevel})
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Reduces Main CPU % upkeep of all Windows &amp; Initiators by{' '}
              <strong className="text-term-green">
                -{CPU.coolingReductionPerLevel * 100}% per level
              </strong>
              .
            </div>
          </div>
          <button
            onClick={() => apply(buyCooling)}
            disabled={coolingMaxed || mips.lt(coolingCost)}
            className={`px-3 py-2 rounded font-bold border shrink-0 ${t.button} disabled:opacity-40`}
          >
            {coolingMaxed ? 'MAXED' : `${formatNumber(coolingCost)} MIPS`}
          </button>
        </div>

        <div className={`${INSET} p-3 space-y-2`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-bold text-sm text-term-amber">
                DASD Volume Array: {dasd.name}
              </div>
              <div className="text-[11px] text-slate-400">
                Cylinders: <strong className="text-white">{dasd.cylinders.toLocaleString()}</strong>{' '}
                | Max Offline Storage:{' '}
                <strong className="text-term-cyan">
                  {(dasd.maxOfflineSec / 3600).toFixed(1)} Hours
                </strong>
              </div>
            </div>
            {nextDasd ? (
              <button
                onClick={() => apply(buyDasd)}
                disabled={mips.lt(nextDasd.cost)}
                className="px-3 py-2 rounded font-bold border shrink-0 border-term-amber/60 text-term-amber hover:bg-term-amber/20 disabled:opacity-40"
              >
                Upgrade {nextDasd.name} ({formatNumber(nextDasd.cost)})
              </button>
            ) : (
              <span className="px-2 py-1 bg-term-green/20 text-term-green rounded font-bold">
                MAX {dasd.name.replace('3390 ', '').toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">
            Larger DASD 3390 volumes slow down JES2 Spool filling and prevent Abend x37 during long
            offline sessions.
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
