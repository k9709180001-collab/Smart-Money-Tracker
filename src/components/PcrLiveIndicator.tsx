import React, { useState } from "react";
import { OptionChainRow } from "../types";
import { ShieldAlert, TrendingDown, TrendingUp, HelpCircle, Activity, Info, RefreshCw, Flame } from "lucide-react";

interface PcrLiveIndicatorProps {
  optionChain: OptionChainRow[];
}

export default function PcrLiveIndicator({ optionChain }: PcrLiveIndicatorProps) {
  const [showPcrGuide, setShowPcrGuide] = useState(true);

  // Calculate live PCR from the current option chain
  const totalCallOI = optionChain.reduce((sum, item) => sum + Number(item.callOI || 0), 0);
  const totalPutOI = optionChain.reduce((sum, item) => sum + Number(item.putOI || 0), 0);
  const pcrValue = totalCallOI > 0 ? parseFloat((totalPutOI / totalCallOI).toFixed(2)) : 1.15;

  // Decide status, colors, and warnings based on user's exact parameters
  let statusLabel = "";
  let zoneColor = ""; // Tailwind classes for text/background
  let barColor = "";  // Tailwind classes for progress bar
  let description = "";
  let warningMessage = null;

  if (pcrValue < 0.70) {
    statusLabel = "BEARISH (Weak / Oversold)";
    zoneColor = "bg-rose-50 text-rose-850 border-rose-200";
    barColor = "bg-rose-600";
    description = "Puts-se-zyada Calls beche ja rhe hain. Market mein heavy selling pressure bana hua hai aur downmove sustained reh sakta hai. Par extreme low hone par downmove exhausting bhi ho sakta hai.";
  } else if (pcrValue >= 0.70 && pcrValue <= 1.20) {
    statusLabel = "NEUTRAL (Consolidation)";
    zoneColor = "bg-slate-50 text-slate-800 border-slate-200";
    barColor = "bg-indigo-600";
    description = "Market rangebound consolidation zone mein hai. Donon buyers and sellers safe levels maintain karne ki koshish kar rahe hain. Standard expiry decay zones maintain honge.";
  } else if (pcrValue > 1.20 && pcrValue < 1.45) {
    statusLabel = "BULLISH (Strong Market)";
    zoneColor = "bg-emerald-50 text-emerald-805 border-emerald-200";
    barColor = "bg-emerald-600";
    description = "Puts side par aggressive writing support generate kar rhi hai. Market bullish territory mein strong hold maintain kar rha hai, buyers are in complete control.";
  } else {
    // PCR >= 1.45 (Usually 1.5 near zone) -> EXTREME OVERBOUGHT / REVERSAL RISK
    statusLabel = "EXTREME OVERBOUGHT (Reversal High Risk!)";
    zoneColor = "bg-amber-500/10 text-amber-500 border-amber-600/30";
    barColor = "bg-amber-500 animate-pulse";
    description = "PCR near/above 1.5 touch ho rha hai! Puts side par extremely unmatched over-positioning ho chuki hai. Market extreme overbought zone mein aa chuka hai, yahan se achanak heavy crash ya profit booking reversal trigger hone ki probabilities maximum hain.";
    warningMessage = "🔴 ALERT: Market high potential overbought saturation state par hai. Aggressive long positions avoid karein aur trailing stop loss tightly placement rakhein!";
  }

  // Calculate percentage for a beautiful gauge (from PCR 0.0 to 2.0 mapped to 0% to 100%)
  const gaugePercent = Math.min(100, Math.max(0, (pcrValue / 2.0) * 100));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="live-pcr-card-container">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="text-sm font-bold tracking-widest text-indigo-900 uppercase font-mono">
              Live Put-Call Ratio (PCR) Pulse & Reversal Indicator
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Session-wise total Open Interest calculation across all active option chain strikes in real-time.
          </p>
        </div>

        <button 
          onClick={() => setShowPcrGuide(!showPcrGuide)}
          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 font-mono"
        >
          <HelpCircle size={13} className="text-indigo-600" />
          {showPcrGuide ? "Hide PCR Rules" : "Why track PCR?"}
        </button>
      </div>

      {/* Guide Rules Box */}
      {showPcrGuide && (
        <div className="mb-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-150 text-xs space-y-2 leading-relaxed animate-fade-in" id="pcr-rules-box">
          <div className="font-bold text-indigo-900 flex items-center gap-1.5 font-mono uppercase text-[10px] tracking-wider mb-1">
            <Info size={13} className="text-indigo-600" /> Live PCR Trading Cheat-Sheet (PCR रूल्स)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:divide-x md:divide-slate-200/80">
            <div className="pr-2 space-y-1">
              <span className="font-extrabold text-rose-600 font-mono text-[10.5px]">🔴 PCR &lt; 0.7 (Bearish/Weak):</span>
              <p className="text-slate-600 font-sans text-[11px]">Calls heavy write ho rhi hain. Market down direction bias maintain karega.</p>
            </div>
            <div className="md:px-3 space-y-1">
              <span className="font-extrabold text-emerald-600 font-mono text-[10.5px]">🟢 PCR &gt; 1.2 (Bullish/Strong):</span>
              <p className="text-slate-600 font-sans text-[11px]">Puts support strong leverage bana rha hai. Market upward jump bias.</p>
            </div>
            <div className="md:pl-3 space-y-1">
              <span className="font-extrabold text-amber-500 font-mono text-[10.5px]">⚠️ PCR ≈ 1.5 (Overbought Level):</span>
              <p className="text-slate-600 font-sans text-[11px] font-semibold text-slate-850">Extreme saturation point. Sudden heavy reversal/girawat alert activated!</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* PCR Big Meter Display */}
        <div className="md:col-span-4 bg-slate-950 p-5 rounded-2xl text-center text-white border border-slate-800 shadow-inner flex flex-col justify-center h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1">
            <Activity className="text-slate-800 animate-pulse" size={40} />
          </div>
          
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-semibold">Live Session PCR</span>
          <div className="text-4xl font-black text-amber-400 my-2 font-mono tracking-tight drop-shadow-md">
            {pcrValue.toFixed(2)}
          </div>
          
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-[11px] font-bold text-slate-300 font-sans uppercase">
              Total PE OI: <span className="text-emerald-400 font-mono">{(totalPutOI / 100000).toFixed(1)}L</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-[11px] font-bold text-slate-300 font-sans uppercase">
              CE OI: <span className="text-rose-400 font-mono">{(totalCallOI / 100000).toFixed(1)}L</span>
            </span>
          </div>

          <div className="mt-3 text-[9px] text-slate-500 border-t border-slate-800/80 pt-2 font-mono flex items-center justify-center gap-1">
            <RefreshCw size={10} className="animate-spin text-emerald-500" />
            Live index state calculations synced
          </div>
        </div>

        {/* PCR Gauge and Detailed interpretation */}
        <div className="md:col-span-8 space-y-4">
          {/* Detailed Status Bar */}
          <div className={`p-4 rounded-xl border-l-4 font-sans ${zoneColor}`} id="pcr-status-zone-banner">
            <div className="flex items-center gap-2">
              {pcrValue >= 1.45 ? (
                <ShieldAlert className="text-amber-500 animate-bounce flex-shrink-0" size={17} />
              ) : pcrValue > 1.20 ? (
                <TrendingUp className="text-emerald-600 flex-shrink-0" size={17} />
              ) : pcrValue < 0.70 ? (
                <TrendingDown className="text-rose-600 flex-shrink-0 text-semibold" size={17} />
              ) : (
                <Activity className="text-indigo-600 flex-shrink-0" size={17} />
              )}
              <span className="font-extrabold text-xs uppercase tracking-wider font-mono">
                Current Interpretation: <span className="underline">{statusLabel}</span>
              </span>
            </div>
            <p className="text-xs mt-1.5 leading-relaxed font-sans font-medium text-slate-700">
              {description}
            </p>
          </div>

          {/* Interactive slider gauge visualizer */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex justify-between text-[10px] text-slate-500 font-bold font-mono">
              <span className="text-rose-500 font-semibold">0.5 (EXTREME BEARISH)</span>
              <span className="text-slate-400">1.0 (NEUTRAL)</span>
              <span className="text-emerald-500 font-semibold">1.2 (BULLISH)</span>
              <span className="text-amber-600 font-extrabold">1.5 (OVERBOUGHT Ceiling)</span>
            </div>
            
            {/* Real slider bar */}
            <div className="relative w-full bg-slate-200 h-4 rounded-full overflow-hidden" id="pcr-bar-container">
              {/* Threshold indicator guidelines */}
              <div className="absolute left-[35%] top-0 bottom-0 w-0.5 bg-rose-300 opacity-60" title="Bearish threshold" />
              <div className="absolute left-[60%] top-0 bottom-0 w-0.5 bg-emerald-300 opacity-60" title="Bullish threshold" />
              <div className="absolute left-[75%] top-0 bottom-0 w-0.5 bg-amber-400 opacity-65" title="Extreme overbought warning threshold" />

              {/* Progress pointer path bar */}
              <div 
                className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                style={{ width: `${gaugePercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[8px] text-slate-400 font-mono">
              <span>Low floor range</span>
              <span className="text-amber-500 font-semibold">▲ Current value pointing here</span>
              <span>High ceiling range</span>
            </div>
          </div>

          {warningMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold leading-relaxed flex items-start gap-1.5" id="pcr-overbought-hazard-box">
              <ShieldAlert size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{warningMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
