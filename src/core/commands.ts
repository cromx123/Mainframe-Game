import * as actions from './actions';
import { BALANCE } from './balance';
import { formatNumber } from './format';
import { msg, outcome, type LogMessage, type Outcome } from './log';
import type { GameState } from './state';
import type { Rng } from './util';

interface Command {
  syntax: string;
  help: string;
  matches: (cmd: string) => boolean;
  run: (game: GameState, rng: Rng) => Outcome;
}

const is =
  (...names: string[]) =>
  (cmd: string) =>
    names.includes(cmd);

const { buffs, multiplier } = BALANCE;

const COMMANDS: readonly Command[] = [
  {
    syntax: 'SUBMIT',
    help: 'Submit JCL Batch Job manually (+MIPS)',
    matches: (cmd) => cmd === 'SUBMIT' || cmd === 'SUB' || cmd.startsWith('SUBMIT '),
    run: submit,
  },
  {
    syntax: '$P',
    help: `Purge JES2 Spool & gain +${(multiplier.purge - 1) * 100}% MIPS for ${buffs.purgeSec}s`,
    matches: is('$P', 'P SPOOL', '$P SPOOL'),
    run: actions.purgeSpool,
  },
  {
    syntax: 'D A,L',
    help: `Display Active System & gain +${(multiplier.telemetry - 1) * 100}% MIPS for ${buffs.telemetrySec}s`,
    matches: is('D A,L', 'D MIPS', 'DA'),
    run: actions.displayActive,
  },
  {
    syntax: 'S PR1',
    help: `Start Printer PR1 (x${multiplier.printing} MIPS/s Risk/Reward Buff)`,
    matches: is('S PR1', '$S PR1'),
    run: actions.startPrinter,
  },
  {
    syntax: 'C PR1',
    help: 'Cancel jammed Printer PR1 (Step 1 of recovery)',
    matches: is('C PR1', '$C PR1', 'C PR1,I'),
    run: actions.cancelPrinter,
  },
  {
    syntax: 'C U=ALL',
    help: 'Emergency close all extra windows to stop Thrashing',
    matches: is('C U=ALL', 'K E,D'),
    run: actions.closeAllWindows,
  },
  {
    syntax: 'HELP',
    help: 'Show this command reference',
    matches: is('HELP', '?'),
    run: help,
  },
];

function submit(game: GameState, rng: Rng): Outcome {
  const result = actions.submitJcl(game, BALANCE.click.submitCommandMult);
  const jobNumber = Math.floor(10_000 + rng() * 89_999);
  return outcome(
    result.game,
    msg(
      'IKJ56250I',
      `JOB BATCH01(JOB${jobNumber}) SUBMITTED. +${formatNumber(result.gained)} MIPS`,
      'info',
    ),
  );
}

function help(game: GameState): Outcome {
  const lines = COMMANDS.filter((cmd) => cmd.syntax !== 'HELP').map((cmd, i) =>
    msg(`HELP${String(i + 2).padStart(2, '0')}I`, `${cmd.syntax.padEnd(8)} : ${cmd.help}`),
  );
  return outcome(
    game,
    msg('HELP01I', '--- z/OS MASTER CONSOLE COMMAND REFERENCE ---', 'highlight'),
    ...lines,
  );
}

export function normalizeCommand(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, ' ');
}

export function runCommand(game: GameState, raw: string, rng: Rng): Outcome {
  const cmd = normalizeCommand(raw);
  if (!cmd) return outcome(game);

  const echo = msg('TSO', `> ${cmd}`, 'cmd');
  const command = COMMANDS.find((candidate) => candidate.matches(cmd));
  if (!command) {
    return outcome(
      game,
      echo,
      msg('IKJ56500I', `COMMAND "${cmd}" NOT FOUND. TYPE "HELP" FOR SYNTAX.`, 'error'),
    );
  }
  const result = command.run(game, rng);
  return { game: result.game, log: [echo, ...result.log] };
}

export function welcomeLog(game: GameState): LogMessage[] {
  const n = game.run.initiatorsActive;
  return [
    msg('IEE114I', 'ZOS1 INITIALIZATION COMPLETE - LPAR ONLINE', 'info'),
    msg('$HASP000', `JES2 SPOOL READY. ${n} INITIATOR${n === 1 ? '' : 'S'} ACTIVE.`),
    msg('IKJ56700A', 'ENTER COMMAND OR TYPE "HELP" FOR TSO OPERATIONS.', 'highlight'),
  ];
}
