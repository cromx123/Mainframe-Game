import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import { deserializeSave, SAVE_VERSION, serializeSave } from './save';
import { defaultSettings } from './settings';
import { game, T0 } from './test-helpers';

const NOW = T0 + 60_000;

describe('save round-trip', () => {
  it('restores the exact game and settings', () => {
    const original = game(
      { mips: new Decimal('1.5e45'), printer: 'JAMMED', initiatorsOwned: 3, initiatorsActive: 2 },
      { archTokens: new Decimal(12), dasdLevel: 3, rexxAutoOp: true },
    );
    const settings = { ...defaultSettings(), scanlines: false };
    const loaded = deserializeSave(serializeSave(original, settings, NOW), NOW);

    expect(loaded?.game.run.mips.eq(original.run.mips)).toBe(true);
    expect(loaded?.game.run.printer).toBe('JAMMED');
    expect(loaded?.game.run.initiatorsActive).toBe(2);
    expect(loaded?.game.meta.archTokens.toNumber()).toBe(12);
    expect(loaded?.game.meta.dasdLevel).toBe(3);
    expect(loaded?.game.lastTick).toBe(T0);
    expect(loaded?.settings.scanlines).toBe(false);
  });
});

describe('deserializeSave', () => {
  it('rejects garbage and other versions', () => {
    expect(deserializeSave('not json', NOW)).toBeNull();
    expect(
      deserializeSave(JSON.stringify({ version: SAVE_VERSION + 1, game: {} }), NOW),
    ).toBeNull();
  });

  it('repairs damaged or out-of-range fields instead of discarding the save', () => {
    const raw = JSON.stringify({
      version: SAVE_VERSION,
      game: {
        lastTick: NOW + 999_999,
        run: {
          mips: 'NaN',
          initiatorsOwned: 2,
          initiatorsActive: 50,
          printer: 'ON FIRE',
          jobs: { batch01: 7, removedJob: 3 },
          openWindows: { sdsf: true, tso: false },
        },
        meta: { hardwareGen: 99, unlockedWindows: { sdsf: false } },
      },
    });
    const loaded = deserializeSave(raw, NOW);

    expect(loaded?.game.run.initiatorsActive).toBe(2);
    expect(loaded?.game.run.printer).toBe('IDLE');
    expect(loaded?.game.run.jobs.batch01).toBe(7);
    expect(loaded?.game.run.jobs.sort02).toBe(0);
    expect(loaded?.game.run.openWindows.tso).toBe(true);
    expect(loaded?.game.run.openWindows.sdsf).toBe(false);
    expect(loaded?.game.meta.hardwareGen).toBe(5);
    expect(loaded?.game.lastTick).toBe(NOW);
  });
});
