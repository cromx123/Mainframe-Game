import {
  Activity,
  FastForward,
  Sparkles,
  Terminal,
  Trash2,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { BALANCE } from '../../core/balance';
import { formatNumber } from '../../core/format';
import { useGameStore } from '../../store/gameStore';
import { Meter } from '../Meter';
import { levelColor } from '../theme';

const LEDS = [0, 1, 2, 3, 4, 5];
const CPU_WARN_PCT = 85;
const { multiplier: M } = BALANCE;

const CONTROL_BUTTON =
  'px-2 py-1.5 text-[11px] bg-control hover:bg-control-hover border rounded flex items-center gap-1 transition';

function HardwareBadge() {
  const hardware = useGameStore((s) => s.stats.hardware);
  const thrashing = useGameStore((s) => s.stats.thrashing);
  const mipsPerSecond = useGameStore((s) => s.stats.mipsPerSecond);
  const iplCount = useGameStore((s) => s.game.meta.iplCount);
  const tokens = useGameStore((s) => s.game.meta.archTokens);
  const ledMs = Math.max(120, 1200 - Math.min(1050, mipsPerSecond.add(1).log10().toNumber() * 220));

  return (
    <div className="flex items-center gap-3 bg-crt border border-edge px-3 py-1.5 rounded">
      <div
        aria-hidden
        className="relative w-9 h-11 bg-rack border border-rack-edge rounded-sm flex flex-col justify-between p-1"
      >
        <div className="text-[7px] text-term-cyan font-bold tracking-tighter leading-none text-center border-b border-rack-edge pb-0.5">
          {hardware.short}
        </div>
        <div className="grid grid-cols-3 gap-0.5 my-auto">
          {LEDS.map((led) => (
            <span
              key={led}
              className={`w-1.5 h-1.5 rounded-full ${
                thrashing ? 'bg-term-red' : led % 2 === 0 ? 'bg-term-green' : 'bg-term-cyan'
              }`}
              style={{ animation: `led-blink ${ledMs + led * 70}ms infinite alternate` }}
            />
          ))}
        </div>
        <div className="h-1 bg-term-cyan/40 rounded-full w-full" />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider text-white">{hardware.name}</span>
          <span className="text-[10px] px-1.5 bg-term-cyan/20 text-term-cyan border border-term-cyan/40 rounded">
            x{hardware.mult} HW MULT
          </span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
          <span>
            LPAR: <strong className="text-term-green">ZOS1</strong>
          </span>
          <span>
            IPLs: <strong className="text-term-amber">{iplCount}</strong>
          </span>
          <span>
            TOKENS: <strong className="text-term-cyan">{formatNumber(tokens, 0)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

function MipsGauge() {
  const mips = useGameStore((s) => s.game.run.mips);
  const mipsPerSecond = useGameStore((s) => s.stats.mipsPerSecond);
  return (
    <div className="bg-crt border border-term-green/40 px-3.5 py-1.5 rounded min-w-[175px]">
      <div className="text-[10px] text-slate-400 flex justify-between gap-2">
        <span>TOTAL MIPS CAPACITY</span>
        <span className="text-term-green font-bold">+{formatNumber(mipsPerSecond)}/s</span>
      </div>
      <div className="text-lg font-extrabold text-term-green tracking-tight">
        {formatNumber(mips)} <span className="text-xs font-normal text-term-green/70">MIPS</span>
      </div>
    </div>
  );
}

const CPU_TONES = {
  thrashing: {
    box: 'border-term-red bg-term-red/10 animate-pulse',
    text: 'text-term-red',
    bar: 'bg-term-red',
  },
  high: { box: 'border-term-amber/60', text: 'text-term-amber', bar: 'bg-term-amber' },
  normal: { box: 'border-edge', text: 'text-term-cyan', bar: 'bg-term-cyan' },
};

function CpuGauge() {
  const cpu = useGameStore((s) => s.stats.cpu);
  const thrashing = useGameStore((s) => s.stats.thrashing);
  const tone = CPU_TONES[thrashing ? 'thrashing' : cpu.total >= CPU_WARN_PCT ? 'high' : 'normal'];

  return (
    <div
      className={`bg-crt border px-3 py-1.5 rounded min-w-[185px] transition-colors ${tone.box}`}
    >
      <div className="text-[10px] flex justify-between items-center gap-2">
        <span className="text-slate-400">MAIN CPU LOAD</span>
        <span className={`font-bold ${tone.text}`}>
          {cpu.total}% {thrashing && '(!THRASHING!)'}
        </span>
      </div>
      <Meter percent={cpu.total} barClass={tone.bar} className="h-2.5 mt-1" />
      <div className="text-[9px] text-slate-400 mt-0.5 flex justify-between gap-2">
        <span>ASIDs: {cpu.windows}%</span>
        <span>INITs: {cpu.initiators}%</span>
        <span>SUB: {cpu.subsystems}%</span>
      </div>
    </div>
  );
}

function SlotsGauge() {
  const slots = useGameStore((s) => s.stats.slots);
  const slotsUsed = useGameStore((s) => s.stats.slotsUsed);
  const owned = useGameStore((s) => s.game.run.initiatorsOwned);
  const active = useGameStore((s) => s.game.run.initiatorsActive);
  const ziipEngines = useGameStore((s) => s.game.meta.ziipEngines);

  return (
    <div className="bg-crt border border-edge px-3 py-1.5 rounded min-w-[145px]">
      <div className="text-[10px] text-slate-400 flex justify-between gap-2">
        <span>JES2 + zIIP SLOTS</span>
        <span className="text-term-amber font-bold">
          {slotsUsed}/{slots}
        </span>
      </div>
      <div className="text-xs font-bold mt-0.5 flex items-center justify-between gap-2">
        <span className="text-term-green">
          INIT: {active}/{owned}
        </span>
        <span className="text-term-cyan bg-term-cyan/10 px-1.5 py-0.5 rounded border border-term-cyan/30">
          zIIP: {ziipEngines}
        </span>
      </div>
    </div>
  );
}

function StorageGauge() {
  const ramUsed = useGameStore((s) => s.stats.ramUsed);
  const ramTotal = useGameStore((s) => s.stats.ramTotal);
  const dasdName = useGameStore((s) => s.stats.dasd.name);
  const spool = useGameStore((s) => s.game.run.spool);
  const spoolTone = levelColor(spool, 70, 90).text;

  return (
    <div className="bg-crt border border-edge px-3 py-1.5 rounded min-w-[165px]">
      <div className="text-[10px] flex justify-between gap-2">
        <span className="text-slate-400">REAL STORAGE (RAM)</span>
        <span className={ramUsed >= ramTotal ? 'text-term-red font-bold' : 'text-term-cyan'}>
          {ramUsed} / {ramTotal} GB
        </span>
      </div>
      <div className="text-[10px] flex justify-between gap-2 mt-1">
        <span className="text-slate-400">JES2 SPOOL ({dasdName})</span>
        <span className={`${spoolTone} ${spool >= 90 ? 'font-bold animate-pulse' : ''}`}>
          {spool.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function Utilities() {
  const scanlines = useGameStore((s) => s.settings.scanlines);
  const simulateOffline = useGameStore((s) => s.simulateOffline);
  const setBootVisible = useGameStore((s) => s.setBootVisible);
  const toggleScanlines = useGameStore((s) => s.toggleScanlines);
  const setConfirm = useGameStore((s) => s.setConfirm);

  return (
    <div className="flex items-center gap-1.5">
      {import.meta.env.DEV && (
        <button
          onClick={() => simulateOffline(3600)}
          title="DEV ONLY: simulate 1 hour offline (tests DASD capacity)"
          className={`${CONTROL_BUTTON} text-term-cyan border-term-cyan/40`}
        >
          <FastForward className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Offline +1h</span>
        </button>
      )}
      <button
        onClick={() => setBootVisible(true)}
        title="Replay 3270 TSO logon sequence"
        className={`${CONTROL_BUTTON} text-term-green border-term-green/40`}
      >
        <Terminal className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">TSO Logon</span>
      </button>
      <button
        onClick={toggleScanlines}
        aria-pressed={scanlines}
        title="Toggle CRT scanlines"
        className={`px-2 py-1.5 text-[11px] border rounded transition ${
          scanlines
            ? 'bg-term-green/15 border-term-green/50 text-term-green'
            : 'bg-control border-slate-700 text-slate-400'
        }`}
      >
        CRT
      </button>
      <button
        onClick={() => setConfirm('reset')}
        title="Hard reset save data"
        aria-label="Hard reset save data"
        className="p-1.5 text-[11px] bg-[#1a0f12] hover:bg-[#31151b] text-term-red border border-term-red/40 rounded transition"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const PILL = {
  danger: 'bg-term-red/20 border border-term-red text-term-red font-bold animate-pulse',
  caution: 'bg-term-amber/20 border border-term-amber text-term-amber font-bold',
  good: 'bg-term-green/15 border border-term-green/50 text-term-green',
  boost: 'bg-term-cyan/15 border border-term-cyan/50 text-term-cyan',
  info: 'bg-term-amber/15 border border-term-amber/50 text-term-amber',
};

function Pill({
  tone,
  icon,
  children,
}: {
  tone: keyof typeof PILL;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`${PILL[tone]} px-2.5 py-0.5 rounded flex items-center gap-1.5`}>
      {icon}
      {children}
    </div>
  );
}

const pct = (factor: number) => Math.round(Math.abs(factor - 1) * 100);

function AlertsBanner() {
  const thrashing = useGameStore((s) => s.stats.thrashing);
  const spoolFull = useGameStore((s) => s.stats.spoolFull);
  const printer = useGameStore((s) => s.game.run.printer);
  const purgeBuff = useGameStore((s) => s.game.run.purgeBuff);
  const telemetryBuff = useGameStore((s) => s.game.run.telemetryBuff);

  const alert = <TriangleAlert className="w-3.5 h-3.5" />;
  const anything =
    thrashing ||
    spoolFull ||
    printer === 'JAMMED' ||
    printer === 'PRINTING' ||
    purgeBuff > 0 ||
    telemetryBuff > 0;
  if (!anything) return null;

  return (
    <div
      role="status"
      className="max-w-[1800px] mx-auto mt-2 pt-1.5 border-t border-edge flex flex-wrap items-center gap-2 text-[11px]"
    >
      {thrashing && (
        <Pill tone="danger" icon={alert}>
          IRA100E SYSTEM THRASHING (&gt;100% CPU): -{pct(M.thrashing)}% MIPS! CLOSE WINDOWS OR RUN
          &quot;C U=ALL&quot;
        </Pill>
      )}
      {printer === 'JAMMED' && (
        <Pill tone="danger" icon={alert}>
          *HASP190 PR1 PAPER JAM (-{pct(M.jammed)}% MIPS): RUN &quot;C PR1&quot; THEN &quot;S
          PR1&quot; IN CONSOLE!
        </Pill>
      )}
      {spoolFull && (
        <Pill tone="caution" icon={alert}>
          $HASP050 JES2 SPOOL 100% FULL (ABEND x37 -{pct(M.spoolFull)}% MIPS): RUN &quot;$P&quot; TO
          PURGE SPOOL!
        </Pill>
      )}
      {printer === 'PRINTING' && (
        <Pill tone="good" icon={<Zap className="w-3 h-3" />}>
          PR1 HIGH-SPEED OUTPUT ACTIVE (x{M.printing} MIPS/s)
        </Pill>
      )}
      {purgeBuff > 0 && (
        <Pill tone="boost" icon={<Sparkles className="w-3 h-3" />}>
          $P SPOOL OVERCLOCK: +{pct(M.purge)}% MIPS ({Math.ceil(purgeBuff)}s)
        </Pill>
      )}
      {telemetryBuff > 0 && (
        <Pill tone="info" icon={<Activity className="w-3 h-3" />}>
          D A,L TELEMETRY BUFF: +{pct(M.telemetry)}% MIPS ({Math.ceil(telemetryBuff)}s)
        </Pill>
      )}
    </div>
  );
}

export function Header() {
  return (
    <header className="bg-chrome border-b border-edge px-3 py-2 sticky top-0 z-30 shadow-xl">
      <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-3">
        <HardwareBadge />
        <div className="flex flex-wrap items-center gap-3 flex-1 justify-center">
          <MipsGauge />
          <CpuGauge />
          <SlotsGauge />
          <StorageGauge />
        </div>
        <Utilities />
      </div>
      <AlertsBanner />
    </header>
  );
}
