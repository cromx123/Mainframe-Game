import Decimal from 'break_eternity.js';
import { BALANCE } from './balance';
import { JOBS, SUBSYSTEMS, WINDOWS, type JobId, type SubsystemId, type WindowId } from './content';
import { recordOf } from './util';

export const PRINTER_STATES = ['IDLE', 'PRINTING', 'JAMMED', 'CANCELLED'] as const;
export type PrinterState = (typeof PRINTER_STATES)[number];

/** Everything an IPL wipes. */
export interface RunState {
  mips: Decimal;
  /** MIPS earned during this run; drives IPL tokens and hardware upgrades. */
  earned: Decimal;
  jobs: Record<JobId, number>;
  subsystems: Record<SubsystemId, number>;
  initiatorsOwned: number;
  initiatorsActive: number;
  ramLevel: number;
  coolingLevel: number;
  printer: PrinterState;
  spool: number;
  purgeBuff: number;
  purgeCooldown: number;
  telemetryBuff: number;
  openWindows: Record<WindowId, boolean>;
}

/** Everything that survives an IPL. */
export interface MetaState {
  iplCount: number;
  archTokens: Decimal;
  hardwareGen: number;
  ziipEngines: number;
  dasdLevel: number;
  clickLevel: number;
  paperLevel: number;
  rexxAutoOp: boolean;
  unlockedWindows: Record<WindowId, boolean>;
}

export interface GameState {
  run: RunState;
  meta: MetaState;
  /** Epoch ms of the last simulated instant. */
  lastTick: number;
}

export function createRunState(
  mips: number = BALANCE.startingMips,
  spool: number = BALANCE.startingSpool,
): RunState {
  return {
    mips: new Decimal(mips),
    earned: new Decimal(mips),
    jobs: recordOf(JOBS, (job) => job.startLevel),
    subsystems: recordOf(SUBSYSTEMS, () => 0),
    initiatorsOwned: 1,
    initiatorsActive: 1,
    ramLevel: 0,
    coolingLevel: 0,
    printer: 'IDLE',
    spool,
    purgeBuff: 0,
    purgeCooldown: 0,
    telemetryBuff: 0,
    openWindows: recordOf(WINDOWS, (win) => win.alwaysOpen),
  };
}

export function createMetaState(): MetaState {
  return {
    iplCount: 0,
    archTokens: new Decimal(0),
    hardwareGen: 0,
    ziipEngines: 0,
    dasdLevel: 0,
    clickLevel: 0,
    paperLevel: 0,
    rexxAutoOp: false,
    unlockedWindows: recordOf(WINDOWS, (win) => win.unlockCost === 0),
  };
}

export function createGame(now: number): GameState {
  return { run: createRunState(), meta: createMetaState(), lastTick: now };
}

export function patchRun(game: GameState, patch: Partial<RunState>): GameState {
  return { ...game, run: { ...game.run, ...patch } };
}

export function patchMeta(game: GameState, patch: Partial<MetaState>): GameState {
  return { ...game, meta: { ...game.meta, ...patch } };
}

export function earn(game: GameState, amount: Decimal): GameState {
  return patchRun(game, {
    mips: game.run.mips.add(amount),
    earned: game.run.earned.add(amount),
  });
}
