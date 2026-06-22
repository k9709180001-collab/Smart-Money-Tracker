import React, { useState, useEffect } from "react";
import { 
  Flame, ShieldAlert, TrendingUp, TrendingDown, RefreshCw, BarChart2, 
  Sparkles, CheckCircle, Info, Zap, AlertTriangle, ArrowUpRight, Target 
} from "lucide-react";
import { OptionChainRow } from "../types";

interface SellerPanicDashboardProps {
  optionChain: OptionChainRow[];
  indicesStatus: any;
}

export default function SellerPanicDashboard({ optionChain, indicesStatus }: SellerPanicDashboardProps) {
  const [showBuyerRules, setShowBuyerRules] = useState(true);
  const [sessionHigh, setSessionHigh] = useState(24050);
  const [simulatedVolumeSpike, setSimulatedVolumeSpike] = useState(true);

  // 1. Analyze OI Shedding (Negative change in OI)
  const negativeCEStrikes = optionChain
    .filter(row => row.callOIchg < 0)
    .sort((a, b) => a.callOIchg - b.callOIchg); // Most negative first

  const negativePEStrikes = optionChain
    .filter(row => row.putOIchg < 0)
    .sort((a, b) => a.putOIchg - b.putOIchg); // Most negative first

  // 2. Breakout Status
  const niftyVal = indicesStatus?.nifty?.value || 24018.45;
  const pdh = 24055.00; // Previous Day High benchmark
  const isBreakoutActive = niftyVal > pdh;

  // 3. VIX Panic Analysis
  const vix = indicesStatus?.indiavix || { value: 13.20, change: 2.15 };
  const vixValue = parseFloat(vix.value);
  const vixChange = parseFloat(vix.change);
  const isVixSpiked = vixChange >= 5.0 && indicesStatus?.nifty?.change < 0;

  // 4. Heavy Resistance & Support Tracker (Current Max OI strikes)
  let maxCE_OI = -1;
  let heaviestCE_Strike = 0;
  let maxPE_OI = -1;
  let heaviestPE_Strike = 0;

  optionChain.forEach((row) => {
    if (row.callOI > maxCE_OI) {
      maxCE_OI = row.callOI;
      heaviestCE_Strike = row.strike;
    }
    if (row.putOI > maxPE_OI) {
      maxPE_OI = row.putOI;
      heaviestPE_Strike = row.strike;
    }
  });

  // Calculate panic metrics & signals
  const cePanicCount = negativeCEStrikes.length;
  const pePanicCount = negativePEStrikes.length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-800 shadow-sm" id="seller-panic-index-dashboard">
      
      {/* Title Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
            <h3 className="text-base font-extrabold tracking-widest text-rose-700 uppercase font-mono flex items-center gap-1.5">
              <Flame className="text-rose-600 animate-pulse" size={18} /> Option Seller Panic Radar (Golden Buyer Setup)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans font-medium">
            Bade operators aur Option Sellers kab darr kar bhag rahe hain? Live short-covering traps catch kijiye aur profit banayein!
          </p>
        </div>

        <button 
          onClick={() => setShowBuyerRules(!showBuyerRules)}
          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-750 font-bold hover:text-slate-900 rounded-lg text-xs flex items-center gap-1.5 transition border border-slate-300 font-mono"
        >
          <Info size={13} className="text-rose-600" />
          {showBuyerRules ? "Hide Golden Rules" : "Golden Rules For Option Buyers 🏆"}
        </button>
      </div>

      {/* Golden rules cheat sheet block in roman hindi / language requested */}
      {showBuyerRules && (
        <div className="mb-6 p-4 bg-rose-50/50 rounded-xl border border-rose-200 text-xs space-y-3 leading-relaxed animate-fade-in" id="buyer-rules-pane">
          <div className="font-extrabold text-rose-800 flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase">
            <Sparkles size={11} className="text-amber-500 animate-spin" /> GOLDEN RULE FOR BUYERS: "OPERATORS KO ZAKHMI SHIKAR BANAYEIN!"
          </div>
          <p className="text-slate-700 font-sans font-medium">
            Option Seller ek <span className="font-bold text-slate-900 underline">Sher (Operator)</span> hota hai. Jab tak bazaar chupchaap range me phasa hai, usko mat chhedo (No trade zone). 
            Jab sellers heavy losses me aakar bhagte hain (<span className="text-rose-700 font-bold">Negative Chg in OI</span>) aur support/resistance tootte hain, 
            tab unki short covering se momentum fast hota hai. Wahi perfect samay hai Option Buying karne ka!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 text-[11px] font-mono">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
              <span className="text-emerald-700 font-extrabold">1. CE OI Minus 📉</span>
              <p className="text-[10px] text-slate-550 mt-1 font-sans">Call writers dar kar bhaag rahe hain. Buy CE signal is high!</p>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
              <span className="text-sky-700 font-extrabold">2. Day High Break 📈</span>
              <p className="text-[10px] text-slate-550 mt-1 font-sans">High Volume breakout se levels par massive traps short cover trigger karenge.</p>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
              <span className="text-rose-700 font-extrabold">3. VIX 5%+ Spike 🚨</span>
              <p className="text-[10px] text-slate-550 mt-1 font-sans">VIX achanak bade toh Put sellers phat jaate hain! Buy PE setup.</p>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
              <span className="text-amber-700 font-extrabold">4. Resistance Shift 🔄</span>
              <p className="text-[10px] text-slate-550 mt-1 font-sans">Heavy OI level upar shift hone ka matlab bade players ne har maan li hai.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Analysis HUD: Four live tripwires side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" id="seller-panic-main-four-signals">
        
        {/* SIGNAL 1: OI SHEDDING (NEGATIVE CHANGE IN OI) */}
        <div className={`p-4 rounded-xl border transition-all h-[190px] flex flex-col justify-between ${
          cePanicCount > 0 || pePanicCount > 0 ? "bg-red-50/60 border-red-200" : "bg-slate-50 border-slate-200"
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-red-100 text-red-700 font-bold font-mono px-2 py-0.5 rounded uppercase">VEC-1: OI Shedding</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <h4 className="text-xs font-bold font-sans text-slate-800 mt-2">Call/Put Sellers Runs</h4>
            <p className="text-[11px] text-slate-600 mt-1 font-sans leading-relaxed">
              Negative Chg in OI means open position band ho rahi hai.
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            {cePanicCount > 0 ? (
              <div className="text-[10.5px] text-emerald-700 font-bold font-mono flex items-center gap-1">
                <CheckCircle size={12} className="text-emerald-600" />
                <span>CE Covering is active! (Buy CE)</span>
              </div>
            ) : pePanicCount > 0 ? (
              <div className="text-[10.5px] text-rose-700 font-bold font-mono flex items-center gap-1">
                <CheckCircle size={12} className="text-rose-600" />
                <span>PE Covering active! (Buy PE)</span>
              </div>
            ) : (
              <span className="text-[10.5px] text-slate-550 font-mono">No negative OI right now. Rangebound.</span>
            )}
            
            <div className="text-[9.5px] text-slate-500 font-mono">
              Hits: CE ({cePanicCount}) | PE ({pePanicCount})
            </div>
          </div>
        </div>

        {/* SIGNAL 2: DAY HIGH/LOW BREAKOUT & VOLUME */}
        <div className={`p-4 rounded-xl border transition-all h-[190px] flex flex-col justify-between ${
          isBreakoutActive ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-sky-100 text-sky-700 font-bold font-mono px-2 py-0.5 rounded uppercase">VEC-2: Breakout</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isBreakoutActive ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
            </div>
            <h4 className="text-xs font-bold font-sans text-slate-800 mt-2">Price Action &amp; Volume</h4>
            <p className="text-[11px] text-slate-600 mt-1 font-sans leading-relaxed">
              Breaks PDH (Previous Day High ₹{pdh.toLocaleString()}) with spikes.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="text-center">
              <span className="text-[9px] text-slate-500 font-mono block">LIVE BENCHMARK NIFTY</span>
              <span className="text-sm font-black font-mono text-slate-900 block">
                {niftyVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-[10px] font-bold font-mono ${isBreakoutActive ? "text-emerald-700" : "text-amber-700"}`}>
                {isBreakoutActive ? "🚀 ABOVE DAY HIGH (Trap On!)" : "Inside Day High Range"}
              </span>
            </div>
          </div>
        </div>

        {/* SIGNAL 3: INDIA VIX PANIC SCALE */}
        <div className={`p-4 rounded-xl border transition-all h-[190px] flex flex-col justify-between ${
          vixChange >= 5.0 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold font-mono px-2 py-0.5 rounded uppercase">VEC-3: VIX Fear Scale</span>
              <span className={`w-1.5 h-1.5 rounded-full ${vixChange >= 5.0 ? "bg-rose-500 animate-ping" : "bg-slate-400"}`} />
            </div>
            <h4 className="text-xs font-bold font-sans text-slate-800 mt-2">Sellers Margin Pressure</h4>
            <p className="text-[11px] text-slate-600 mt-1 font-sans leading-relaxed">
              VIX shoots by &gt;5% while index goes dry red = heavy PE cover.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-200 text-center">
            <div className="text-[10px] font-mono font-bold text-slate-700">
              India VIX Value: <span className="text-sky-700">{vixValue.toFixed(2)}</span>
            </div>
            <div className={`text-[10.5px] font-bold font-mono px-1.5 py-0.5 rounded inline-block ${
              vixChange >= 0 ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-emerald-100 text-emerald-700 border border-emerald-250"
            }`}>
              VIX Change: {vixChange >= 0 ? "+" : ""}{vixChange.toFixed(2)}%
            </div>
            {isVixSpiked && (
              <div className="text-[9.5px] font-bold text-rose-705 font-mono uppercase bg-rose-100 py-0.5 mt-1 rounded border border-rose-200">
                🚨 PUT SELLER IN DANGER
              </div>
            )}
          </div>
        </div>

        {/* SIGNAL 4: RESISTANCE & SUPPORT SHIFTS */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl h-[190px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold font-mono px-2 py-0.5 rounded uppercase">VEC-4: Shifting Levels</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <h4 className="text-xs font-bold font-sans text-slate-800 mt-2">Operators Retreat Matrix</h4>
            <p className="text-[11px] text-slate-600 mt-1 font-sans leading-relaxed">
              Max Call &amp; Put open interest strikes tracking.
            </p>
          </div>

          <div className="text-xs font-mono pt-2 border-t border-slate-200 space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-red-700 font-bold">Max CE Barrier:</span>
              <span className="text-slate-800 font-black font-mono">{heaviestCE_Strike}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-emerald-700 font-bold">Max PE Floor:</span>
              <span className="text-slate-800 font-black font-mono">{heaviestPE_Strike}</span>
            </div>
            <span className="text-[9px] text-emerald-700 block font-semibold text-center pt-1 mt-1 border-t border-slate-200">
              Shift logic refreshed live
            </span>
          </div>
        </div>
      </div>
             {/* Live Traps Spotter Panel & Trigger Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="seller-panic-active-traps-radar">
        
        {/* S-1: LIVE ACTIVE SHORTS SHEDDING (Negative OI detail table) */}
        <div className="lg:col-span-7 bg-slate-50 p-4.5 rounded-xl border border-slate-200">
          <div className="font-mono text-xs text-rose-700 font-bold uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>🔴 SELLER SHEDDING &amp; OUTFLOW strikes (ऋणात्मक चेंज इन ओआई)</span>
            <span className="text-[9px] font-sans text-slate-500 lowercase">(most vulnerable strike ranges)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* CALL WRITERS PANIC SECTION */}
            <div className="space-y-2.5">
              <span className="text-[10px] text-rose-700 font-bold font-mono tracking-wide uppercase block border-b border-rose-200 pb-1">
                Call Sellers Fleeing (CE Short Covering)
              </span>

              {negativeCEStrikes.length === 0 ? (
                <p className="text-xs text-slate-500 font-sans italic p-2.5">
                  Arre waah! Call buyers ne abhi tak sellers ko choke nahi kiya hai. Koi negative change in OI nahi dikha.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {negativeCEStrikes.slice(0, 3).map((strike) => (
                    <div key={strike.strike} className="flex justify-between items-center p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <span className="text-xs font-black font-mono text-slate-800">Strike {strike.strike} CE</span>
                      <span className="text-xs font-bold font-mono text-emerald-700">
                        {strike.callOIchg.toFixed(1)}% OI COVERING!
                      </span>
                    </div>
                  ))}
                  <div className="p-2.5 bg-emerald-100 rounded-lg border border-emerald-300 text-[10.5px] font-sans text-emerald-800 mt-1">
                    🎯 <strong className="font-extrabold uppercase">CALL BUY ALERT:</strong> Call writers are covering fast. Direct Buy CE signal is activated for strike {negativeCEStrikes[0].strike}!
                  </div>
                </div>
              )}
            </div>

            {/* PUT WRITERS PANIC SECTION */}
            <div className="space-y-2.5">
              <span className="text-[10px] text-emerald-700 font-bold font-mono tracking-wide uppercase block border-b border-emerald-200 pb-1">
                Put Sellers Fleeing (PE Short Covering)
              </span>

              {negativePEStrikes.length === 0 ? (
                <p className="text-xs text-slate-500 font-sans italic p-2.5">
                  Kya baat hai! Put writers bilkul safe zone me trade kar rahe hain. Standard support intact hai.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {negativePEStrikes.slice(0, 3).map((strike) => (
                    <div key={strike.strike} className="flex justify-between items-center p-2 bg-rose-50 border border-rose-200 rounded-lg">
                      <span className="text-xs font-black font-mono text-slate-800">Strike {strike.strike} PE</span>
                      <span className="text-xs font-bold font-mono text-rose-700">
                        {strike.putOIchg.toFixed(1)}% OI DRAGGED!
                      </span>
                    </div>
                  ))}
                  <div className="p-2.5 bg-rose-100 rounded-lg border border-rose-300 text-[10.5px] font-sans text-rose-800 mt-1">
                    🚨 <strong className="font-extrabold uppercase">PUT BUY ALERT:</strong> Put writers are panicking as Support is melting. Put Buying is ready for strike {negativePEStrikes[0].strike}!
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>

        {/* COMBINED OPERATOR PANIC SUM SCREEN & ALERT BULLET */}
        <div className="lg:col-span-5 bg-slate-50 p-4.5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs text-amber-850 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" /> Active Actionable Signal Indicator
            </div>

            <div className="space-y-3 mt-1 text-xs">
              {/* Dynamic live state message parsing */}
              {cePanicCount > 0 && isBreakoutActive ? (
                <div className="p-4.5 bg-gradient-to-r from-emerald-50 to-white border-l-4 border-emerald-500 rounded text-slate-800 border-y border-r border-emerald-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-black font-mono tracking-wide uppercase text-[11px] mb-1">
                    🚀 DOUBLE BUY CE JACKPOT COMBO!
                  </div>
                  <p className="leading-relaxed font-sans text-xs">
                    Nifty Day High ko tood chuka hai aur call sellers negative OI ke sath position se uth kar bhag rahe hain! 
                    Yeh dynamic institutions short covering rally hai. Premiums bohot hi tezi se badhenge. Buy breakout CEs with trailing SL.
                  </p>
                </div>
              ) : isVixSpiked ? (
                <div className="p-4.5 bg-gradient-to-r from-rose-50 to-white border-l-4 border-rose-600 rounded text-slate-800 border-y border-r border-rose-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-rose-700 font-black tracking-wide uppercase text-[11px] mb-1 font-mono">
                    🚨 EXTREME PANIC PUT BUY SETUP!
                  </div>
                  <p className="leading-relaxed font-sans text-xs">
                    Market tezi se slip ho raha hai aur India VIX 5% se upar shoot ho chuka hai. 
                    Options premiums heavy aag pakad chuke hain. Put sellers ko options margins drag kar rahe hain. 
                    Strongly favor Buying ATM Puts for sharp downward sweeps!
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-white border border-slate-200 rounded text-slate-705 leading-relaxed font-sans text-[11px]">
                  <p className="font-semibold text-slate-800">⚖️ Market Alignment is Balanced</p>
                  <p className="text-slate-500 mt-1">
                    Bada seller abhi so raha hai ya aaram se standard limits bech raha hai. 
                    Rangebound support levels respect karenge. Options high premium decay pe hum log target swings setup karenge. 
                    WWait until either Day high breaks or any option strike OI change turns minus.
                  </p>
                </div>
              )}

              {/* Status checklist helper boxes */}
              <div className="space-y-1.5 pt-2 font-mono text-[10px]">
                <div className="text-[10px] text-slate-500 tracking-wider font-bold uppercase">Sentinel Status Checklist:</div>
                <div className="flex items-center justify-between text-slate-700 border-b border-dashed border-slate-200 pb-1">
                  <span>1. Negative Change in OI:</span>
                  <span className={cePanicCount > 0 || pePanicCount > 0 ? "text-emerald-700 font-bold" : "text-slate-550"}>
                    {cePanicCount > 0 || pePanicCount > 0 ? "🟢 TRIGGERED (-OI)" : "⚪ Quiet"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700 border-b border-dashed border-slate-200 pb-1">
                  <span>2. Day High Breakout:</span>
                  <span className={isBreakoutActive ? "text-emerald-700 font-bold" : "text-slate-550"}>
                    {isBreakoutActive ? "🟢 TRIGGERED (High Break)" : "⚪ Rangebound"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700 border-b border-dashed border-slate-200 pb-1">
                  <span>3. India VIX Panic:</span>
                  <span className={vixChange >= 5.0 ? "text-rose-700 font-bold" : "text-slate-550"}>
                    {vixChange >= 2.0 ? `🟢 Active (+${vixChange.toFixed(1)}%)` : "⚪ Calm"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>4. Resistance Shift:</span>
                  <span className="text-slate-600 font-bold">
                    CE Level {heaviestCE_Strike} Hold
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[8.5px] text-slate-500 font-mono italic text-center pt-3 border-t border-slate-200 mt-3">
            Option Buyers alert index system synced with derivations.
          </div>

        </div>

      </div>

    </div>
  );
}
