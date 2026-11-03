import Decimal from 'break_eternity.js';
import { BALANCE } from './balance';
import {
  DASD,
  HARDWARE,
  JOB_BY_ID,
  SUBSYSTEM_BY_ID,
  WINDOW_BY_ID,
  WINDOWS,
  type JobId,
  type SubsystemId,
  type WindowId,
} from './content';
import { cost } from './costs';
import { formatNumber } from './format';
import { msg, outcome, type Outcome } from './log';
import { createRunState, earn, patchMeta, patchRun, type GameState } from './state';
import { computeStats } from './stats';
import { at, clamp, recordOf } from './util';

function pay(game: GameState, price: Decimal): GameState | null {
  return game.run.mips.gte(price) ? patchRun(game, { mips: game.run.mips.sub(price) }) : null;
}

export interface SubmitOutcome extends Outcome {
  gained: Decimal;
}

export function submitJcl(game: GameState, factor = 1): SubmitOutcome {
  const gained = computeStats(game).clickPower.mul(factor);
  return { game: earn(game, gained), log: [], gained };
}

// --- Batch & online workloads ---------------------------------------------

export function buyJob(game: GameState, id: JobId): Outcome {
  const level = game.run.jobs[id];
  const paid = pay(game, cost.job(JOB_BY_ID[id], level));
  if (!paid) return outcome(game);
  return outcome(patchRun(paid, { jobs: { ...paid.run.jobs, [id]: level + 1 } }));
}

export function buySubsystem(game: GameState, id: SubsystemId): Outcome {
  const level = game.run.subsystems[id];
  const paid = pay(game, cost.subsystem(SUBSYSTEM_BY_ID[id], level));
  if (!paid) return outcome(game);
  return outcome(patchRun(paid, { subsystems: { ...paid.run.subsystems, [id]: level + 1 } }));
}

// --- Initiators & engines --------------------------------------------------

export function buyInitiator(game: GameState): Outcome {
  const { initiatorsOwned, initiatorsActive } = game.run;
  const paid = pay(game, cost.initiator(initiatorsOwned));
  if (!paid) return outcome(game);
  return outcome(
    patchRun(paid, {
      initiatorsOwned: initiatorsOwned + 1,
      initiatorsActive: initiatorsActive + 1,
    }),
    msg(
      '$HASP100',
      `JES2 INITIATOR INIT${initiatorsOwned + 1} ALLOCATED (+${BALANCE.cpu.initiatorUpkeep}% CPU UPKEEP)`,
      'info',
    ),
  );
}

export function setActiveInitiators(game: GameState, count: number): Outcome {
  const initiatorsActive = clamp(Math.round(count), 0, game.run.initiatorsOwned);
  return outcome(patchRun(game, { initiatorsActive }));
}

export function buyZiip(game: GameState): Outcome {
  const engines = game.meta.ziipEngines;
  const paid = pay(game, cost.ziip(engines));
  if (!paid) return outcome(game);
  return outcome(
    patchMeta(paid, { ziipEngines: engines + 1 }),
    msg(
      'IEA001I',
      'zIIP SPECIALTY ENGINE ONLINE! +1 PARALLEL SLOT AT 0% MAIN CPU COST.',
      'highlight',
    ),
  );
}

export function buyClickUpgrade(game: GameState): Outcome {
  const level = game.meta.clickLevel;
  const paid = pay(game, cost.click(level));
  if (!paid) return outcome(game);
  return outcome(patchMeta(paid, { clickLevel: level + 1 }));
}

// --- JES2 printer ----------------------------------------------------------

export function buyPaper(game: GameState): Outcome {
  const level = game.meta.paperLevel;
  if (level >= BALANCE.costs.paper.maxLevel) return outcome(game);
  const paid = pay(game, cost.paper(level));
  if (!paid) return outcome(game);
  return outcome(patchMeta(paid, { paperLevel: level + 1 }));
}

