import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import {
  buyInitiator,
  buyJob,
  cancelPrinter,
  performIpl,
  purgeSpool,
  setActiveInitiators,
  startPrinter,
  toggleWindow,
  unlockWindow,
} from './actions';
import { game, rich } from './test-helpers';

describe('purchases', () => {
  it('levels up a job and charges the scaled cost', () => {
    const { game: next } = buyJob(game({ mips: new Decimal(100) }), 'batch01');
    expect(next.run.jobs.batch01).toBe(2);
    expect(next.run.mips.toNumber()).toBe(100 - 17);
  });

  it('returns the same state when the player cannot afford it', () => {
    const start = game({ mips: new Decimal(10) });
    expect(buyJob(start, 'batch01').game).toBe(start);
  });

  it('allocates initiators as owned and active', () => {
    const { game: next, log } = buyInitiator(game(rich()));
    expect(next.run.initiatorsOwned).toBe(2);
    expect(next.run.initiatorsActive).toBe(2);
    expect(log[0]?.code).toBe('$HASP100');
  });

  it('clamps active initiators to what the player owns', () => {
    const start = game({ initiatorsOwned: 3 });
    expect(setActiveInitiators(start, 9).game.run.initiatorsActive).toBe(3);
    expect(setActiveInitiators(start, -1).game.run.initiatorsActive).toBe(0);
  });
});

describe('window manager', () => {
  it('auto-opens a newly licensed session when RAM allows', () => {
    const { game: next } = unlockWindow(game(rich()), 'sdsf');
    expect(next.meta.unlockedWindows.sdsf).toBe(true);
    expect(next.run.openWindows.sdsf).toBe(true);
  });

  it('refuses to open a session without free RAM', () => {
    const start = game(
      {
        openWindows: {
          tso: true,
          sdsf: true,
          jes2: true,
          cics: true,
          hardware: false,
          sysview: false,
        },
      },
      {
        unlockedWindows: {
          tso: true,
          sdsf: true,
          jes2: true,
          cics: true,
          hardware: true,
          sysview: true,
        },
      },
    );
    const result = toggleWindow(start, 'sysview');
    expect(result.game.run.openWindows.sysview).toBe(false);
    expect(result.log[0]?.code).toBe('IRA200E');
  });

  it('never closes the TSO console', () => {
    const start = game();
    expect(toggleWindow(start, 'tso').game).toBe(start);
  });
});

describe('console mechanics', () => {
  it('purges the spool, grants the overclock and starts the cooldown', () => {
    const { game: purged } = purgeSpool(game({ spool: 80 }));
    expect(purged.run.spool).toBe(0);
    expect(purged.run.purgeBuff).toBe(20);
    expect(purgeSpool(purged).log[0]?.code).toBe('$HASP649');
  });

  it('requires cancelling a jammed printer before restarting it', () => {
    const jammed = game({ printer: 'JAMMED' });
    expect(startPrinter(jammed).game.run.printer).toBe('JAMMED');
    const cancelled = cancelPrinter(jammed).game;
    expect(cancelled.run.printer).toBe('CANCELLED');
    expect(startPrinter(cancelled).game.run.printer).toBe('PRINTING');
  });
});

describe('performIpl', () => {
  it('does nothing below the threshold', () => {
    const start = game({ earned: new Decimal(9_000) });
    expect(performIpl(start).game).toBe(start);
  });

  it('resets the run, keeps meta progress and pays out tokens', () => {
    const start = game(
      { earned: new Decimal(30_000), mips: new Decimal(5_000), initiatorsOwned: 4, spool: 70 },
      { dasdLevel: 2, rexxAutoOp: true, ziipEngines: 1 },
    );
    const { game: next } = performIpl(start);
    expect(next.run.mips.toNumber()).toBe(50);
    expect(next.run.initiatorsOwned).toBe(1);
    expect(next.run.spool).toBe(0);
    expect(next.meta.iplCount).toBe(1);
    expect(next.meta.archTokens.toNumber()).toBe(1);
    expect(next.meta.ziipEngines).toBe(2);
    expect(next.meta.hardwareGen).toBe(1);
    expect(next.meta.dasdLevel).toBe(2);
    expect(next.meta.rexxAutoOp).toBe(true);
  });
});
