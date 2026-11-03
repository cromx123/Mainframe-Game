import Decimal from 'break_eternity.js';
import { BALANCE } from './balance';
import { DASD, HARDWARE, JOBS, SUBSYSTEMS, THEMES, WINDOWS } from './content';
import { defaultSettings, type Settings } from './settings';
import {
  createMetaState,
  createRunState,
  PRINTER_STATES,
  type GameState,
  type MetaState,
  type RunState,
} from './state';
import { clamp, recordOf } from './util';

/** Bump when the shape changes, and add a migration from the previous version in `deserializeSave`. */
export const SAVE_VERSION = 1;

type Serialized<T> = { [K in keyof T]: T[K] extends Decimal ? string : T[K] };

interface SaveFile {
  version: typeof SAVE_VERSION;
  savedAt: number;
  game: { lastTick: number; run: Serialized<RunState>; meta: Serialized<MetaState> };
  settings: Settings;
}

export interface LoadedSave {
  game: GameState;
  settings: Settings;
}

export function serializeSave(game: GameState, settings: Settings, now: number): string {
  const { run, meta } = game;
  const file: SaveFile = {
    version: SAVE_VERSION,
    savedAt: now,
    game: {
      lastTick: game.lastTick,
      run: { ...run, mips: run.mips.toString(), earned: run.earned.toString() },
      meta: { ...meta, archTokens: meta.archTokens.toString() },
    },
    settings,
  };
  return JSON.stringify(file);
}

// --- Lenient readers: a damaged field falls back to its default instead of wiping the save. ---

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const obj = (value: unknown): Json => (isObject(value) ? value : {});
const num = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const int = (value: unknown, fallback: number, min: number, max = Number.MAX_SAFE_INTEGER) =>
  clamp(Math.floor(num(value, fallback)), min, max);
const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

function dec(value: unknown, fallback: Decimal): Decimal {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;
  const d = new Decimal(value);
  return d.isNan() || !d.isFinite() || d.lt(0) ? fallback : d;
}

function oneOf<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
  return options.find((option) => option === value) ?? fallback;
}

function levels<T extends { readonly id: string }>(
  defs: readonly T[],
  value: unknown,
  fallback: Record<T['id'], number>,
): Record<T['id'], number> {
  const source = obj(value);
  return recordOf(defs, (def) => int(source[def.id], fallback[def.id as T['id']], 0));
}

function flags<T extends { readonly id: string }>(
  defs: readonly T[],
  value: unknown,
  fallback: Record<T['id'], boolean>,
): Record<T['id'], boolean> {
  const source = obj(value);
  return recordOf(defs, (def) => bool(source[def.id], fallback[def.id as T['id']]));
}

function readMeta(value: unknown): MetaState {
  const s = obj(value);
  const d = createMetaState();
  const unlocked = flags(WINDOWS, s.unlockedWindows, d.unlockedWindows);
  return {
    iplCount: int(s.iplCount, d.iplCount, 0),
    archTokens: dec(s.archTokens, d.archTokens),
    hardwareGen: int(s.hardwareGen, d.hardwareGen, 0, HARDWARE.length - 1),
    ziipEngines: int(s.ziipEngines, d.ziipEngines, 0),
    dasdLevel: int(s.dasdLevel, d.dasdLevel, 0, DASD.length - 1),
    clickLevel: int(s.clickLevel, d.clickLevel, 0),
    paperLevel: int(s.paperLevel, d.paperLevel, 0, BALANCE.costs.paper.maxLevel),
    rexxAutoOp: bool(s.rexxAutoOp, d.rexxAutoOp),
    unlockedWindows: recordOf(WINDOWS, (win) => win.unlockCost === 0 || unlocked[win.id]),
  };
}

function readRun(value: unknown, meta: MetaState): RunState {
  const s = obj(value);
  const d = createRunState();
  const initiatorsOwned = int(s.initiatorsOwned, d.initiatorsOwned, 1);
  const open = flags(WINDOWS, s.openWindows, d.openWindows);
  return {
    mips: dec(s.mips, d.mips),
    earned: dec(s.earned, d.earned),
    jobs: levels(JOBS, s.jobs, d.jobs),
    subsystems: levels(SUBSYSTEMS, s.subsystems, d.subsystems),
    initiatorsOwned,
    initiatorsActive: int(s.initiatorsActive, d.initiatorsActive, 0, initiatorsOwned),
    ramLevel: int(s.ramLevel, d.ramLevel, 0),
    coolingLevel: int(s.coolingLevel, d.coolingLevel, 0, BALANCE.costs.cooling.maxLevel),
    printer: oneOf(PRINTER_STATES, s.printer, d.printer),
    spool: clamp(num(s.spool, d.spool), 0, 100),
    purgeBuff: Math.max(0, num(s.purgeBuff, 0)),
    purgeCooldown: Math.max(0, num(s.purgeCooldown, 0)),
    telemetryBuff: Math.max(0, num(s.telemetryBuff, 0)),
    openWindows: recordOf(
      WINDOWS,
      (win) => win.alwaysOpen || (meta.unlockedWindows[win.id] && open[win.id]),
    ),
  };
}

function readSettings(value: unknown): Settings {
  const s = obj(value);
  const d = defaultSettings();
  const themes = obj(s.themes);
  return {
    scanlines: bool(s.scanlines, d.scanlines),
    themes: recordOf(WINDOWS, (win) => oneOf(THEMES, themes[win.id], d.themes[win.id])),
  };
}

/** Returns null when the payload is not a readable save of the current version. */
export function deserializeSave(raw: string, now: number): LoadedSave | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(data) || data.version !== SAVE_VERSION) return null;
  const game = data.game;
  if (!isObject(game)) return null;

  const meta = readMeta(game.meta);
  const run = readRun(game.run, meta);
  const lastTick = Math.min(num(game.lastTick, now), now);
  return { game: { run, meta, lastTick }, settings: readSettings(data.settings) };
}