export function buyRexx(game: GameState): Outcome {
  if (game.meta.rexxAutoOp) return outcome(game);
  const paid = pay(game, cost.rexx());
  if (!paid) return outcome(game);
  return outcome(
    patchMeta(paid, { rexxAutoOp: true }),
    msg('REXX00I', 'NETVIEW REXX AUTO-OPERATOR SCRIPT INSTALLED.', 'highlight'),
  );
}

export function purgeSpool(game: GameState): Outcome {
  const { purgeSec, purgeCooldownSec } = BALANCE.buffs;
  const cooldown = game.run.purgeCooldown;
  if (cooldown > 0) {
    return outcome(
      game,
      msg('$HASP649', `PURGE COMMAND ON COOLDOWN (${Math.ceil(cooldown)}s REMAINING)`, 'warn'),
    );
  }
  return outcome(
    patchRun(game, { spool: 0, purgeBuff: purgeSec, purgeCooldown: purgeCooldownSec }),
    msg(
      '$HASP890',
      `JES2 SPOOL PURGED TO 0%. +${(BALANCE.multiplier.purge - 1) * 100}% MIPS OVERCLOCK FOR ${purgeSec} SECONDS!`,
      'highlight',
    ),
  );
}

export function cancelPrinter(game: GameState): Outcome {
  const { printer } = game.run;
  if (printer === 'JAMMED' || printer === 'PRINTING') {
    return outcome(
      patchRun(game, { printer: 'CANCELLED' }),
      msg('$HASP000', 'PR1 DRAINED AND CANCELLED. READY FOR "$S PR1" TO RESTART.', 'warn'),
    );
  }
  return outcome(game, msg('$HASP000', `PR1 IS ALREADY ${printer}. TYPE "S PR1" TO START.`));
}

export function startPrinter(game: GameState): Outcome {
  if (game.run.printer === 'JAMMED') {
    return outcome(
      game,
      msg('*HASP190', 'CANNOT START PR1 WHILE JAMMED! YOU MUST CANCEL FIRST WITH "C PR1"', 'error'),
    );
  }
  return outcome(
    patchRun(game, { printer: 'PRINTING' }),
    msg(
      '$HASP100',
      `PR1 STARTED ON CLASS=A. HIGH-SPEED BATCH OUTPUT ACTIVE (x${BALANCE.multiplier.printing} MIPS/s)!`,
      'highlight',
    ),
  );
}

// --- Telemetry -------------------------------------------------------------

export function displayActive(game: GameState): Outcome {
  const stats = computeStats(game);
  const { telemetrySec } = BALANCE.buffs;
  return outcome(
    patchRun(game, { telemetryBuff: telemetrySec }),
    msg(
      'IEE115I',
      `SYS=ZOS1 MIPS/S=${formatNumber(stats.mipsPerSecond)} CPU=${stats.cpu.total}% RAM=${stats.ramUsed}/${stats.ramTotal}GB`,
      'info',
    ),
    msg(
      'WLM001I',
      `TELEMETRY CALIBRATED: +${(BALANCE.multiplier.telemetry - 1) * 100}% MIPS PRODUCTION FOR ${telemetrySec}s`,
      'highlight',
    ),
  );
}

// --- Hardware --------------------------------------------------------------

export function buyRam(game: GameState): Outcome {
  const level = game.run.ramLevel;
  const paid = pay(game, cost.ram(level));
  if (!paid) return outcome(game);
  return outcome(
    patchRun(paid, { ramLevel: level + 1 }),
    msg('IEE500I', `CENTRAL STORAGE EXPANDED BY +${BALANCE.ram.gbPerUpgrade} GB REAL RAM.`, 'info'),
  );
}

export function buyCooling(game: GameState): Outcome {
  const level = game.run.coolingLevel;
  if (level >= BALANCE.costs.cooling.maxLevel) return outcome(game);
  const paid = pay(game, cost.cooling(level));
  if (!paid) return outcome(game);
  const pct = BALANCE.cpu.coolingReductionPerLevel * 100;
  return outcome(
    patchRun(paid, { coolingLevel: level + 1 }),
    msg('WLM010I', `WORKLOAD MANAGER POLICY OPTIMIZED (-${pct}% CPU LOAD).`, 'info'),
  );
}

