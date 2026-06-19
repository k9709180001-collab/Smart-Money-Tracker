import React from "react";
import { DerivativesReport } from "../types";
import { 
  TrendingUp, TrendingDown, HelpCircle, ShieldAlert, Award, Zap, 
  Target, AlertTriangle, ArrowUpRight, ArrowDownRight, Compass 
} from "lucide-react";

interface AnalystReportProps {
  report: DerivativesReport | null;
  loading: boolean;
}

export default function AnalystReport({ report, loading }: AnalystReportProps) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[350px]">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <Compass className="absolute text-indigo-600 animate-pulse" size={20} />
        </div>
        <h3 className="text-slate-800 font-semibold text-lg font-sans">
          Analyzing Option Chain &amp; FII/DII Sentiment...
        </h3>
        <p className="text-slate-500 text-xs font-mono max-w-sm mt-2 leading-relaxed">
          Calculating Put-Call Ratio (PCR), identifying Short Covering and Long Unwinding zones, and compiling institutional alignment models via server-side Gemini 3.5...
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <HelpCircle className="text-slate-400 mb-3" size={32} />
        <h3 className="text-slate-800 font-semibold text-base font-sans">
          No active report analyzed.
        </h3>
        <p className="text-slate-500 text-xs max-w-md mt-1 leading-relaxed">
          Tweak Option Chain data points or paste raw Sensibull text, then click the **Generate Derivatives Intelligence** button above to generate a professional quant report.
        </p>
      </div>
    );
  }

  const getPcrColor = (interpretation: string) => {
    const inter = interpretation.toLowerCase();
    if (inter.includes("overbought")) return "text-red-700 bg-red-50 border-red-200";
    if (inter.includes("oversold")) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (inter.includes("bullish")) return "text-teal-700 bg-teal-50 border-teal-200";
    if (inter.includes("bearish")) return "text-rose-700 bg-rose-50 border-rose-200";
    return "text-slate-700 bg-slate-50 border-slate-205";
  };

  const getInstSummaryColor = (summary: string) => {
    const s = summary.toLowerCase();
    if (s.includes("bullish")) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (s.includes("bearish")) return "text-red-700 bg-red-50 border-red-200";
    return "text-amber-800 bg-amber-50 border-amber-200";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="analyst-report-section">
      {/* Fallback warning alert banner for rate limits */}
      {report?.pcr?.details && (report.pcr.details.includes("Fallback Analysis") || report.pcr.details.includes("overloading")) && (
        <div className="lg:col-span-12 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-xs items-center leading-relaxed">
          <AlertTriangle className="text-amber-600 flex-shrink-0 animate-pulse" size={18} />
          <div>
            <span className="font-bold">Gemini API Dynamic Fallback Activated:</span> Gemini AI is currently at standard free-tier limit capacity. QuantaTrader's high-fidelity <span className="font-semibold text-amber-900">local math matrix engine</span> has executed instant fallback calculations so you get perfectly accurate Open Interest, PCR, Max Pain, and Spreads suggestions with zero interruption!
          </div>
        </div>
      )}

      {/* LEFT: PCR + Supports/Resistances + Traps (7 columns) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* PCR Summary Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 w-24 h-24 bg-indigo-550/5 rounded-full blur-xl" />
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
              [Section 1] PCR &amp; OI Interpretation
            </h4>
            <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getPcrColor(report.pcr.interpretation)}`}>
              PCR: {report.pcr.value.toFixed(2)} — {report.pcr.interpretation}
            </span>
          </div>

          <p className="text-sm text-slate-750 leading-relaxed font-sans mt-2">
            {report.pcr.details}
          </p>
        </div>

        {/* Support & Resistance Table/Cards */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mb-4">
            Option Chain Support &amp; Resistance Levels
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SUPPORT COLUMN */}
            <div className="bg-slate-50 p-4 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-3">
                <ArrowDownRight size={14} />
                <span>Market Supports (PE Writer Base)</span>
              </div>
              <div className="space-y-3">
                {report.supportResistance.supportStrikes.map((s, i) => (
                  <div key={i} className="border-b border-slate-200 last:border-0 pb-2.5 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-extrabold text-slate-800 font-mono">₹{s.strike}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold">
                        OI: {s.oi.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-sans">
                      {s.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* RESISTANCE COLUMN */}
            <div className="bg-slate-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-1.5 text-red-700 font-bold text-xs uppercase tracking-wider mb-3">
                <ArrowUpRight size={14} />
                <span>Market Resistances (CE Writer Base)</span>
              </div>
              <div className="space-y-3">
                {report.supportResistance.resistanceStrikes.map((r, i) => (
                  <div key={i} className="border-b border-slate-200 last:border-0 pb-2.5 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-extrabold text-slate-800 font-mono">₹{r.strike}</span>
                      <span className="text-[10px] text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded font-mono font-bold">
                        OI: {r.oi.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-sans">
                      {r.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Max Pain Indicator */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-mono font-medium">Calculated Option Expiry Max Pain Spot:</span>
            <span className="text-sm font-extrabold text-amber-600 font-mono">
              ₹{report.supportResistance.maxPain.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Traps & Scenarios Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 -mr-6 -mb-6 w-24 h-24 bg-red-550/5 rounded-full blur-xl" />
          
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <AlertTriangle className="text-amber-500" size={18} />
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
              [Section 3] Market Trap &amp; Expiry Breakout Scenarios
            </h4>
          </div>

          <div className="space-y-4">
            {/* Short Covering Column */}
            <div className="bg-slate-100/60 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-red-700 font-mono mb-1.5">
                <span>SHORT COVERING RALLY TRIGGER</span>
                <span className="bg-red-50 text-red-700 font-extrabold px-2 py-0.5 rounded border border-red-200">
                  ⚡ &gt; ₹{report.trapsAndScenarios.shortCoveringTrigger}
                </span>
              </div>
              <p className="text-xs text-slate-650 leading-relaxed font-sans">
                {report.trapsAndScenarios.shortCoveringDetails}
              </p>
            </div>

            {/* Long Unwinding Column */}
            <div className="bg-slate-100/60 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 font-mono mb-1.5">
                <span>LONG UNWINDING DUMP TRIGGER</span>
                <span className="bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                  ⚡ &lt; ₹{report.trapsAndScenarios.longUnwindingTrigger}
                </span>
              </div>
              <p className="text-xs text-slate-650 leading-relaxed font-sans">
                {report.trapsAndScenarios.longUnwindingDetails}
              </p>
            </div>

            {/* Aggressive Traders Trap Zone */}
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="text-xs font-bold text-red-800 font-mono uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldAlert size={14} className="text-red-600" />
                <span>Aggressive Trap Zone: {report.trapsAndScenarios.trapLevel}</span>
              </div>
              <p className="text-xs text-red-700 leading-relaxed font-sans">
                {report.trapsAndScenarios.trapExplanation}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT: Institutional Activity Alignment + Actionable trading strategies (5 columns) */}
      <div className="lg:col-span-12 xl:col-span-5 space-y-6">
        
        {/* Institutional Activity Alignment box */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 w-24 h-24 bg-amber-550/5 rounded-full blur-xl" />
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
              [Section 2] Institutional Alignment
            </h4>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getInstSummaryColor(report.institutionalAlignment.summary)}`}>
              {report.institutionalAlignment.summary}
            </span>
          </div>

          <div className="text-xs text-slate-700 leading-relaxed font-sans space-y-3">
            <p className="font-bold text-slate-800">
              Contradiction Review (Cash Sell vs Index Put Write):
            </p>
            <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 italic text-slate-600">
              {report.institutionalAlignment.analysis}
            </p>
          </div>
        </div>

        {/* Actionable Trading setups / strategy recommendations */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Award className="text-indigo-600" size={18} />
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
              [Section 4] Suggested Option setups
            </h4>
          </div>

          <div className="space-y-4">
            {report.suggestedStrategies.map((strat, sIdx) => (
              <div 
                key={strat.name} 
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition shadow-inner"
              >
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{strat.name}</span>
                  <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono font-semibold">
                    {strat.type}
                  </span>
                </div>

                {/* Specific option legs inside strategy */}
                <div className="space-y-1.5 mb-3.5">
                  {strat.legs.map((leg, lIdx) => (
                    <div key={lIdx} className="flex justify-between items-center text-xs font-mono bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${leg.action === 'BUY' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-100'}`}>
                        {leg.action}
                      </span>
                      <span className="text-slate-700 font-medium font-sans">Strike ₹{leg.strike}</span>
                      <span className="text-slate-800 font-bold">{leg.type}</span>
                      <span className="text-slate-500 text-[10px]">LTP: ₹{leg.premium}</span>
                    </div>
                  ))}
                </div>

                {/* Return Matrix */}
                <div className="grid grid-cols-2 gap-2 mb-3.5 text-center">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-500 font-mono block">Max Profit</span>
                    <span className="text-xs font-bold text-emerald-700">{strat.maxProfit}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-500 font-mono block">Max Loss</span>
                    <span className="text-xs font-bold text-red-700">{strat.maxLoss}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-500 font-mono block">R/R Ratio</span>
                    <span className="text-xs font-bold text-indigo-700">{strat.riskRewardRatio}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-500 font-mono block">Break-Evens</span>
                    <span className="text-[10px] font-bold text-amber-700 font-mono">{strat.breakEven}</span>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-150 p-3 rounded-lg">
                  <span className="text-[10px] text-indigo-800 font-mono font-bold uppercase block mb-1">
                    🎯 Tactical Execution Guidelines:
                  </span>
                  <p className="text-xs text-slate-750 leading-relaxed font-sans">
                    {strat.tacticalEntryExit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
