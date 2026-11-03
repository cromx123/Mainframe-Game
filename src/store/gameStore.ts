import Decimal from 'break_eternity.js';
import { create } from 'zustand';
import * as actions from '../core/actions';
import { runCommand, welcomeLog } from '../core/commands';
import type { WindowId } from '../core/content';
import { msg, type LogMessage, type Outcome } from '../core/log';
import { deserializeSave, serializeSave } from '../core/save';
import { defaultSettings, nextTheme, type Settings } from '../core/settings';
import { advance, applyOffline, type OfflineReport } from '../core/simulation';
import { createGame, type GameState } from '../core/state';
import { computeStats, type SystemStats } from '../core/stats';
import { CORRUPT_SAVE_KEY, SAVE_KEY, storage } from '../platform/storage';

const MAX_LOG_LINES = 100;
const HISTORY_SAMPLES = 20;

export interface LogEntry extends LogMessage {
  id: number;
  time: string;
}

export type ConfirmDialog = 'ipl' | 'reset' | null;

export interface GameStore {
  game: GameState;
  stats: SystemStats;
  settings: Settings;
  log: LogEntry[];
  history: Decimal[];
  bootVisible: boolean;
  confirm: ConfirmDialog;
  offlineReport: OfflineReport | null;

  hydrate: () => void;
  tick: () => void;
  sampleTelemetry: () => void;
  save: () => void;
  apply: (action: (game: GameState) => Outcome) => void;
  submitJcl: () => Decimal;
  command: (raw: string) => void;
  performIpl: () => void;
  hardReset: () => void;
  simulateOffline: (seconds: number) => void;
  toggleScanlines: () => void;
  cycleTheme: (id: WindowId) => void;
  setBootVisible: (visible: boolean) => void;
  setConfirm: (dialog: ConfirmDialog) => void;
  dismissOfflineReport: () => void;
}

let nextLogId = 1;
let saveErrorReported = false;

function appendLog(log: LogEntry[], messages: LogMessage[], now: number): LogEntry[] {
  if (messages.length === 0) return log;
  const time = new Date(now).toTimeString().slice(0, 8);
  const stamped = messages.map((message) => ({ ...message, id: nextLogId++, time }));
  return [...log, ...stamped].slice(-MAX_LOG_LINES);
}

function emptyHistory(): Decimal[] {
  return Array.from({ length: HISTORY_SAMPLES }, () => new Decimal(0));
}

function freshSession(game: GameState, notices: LogMessage[] = []) {
  return {
    game,
    stats: computeStats(game),
    log: appendLog([], [...welcomeLog(game), ...notices], Date.now()),
    history: emptyHistory(),
    offlineReport: null,
  };
}

export const useGameStore = create<GameStore>()((set, get) => {
  function commit(game: GameState, messages: LogMessage[], extra: Partial<GameStore> = {}) {
    set((s) => ({
      game,
      stats: computeStats(game),
      log: appendLog(s.log, messages, Date.now()),
      ...extra,
    }));
  }

  return {
    ...freshSession(createGame(Date.now())),
    settings: defaultSettings(),
    bootVisible: false,
    confirm: null,

    hydrate() {
      const now = Date.now();
      const raw = storage.read(SAVE_KEY);
      const loaded = raw === null ? null : deserializeSave(raw, now);
      const corrupt = raw !== null && loaded === null;
      if (corrupt) storage.write(CORRUPT_SAVE_KEY, raw);

      const notices = corrupt
        ? [msg('IEC161I', 'SAVE DATASET UNREADABLE - BACKED UP, STARTING A FRESH SYSTEM', 'warn')]
        : [];
      set({
        ...freshSession(loaded?.game ?? createGame(now), notices),
        settings: loaded?.settings ?? defaultSettings(),
        bootVisible: loaded === null,
      });
    },

    tick() {
      const { game } = get();
      const result = advance(game, Date.now(), Math.random);
      if (result.game === game) return;
      commit(result.game, result.log, result.offline ? { offlineReport: result.offline } : {});
    },

    sampleTelemetry() {
      set((s) => ({ history: [...s.history.slice(1), s.stats.mipsPerSecond] }));
    },

    save() {
      const { game, settings } = get();
      if (storage.write(SAVE_KEY, serializeSave(game, settings, Date.now()))) {
        saveErrorReported = false;
        return;
      }
      if (saveErrorReported) return;
      saveErrorReported = true;
      commit(game, [msg('IEC614I', 'SAVE FAILED - BROWSER STORAGE IS FULL OR BLOCKED', 'error')]);
    },

    apply(action) {
      const { game } = get();
      const result = action(game);
      if (result.game === game && result.log.length === 0) return;
      commit(result.game, result.log);
    },

    submitJcl() {
      const result = actions.submitJcl(get().game);
      commit(result.game, result.log);
      return result.gained;
    },

    command(raw) {
      get().apply((game) => runCommand(game, raw, Math.random));
    },

    performIpl() {
      const { game } = get();
      const result = actions.performIpl(game);
      if (result.game === game) return;
      commit(result.game, result.log, { confirm: null, bootVisible: true });
      get().save();
    },

    hardReset() {
      storage.remove(SAVE_KEY);
      set({ ...freshSession(createGame(Date.now())), confirm: null, bootVisible: true });
    },

    simulateOffline(seconds) {
      const result = applyOffline(get().game, seconds, Date.now());
      commit(result.game, result.log, { offlineReport: result.offline });
    },

    toggleScanlines() {
      set((s) => ({ settings: { ...s.settings, scanlines: !s.settings.scanlines } }));
    },

    cycleTheme(id) {
      set((s) => ({
        settings: {
          ...s.settings,
          themes: { ...s.settings.themes, [id]: nextTheme(s.settings.themes[id]) },
        },
      }));
    },

    setBootVisible(visible) {
      set({ bootVisible: visible });
    },

    setConfirm(dialog) {
      set({ confirm: dialog });
    },

    dismissOfflineReport() {
      set({ offlineReport: null });
    },
  };
});