export function buyDasd(game: GameState): Outcome {
  const next = DASD[game.meta.dasdLevel + 1];
  if (!next) return outcome(game);
  const paid = pay(game, new Decimal(next.cost));
  if (!paid) return outcome(game);
  return outcome(
    patchMeta(paid, { dasdLevel: game.meta.dasdLevel + 1 }),
    msg(
      'ICK003I',
      `ICKDSF INITIALIZED NEW DASD VOLUME: ${next.name} (${next.cylinders} CYL)`,
      'highlight',
    ),
  );
}

// --- Window manager (sessions are a resource: CPU% + RAM) -------------------

export function unlockWindow(game: GameState, id: WindowId): Outcome {
  const def = WINDOW_BY_ID[id];
  if (game.meta.unlockedWindows[id]) return outcome(game);
  const paid = pay(game, new Decimal(def.unlockCost));
  if (!paid) return outcome(game);

  const stats = computeStats(game);
  const fitsRam = stats.ramUsed + def.ramUpkeep <= stats.ramTotal;
  const next: GameState = {
    ...paid,
    meta: { ...paid.meta, unlockedWindows: { ...paid.meta.unlockedWindows, [id]: true } },
    run: { ...paid.run, openWindows: { ...paid.run.openWindows, [id]: fitsRam } },
  };
  return outcome(
    next,
    msg(
      'IEF403I',
      `ASID ${def.asid} (${def.shortTitle}) LICENSE ACTIVATED.${fitsRam ? ' SESSION STARTED.' : ' INSUFFICIENT RAM TO AUTO-OPEN.'}`,
      'highlight',
    ),
  );
}

export function toggleWindow(game: GameState, id: WindowId): Outcome {
  const def = WINDOW_BY_ID[id];
  if (!game.meta.unlockedWindows[id] || def.alwaysOpen) return outcome(game);

  const isOpen = game.run.openWindows[id];
  if (!isOpen) {
    const stats = computeStats(game);
    if (stats.ramUsed + def.ramUpkeep > stats.ramTotal) {
      return outcome(
        game,
        msg(
          'IRA200E',
          `AUXILIARY STORAGE SHORTAGE: NEED ${def.ramUpkeep}GB FREE RAM FOR ${def.shortTitle}!`,
          'error',
        ),
      );
    }
  }
  return outcome(patchRun(game, { openWindows: { ...game.run.openWindows, [id]: !isOpen } }));
}

export function closeAllWindows(game: GameState): Outcome {
  return outcome(
    patchRun(game, { openWindows: recordOf(WINDOWS, (win) => win.alwaysOpen) }),
    msg('IEE301I', 'ALL SECONDARY ASID SESSIONS TERMINATED. CPU LOAD RESTORED TO NOMINAL.', 'warn'),
  );
}

// --- Prestige --------------------------------------------------------------

export function performIpl(game: GameState): Outcome {
  const stats = computeStats(game);
  if (stats.pendingTokens.lte(0)) return outcome(game);

  const hardwareGen = game.meta.hardwareGen + (stats.hardwareUpgradeReady ? 1 : 0);
  const hardware = at(HARDWARE, hardwareGen);
  const meta = {
    ...game.meta,
    iplCount: game.meta.iplCount + 1,
    archTokens: game.meta.archTokens.add(stats.pendingTokens),
    hardwareGen,
    ziipEngines: game.meta.ziipEngines + 1,
  };

  const log = [
    msg(
      'IEA301I',
      `SYSTEM IPL COMPLETE ON ${hardware.name}. +${formatNumber(stats.pendingTokens, 0)} ARCH TOKENS, +1 PERMANENT zIIP!`,
      'highlight',
    ),
  ];
  if (stats.hardwareUpgradeReady) {
    log.unshift(
      msg(
        'IEE114I',
        `HARDWARE FRAME UPGRADED TO ${hardware.name} (x${hardware.mult} MULT)`,
        'highlight',
      ),
    );
  }

  return { game: { ...game, run: createRunState(BALANCE.postIplMips, 0), meta }, log };
}
