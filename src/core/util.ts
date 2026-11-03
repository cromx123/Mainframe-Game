/** Returns a float in [0, 1); injected so randomness stays testable. */
export type Rng = () => number;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function sum(values: readonly number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

/** Index lookup clamped to the list bounds; for tables like hardware generations. */
export function at<T>(list: readonly T[], index: number): T {
  const item = list[clamp(Math.floor(index), 0, list.length - 1)];
  if (item === undefined) throw new Error('at(): empty list');
  return item;
}

export function recordOf<T extends { readonly id: string }, V>(
  list: readonly T[],
  value: (item: T) => V,
): Record<T['id'], V> {
  return Object.fromEntries(list.map((item) => [item.id, value(item)])) as Record<T['id'], V>;
}

export function indexById<T extends { readonly id: string }>(
  list: readonly T[],
): Record<T['id'], T> {
  return recordOf(list, (item) => item);
}
