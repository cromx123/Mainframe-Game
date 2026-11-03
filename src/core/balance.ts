/** Every tunable number of the economy lives here, so balancing never requires touching logic. */
export const BALANCE = {
  tickSeconds: 0.1,
  startingMips: 25,
  postIplMips: 50,
  startingSpool: 12,

  cpu: {
    initiatorUpkeep: 8,
    subsystemUpkeep: 4,
    minLoad: 5,
    thrashAbove: 100,
    maxReduction: 0.45,
    coolingReductionPerLevel: 0.05,
  },
  ram: { gbPerUpgrade: 16, gbPerSubsystem: 2 },
  batch: { extraSlotBonus: 0.18 },

  multiplier: {
    perToken: 0.25,
    purge: 2,
    telemetry: 1.5,
    printing: 3.5,
    jammed: 0.7,
    spoolFull: 0.5,
    thrashing: 0.5,
  },

  click: { base: 2, perLevel: 4, mpsShare: 0.08, submitCommandMult: 1.25 },

  spool: {
    fullAt: 99.5,
    fillPerSec: { IDLE: 0.25, CANCELLED: 0.25, PRINTING: 0.65, JAMMED: 2.4 },
  },
  printer: {
    baseJamPct: 7.5,
    jamPctPerPaperLevel: 1.2,
    minJamPct: 1.5,
    rexxRecoveryPerSec: 0.25,
  },
  buffs: { purgeSec: 20, purgeCooldownSec: 35, telemetrySec: 15 },

  ipl: { minRunMips: 10_000, tokenDivisor: 8000, tokenExponent: 0.42 },
  offline: { thresholdSec: 120, efficiency: 0.75 },

  costs: {
    initiator: { base: 75, growth: 2.1 },
    ziip: { base: 1800, growth: 3.2 },
    click: { base: 25, growth: 1.75 },
    paper: { base: 180, growth: 2.2, maxLevel: 5 },
    ram: { base: 400, growth: 2.5 },
    cooling: { base: 600, growth: 2.6, maxLevel: 8 },
    rexx: 15_000,
  },
} as const;
