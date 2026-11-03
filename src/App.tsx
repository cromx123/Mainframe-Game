import type { ComponentType } from 'react';
import { WINDOWS, type WindowId } from './core/content';
import { useGameStore } from './store/gameStore';
import { useGameLoop } from './store/useGameLoop';
import { Header } from './ui/layout/Header';
import { Taskbar } from './ui/layout/Taskbar';
import { BootSequence } from './ui/modals/BootSequence';
import { ConfirmIplModal, ConfirmResetModal } from './ui/modals/ConfirmModals';
import { OfflineReportModal } from './ui/modals/OfflineReportModal';
import { CicsWindow } from './ui/windows/CicsWindow';
import { HardwareWindow } from './ui/windows/HardwareWindow';
import { Jes2Window } from './ui/windows/Jes2Window';
import { SdsfWindow } from './ui/windows/SdsfWindow';
import { SysviewWindow } from './ui/windows/SysviewWindow';
import { TsoConsole } from './ui/windows/TsoConsole';

const WINDOW_VIEWS: Record<WindowId, ComponentType> = {
  tso: TsoConsole,
  sdsf: SdsfWindow,
  jes2: Jes2Window,
  cics: CicsWindow,
  hardware: HardwareWindow,
  sysview: SysviewWindow,
};

function gridClass(openCount: number): string {
  if (openCount === 1) return 'grid gap-3 grid-cols-1 max-w-4xl mx-auto';
  if (openCount === 2) return 'grid gap-3 grid-cols-1 lg:grid-cols-2';
  return 'grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
}

export default function App() {
  useGameLoop();
  const scanlines = useGameStore((s) => s.settings.scanlines);
  const openWindows = useGameStore((s) => s.game.run.openWindows);
  const bootVisible = useGameStore((s) => s.bootVisible);
  const confirm = useGameStore((s) => s.confirm);
  const offlineReport = useGameStore((s) => s.offlineReport);
  const open = WINDOWS.filter((win) => openWindows[win.id]);

  return (
    <div className="min-h-screen bg-crt text-term-green font-mono select-none flex flex-col relative overflow-x-hidden">
      {scanlines && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-40 opacity-15 crt-scanlines"
        />
      )}

      <Header />
      <Taskbar />

      <main className="flex-1 p-3 max-w-[1800px] w-full mx-auto">
        <div className={gridClass(open.length)}>
          {open.map((win) => {
            const View = WINDOW_VIEWS[win.id];
            return <View key={win.id} />;
          })}
        </div>
      </main>

      {bootVisible && <BootSequence />}
      {confirm === 'ipl' && <ConfirmIplModal />}
      {confirm === 'reset' && <ConfirmResetModal />}
      {offlineReport && <OfflineReportModal report={offlineReport} />}
    </div>
  );
}
