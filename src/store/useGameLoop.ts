import { useEffect } from 'react';
import { BALANCE } from '../core/balance';
import { useGameStore } from './gameStore';

const TICK_MS = BALANCE.tickSeconds * 1000;
const TELEMETRY_MS = 1000;
const AUTOSAVE_MS = 10_000;

/** Drives simulation, telemetry sampling and autosave for the lifetime of the app. */
export function useGameLoop(): void {
  useEffect(() => {
    const { tick, sampleTelemetry, save } = useGameStore.getState();
    const timers = [
      setInterval(tick, TICK_MS),
      setInterval(sampleTelemetry, TELEMETRY_MS),
      setInterval(save, AUTOSAVE_MS),
    ];
    const saveWhenHidden = () => {
      if (document.visibilityState === 'hidden') save();
    };
    document.addEventListener('visibilitychange', saveWhenHidden);
    window.addEventListener('pagehide', save);

    return () => {
      timers.forEach(clearInterval);
      document.removeEventListener('visibilitychange', saveWhenHidden);
      window.removeEventListener('pagehide', save);
    };
  }, []);
}
