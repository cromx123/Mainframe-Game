import { HardDrive } from 'lucide-react';
import { formatDuration, formatNumber } from '../../core/format';
import type { OfflineReport } from '../../core/simulation';
import { useGameStore } from '../../store/gameStore';
import { ModalShell } from './ModalShell';

export function OfflineReportModal({ report }: { report: OfflineReport }) {
  const dismiss = useGameStore((s) => s.dismissOfflineReport);

  return (
    <ModalShell label="Offline progress report" border="border-term-cyan">
      <div className="text-sm font-extrabold text-term-cyan flex items-center gap-2">
        <HardDrive className="w-5 h-5" />
        DASD OFFLINE BATCH SPOOL REPORT
      </div>
      <div className="space-y-1.5 text-slate-300">
        <div>
          Time Offline: <strong>{formatDuration(report.elapsedSec)}</strong>
        </div>
        <div>
          Active DASD Volume: <strong className="text-term-amber">{report.dasdName}</strong>
        </div>
        {report.abend ? (
          <div className="p-2 bg-term-red/20 border border-term-red text-term-red rounded font-bold">
            IEC030I ABEND B37-04: DASD Volume filled at {formatDuration(report.creditedSec)}!
            Upgrade to a larger 3390 Mod in the DASD window to store more offline progress.
          </div>
        ) : (
          <div className="text-term-green">
            All offline batch datasets fitted cleanly inside {report.dasdName}.
          </div>
        )}
        <div className="text-base font-extrabold text-term-green pt-1">
          Recovered: +{formatNumber(report.gained)} MIPS
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button
          autoFocus
          onClick={dismiss}
          className="px-4 py-1.5 rounded bg-term-cyan text-black font-extrabold hover:brightness-110"
        >
          ACKNOWLEDGE
        </button>
      </div>
    </ModalShell>
  );
}
