import { buyPaper, buyRexx } from '../../core/actions';
import { BALANCE } from '../../core/balance';
import { cost } from '../../core/costs';
import { formatNumber } from '../../core/format';
import type { PrinterState } from '../../core/state';
import { useGameStore } from '../../store/gameStore';
import { Meter } from '../Meter';
import { INSET, levelColor, usePhosphor } from '../theme';
import { WindowFrame } from './WindowFrame';

const { multiplier: M, costs: C } = BALANCE;

const STATUS_BOX: Record<PrinterState, string> = {
  IDLE: 'bg-panel-inset border-slate-800',
  CANCELLED: 'bg-panel-inset border-slate-800',
  PRINTING: 'bg-term-green/10 border-term-green',
  JAMMED: 'bg-term-red/15 border-term-red',
};

const STATUS_BADGE: Record<PrinterState, string> = {
  IDLE: 'bg-slate-800 text-slate-300',
  CANCELLED: 'bg-slate-800 text-slate-300',
  PRINTING: 'bg-term-green text-black',
  JAMMED: 'bg-term-red text-black animate-pulse',
};

function PrinterStatus({ printer, jamChancePct }: { printer: PrinterState; jamChancePct: number }) {
  switch (printer) {
    case 'IDLE':
      return (
        <p className="text-[11px] text-slate-400 mt-2">
          Printer PR1 is IDLE. Start high-volume batch printing with{' '}
          <strong className="text-white">S PR1</strong> for a massive{' '}
          <strong className="text-term-green">x{M.printing} MIPS/s</strong> boost!
        </p>
      );
    case 'PRINTING':
      return (
        <div className="mt-2 space-y-1">
          <div className="text-term-green font-bold">
            HIGH-SPEED SYSOUT STREAMING: x{M.printing} GLOBAL MIPS!
          </div>
          <div className="text-[11px] text-slate-400">
            Paper Jam Risk:{' '}
            <strong className="text-term-amber">{jamChancePct.toFixed(1)}%/sec</strong>
          </div>
        </div>
      );
    case 'JAMMED':
      return (
        <div className="mt-2 space-y-1.5">
          <div className="text-term-red font-bold">
            *HASP190 PR1 INTERVENTION REQUIRED - PAPER JAM (-{Math.round((1 - M.jammed) * 100)}%
            MIPS)
          </div>
          <div className="text-[11px] text-slate-200 bg-black/60 p-2 rounded border border-term-red/50">
            <div>RECOVERY PROCEDURE:</div>
            <div className="text-term-yellow">
              1. Execute &quot;C PR1&quot; to cancel &amp; drain printer
            </div>
            <div className="text-slate-400">2. Execute &quot;S PR1&quot; to restart initiator</div>
          </div>
        </div>
      );
    case 'CANCELLED':
      return (
        <div className="mt-2 space-y-1">
          <div className="text-term-yellow font-bold">
            $HASP000 PR1 DRAINED &amp; CLEAR OF PAPER JAM.
          </div>
          <div className="text-[11px] text-slate-300">
            Step 1 complete! Now execute <strong className="text-term-green">S PR1</strong> to
            resume x{M.printing} MIPS!
          </div>
        </div>
      );
  }
}

export function Jes2Window() {
  const t = usePhosphor('jes2');
  const apply = useGameStore((s) => s.apply);
  const command = useGameStore((s) => s.command);
  const mips = useGameStore((s) => s.game.run.mips);
  const printer = useGameStore((s) => s.game.run.printer);
  const spool = useGameStore((s) => s.game.run.spool);
  const purgeCooldown = useGameStore((s) => s.game.run.purgeCooldown);
  const paperLevel = useGameStore((s) => s.game.meta.paperLevel);
  const rexxAutoOp = useGameStore((s) => s.game.meta.rexxAutoOp);
  const jamChancePct = useGameStore((s) => s.stats.jamChancePct);

  const paperCost = cost.paper(paperLevel);
  const paperMaxed = paperLevel >= C.paper.maxLevel;
  const rexxCost = cost.rexx();
  const spoolColor = levelColor(spool, 70, 90);

  return (
    <WindowFrame id="jes2" alert={printer === 'JAMMED'}>
      <div className="flex-1 p-3 flex flex-col justify-between overflow-y-auto space-y-2.5 text-xs">
        <div className={`p-3 rounded border-2 ${STATUS_BOX[printer]}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300">DEVICE: JES2 PRINTER PR1</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${STATUS_BADGE[printer]}`}
            >
              {printer}
            </span>
          </div>

          <PrinterStatus printer={printer} jamChancePct={jamChancePct} />

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => command('C PR1')}
              className={`py-1.5 px-2 rounded font-bold text-xs border ${
                printer === 'JAMMED'
                  ? 'bg-term-red text-black border-term-red animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              $C PR1 (Cancel)
            </button>
            <button
              onClick={() => command('S PR1')}
              className={`py-1.5 px-2 rounded font-bold text-xs border ${
                printer === 'CANCELLED' || printer === 'IDLE'
                  ? 'bg-term-green/20 border-term-green text-term-green hover:bg-term-green/30'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
            >
              $S PR1 (Start x{M.printing})
            </button>
          </div>
        </div>

        <div className={`${INSET} p-2.5`}>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300 font-bold">JES2 SPOOL UTILIZATION</span>
            <span className={spool >= 85 ? 'text-term-red font-bold' : t.text}>
              {spool.toFixed(1)}%
            </span>
          </div>
          <Meter percent={spool} barClass={spoolColor.bar} className="h-3" />
          <div className="flex justify-between items-center gap-2 mt-2">
            <span className="text-[10px] text-slate-400">
              At 100%, Abend x37 reduces MIPS by {Math.round((1 - M.spoolFull) * 100)}%.
            </span>
            <button
              onClick={() => command('$P')}
              disabled={purgeCooldown > 0}
              className={`px-2.5 py-1 rounded text-[11px] font-bold border shrink-0 ${t.button} disabled:opacity-40`}
            >
              {purgeCooldown > 0
                ? `$P Cooldown (${Math.ceil(purgeCooldown)}s)`
                : `Run $P (Purge + ${M.purge}x Buff)`}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className={`${INSET} flex items-center justify-between gap-2 p-2`}>
            <div>
              <div className="font-bold text-slate-200">
                Continuous Feed Laser Paper (Lv.{paperLevel}/{C.paper.maxLevel})
              </div>
              <div className="text-[10px] text-slate-400">
                Reduces PR1 Paper Jam probability ({jamChancePct.toFixed(1)}%/s)
              </div>
            </div>
            <button
              onClick={() => apply(buyPaper)}
              disabled={paperMaxed || mips.lt(paperCost)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold border shrink-0 ${t.button} disabled:opacity-40`}
            >
              {paperMaxed ? 'MAXED' : `${formatNumber(paperCost)} MIPS`}
            </button>
          </div>

          <div className={`${INSET} flex items-center justify-between gap-2 p-2`}>
            <div>
              <div className="font-bold text-term-cyan">NetView REXX Auto-Operator</div>
              <div className="text-[10px] text-slate-400">
                Automatically runs $C PR1 &amp; $S PR1 within seconds of a jam
              </div>
            </div>
            <button
              onClick={() => apply(buyRexx)}
              disabled={rexxAutoOp || mips.lt(rexxCost)}
              className="px-2.5 py-1 rounded text-[11px] font-bold border shrink-0 border-term-cyan/60 text-term-cyan hover:bg-term-cyan/20 disabled:opacity-40"
            >
              {rexxAutoOp ? 'ACTIVE' : `${formatNumber(rexxCost)} MIPS`}
            </button>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
