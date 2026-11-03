import Decimal from 'break_eternity.js';
import { RefreshCw } from 'lucide-react';
import { BALANCE } from '../../core/balance';
import { formatNumber } from '../../core/format';
import { useGameStore } from '../../store/gameStore';
import { INSET, usePhosphor } from '../theme';
import { WindowFrame } from './WindowFrame';

function Histogram({ samples, color }: { samples: readonly Decimal[]; color: string }) {
  const max = samples.reduce((acc, value) => Decimal.max(acc, value), new Decimal(10));
  return (
    <div className="h-20 flex items-end gap-1 pt-2 px-1 bg-black/50 rounded border border-slate-900">
      {samples.map((value, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all duration-300"
          style={{
            height: `${Math.max(6, Math.round(value.div(max).toNumber() * 100))}%`,
            backgroundColor: color,
            opacity: 0.35 + (i / samples.length) * 0.65,
          }}
        />
      ))}
    </div>
  );
}

export function SysviewWindow() {
  const t = usePhosphor('sysview');
  const history = useGameStore((s) => s.history);
  const mipsPerSecond = useGameStore((s) => s.stats.mipsPerSecond);
  const thrashing = useGameStore((s) => s.stats.thrashing);
  const pendingTokens = useGameStore((s) => s.stats.pendingTokens);
  const nextHardware = useGameStore((s) => s.stats.nextHardware);
  const upgradeReady = useGameStore((s) => s.stats.hardwareUpgradeReady);
  const earned = useGameStore((s) => s.game.run.earned);
  const setConfirm = useGameStore((s) => s.setConfirm);

  const canIpl = pendingTokens.gt(0);
  const tokenBonus = BALANCE.multiplier.perToken * 100;

  return (
    <WindowFrame id="sysview">
      <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
        <div className={`${INSET} p-2.5`}>
          <div className="flex justify-between items-center text-[11px] mb-2">
            <span className="font-bold text-slate-300">
              SYSVIEW REAL-TIME MIPS/SEC ({history.length}s)
            </span>
            <span className={t.text}>{formatNumber(mipsPerSecond)} MIPS/s</span>
          </div>
          <Histogram samples={history} color={thrashing ? 'var(--color-term-red)' : t.color} />
        </div>

        <div className="bg-panel-inset border-2 border-term-amber/50 p-3 rounded space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-extrabold text-sm text-term-amber flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" />
              SYSTEM IPL (HARDWARE PRESTIGE)
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-term-amber/20 text-term-amber rounded font-bold shrink-0">
              This run: {formatNumber(earned)} MIPS
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Executing an <strong>Initial Program Load (IPL)</strong> resets current MIPS, JCL
            levels, and CICS regions, but upgrades your Mainframe generation, grants permanent{' '}
            <strong>Architecture Tokens (+{tokenBonus}% MIPS each)</strong>, and installs{' '}
            <strong>+1 Permanent zIIP Engine</strong>!
          </p>

          <div className="bg-black/60 border border-slate-800 p-2 rounded space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Architecture Tokens on IPL:</span>
              <span className="text-term-cyan font-bold">
                +{formatNumber(pendingTokens, 0)} Tokens
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Permanent zIIP Bonus:</span>
              <span className="text-term-green font-bold">+1 Free zIIP Engine</span>
            </div>
            {nextHardware && (
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Next Hardware Frame ({nextHardware.name}):</span>
                <span className={upgradeReady ? 'text-term-green font-bold' : 'text-slate-500'}>
                  {upgradeReady
                    ? `READY! (x${nextHardware.mult} Mult)`
                    : `Requires ${formatNumber(nextHardware.reqRunMips)} MIPS this run`}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setConfirm('ipl')}
            disabled={!canIpl}
            className="w-full py-2 rounded font-extrabold text-xs bg-term-amber hover:brightness-110 text-black disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg"
          >
            {canIpl
              ? `EXECUTE SYSTEM IPL (+${formatNumber(pendingTokens, 0)} TOKENS & +1 zIIP)`
              : `EARN ${formatNumber(BALANCE.ipl.minRunMips, 0)} MIPS THIS RUN TO UNLOCK IPL`}
          </button>
        </div>
      </div>
    </WindowFrame>
  );
}
