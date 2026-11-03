import Decimal from 'break_eternity.js';
import { BALANCE } from './balance';
import {
  DASD,
  HARDWARE,
  JOBS,
  SUBSYSTEMS,
  WINDOWS,
  type DasdDef,
  type HardwareDef,
  type JobId,
} from './content';
import type { GameState, MetaState, RunState } from './state';
import { at, sum } from './util';

export interface CpuLoad {
  windows: number;
  initiators: number;
  subsystems: number;
  total: number;
}

export interface SystemStats {
  hardware: HardwareDef;
  nextHardware: HardwareDef | null;
  hardwareUpgradeReady: boolean;
  dasd: DasdDef;
  nextDasd: DasdDef | null;
  ramTotal: number;
  ramUsed: number;
  cpu: CpuLoad;
  thrashing: boolean;
  spoolFull: boolean;
  slots: number;
  slotsUsed: number;
  runningJobs: ReadonlySet<JobId>;
  multiplier: Decimal;
  batchMips: Decimal;
  subsystemMips: Decimal;
  mipsPerSecond: Decimal;
  clickPower: Decimal;
  jamChancePct: number;
  pendingTokens: Decimal;
}

export function pendingTokens(earned: Decimal): Decimal {
  const { minRunMips, tokenDivisor, tokenExponent } = BALANCE.ipl;
  if (earned.lt(minRunMips)) return new Decimal(0);
  return Decimal.max(1, earned.div(tokenDivisor).pow(tokenExponent).floor());
}

function cpuLoad(
  run: RunState,
  hardware: HardwareDef,
  windowUpkeep: number,
  activeSubsystems: number,
): CpuLoad {
  const { initiatorUpkeep, subsystemUpkeep, minLoad, maxReduction, coolingReductionPerLevel } =
    BALANCE.cpu;
  const reduction = Math.min(
    maxReduction,
    run.coolingLevel * coolingReductionPerLevel + hardware.cpuReductionPct / 100,
  );
  const keep = 1 - reduction;
  const initiators = run.initiatorsActive * initiatorUpkeep;
  const subsystems = activeSubsystems * subsystemUpkeep;
  return {
    windows: Math.round(windowUpkeep * keep),
    initiators: Math.round(initiators * keep),
    subsystems: Math.round(subsystems * keep),
    total: Math.max(minLoad, Math.round((windowUpkeep + initiators + subsystems) * keep)),
  };
}

function globalMultiplier(
  run: RunState,
  meta: MetaState,
  hardware: HardwareDef,
  spoolFull: boolean,
  thrashing: boolean,
): Decimal {
  const m = BALANCE.multiplier;
  let factor = meta.archTokens.mul(m.perToken).add(1).mul(hardware.mult);
  if (run.purgeBuff > 0) factor = factor.mul(m.purge);
  if (run.telemetryBuff > 0) factor = factor.mul(m.telemetry);
  if (run.printer === 'PRINTING') factor = factor.mul(m.printing);
  else if (run.printer === 'JAMMED') factor = factor.mul(m.jammed);
  if (spoolFull) factor = factor.mul(m.spoolFull);
  if (thrashing) factor = factor.mul(m.thrashing);
  return factor;
}

export function computeStats(game: GameState): SystemStats {
  const { run, meta } = game;
  const hardware = at(HARDWARE, meta.hardwareGen);
  const nextHardware = HARDWARE[meta.hardwareGen + 1] ?? null;
  const dasd = at(DASD, meta.dasdLevel);
  const nextDasd = DASD[meta.dasdLevel + 1] ?? null;

  const openWindows = WINDOWS.filter((win) => run.openWindows[win.id]);
  const activeSubsystems = SUBSYSTEMS.filter((sub) => run.subsystems[sub.id] > 0).length;

  const ramTotal = hardware.baseRamGb + run.ramLevel * BALANCE.ram.gbPerUpgrade;
  const ramUsed =
    sum(openWindows.map((win) => win.ramUpkeep)) + activeSubsystems * BALANCE.ram.gbPerSubsystem;

  const cpu = cpuLoad(
    run,
    hardware,
    sum(openWindows.map((win) => win.cpuUpkeep)),
    activeSubsystems,
  );
  const thrashing = cpu.total > BALANCE.cpu.thrashAbove;
  const spoolFull = run.spool >= BALANCE.spool.fullAt;

  // Initiators and zIIPs are execution slots; the most productive compiled jobs get them first.
  const slots = run.initiatorsActive + meta.ziipEngines;
  const compiled = JOBS.filter((job) => run.jobs[job.id] > 0)
    .map((job) => ({ id: job.id, output: new Decimal(job.baseMips).mul(run.jobs[job.id]) }))
    .sort((a, b) => b.output.cmp(a.output));
  const running = compiled.slice(0, slots);
  const extraSlots = Math.max(0, slots - compiled.length);

  const batchBase = running
    .reduce((acc, job) => acc.add(job.output), new Decimal(0))
    .mul(1 + extraSlots * BALANCE.batch.extraSlotBonus);
  const subsystemBase = SUBSYSTEMS.reduce(
    (acc, sub) => acc.add(new Decimal(sub.baseMips).mul(run.subsystems[sub.id])),
    new Decimal(0),
  );

  const multiplier = globalMultiplier(run, meta, hardware, spoolFull, thrashing);
  const batchMips = batchBase.mul(multiplier);
  const subsystemMips = subsystemBase.mul(multiplier);
  const mipsPerSecond = batchMips.add(subsystemMips);

  const { click, printer } = BALANCE;
  const clickPower = mipsPerSecond
    .mul(click.mpsShare)
    .add(click.base + meta.clickLevel * click.perLevel)
    .mul(hardware.mult);

  return {
    hardware,
    nextHardware,
    hardwareUpgradeReady: nextHardware !== null && run.earned.gte(nextHardware.reqRunMips),
    dasd,
    nextDasd,
    ramTotal,
    ramUsed,
    cpu,
    thrashing,
    spoolFull,
    slots,
    slotsUsed: running.length,
    runningJobs: new Set(running.map((job) => job.id)),
    multiplier,
    batchMips,
    subsystemMips,
    mipsPerSecond,
    clickPower,
    jamChancePct: Math.max(
      printer.minJamPct,
      printer.baseJamPct - meta.paperLevel * printer.jamPctPerPaperLevel,
    ),
    pendingTokens: pendingTokens(run.earned),
  };
}
