import { indexById } from './util';

export const THEMES = ['green', 'cyan', 'amber'] as const;
export type Theme = (typeof THEMES)[number];

export interface HardwareDef {
  readonly name: string;
  readonly short: string;
  readonly mult: number;
  readonly baseRamGb: number;
  readonly cpuReductionPct: number;
  readonly reqRunMips: number;
}

export const HARDWARE: readonly HardwareDef[] = [
  {
    name: 'IBM zEnterprise z12',
    short: 'z12',
    mult: 1,
    baseRamGb: 16,
    cpuReductionPct: 0,
    reqRunMips: 0,
  },
  {
    name: 'IBM z13 Mainframe',
    short: 'z13',
    mult: 3.5,
    baseRamGb: 32,
    cpuReductionPct: 5,
    reqRunMips: 25_000,
  },
  {
    name: 'IBM z14 ZR1',
    short: 'z14',
    mult: 12,
    baseRamGb: 64,
    cpuReductionPct: 10,
    reqRunMips: 250_000,
  },
  {
    name: 'IBM z15 T01',
    short: 'z15',
    mult: 45,
    baseRamGb: 128,
    cpuReductionPct: 15,
    reqRunMips: 5_000_000,
  },
  {
    name: 'IBM Telum z16',
    short: 'z16',
    mult: 200,
    baseRamGb: 256,
    cpuReductionPct: 20,
    reqRunMips: 150_000_000,
  },
  {
    name: 'IBM Quantum zSystem',
    short: 'zQ',
    mult: 1000,
    baseRamGb: 512,
    cpuReductionPct: 30,
    reqRunMips: 5_000_000_000,
  },
];

export interface WindowDef {
  readonly id: string;
  readonly asid: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly unlockCost: number;
  readonly cpuUpkeep: number;
  readonly ramUpkeep: number;
  readonly alwaysOpen: boolean;
  readonly defaultTheme: Theme;
}

export const WINDOWS = [
  {
    id: 'tso',
    asid: '0001',
    title: 'TSO/E CONSOLE - ZADMIN01',
    shortTitle: 'TSO CONSOLE',
    unlockCost: 0,
    cpuUpkeep: 5,
    ramUpkeep: 2,
    alwaysOpen: true,
    defaultTheme: 'green',
  },
  {
    id: 'sdsf',
    asid: '002A',
    title: 'SDSF DA - ACTIVE JOBS & INITIATORS',
    shortTitle: 'SDSF DA (JOBS)',
    unlockCost: 35,
    cpuUpkeep: 10,
    ramUpkeep: 4,
    alwaysOpen: false,
    defaultTheme: 'cyan',
  },
  {
    id: 'jes2',
    asid: '003F',
    title: 'JES2 SPOOL & PRINTER PR1',
    shortTitle: 'JES2 / PR1',
    unlockCost: 120,
    cpuUpkeep: 8,
    ramUpkeep: 2,
    alwaysOpen: false,
    defaultTheme: 'amber',
  },
  {
    id: 'cics',
    asid: '005C',
    title: 'CICS TS REGIONS & DB2 SUBSYSTEMS',
    shortTitle: 'CICS / DB2',
    unlockCost: 750,
    cpuUpkeep: 12,
    ramUpkeep: 6,
    alwaysOpen: false,
    defaultTheme: 'green',
  },
  {
    id: 'hardware',
    asid: '008E',
    title: 'HCD HARDWARE & DASD 3390 STORAGE',
    shortTitle: 'DASD & RAM',
    unlockCost: 2200,
    cpuUpkeep: 8,
    ramUpkeep: 2,
    alwaysOpen: false,
    defaultTheme: 'cyan',
  },
  {
    id: 'sysview',
    asid: '00FA',
    title: 'SYSVIEW MONITOR & SYSTEM IPL',
    shortTitle: 'SYSVIEW / IPL',
    unlockCost: 10_000,
    cpuUpkeep: 15,
    ramUpkeep: 8,
    alwaysOpen: false,
    defaultTheme: 'amber',
  },
] as const satisfies readonly WindowDef[];

export type WindowId = (typeof WINDOWS)[number]['id'];
export const WINDOW_BY_ID: Record<WindowId, WindowDef> = indexById(WINDOWS);

export interface JobDef {
  readonly id: string;
  readonly jobName: string;
  readonly stepName: string;
  readonly owner: string;
  readonly desc: string;
  readonly baseCost: number;
  readonly costGrowth: number;
  readonly baseMips: number;
  readonly startLevel: number;
}

