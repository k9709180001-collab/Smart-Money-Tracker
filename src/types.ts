export interface OptionChainRow {
  strike: number;
  callOI: number;      // Open Interest in contracts or lakhs
  callOIchg: number;   // Change in Open Interest % or contracts
  callLtp: number;     // Last Traded Price
  putLtp: number;      // Last Traded Price
  putOIchg: number;    // Put Change in Open Interest % or contracts
  putOI: number;       // Put Open Interest
}

export interface FiiDiiData {
  fiiCashNet: number;       // Net Cash Flow in Crores (INR) - e.g. -1200
  diiCashNet: number;       // Net Cash Flow in Crores (INR) - e.g. 1500
  fiiIndexFuturesNet: number; // Index Futures net contracts - e.g. -4500
  fiiIndexOptionsNet: number; // Index Options net contracts - e.g. 23000
  date: string;
}

export interface PCRSummary {
  value: number;
  interpretation: string; // "Overbought", "Neutral", "Oversold", "Moderately Bullish", "Moderately Bearish"
  details: string;        // Hinglish/English interpretation explaining current PCR
}

export interface SupportResistanceItem {
  strike: number;
  oi: number;
  details: string;       // Why this represents a support/resistance, e.g. Highest Put writer buildup
}

export interface SupportResistanceAnalysis {
  supportStrikes: SupportResistanceItem[];
  resistanceStrikes: SupportResistanceItem[];
  maxPain: number;
}

export interface InstitutionalAlignmentAnalysis {
  summary: string;       // "Bullish Align", "Bearish Align", "Contradictory / Hedging Profile", "Neutral"
  analysis: string;      // Deep analysis, especially detailing cases like FII Cash selling but put writing heavy
}

export interface TrapsAndScenariosAnalysis {
  shortCoveringTrigger: number; // Strike above which short covering starts
  shortCoveringDetails: string; // Detailed description of trigger
  longUnwindingTrigger: number; // Strike below which long unwinding starts
  longUnwindingDetails: string; // Detailed description of trigger
  trapLevel: string;            // Vulnerable trap level description
  trapExplanation: string;      // How aggressive traders can get trapped
}

export interface OptionLeg {
  strike: number;
  type: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  premium: number;
}

export interface TradingStrategy {
  name: string;
  type: 'BullCallSpread' | 'BearPutSpread' | 'IronCondor' | 'LongStraddle' | 'ShortStrangle' | 'Custom';
  legs: OptionLeg[];
  maxProfit: string;     // Value or description
  maxLoss: string;       // Value or description
  riskRewardRatio: string;
  breakEven: string;     // Strike levels
  tacticalEntryExit: string; // Hinglish tactical instructions
}

export interface DerivativesReport {
  pcr: PCRSummary;
  supportResistance: SupportResistanceAnalysis;
  institutionalAlignment: InstitutionalAlignmentAnalysis;
  trapsAndScenarios: TrapsAndScenariosAnalysis;
  suggestedStrategies: TradingStrategy[];
}

export interface StrategyPayoffPoint {
  stockPrice: number;
  profit: number;
}
