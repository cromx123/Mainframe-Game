import Decimal from 'break_eternity.js';
import { BALANCE } from './balance';
import type { JobDef, SubsystemDef } from './content';

function scaled(base: number, growth: number, level: number): Decimal {
  return Decimal.pow(growth, level).mul(base).floor();
}

const C = BALANCE.costs;

export const cost = {
  job: (def: JobDef, level: number) => scaled(def.baseCost, def.costGrowth, level),
  subsystem: (def: SubsystemDef, level: number) => scaled(def.baseCost, def.costGrowth, level),
  initiator: (owned: number) => scaled(C.initiator.base, C.initiator.growth, owned - 1),
  ziip: (engines: number) => scaled(C.ziip.base, C.ziip.growth, engines),
  click: (level: number) => scaled(C.click.base, C.click.growth, level),
  paper: (level: number) => scaled(C.paper.base, C.paper.growth, level),
  ram: (level: number) => scaled(C.ram.base, C.ram.growth, level),
  cooling: (level: number) => scaled(C.cooling.base, C.cooling.growth, level),
  rexx: () => new Decimal(C.rexx),
};
