import React, { useState } from "react";
import { OptionChainRow } from "../types";
import { ArrowUpRight, ArrowDownRight, Sparkles, Info, Flame, ShieldAlert, BadgeInfo } from "lucide-react";

interface AtmCoiTrackerProps {
  optionChain: OptionChainRow[];
  spotPrice: number;
}

export default function AtmCoiTracker({ optionChain, spotPrice }: AtmCoiTrackerProps) {
  const [showGuide, setShowGuide] = useState(true);

  // Find the closest index to Spot Price to identify ATM strike
  const getAtmIndexRange = () => {
    if (!optionChain || optionChain.length === 0) return [];
    
    // Sort just in case
    const sorted = [...optionChain].sort((a, b) => a.strike - b.strike);
    
    let closestIndex = 0;
    let minDiff = Math.abs(sorted[0].strike - spotPrice);
    
    for (let i = 0; i < sorted.length; i++) {
      const diff = Math.abs(sorted[i].strike - spotPrice);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    // Centered 5 strikes: ATM-2, ATM-1, ATM, ATM+1, ATM+2
    const start = Math.max(0, closestIndex - 2);
    const end = Math.min(sorted.length - 1, closestIndex + 2);
    return sorted.slice(start, end + 1);
  };

  const atmStrikes = getAtmIndexRange();

  // Find the absolute maximum COI (absolute value because change in OI can be positive or negative) for scaling bars
  const maxChgVal = Math.max(
    ...atmStrikes.map(s => Math.max(Math.abs(s.callOIchg), Math.abs(s.putOIchg), 1)),
    10
  );

  // Multi-strike metrics sum
  const callCoiSum = atmStrikes.reduce((acc, curr) => acc + (curr.callOIchg || 0), 0);
  const putCoiSum = atmStrikes.reduce((acc, curr) => acc + (curr.putOIchg || 0), 0);
  
  // Decide overall bias around ATM
  let biasLabel = "NEUTRAL";
  let biasColor = "text-slate-600 bg-slate-150";
  let biasDesc = "Donon taraf barabar buildup hai. rangebound consolidation expect karein.";

  if (putCoiSum > callCoiSum * 1.1) {
    const ratio = callCoiSum > 0 ? (putCoiSum / callCoiSum).toFixed(1) : "Multiple";
    biasLabel = "BULLISH (PUT WRITING HEAVY)";
    biasColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
    biasDesc = `Puts mein call se double buildup ho rha hai (${ratio}x). Smart money supportive floor build kar rha hai, bounce aane ki high probability hai.`;
  } else if (callCoiSum > putCoiSum * 1.1) {
    const ratio = putCoiSum > 0 ? (callCoiSum / putCoiSum).toFixed(1) : "Multiple";
    biasLabel = "BEARISH (CALL WRITING HEAVY)";
    biasColor = "text-rose-700 bg-rose-50 border-rose-200";
    biasDesc = `Call writers heavy sell build kar rhe hain (${ratio}x). Upside par major resistance ceiling create ho rhi hai, pressure build rahega.`;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl" id="atm-coi-tracker-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
            <h3 className="text-sm font-bold tracking-widest text-amber-400 uppercase font-mono">
              ATM Call vs Put Change in Open Interest (COI) Tracker
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            At-The-Money (ATM) ke aas-paas ke 5 key strikes par live buildup and session-specific pressure meter.
          </p>
        </div>

        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 font-mono"
        >
          <Info size={13} />
          {showGuide ? "Hide Tracker Guide" : "Explain: COI Kaise Track Kare?"}
        </button>
      </div>

      {/* EDUCATIONAL EXPLAINER IN HINGLISH */}
      {showGuide && (
        <div className="mb-6 p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs space-y-2 leading-relaxed animate-fade-in" id="coi-guide-box">
          <div className="font-bold text-amber-400 flex items-center gap-1.5 font-mono uppercase text-[10px] tracking-wider mb-1">
            <Sparkles size={12} className="text-amber-400" /> Options Live Tracker Guide (COI कैसे ट्रैक करें?)
          </div>
          <p className="text-slate-300 font-sans">
            १. <span className="font-bold text-white">Call COI (लाल बार)</span> badhne ka matlab hai ki log Call upar bech rhe hain (<span className="text-rose-400 font-semibold">CE Writing buildup</span>). Ye level aane wale movement ke liye <span className="text-rose-400 font-bold underline">RESISTANCE (छत)</span> banega.
          </p>
          <p className="text-slate-300 font-sans">
            २. <span className="font-bold text-white">Put COI (हरा बार)</span> badhne ka matlab hai ki log Put bech kar niche floor bana rhe hain (<span className="text-emerald-400 font-semibold">PE Writing buildup</span>). Ye spot price ke niche strong <span className="text-emerald-400 font-bold underline">SUPPORT (जमीन)</span> banega.
          </p>
          <p className="text-slate-300 font-sans">
            ३. Jis strike par dono bar bade ho, wahan <span className="text-amber-300 font-semibold font-mono">Heavy Battle</span> ho rha hai (Straddle buildup). Wahan spot speed se move hone par side break hone ka breakout chance banta hai!
          </p>
        </div>
      )}

      {/* QUICK BIAS METER BANNER */}
      <div className={`p-4 rounded-xl border mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${biasColor}`} id="coi-bias-hud">
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-widest opacity-80">5-Strikes Centered ATM Buildup Bias</div>
          <div className="text-sm font-extrabold flex items-center gap-1.5">
            <Flame size={15} />
            {biasLabel}
          </div>
        </div>
        <p className="text-xs max-w-lg leading-relaxed font-sans font-medium">
          {biasDesc}
        </p>
      </div>

      {/* STRIKE LIST HEATMAP PROGRESS METERS */}
      <div className="space-y-4" id="strikes-progress-container">
        <div className="grid grid-cols-12 text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1 px-2">
          <div className="col-span-5 text-right pr-4">CE COI ADDITION (Call Sellers)</div>
          <div className="col-span-2 text-center text-amber-500 font-bold">STRIKE PRICE</div>
          <div className="col-span-5 text-left pl-4">PE COI ADDITION (Put Sellers)</div>
        </div>

        {atmStrikes.map((s, idx) => {
          const isCurrentAtm = Math.abs(s.strike - spotPrice) <= 25; // exact ATM approximate 50-strike widths

          // Calculate percentage bars relative to maxChgVal
          const callPercent = Math.min(100, Math.max(5, (Math.abs(s.callOIchg) / maxChgVal) * 100));
          const putPercent = Math.min(100, Math.max(5, (Math.abs(s.putOIchg) / maxChgVal) * 100));

          const cePositive = s.callOIchg >= 0;
          const pePositive = s.putOIchg >= 0;

          return (
            <div 
              key={s.strike} 
              className={`grid grid-cols-12 items-center py-2 px-1 rounded-xl transition ${
                isCurrentAtm ? "bg-slate-800/50 border border-slate-700/60" : "hover:bg-slate-800/25"
              }`}
            >
              {/* === CALL COI PROGRESS (Left aligned to right) === */}
              <div className="col-span-5 flex items-center justify-end gap-2.5">
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {cePositive ? "+" : ""}{s.callOIchg.toFixed(1)}%
                </span>
                
                {/* Bar */}
                <div className="w-full bg-slate-950 h-3.5 rounded-md overflow-hidden flex justify-end max-w-[140px] md:max-w-none">
                  <div 
                    className={`h-full rounded-l ${cePositive ? 'bg-gradient-to-l from-rose-500 to-rose-600' : 'bg-gradient-to-l from-slate-600 to-slate-700'}`}
                    style={{ width: `${callPercent}%` }}
                  />
                </div>
              </div>

              {/* === STRIKE CENTER COLUMN === */}
              <div className="col-span-2 text-center relative py-1">
                <span className={`text-xs font-mono font-extrabold tracking-tight ${isCurrentAtm ? 'text-amber-400 text-sm' : 'text-slate-200'}`}>
                  {s.strike}
                </span>
                {isCurrentAtm && (
                  <span className="block text-[8px] bg-amber-500 text-slate-950 font-bold px-0.5 rounded-sm uppercase tracking-wider mx-auto w-fit mt-0.5 scale-90">
                    SPOT ATM
                  </span>
                )}
              </div>

              {/* === PUT COI PROGRESS (Right aligned to left) === */}
              <div className="col-span-5 flex items-center justify-start gap-2.5">
                {/* Bar */}
                <div className="w-full bg-slate-950 h-3.5 rounded-md overflow-hidden flex justify-start max-w-[140px] md:max-w-none">
                  <div 
                    className={`h-full rounded-r ${pePositive ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-slate-600 to-slate-700'}`}
                    style={{ width: `${putPercent}%` }}
                  />
                </div>

                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {pePositive ? "+" : ""}{s.putOIchg.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTTOM METRICS BAR */}
      <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[9px] text-slate-400 font-mono uppercase">Total CE COI Addition</div>
          <div className="text-sm font-extrabold text-rose-500 mt-0.5 font-mono">
            {callCoiSum >= 0 ? "+" : ""}{callCoiSum.toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[9px] text-slate-400 font-mono uppercase">Total PE COI Addition</div>
          <div className="text-sm font-extrabold text-emerald-500 mt-0.5 font-mono">
            {putCoiSum >= 0 ? "+" : ""}{putCoiSum.toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[9px] text-slate-400 font-mono uppercase">ATM Net COI Ratio</div>
          <div className="text-sm font-extrabold text-amber-400 mt-0.5 font-mono">
            {callCoiSum !== 0 ? (putCoiSum / Math.max(1, callCoiSum)).toFixed(2) : "N/A"}
          </div>
        </div>
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-center items-center">
          <div className="text-[9px] text-slate-400 font-mono uppercase">Current Trend strength</div>
          <div className="text-xs font-semibold text-slate-200 mt-0.5">
            {Math.abs(putCoiSum - callCoiSum) > 75 ? "🔥 Aggressive" : "⚖️ Consolidated"}
          </div>
        </div>
      </div>
    </div>
  );
}
