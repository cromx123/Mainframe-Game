import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

const LAST_STEP = 6;
const STEP_MS = 450;

export function BootSequence() {
  const hardware = useGameStore((s) => s.stats.hardware);
  const initiators = useGameStore((s) => s.game.run.initiatorsOwned);
  const ziipEngines = useGameStore((s) => s.game.meta.ziipEngines);
  const setBootVisible = useGameStore((s) => s.setBootVisible);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((current) => Math.min(LAST_STEP, current + 1)), STEP_MS);
    return () => clearInterval(id);
  }, []);

  const done = step >= LAST_STEP;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="TSO logon"
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
    >
      <div className="bg-crt border-2 border-term-green rounded max-w-xl w-full p-5 text-xs space-y-3 shadow-2xl">
        <div className="flex justify-between items-center gap-2 border-b border-term-green/30 pb-2">
          <span className="text-term-green font-bold">
            IBM 3270 INFORMATION DISPLAY SYSTEM - LPAR ZOS1
          </span>
          <span className="text-[10px] text-term-cyan">{hardware.name}</span>
        </div>

        <div className="space-y-1.5 min-h-[190px] text-term-green">
          <div>&gt; CONNECTING TO VTAM SNA LU2 PORT 23...</div>
          {step >= 1 && <div>&gt; IEE114I HARDWARE FRAME: {hardware.name} ONLINE</div>}
          {step >= 2 && (
            <div>
              &gt; ENTER TSO/E USERID: <span className="text-white font-bold">ZADMIN01</span>
            </div>
          )}
          {step >= 3 && (
            <div>
              &gt; PASSWORD: <span className="text-white">********</span> [RACF AUTHORIZED]
            </div>
          )}
          {step >= 4 && (
            <div className="text-term-cyan">
              &gt; $HASP000 JES2 SPOOL INITIALIZED ({initiators} INITIATORS, {ziipEngines} zIIP
              ENGINES)
            </div>
          )}
          {step >= 5 && (
            <div className="text-term-amber">
              &gt; TIP: Open SDSF &amp; JES2 windows in the taskbar, but watch your MAIN CPU %!
            </div>
          )}
          {done && <div className="text-white font-bold animate-pulse">&gt; READY.</div>}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            autoFocus
            onClick={() => setBootVisible(false)}
            className="px-4 py-2 bg-term-green hover:brightness-110 text-black font-extrabold rounded text-xs transition"
          >
            {done ? 'ENTER TSO MASTER CONSOLE' : 'SKIP LOGON / CONNECT NOW'}
          </button>
        </div>
      </div>
    </div>
  );
}
