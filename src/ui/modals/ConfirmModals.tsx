import { RefreshCw, TriangleAlert } from 'lucide-react';
import { BALANCE } from '../../core/balance';
import { formatNumber } from '../../core/format';
import { useGameStore } from '../../store/gameStore';
import { ModalShell } from './ModalShell';

export function ConfirmIplModal() {
  const pendingTokens = useGameStore((s) => s.stats.pendingTokens);
  const upgradeReady = useGameStore((s) => s.stats.hardwareUpgradeReady);
  const nextHardware = useGameStore((s) => s.stats.nextHardware);
  const performIpl = useGameStore((s) => s.performIpl);
  const setConfirm = useGameStore((s) => s.setConfirm);
  const bonusPct = pendingTokens.mul(BALANCE.multiplier.perToken * 100);

  return (
    <ModalShell label="Confirm system IPL" border="border-term-amber">
      <div className="text-sm font-extrabold text-term-amber flex items-center gap-2">
        <RefreshCw className="w-5 h-5" />
        CONFIRM SYSTEM IPL (INITIAL PROGRAM LOAD)
      </div>
      <p className="text-slate-300 leading-relaxed">
        Are you sure you want to initiate a System IPL? Current MIPS, JCL levels, and CICS regions
        will reset in exchange for:
      </p>
      <ul className="bg-black/60 border border-slate-800 p-3 rounded space-y-1 text-term-green font-bold">
        <li>
          • +{formatNumber(pendingTokens, 0)} Permanent Architecture Tokens (+
          {formatNumber(bonusPct, 0)}% MIPS)
        </li>
        <li>• +1 Permanent zIIP Offload Processor (0% CPU Upkeep)</li>
        {upgradeReady && nextHardware && (
          <li className="text-term-cyan">
            • Hardware Upgrade to {nextHardware.name} (x{nextHardware.mult} Base Multiplier!)
          </li>
        )}
      </ul>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={() => setConfirm(null)}
          className="px-3 py-1.5 rounded border border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          CANCEL
        </button>
        <button
          onClick={performIpl}
          className="px-4 py-1.5 rounded bg-term-amber text-black font-extrabold hover:brightness-110"
        >
          EXECUTE IPL NOW
        </button>
      </div>
    </ModalShell>
  );
}

export function ConfirmResetModal() {
  const hardReset = useGameStore((s) => s.hardReset);
  const setConfirm = useGameStore((s) => s.setConfirm);

  return (
    <ModalShell label="Confirm hard reset" border="border-term-red" width="max-w-sm">
      <div className="text-sm font-extrabold text-term-red flex items-center gap-2">
        <TriangleAlert className="w-5 h-5" />
        WIPE ALL MAINFRAME SAVE DATA?
      </div>
      <p className="text-slate-300">
        This will permanently erase your save, including IPL prestige tokens and hardware
        generations.
      </p>
      <div className="flex justify-end gap-2">
        <button
          autoFocus
          onClick={() => setConfirm(null)}
          className="px-3 py-1.5 rounded border border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          CANCEL
        </button>
        <button
          onClick={hardReset}
          className="px-4 py-1.5 rounded bg-term-red text-black font-extrabold hover:brightness-110"
        >
          FORMAT SYSTEM (RESET)
        </button>
      </div>
    </ModalShell>
  );
}
