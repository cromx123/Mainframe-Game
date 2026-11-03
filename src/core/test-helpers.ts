import Decimal from 'break_eternity.js';
import {
  createGame,
  patchMeta,
  patchRun,
  type GameState,
  type MetaState,
  type RunState,
} from './state';

export const T0 = 1_700_000_000_000;

export function game(run: Partial<RunState> = {}, meta: Partial<MetaState> = {}): GameState {
  return patchMeta(patchRun(createGame(T0), run), meta);
}

export function rich(amount = 1e12): Partial<RunState> {
  return { mips: new Decimal(amount) };
}

export const always = (value: number) => () => value;
