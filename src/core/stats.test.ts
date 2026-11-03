import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import { computeStats, pendingTokens } from './stats';
import { game } from './test-helpers';

describe('computeStats', () => {
  it('describes a fresh z12 with one initiator running BATCH01', () => {
    const stats = computeStats(game());
    expect(stats.mipsPerSecond.toNumber()).toBeCloseTo(2.5);
    expect(stats.cpu.total).toBe(13);
    expect(stats.ramUsed).toBe(2);
    expect(stats.ramTotal).toBe(16);
    expect(stats.thrashing).toBe(false);
  });

  it('gives the scarce slots to the most productive jobs', () => {
    const stats = computeStats(game({ jobs: { batch01: 1, sort02: 1, db2unld: 0, imsbkup: 0 } }));
    expect([...stats.runningJobs]).toEqual(['sort02']);
    expect(stats.batchMips.toNumber()).toBeCloseTo(14);
  });

  it('turns idle slots into a parallelism bonus', () => {
    const stats = computeStats(game({}, { ziipEngines: 2 }));
    expect(stats.slots).toBe(3);
    expect(stats.batchMips.toNumber()).toBeCloseTo(2.5 * 1.36);
  });

  it('halves production when CPU goes over 100%', () => {
    const calm = computeStats(game({ initiatorsOwned: 10, initiatorsActive: 1 }));
    const thrashing = computeStats(game({ initiatorsOwned: 13, initiatorsActive: 13 }));
    expect(thrashing.cpu.total).toBe(109);
    expect(thrashing.thrashing).toBe(true);
    expect(thrashing.multiplier.toNumber()).toBe(calm.multiplier.toNumber() * 0.5);
  });

  it('applies printer, spool and token multipliers', () => {
    expect(computeStats(game({ printer: 'PRINTING' })).multiplier.toNumber()).toBe(3.5);
    expect(computeStats(game({ printer: 'JAMMED' })).multiplier.toNumber()).toBeCloseTo(0.7);
    expect(computeStats(game({ spool: 100 })).multiplier.toNumber()).toBe(0.5);
    expect(computeStats(game({}, { archTokens: new Decimal(4) })).multiplier.toNumber()).toBe(2);
  });

  it('flags a hardware upgrade once the run earned enough', () => {
    expect(computeStats(game({ earned: new Decimal(24_999) })).hardwareUpgradeReady).toBe(false);
    expect(computeStats(game({ earned: new Decimal(25_000) })).hardwareUpgradeReady).toBe(true);
  });
});

describe('pendingTokens', () => {
  it('requires 10K MIPS this run and grows sub-linearly', () => {
    expect(pendingTokens(new Decimal(9_999)).toNumber()).toBe(0);
    expect(pendingTokens(new Decimal(10_000)).toNumber()).toBe(1);
    expect(pendingTokens(new Decimal(8e6)).toNumber()).toBe(18);
  });
});
