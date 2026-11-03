import type { GameState } from './state';

export type Tone = 'normal' | 'info' | 'highlight' | 'warn' | 'error' | 'cmd';

export interface LogMessage {
  code: string;
  text: string;
  tone: Tone;
}

/** Result of any game action: the next state plus console messages to print. */
export interface Outcome {
  game: GameState;
  log: LogMessage[];
}

export function msg(code: string, text: string, tone: Tone = 'normal'): LogMessage {
  return { code, text, tone };
}

export function outcome(game: GameState, ...log: LogMessage[]): Outcome {
  return { game, log };
}
