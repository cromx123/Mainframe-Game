import Decimal from 'break_eternity.js';
import { buyInitiator, buyJob, buyZiip, setActiveInitiators } from '../../core/actions';
import { BALANCE } from '../../core/balance';
import { JOBS } from '../../core/content';
import { cost } from '../../core/costs';
import { formatNumber } from '../../core/format';
import { useGameStore } from '../../store/gameStore';
import { INSET, usePhosphor } from '../theme';
import { WindowFrame } from './WindowFrame';

const STEP_BUTTON =
  'px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold';

export function SdsfWindow() {
  const t = usePhosphor('sdsf');
  const apply = useGameStore((s) => s.apply);
  const mips = useGameStore((s) => s.game.run.mips);
  const owned = useGameStore((s) => s.game.run.initiatorsOwned);
  const active = useGameStore((s) => s.game.run.initiatorsActive);
  const levels = useGameStore((s) => s.game.run.jobs);
  const ziipEngines = useGameStore((s) => s.game.meta.ziipEngines);
  const slots = useGameStore((s) => s.stats.slots);
  const runningJobs = useGameStore((s) => s.stats.runningJobs);
  const multiplier = useGameStore((s) => s.stats.multiplier);

  const initiatorCost = cost.initiator(owned);
  const ziipCost = cost.ziip(ziipEngines);

  return (
    <WindowFrame id="sdsf">
      <div className="p-2.5 bg-taskbar border-b border-slate-800 grid grid-cols-2 gap-2 text-xs">
        <div className={`${INSET} p-2 flex flex-col justify-between`}>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-300 font-bold">JES2 INITIATORS</span>
            <span className="text-[10px] text-term-amber">
              {BALANCE.cpu.initiatorUpkeep}% CPU each
            </span>
          </div>
          <div className="flex items-center gap-1 my-1.5">
            <button
              onClick={() => apply((game) => setActiveInitiators(game, active - 1))}
              aria-label="Stop one initiator"
              className={STEP_BUTTON}
            >
              -
            </button>
            <span className={`px-2 font-bold ${t.text}`}>
              {active} / {owned} ACTIVE
            </span>
            <button
              onClick={() => apply((game) => setActiveInitiators(game, active + 1))}
              aria-label="Start one initiator"
              className={STEP_BUTTON}
            >
              +
            </button>
          </div>
          <button
            onClick={() => apply(buyInitiator)}
            disabled={mips.lt(initiatorCost)}
            className={`w-full py-1 rounded text-[11px] font-bold border ${t.button} disabled:opacity-40`}
          >
            +1 Initiator ({formatNumber(initiatorCost)} MIPS)
          </button>
        </div>

        <div className="bg-panel-inset border border-term-cyan/30 p-2 rounded flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-term-cyan font-bold">zIIP ENGINES</span>
            <span className="text-[10px] bg-term-green/20 text-term-green px-1 rounded">
              0% CPU UPKEEP!
            </span>
          </div>
          <div className="my-1.5 text-xs text-slate-300">
            Active zIIPs: <strong className="text-term-cyan">{ziipEngines}</strong> (Total Slots:{' '}
            {slots})
          </div>
          <button
            onClick={() => apply(buyZiip)}
            disabled={mips.lt(ziipCost)}
            className="w-full py-1 rounded text-[11px] font-bold border border-term-cyan/60 text-term-cyan hover:bg-term-cyan/20 disabled:opacity-40"
          >
            Buy zIIP ({formatNumber(ziipCost)} MIPS)
          </button>
        </div>
      </div>

      <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
        <div className="grid grid-cols-12 text-[10px] text-slate-400 border-b border-slate-800 pb-1 px-1 font-bold">
          <div className="col-span-3">JOBNAME</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-3">OUTPUT</div>
          <div className="col-span-4 text-right">UPGRADE JCL</div>
        </div>

        {JOBS.map((job) => {
          const level = levels[job.id];
          const jobCost = cost.job(job, level);
          const running = runningJobs.has(job.id);
          const waiting = level > 0 && !running;
          return (
            <div
              key={job.id}
              className="bg-panel-inset border border-slate-800/90 rounded p-2 grid grid-cols-12 items-center gap-1 text-xs"
            >
              <div className="col-span-3">
                <div className={`font-bold ${t.text}`}>{job.jobName}</div>
                <div className="text-[10px] text-slate-500">
                  {job.stepName} (Lv.{level})
                </div>
              </div>

              <div className="col-span-2">
                {level === 0 ? (
                  <span className="text-[10px] text-slate-600">INACTIVE</span>
                ) : running ? (
                  <span className="text-[10px] px-1.5 py-0.5 bg-term-green/20 text-term-green rounded font-bold">
                    EXEC
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 bg-term-amber/20 text-term-amber rounded font-bold">
                    WAIT INIT
                  </span>
                )}
              </div>

              <div className="col-span-3">
                <div className="text-slate-200 font-bold">
                  +{formatNumber(new Decimal(job.baseMips).mul(level).mul(multiplier))}/s
                </div>
                <div className="text-[10px] text-slate-500">
                  Base: {formatNumber(job.baseMips)}/lv
                </div>
              </div>

              <div className="col-span-4 text-right">
                <button
                  onClick={() => apply((game) => buyJob(game, job.id))}
                  disabled={mips.lt(jobCost)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border ${t.button} disabled:opacity-40`}
                >
                  {level === 0 ? 'Compile' : 'Upgrade'} ({formatNumber(jobCost)})
                </button>
              </div>

              {waiting && (
                <div className="col-span-12 text-[10px] text-term-amber mt-1">
                  * Waiting for free JES2 Initiator or zIIP slot to execute!
                </div>
              )}
            </div>
          );
        })}
      </div>
    </WindowFrame>
  );
}
