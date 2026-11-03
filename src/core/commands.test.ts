import { describe, expect, it } from 'vitest';
import { normalizeCommand, runCommand } from './commands';
import { always, game } from './test-helpers';

describe('runCommand', () => {
  it('normalizes case and spacing', () => {
    expect(normalizeCommand('  d   a,l ')).toBe('D A,L');
    const { game: next, log } = runCommand(game(), ' d a,l', always(0));
    expect(next.run.telemetryBuff).toBe(15);
    expect(log.map((line) => line.code)).toEqual(['TSO', 'IEE115I', 'WLM001I']);
  });

  it('echoes and rejects unknown commands', () => {
    const { log } = runCommand(game(), 'IPL NOW', always(0));
    expect(log[0]?.text).toBe('> IPL NOW');
    expect(log[1]?.code).toBe('IKJ56500I');
  });

  it('submits a batch job worth 1.25x the click power', () => {
    const { game: next, log } = runCommand(game(), 'SUBMIT', always(0));
    expect(next.run.mips.toNumber()).toBeCloseTo(25 + (2 + 2.5 * 0.08) * 1.25);
    expect(log[1]?.text).toContain('JOB10000');
  });

  it('lists every command in HELP', () => {
    const { log } = runCommand(game(), '?', always(0));
    const text = log.map((line) => line.text).join('\n');
    for (const cmd of ['SUBMIT', '$P', 'D A,L', 'S PR1', 'C PR1', 'C U=ALL']) {
      expect(text).toContain(cmd);
    }
  });

  it('ignores blank input', () => {
    const start = game();
    expect(runCommand(start, '   ', always(0))).toEqual({ game: start, log: [] });
  });
});
