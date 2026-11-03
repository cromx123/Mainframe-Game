import Decimal from 'break_eternity.js';

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'] as const;

// Floors instead of rounding: a currency display must never claim more than the player has.
function floorTo(value: number, places: number): string {
  const factor = 10 ** places;
  return (Math.floor(value * factor + 1e-9) / factor).toFixed(places);
}

export function formatNumber(value: Decimal | number, decimals = 1): string {
  const d = new Decimal(value);
  if (d.isNan()) return '0';
  if (d.lt(0)) return '-' + formatNumber(d.neg(), decimals);

  if (d.lt(1000)) {
    const n = d.toNumber();
    return floorTo(n, n < 10 ? decimals : 0);
  }

  let tier = Math.floor(d.log10().toNumber() / 3);
  if (!Number.isFinite(tier) || tier >= SUFFIXES.length) {
    return d.toExponential(2).replace('e+', 'e');
  }

  let scaled = d.div(Decimal.pow(1000, tier)).toNumber();
  if (scaled >= 1000) {
    tier += 1;
    scaled /= 1000;
  }
  const suffix = SUFFIXES[tier];
  if (suffix === undefined) return d.toExponential(2).replace('e+', 'e');
  return floorTo(scaled, decimals) + suffix;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}
