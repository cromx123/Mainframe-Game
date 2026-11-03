import { Play } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { buyClickUpgrade } from '../../core/actions';
import { BALANCE } from '../../core/balance';
import { normalizeCommand } from '../../core/commands';
import { cost } from '../../core/costs';
import { formatNumber } from '../../core/format';
import type { Tone } from '../../core/log';
import type { PrinterState } from '../../core/state';
import { useGameStore } from '../../store/gameStore';
import { usePhosphor } from '../theme';
import { WindowFrame } from './WindowFrame';

const TONE_CLASS: Record<Exclude<Tone, 'normal'>, string> = {
  error: 'text-term-red font-bold',
  warn: 'text-term-yellow',
  highlight: 'text-term-cyan font-bold',
  info: 'text-slate-300',
  cmd: 'text-white font-bold',
};

const MAX_HISTORY = 20;
const FLOATER_MS = 850;
const { multiplier: M } = BALANCE;

interface Floater {
  id: number;
  x: number;
  y: number;
  label: string;
}

let floaterSeq = 0;

function macroClass(cmd: string, printer: PrinterState): string {
  if (cmd === 'C PR1' && printer === 'JAMMED') {
    return 'bg-term-red/30 border-term-red text-term-red font-bold animate-bounce';
  }
  if (cmd === 'S PR1' && printer === 'CANCELLED') {
    return 'bg-term-green/30 border-term-green text-term-green font-bold animate-pulse';
  }
  return 'bg-panel-head border-slate-700 text-slate-300 hover:border-slate-400';
}

export function TsoConsole() {
  const t = usePhosphor('tso');
  const log = useGameStore((s) => s.log);
  const clickPower = useGameStore((s) => s.stats.clickPower);
  const mips = useGameStore((s) => s.game.run.mips);
  const clickLevel = useGameStore((s) => s.game.meta.clickLevel);
  const printer = useGameStore((s) => s.game.run.printer);
  const purgeCooldown = useGameStore((s) => s.game.run.purgeCooldown);
  const submitJcl = useGameStore((s) => s.submitJcl);
  const command = useGameStore((s) => s.command);
  const apply = useGameStore((s) => s.apply);

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const lastLogId = log.at(-1)?.id;

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastLogId]);

  const execute = (raw: string) => {
    const clean = normalizeCommand(raw);
    if (!clean) return;
    command(clean);
    setHistory((list) => [clean, ...list.filter((item) => item !== clean)].slice(0, MAX_HISTORY));
    setCursor(-1);
  };

  const submitInput = () => {
    execute(input);
    setInput('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitInput();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(cursor + 1, history.length - 1);
      if (next < 0) return;
      setCursor(next);
      setInput(history[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cursor < 0) return;
      const next = cursor - 1;
      setCursor(next);
      setInput(next >= 0 ? (history[next] ?? '') : '');
    }
  };

  const onSubmitClick = (e: MouseEvent<HTMLButtonElement>) => {
    const gained = submitJcl();
    if (e.detail === 0) return;
    const floater = {
      id: ++floaterSeq,
      x: e.clientX,
      y: e.clientY,
      label: `+${formatNumber(gained)} MIPS`,
    };
    setFloaters((list) => [...list.slice(-8), floater]);
    setTimeout(() => setFloaters((list) => list.filter((f) => f.id !== floater.id)), FLOATER_MS);
  };

  const upgradeCost = cost.click(clickLevel);
  const macros = [
    { cmd: 'SUBMIT', label: 'SUBMIT (+MIPS)' },
    {
      cmd: '$P',
      label:
        purgeCooldown > 0
          ? `$P (${Math.ceil(purgeCooldown)}s)`
          : `$P (Purge +${(M.purge - 1) * 100}%)`,
    },
    { cmd: 'D A,L', label: `D A,L (+${(M.telemetry - 1) * 100}%)` },
    { cmd: 'S PR1', label: `S PR1 (x${M.printing} Buff)` },
    { cmd: 'C PR1', label: 'C PR1 (Cancel Jam)' },
    { cmd: 'HELP', label: 'HELP' },
  ];

  return (
    <WindowFrame id="tso">
      {floaters.map((f) => (
        <div
          key={f.id}
          className="pointer-events-none fixed z-50 text-xs font-bold text-term-green bg-black/80 border border-term-green/50 px-2 py-0.5 rounded shadow-lg animate-bounce"
          style={{ left: f.x - 30, top: f.y - 28 }}
        >
          {f.label}
        </div>
      ))}

      <div className="p-2.5 bg-taskbar border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onSubmitClick}
          className={`flex-1 py-2 px-3 rounded font-extrabold text-xs border-2 ${t.button} bg-black/50 flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-inner`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>SUBMIT JCL BATCH (+{formatNumber(clickPower)} MIPS)</span>
        </button>
        <button
          onClick={() => apply(buyClickUpgrade)}
          disabled={mips.lt(upgradeCost)}
          className="py-2 px-2.5 rounded text-[11px] bg-panel-head hover:bg-control-hover disabled:opacity-40 border border-slate-700 text-slate-200 transition"
        >
          Optimize JCL Lv.{clickLevel + 1} ({formatNumber(upgradeCost)} MIPS)
        </button>
      </div>

      <div
        ref={logRef}
        role="log"
        className="flex-1 p-3 overflow-y-auto space-y-1 text-xs bg-panel-deep select-text"
      >
        {log.map((entry) => (
          <div
            key={entry.id}
            className={`leading-relaxed break-words ${entry.tone === 'normal' ? t.text : TONE_CLASS[entry.tone]}`}
          >
            <span className="text-slate-500 mr-1.5">[{entry.time}]</span>
            <span className="opacity-85 mr-1.5">{entry.code}</span>
            <span>{entry.text}</span>
          </div>
        ))}
      </div>

      <div className="px-2.5 py-1.5 bg-taskbar border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-slate-400 mr-1">QUICK MACRO:</span>
        {macros.map((macro) => (
          <button
            key={macro.cmd}
            onClick={() => execute(macro.cmd)}
            className={`text-[10px] px-2 py-0.5 rounded border ${macroClass(macro.cmd, printer)}`}
          >
            {macro.label}
          </button>
        ))}
      </div>

      <div className="bg-panel-head border-t border-slate-700 px-3 py-2 flex items-center gap-2">
        <label htmlFor="tso-command" className={`text-xs font-bold ${t.text}`}>
          COMMAND ===&gt;
        </label>
        <input
          id="tso-command"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type $P, S PR1, C PR1, D A,L, SUBMIT..."
          autoComplete="off"
          spellCheck={false}
          className={`flex-1 min-w-0 bg-transparent text-xs font-bold focus:outline-none ${t.text} placeholder-slate-600`}
        />
        <button
          onClick={submitInput}
          className={`px-2.5 py-0.5 text-[11px] font-bold rounded border ${t.button}`}
        >
          ENTER
        </button>
      </div>
    </WindowFrame>
  );
}
