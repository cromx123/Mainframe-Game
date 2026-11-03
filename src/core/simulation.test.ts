import { describe, expect, it } from 'vitest';
import { advance, step } from './simulation';
import { always, game, T0 } from './test-helpers';

describe('step', () => {
  it('accrues production into mips and run earnings', () => {
    const { game: next } = step(game(), 1, always(0.5));
    expect(next.run.mips.toNumber()).toBeCloseTo(27.5);
    expect(next.run.earned.toNumber()).toBeCloseTo(27.5);
  });

  it('fills the spool according to the printer state and DASD', () => {
    expect(step(game({ spool: 0 }), 1, always(0.5)).game.run.spool).toBeCloseTo(0.25);
    expect(step(game({ spool: 0 }, { dasdLevel: 4 }), 1, always(0.5)).game.run.spool).toBeCloseTo(
      0.0625,
    );
  });

  it('jams the printer on an unlucky roll', () => {
    const printing = game({ printer: 'PRINTING' });
    expect(step(printing, 0.1, always(0.999)).game.run.printer).toBe('PRINTING');
    const { game: jammed, log } = step(printing, 0.1, always(0));
    expect(jammed.run.printer).toBe('JAMMED');
    expect(log[0]?.code).toBe('*HASP190');
  });

  it('lets the REXX auto-operator recover a jam', () => {
    const jammed = game({ printer: 'JAMMED' }, { rexxAutoOp: true });
    expect(step(jammed, 0.1, always(0)).game.run.printer).toBe('PRINTING');
  });

  it('counts buffs down', () => {
    const { game: next } = step(game({ purgeBuff: 1, telemetryBuff: 0.05 }), 0.1, always(0.5));
    expect(next.run.purgeBuff).toBeCloseTo(0.9);
    expect(next.run.telemetryBuff).toBe(0);
  });
});

describe('advance', () => {
  it('runs whole fixed steps and keeps the remainder for the next tick', () => {
    const { game: next } = advance(game(), T0 + 1050, always(0.5));
    expect(next.lastTick).toBe(T0 + 1000);
    expect(next.run.mips.toNumber()).toBeCloseTo(27.5);
  });

  it('ignores a clock that went backwards', () => {
    const { game: next } = advance(game(), T0 - 5000, always(0.5));
    expect(next.lastTick).toBe(T0 - 5000);
    expect(next.run.mips.toNumber()).toBe(25);
  });

  it('credits long gaps as offline time capped by the DASD volume', () => {
    const { game: next, offline } = advance(
      game({ printer: 'PRINTING' }),
      T0 + 3_600_000,
      always(0),
    );
    expect(offline?.abend).toBe(true);
    expect(offline?.creditedSec).toBe(1800);
    expect(offline?.gained.toNumber()).toBeCloseTo(2.5 * 1800 * 0.75);
    expect(next.run.printer).toBe('JAMMED');
    expect(next.lastTick).toBe(T0 + 3_600_000);
  });

  it('does not abend when the DASD volume holds the whole absence', () => {
    const { offline } = advance(game({}, { dasdLevel: 1 }), T0 + 3_600_000, always(0));
    expect(offline?.abend).toBe(false);
    expect(offline?.creditedSec).toBe(3600);
  });
});