export const JOBS = [
  {
    id: 'batch01',
    jobName: 'BATCH01',
    stepName: 'COB2RUN',
    owner: 'ZADMIN01',
    desc: 'COBOL Payroll Batch Processing',
    baseCost: 15,
    costGrowth: 1.18,
    baseMips: 2.5,
    startLevel: 1,
  },
  {
    id: 'sort02',
    jobName: 'DFSORT02',
    stepName: 'SORTMERG',
    owner: 'SYSOPR',
    desc: 'DFSORT High-Volume VSAM Merge',
    baseCost: 100,
    costGrowth: 1.2,
    baseMips: 14,
    startLevel: 0,
  },
  {
    id: 'db2unld',
    jobName: 'DB2UNLD',
    stepName: 'DSNUTILB',
    owner: 'DB2ADM',
    desc: 'DB2 Nightly Tablespace Unload',
    baseCost: 650,
    costGrowth: 1.22,
    baseMips: 75,
    startLevel: 0,
  },
  {
    id: 'imsbkup',
    jobName: 'IMSBKUP',
    stepName: 'DFSRRC00',
    owner: 'IMSPROD',
    desc: 'IMS Hierarchical Database Image Copy',
    baseCost: 4200,
    costGrowth: 1.25,
    baseMips: 420,
    startLevel: 0,
  },
] as const satisfies readonly JobDef[];

export type JobId = (typeof JOBS)[number]['id'];
export const JOB_BY_ID: Record<JobId, JobDef> = indexById(JOBS);

export interface SubsystemDef {
  readonly id: string;
  readonly name: string;
  readonly proc: string;
  readonly type: string;
  readonly desc: string;
  readonly baseCost: number;
  readonly costGrowth: number;
  readonly baseMips: number;
  readonly txPerLevel: number;
}

export const SUBSYSTEMS = [
  {
    id: 'cicsprod',
    name: 'CICSPROD',
    proc: 'DFHSIP',
    type: 'CICS TS 5.6',
    desc: 'High-Frequency Online Banking Transactions',
    baseCost: 1000,
    costGrowth: 1.22,
    baseMips: 110,
    txPerLevel: 450,
  },
  {
    id: 'db2mstr',
    name: 'DB2MSTR',
    proc: 'DSNYASCP',
    type: 'DB2 13 z/OS',
    desc: 'Relational Database Buffer Pool Engine',
    baseCost: 6500,
    costGrowth: 1.25,
    baseMips: 680,
    txPerLevel: 1200,
  },
  {
    id: 'mqseries',
    name: 'MQMSTR',
    proc: 'CSQ9MSTR',
    type: 'IBM MQ z/OS',
    desc: 'Enterprise Cross-LPAR Message Queueing',
    baseCost: 38_000,
    costGrowth: 1.28,
    baseMips: 3900,
    txPerLevel: 5400,
  },
  {
    id: 'zosmf',
    name: 'IZUSVR1',
    proc: 'IZUPRM',
    type: 'z/OSMF REST',
    desc: 'Modernized WebSphere Liberty API Gateway',
    baseCost: 250_000,
    costGrowth: 1.3,
    baseMips: 24_000,
    txPerLevel: 18_000,
  },
] as const satisfies readonly SubsystemDef[];

export type SubsystemId = (typeof SUBSYSTEMS)[number]['id'];
export const SUBSYSTEM_BY_ID: Record<SubsystemId, SubsystemDef> = indexById(SUBSYSTEMS);

export interface DasdDef {
  readonly name: string;
  readonly cylinders: number;
  readonly maxOfflineSec: number;
  /** Multiplies how fast the JES2 spool fills up. */
  readonly spoolFillMult: number;
  readonly cost: number;
}

export const DASD: readonly DasdDef[] = [
  { name: '3390 Mod 1', cylinders: 1113, maxOfflineSec: 1800, spoolFillMult: 1.0, cost: 0 },
  { name: '3390 Mod 3', cylinders: 3339, maxOfflineSec: 7200, spoolFillMult: 0.8, cost: 1500 },
  {
    name: '3390 Mod 9',
    cylinders: 10_017,
    maxOfflineSec: 21_600,
    spoolFillMult: 0.6,
    cost: 12_000,
  },
  {
    name: '3390 Mod 27',
    cylinders: 32_760,
    maxOfflineSec: 43_200,
    spoolFillMult: 0.4,
    cost: 95_000,
  },
  {
    name: '3390 Mod 54',
    cylinders: 65_520,
    maxOfflineSec: 86_400,
    spoolFillMult: 0.25,
    cost: 850_000,
  },
];
