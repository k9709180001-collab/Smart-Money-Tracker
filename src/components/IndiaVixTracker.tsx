import React, { useState } from "react";
import { HelpCircle, Eye, ShieldAlert, Sparkles, TrendingUp, TrendingDown, Activity, Info, RefreshCw, VolumeX } from "lucide-react";

interface IndiaVixTrackerProps {
  indicesStatus: any;
}

export default function IndiaVixTracker({ indicesStatus }: IndiaVixTrackerProps) {
  const [showVixGuide, setShowVixGuide] = useState(true);

  if (!indicesStatus) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 antialiased shadow-xl animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-slate-950 rounded-xl"></div>
      </div>
    );
  }

  // Gracefully fallback to standard VIX parameters if not synced
  const vix = indicesStatus.indiavix || { name: "INDIA VIX", value: 13.20, change: 2.15, prevClose: 12.92 };

  const vixValue = parseFloat(vix.value);
  const vixChange = parseFloat(vix.change);

  // Volatility evaluation based on India VIX standards
  let volatilityState = "";
  let evaluationColor = ""; // text & border style classes
  let iconElement = null;
  let summaryText = "";
  let tradingImpact = "";

  if (vixValue < 12.0) {
    volatilityState = "LOW VOLATILITY (EXTREME COMPRESSION)";
    evaluationColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    iconElement = <Eye className="text-emerald-400 flex-shrink-0 animate-pulse" size={17} />;
    summaryText = "Market bilkul shaant hai. Premiums bohot saste hain (Low IV).";
    tradingImpact = "⚠️ Option Buyers beware: Premiums saste hain par momentum slow hone se decay jaldi hoga. Option Sellers ko chhota premium milega par rangebound decay safe hain. Stay alert for a sudden big breakout!";
  } else if (vixValue >= 12.0 && vixValue < 15.5) {
    volatilityState = "NORMAL / BALANCED VOLATILITY";
    evaluationColor = "text-sky-450 bg-sky-500/10 border-sky-500/20";
    iconElement = <Activity className="text-sky-400 flex-shrink-0" size={17} />;
    summaryText = "Technical analysis levels perfectly respect ho rahe hain. Steady trend.";
    tradingImpact = "✅ Optimal Options Zone: Swing high & low guidelines solid work karenge. Donon option buyers and sellers standard intraday reversals and decay ratios se safe trade setup manage kar sakte hain.";
  } else if (vixValue >= 15.5 && vixValue < 20.0) {
    volatilityState = "HIGH VOLATILITY (ELEVATED RISK)";
    evaluationColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
    iconElement = <VolumeX className="text-amber-400 flex-shrink-0" size={17} />;
    summaryText = "Swings bade hone lage hain. Fear aur uncertainty market me rise ho rhi hai.";
    tradingImpact = "🔥 Premium Rising Status: Option sellers leverage half (50%) kar dein. Big gaps aur sudden intraday swings stop-loss trigger kar sakte hain. Directional option buyers can get quick gains but premium volatility is high.";
  } else {
    volatilityState = "EXTREME PANIC / DANGER VOLATILITY";
    evaluationColor = "text-rose-500 bg-rose-500/10 border-rose-500/30 animate-pulse";
    iconElement = <ShieldAlert className="text-rose-500 flex-shrink-0" size={18} />;
    summaryText = "Extreme fear! Options premiums heavy fire par hain. Sharp panic cuts anytime.";
    tradingImpact = "🚨 WARNING (Sellers Hazard): Option seller positions immediate close ya tight hedge karein! Whipsaws aur unpredictable crashes/jump options writing margins ko easily damage kar sakti hai. Avoid naked shorting.";
  }

  // Calculate percentage for visual indicator gauge (range 5 to 25 mapped to 0% to 100%)
  const minVix = 8;
  const maxVix = 24;
  const vixPercent = Math.min(100, Math.max(0, ((vixValue - minVix) / (maxVix - minVix)) * 100));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl" id="india-vix-tracker-box">
      {/* Title section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-bold tracking-widest text-sky-400 uppercase font-mono">
              India VIX - Live Implied Volatility (Fear Index) Tracker
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Options segment ki real-time volatility index track karein aur extreme fear triggers ko spot kijiye.
          </p>
        </div>

        <button 
          onClick={() => setShowVixGuide(!showVixGuide)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-305 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-750 font-mono"
        >
          <Info size={13} className="text-sky-400" />
          {showVixGuide ? "Hide VIX Guide" : "VIX Levels Explained"}
        </button>
      </div>

      {/* Volatility Hinglish Guide Box */}
      {showVixGuide && (
        <div className="mb-6 p-4.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2.5 leading-relaxed animate-fade-in" id="vix-rules-cheat-sheet">
          <div className="font-extrabold text-sky-400 flex items-center gap-1.5 font-mono uppercase text-[10px] tracking-wider">
            <Sparkles size={12} className="text-sky-450" /> INDIA VIX TRADING MATRIX (वीआईएक्स ट्रेडिंग सीखें)
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-305 font-sans">
            <div className="space-y-1.5">
              <p>
                <span className="text-emerald-400 font-bold font-mono">📉 VIX &lt; 12 (Shaant Bazaar):</span> Option buyers ko premium quickly decay hone ka darr hota hai. Options sellers lower boundary bechkar safe theta decay enjoy karte hain.
              </p>
              <p>
                <span className="text-sky-400 font-bold font-mono font-semibold">📊 VIX 12 - 15 (Perfect Range):</span> Balanced options environment. Key support &amp; resistance levels aur standard option-chain ranges high accuracy ke sath hold hoti hain.
              </p>
            </div>
            
            <div className="space-y-1.5 md:border-l md:border-slate-800 md:pl-4">
              <p>
                <span className="text-amber-400 font-bold font-mono">📈 VIX 15 - 20 (Darr ka aagman):</span> premiums fire up ho jaate hain. Market wide swings aur abrupt jumps deta hai. Sellers ko hedge (Spreads) ke sath kam karna chaiye.
              </p>
              <p>
                <span className="text-rose-400 font-bold font-mono">🚨 VIX &gt; 20 (Extreme Fear):</span> Option sellers block! Unpredictable sharp vertical falls aur sudden panic reversals high probability banti hain. Long positions tight SL ke sath trigger karein.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Core HUD block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* BIG VIX DISPAY */}
        <div className="md:col-span-4 bg-slate-950 p-5 rounded-2xl border border-slate-850/80 text-center relative overflow-hidden flex flex-col justify-center h-full">
          <div className="absolute top-0 left-0 p-2 font-mono text-[8px] text-slate-600 uppercase tracking-widest font-extrabold">Fear Index Unit</div>
          
          <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Live India VIX</span>
          <div className="text-4.5xl font-black text-sky-400 my-2 font-mono tracking-normal text-slate-50">
            {vixValue.toFixed(2)}
          </div>

          <div className="flex items-center justify-center gap-1">
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md flex items-center ${
              vixChange >= 0 ? "bg-rose-950/40 text-rose-400" : "bg-emerald-950/40 text-emerald-400"
            }`}>
              {vixChange >= 0 ? <TrendingUp size={12} className="inline mr-0.5" /> : <TrendingDown size={12} className="inline mr-0.5" />}
              {vixChange >= 0 ? "+" : ""}{vixChange.toFixed(2)}%
            </span>
          </div>

          <div className="text-[8.5px] text-slate-550 pt-3 mt-3 border-t border-slate-850/60 font-mono text-slate-500">
            Base volatility dynamic tracking active
          </div>
        </div>

        {/* RISK BAR AND IMPLICATIONS */}
        <div className="md:col-span-8 space-y-4">
          {/* Volatility description card */}
          <div className={`p-4 rounded-xl border border-slate-800/80 font-sans ${evaluationColor}`}>
            <div className="flex items-center gap-2">
              {iconElement}
              <span className="font-extrabold text-[11px] uppercase tracking-wider font-mono">
                Volatility evaluation: {volatilityState}
              </span>
            </div>
            
            <p className="text-xs font-sans text-slate-200 mt-2 font-bold select-none">
              {summaryText}
            </p>
            <p className="text-xs font-sans text-slate-300 mt-1.5 leading-relaxed font-semibold">
              {tradingImpact}
            </p>
          </div>

          {/* Graphical VIX gauge bar */}
          <div className="bg-slate-950/65 p-3.5 rounded-xl border border-slate-850">
            <div className="flex justify-between text-[9px] text-slate-500 font-bold font-mono mb-1.5">
              <span className="text-emerald-400">8.0 (CALM Bazaar)</span>
              <span className="text-sky-400">12.0 (NORMAL Balanced)</span>
              <span className="text-amber-500">15.5 (ELEVATED Risks)</span>
              <span className="text-rose-500 font-extrabold">20.0+ (PANIC Alert)</span>
            </div>

            {/* Vix bar track representation */}
            <div className="relative w-full bg-slate-900 h-3 rounded-full overflow-hidden" id="vix-bar-progress-track">
              {/* Guides */}
              <div className="absolute left-[25%] top-0 bottom-0 w-0.5 bg-sky-500/20" />
              <div className="absolute left-[47%] top-0 bottom-0 w-0.5 bg-amber-500/30" />
              <div className="absolute left-[75%] top-0 bottom-0 w-0.5 bg-rose-500/40" />

              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  vixValue >= 20.0 ? "bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600" :
                  vixValue >= 15.5 ? "bg-gradient-to-r from-emerald-500 via-sky-400 to-amber-500" :
                  "bg-gradient-to-r from-emerald-600 to-emerald-400"
                }`}
                style={{ width: `${vixPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[8px] text-slate-500 mt-1 font-mono">
              <span>Implied risk minimal</span>
              <span className="text-sky-400 font-semibold">▲ Current pointer value</span>
              <span>Implied risk extreme</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
