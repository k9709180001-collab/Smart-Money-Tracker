import { OptionChainRow, FiiDiiData } from "../types";

export const DEFAULT_SPOT_PRICE = 24018.45;

export const DEFAULT_OPTION_CHAIN: OptionChainRow[] = [
  {
    strike: 23700,
    callOI: 12400,
    callOIchg: 8.5,
    callLtp: 324.50,
    putLtp: 12.10,
    putOIchg: -14.2,
    putOI: 85200,
  },
  {
    strike: 23800,
    callOI: 17800,
    callOIchg: 12.1,
    callLtp: 242.00,
    putLtp: 18.30,
    putOIchg: -5.6,
    putOI: 74600,
  },
  {
    strike: 23900,
    callOI: 28500,
    callOIchg: 15.4,
    callLtp: 164.80,
    putLtp: 38.65,
    putOIchg: 85.3,
    putOI: 112400, // Strong Support Base
  },
  {
    strike: 23950,
    callOI: 14200,
    callOIchg: -4.2,
    callLtp: 131.10,
    putLtp: 52.40,
    putOIchg: 34.6,
    putOI: 41200,
  },
  {
    strike: 24000, // ATM
    callOI: 82000, // Solid Call buildup
    callOIchg: 110.5,
    callLtp: 101.45,
    putLtp: 76.80,
    putOIchg: 48.2,
    putOI: 68300,
  },
  {
    strike: 24050,
    callOI: 44600,
    callOIchg: 45.1,
    callLtp: 75.30,
    putLtp: 104.90,
    putOIchg: 18.4,
    putOI: 29500,
  },
  {
    strike: 24100,
    callOI: 124500, // Peak Resistance Call Writer
    callOIchg: 86.4,
    callLtp: 52.15,
    putLtp: 138.40,
    putOIchg: 5.2,
    putOI: 15400,
  },
  {
    strike: 24200,
    callOI: 92400,
    callOIchg: 22.8,
    callLtp: 22.85,
    putLtp: 216.50,
    putOIchg: -12.1,
    putOI: 7800,
  },
  {
    strike: 24300,
    callOI: 68100,
    callOIchg: 10.3,
    callLtp: 8.20,
    putLtp: 304.10,
    putOIchg: -18.5,
    putOI: 2100,
  },
];

export const DEFAULT_FII_DII: FiiDiiData = {
  fiiCashNet: -1452.80,      // FII selling in Cash
  diiCashNet: 1845.50,       // DII buying in Cash
  fiiIndexFuturesNet: -2410, // Slight short setup in Futures
  fiiIndexOptionsNet: 48500, // Massive Index Put writing / option buying mix
  date: "2026-06-18",
};
