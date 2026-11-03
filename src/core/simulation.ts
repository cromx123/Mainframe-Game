import type Decimal from 'break_eternity.js';
import { BALANCE } from './balance';
import { formatNumber } from './format';
import { msg, type LogMessage, type Outcome } from './log';
import { earn, patchRun, type GameState, type PrinterState } from './state';
import { computeStats } from './stats';
import { clamp, type Rng } from './util';

export interface OfflineReport {
  elapsedSec: number;
  creditedSec: number;
  abend: boolean;
  gained: Decimal;
  dasdName: string;
}

export interface AdvanceResult extends Outcome {
  offline: OfflineReport | null;
}

export function step(game: GameState, dt: number, rng: Rng): Outcome {
  const stats = computeStats(game);
  const { run, meta } = game;
  const log: LogMessage[] = [];

  let printer: PrinterState = run.printer;
  if (printer === 'PRINTING' && rng() * 100 < stats.jamChancePct * dt) {
    printer = 'JAMMED';
    log.push(
      msg('*HASP190', 'PR1 INTERVENTION REQUIRED - PAPER JAM! ENTER "C PR1" THEN "S PR1"', 'error'),
    );
  } else if (
    printer === 'JAMMED' &&
    meta.rexxAutoOp &&
    rng() < BALANCE.printer.rexxRecoveryPerSec * dt
  ) {
    printer = 'PRINTING';
    log.push(msg('REXX01I', 'NETVIEW AUTO-OP EXECUTED "$C PR1; $S PR1" - PR1 RESTORED', 'info'));
  }

  const spoolRate = BALANCE.spool.fillPerSec[run.printer] * stats.dasd.spoolFillMult;
  const earned = earn(game, stats.mipsPerSecond.mul(dt));
  return {
    game: patchRun(earned, {
      purgeBuff: Math.max(0, run.purgeBuff - dt),
      purgeCooldown: Math.max(0, run.purgeCooldown - dt),
      telemetryBuff: Math.max(0, run.telemetryBuff - dt),
      spool: clamp(run.spool + spoolRate * dt, 0, 100),
      printer,
    }),
    log,
  };
}

/**
 * Offline time is credited at a reduced rate from the steady-state production (no buffs, no
 * printer), and capped by the DASD volume size: past it, the player suffers a B37 abend.
 */
export function applyOffline(game: GameState, elapsedSec: number, now: number): AdvanceResult {
  const { run, meta } = game;
  const stats = computeStats(game);
  const creditedSec = Math.min(elapsedSec, stats.dasd.maxOfflineSec);
  const abend = elapsedSec > stats.dasd.maxOfflineSec;

  const steady = computeStats(
    patchRun(game, { purgeBuff: 0, telemetryBuff: 0, printer: 'IDLE', spool: 0 }),
  ).mipsPerSecond;
  const gained = steady.mul(creditedSec * BALANCE.offline.efficiency);

  const wasPrinting = run.printer === 'PRINTING' || run.printer === 'JAMMED';
  const printer: PrinterState = wasPrinting
    ? meta.rexxAutoOp
      ? 'PRINTING'
      : 'JAMMED'
    : run.printer;
  const spoolRate = BALANCE.spool.fillPerSec.IDLE * stats.dasd.spoolFillMult;

  const next = patchRun(earn(game, gained), {
    purgeBuff: 0,
    purgeCooldown: 0,
    telemetryBuff: 0,
    spool: clamp(run.spool + spoolRate * elapsedSec, 0, 100),
    printer,
  });

  const minutes = Math.floor(creditedSec / 60);
  const log = abend
    ? [
        msg(
          'IEC030I',
          `B37-04 ABEND: DASD ${stats.dasd.name} FILLED AFTER ${minutes} MIN! +${formatNumber(gained)} MIPS RECOVERED`,
          'error',
        ),
      ]
    : [msg('IEF142I', `OFFLINE BATCH SPOOL RECOVERED: +${formatNumber(gained)} MIPS`, 'highlight')];

  return {
    game: { ...next, lastTick: now },
    log,
    offline: { elapsedSec, creditedSec, abend, gained, dasdName: stats.dasd.name },
  };
}

/** Catches the simulation up to `now` in fixed steps, or as offline time after a long gap. */
export function advance(game: GameState, now: number, rng: Rng): AdvanceResult {
  const elapsedMs = now - game.lastTick;
  if (elapsedMs < 0) return { game: { ...game, lastTick: now }, log: [], offline: null };
  if (elapsedMs / 1000 > BALANCE.offline.thresholdSec) {
    return applyOffline(game, elapsedMs / 1000, now);
  }

  const stepMs = BALANCE.tickSeconds * 1000;
  const steps = Math.floor(elapsedMs / stepMs);
  if (steps === 0) return { game, log: [], offline: null };

  let current = game;
  const log: LogMessage[] = [];
  for (let i = 0; i < steps; i++) {
    const result = step(current, BALANCE.tickSeconds, rng);
    current = result.game;
    log.push(...result.log);
  }
  return { game: { ...current, lastTick: game.lastTick + steps * stepMs }, log, offline: null };
}
