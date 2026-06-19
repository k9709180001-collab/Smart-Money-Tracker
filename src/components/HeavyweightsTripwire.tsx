import React, { useState } from "react";
import { ShieldAlert, Sparkles, TrendingDown, TrendingUp, AlertTriangle, HelpCircle, ArrowUpRight, ArrowDownRight, RefreshCw, BadgeInfo } from "lucide-react";

interface HeavyweightsTripwireProps {
  indicesStatus: any;
}

export default function HeavyweightsTripwire({ indicesStatus }: HeavyweightsTripwireProps) {
  const [showInfo, setShowInfo] = useState(true);

  if (!indicesStatus) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 antialiased shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const nifty = indicesStatus.nifty || { value: 24018.45, change: 0.41, prevClose: 23920.00 };
  const reliance = indicesStatus.reliance || { value: 2940.50, change: 0.85, prevClose: 2915.00 };
  const hdfc = indicesStatus.hdfcbank || { value: 1625.30, change: -0.45, prevClose: 1632.00 };
  const infy = indicesStatus.infy || { value: 1885.20, change: 0.65, prevClose: 1873.00 };
  const tcs = indicesStatus.tcs || { value: 4125.60, change: -0.90, prevClose: 4163.00 };

  const isNiftyUp = nifty.change > 0;
  const isRelianceRed = reliance.change < 0;
  const isHdfcRed = hdfc.change < 0;
  const isInfyRed = infy.change < 0;
  const isTcsRed = tcs.change < 0;

  // Compute number of red heavyweights
  const redStocks: string[] = [];
  if (isRelianceRed) redStocks.push("RELIANCE");
  if (isHdfcRed) redStocks.push("HDFC BANK");
  if (isInfyRed) redStocks.push("INFOSYS");
  if (isTcsRed) redStocks.push("TCS");

  const totalRedCount = redStocks.length;

  // Cumulative weighted calculation representation:
  // Reliance weight: 11.1%, HDFC: 10.3%, Infosys: 5.2%, TCS: 4.1%
  const activeWeights = [
    { name: "RELIANCE", weight: 11.1, change: reliance.change, isRed: isRelianceRed },
    { name: "HDFC BANK", weight: 10.3, change: hdfc.change, isRed: isHdfcRed },
    { name: "INFOSYS", weight: 5.2, change: infy.change, isRed: isInfyRed },
    { name: "TCS", weight: 4.1, change: tcs.change, isRed: isTcsRed },
  ];

  const redWeightContribution = activeWeights
    .filter(s => s.isRed)
    .reduce((sum, s) => sum + s.weight, 0);

  const totalHeavyweightWeightValue = 30.7; // 11.1 + 10.3 + 5.2 + 4.1

  // Determine trap level
  let trapStatus = "NORMAL ALIGNMENT";
  let trapMsg = "Heavyweights perfectly Nifty movement ko support kar rahe hain. Trend healthy hai.";
  let alertStyle = "bg-slate-50 text-slate-800 border-slate-200";

  if (isNiftyUp) {
    if (totalRedCount >= 3) {
      trapStatus = "HIGH LEVEL 5 DANGER: EXTREME NIFTY FAKEUP TRAP ACTIVE! 🚨";
      trapMsg = `ALERT: Nifty toh upar ja raha hai, lekin 4 me se ${totalRedCount} sabse bade heavyweights (${redStocks.join(", ")}) RED zone me hain! Nifty ki weightage me lagbhag ${redWeightContribution.toFixed(1)}% weight drag kar raha hai. Yeh ek classic distribution trap hai. Retails buyers ko top pe fasaya ja raha hai. Aggressive longs strictly avoid karein! Reversal imminent hai.`;
      alertStyle = "bg-rose-50 border-rose-300 text-rose-950 border-2 animate-pulse";
    } else if (totalRedCount === 2) {
      trapStatus = "WARNING: HEAVY DIVERGENCE (WEIGHT PRESSURE) ⚡";
      trapMsg = `ATTENTION: Nifty positive hai lekin ${redStocks.join(" aur ")} dono stock RED zone me hain. Momentum weak and volatile rahega. Resistance range ko test hone k baad reversal active ho skti hai. Tight trailing stop-loss deployed rakhein.`;
      alertStyle = "bg-amber-50 border-amber-300 text-amber-900";
    } else if (totalRedCount === 1) {
      trapStatus = "LIGHT DIVERGENCE: MINOR UNDERPERFORMANCE 🔍";
      trapMsg = `NOTE: Nifty up trend me hai aur only one key heavyweight (${redStocks[0]}) underperforming hoke RED zone me trade kar raha hai. IT ya Financials support provide kar rahe hain, is liye overall break down ka stress filhal low hai.`;
      alertStyle = "bg-indigo-50 border-indigo-250 text-indigo-950";
    }
  } else {
    // Nifty is down
    const greenStocks = activeWeights.filter(s => !s.isRed).map(s => s.name);
    if (greenStocks.length >= 3) {
      trapStatus = "BULLISH DISCREPANCY: SMART ACCUMULATION COILING 🎯";
      trapMsg = `INTERESTING: Nifty under pressure lag raha hai par key heavyweights (${greenStocks.join(", ")}) robust range me buy ho rahe hain! Short sellers sudden pull-back recover zone me trap hone wale hain. Key low levels par immediate demand back up support expect karein.`;
      alertStyle = "bg-emerald-50 border-emerald-300 text-emerald-950";
    } else {
      trapStatus = "DOWNWARD CONSENSUS: HEALTHY CORRECTION";
      trapMsg = "Heavyweights aur Index dono align hoke correct kar rahe hain. Standard bearish trend structure intact hai.";
      alertStyle = "bg-slate-50 border-slate-200 text-slate-800";
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="heavyweights-tracker-tripwire">
      {/* Title block */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse" />
            <h3 className="text-sm font-bold tracking-widest text-slate-900 uppercase font-mono">
              Nifty Mega-Heavyweights Tripwire &amp; Trap Radar
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Reliance, HDFC Bank, Infosys aur TCS live results se institutional smart-money traps ko immediate catch karein.
          </p>
        </div>

        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 font-mono"
        >
          <HelpCircle size={13} className="text-rose-600" />
          {showInfo ? "Hide Explainer" : "Rules: Red matlab Trap kaise?"}
        </button>
      </div>

      {/* Trap Explainer in Hinglish */}
      {showInfo && (
        <div className="mb-5 p-4 bg-red-950/[0.03] text-slate-700 text-xs rounded-xl border border-red-900/10 space-y-2.5 leading-relaxed animate-fade-in" id="heavyweights-explainer-box">
          <div className="font-extrabold text-red-900 flex items-center gap-1.5 font-mono uppercase text-[10px] tracking-wider mb-1">
            <Sparkles size={12} className="text-amber-500" /> TRAP RULES: KEY HEAVYWEIGHTS CORRELATION (RELIANCE + HDFC + INFY + TCS)
          </div>
          <p className="font-sans">
            १. <span className="font-bold text-slate-900">Reliance, HDFC Bank, Infosys, aur TCS</span> मिलकर Nifty 50 का <span className="font-bold text-slate-900 underline">लगभग ३०.७% वेटेज</span> कंट्रोल करते हैं। यह ऑलमोस्ट एक-तिहाई मार्केट पावर है!
          </p>
          <p className="font-sans">
            २. अगर Nifty ऊपर ग्रीन (<span className="text-emerald-650 font-bold">🟢</span>) जा रहा है, लेकिन इनमें से <span className="font-bold text-rose-700 underline">३ या ४ स्टॉक्स लाल (RED 🔴)</span> हैं, तो समझ जाइए कि छोटे-मोटे स्टॉक्स को जानबूझकर घुमाकर बाजार को आर्टिफिशियली ऊपर रोका जा रहा है।
          </p>
          <p className="font-sans text-amber-900 font-semibold">
            ३. ऐसे समय में Nifty का high-rise पूरी तरह FAKE (Retailers-Trap) होता है, और बड़े ऑपरेटर्स ऊंचे लेवल्स पर सेलिंग कर रहे होते हैं जिससे जल्द ही एक भारी क्रैश/गिरावट आती है।
          </p>
        </div>
      )}

      {/* Grid of the 4 Heavyweights & Nifty side-by-side */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-5" id="heavyweights-dashboard-cards">
        {/* NIFTY CARD */}
        <div className="p-3 rounded-xl border border-slate-205 bg-slate-50 flex flex-col justify-between h-24 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 font-mono tracking-wider uppercase">Nifty Benchmark</div>
          <div className="text-base font-black font-mono text-slate-900 tracking-tight my-0.5">
            {nifty.value.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              isNiftyUp ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
            }`}>
              {isNiftyUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {isNiftyUp ? "+" : ""}{nifty.change.toFixed(2)}%
            </span>
            <span className="text-[8px] font-mono text-slate-400">INDEX</span>
          </div>
        </div>

        {/* RELIANCE CARD */}
        <div className={`p-3 rounded-xl border transition-all duration-305 flex flex-col justify-between h-24 shadow-sm ${
          isRelianceRed ? "bg-rose-50/50 border-rose-200" : "bg-emerald-50/40 border-emerald-150"
        }`}>
          <div className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase flex items-center justify-between">
            <span>RELIANCE</span>
            <span className="text-[8px] bg-slate-200/60 px-1 rounded font-normal font-sans">11.1%</span>
          </div>
          <div className="text-base font-black font-mono text-slate-800 tracking-tight my-0.5">
            ₹{reliance.value.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              isRelianceRed ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {isRelianceRed ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
              {isRelianceRed ? "" : "+"}{reliance.change.toFixed(2)}%
            </span>
            <span className="text-[8px] font-mono text-slate-400">ENERGY</span>
          </div>
        </div>

        {/* HDFC BANK CARD */}
        <div className={`p-3 rounded-xl border transition-all duration-305 flex flex-col justify-between h-24 shadow-sm ${
          isHdfcRed ? "bg-rose-50/50 border-rose-200" : "bg-emerald-50/40 border-emerald-150"
        }`}>
          <div className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase flex items-center justify-between">
            <span>HDFC BANK</span>
            <span className="text-[8px] bg-slate-200/60 px-1 rounded font-normal font-sans">10.3%</span>
          </div>
          <div className="text-base font-black font-mono text-slate-800 tracking-tight my-0.5">
            ₹{hdfc.value.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              isHdfcRed ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {isHdfcRed ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
              {isHdfcRed ? "" : "+"}{hdfc.change.toFixed(2)}%
            </span>
            <span className="text-[8px] font-mono text-slate-400">FINANCE</span>
          </div>
        </div>

        {/* INFOSYS CARD */}
        <div className={`p-3 rounded-xl border transition-all duration-305 flex flex-col justify-between h-24 shadow-sm ${
          isInfyRed ? "bg-rose-50/50 border-rose-200" : "bg-emerald-50/40 border-emerald-150"
        }`}>
          <div className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase flex items-center justify-between">
            <span>INFOSYS</span>
            <span className="text-[8px] bg-slate-200/60 px-1 rounded font-normal font-sans">5.2%</span>
          </div>
          <div className="text-base font-black font-mono text-slate-800 tracking-tight my-0.5">
            ₹{infy.value.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              isInfyRed ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {isInfyRed ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
              {isInfyRed ? "" : "+"}{infy.change.toFixed(2)}%
            </span>
            <span className="text-[8px] font-mono text-slate-400">IT</span>
          </div>
        </div>

        {/* TCS CARD */}
        <div className={`p-3 rounded-xl border transition-all duration-305 flex flex-col justify-between h-24 shadow-sm ${
          isTcsRed ? "bg-rose-50/50 border-rose-200" : "bg-emerald-50/40 border-emerald-150"
        }`}>
          <div className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase flex items-center justify-between">
            <span>TCS</span>
            <span className="text-[8px] bg-slate-200/60 px-1 rounded font-normal font-sans">4.1%</span>
          </div>
          <div className="text-base font-black font-mono text-slate-800 tracking-tight my-0.5">
            ₹{tcs.value.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              isTcsRed ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {isTcsRed ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
              {isTcsRed ? "" : "+"}{tcs.change.toFixed(2)}%
            </span>
            <span className="text-[8px] font-mono text-slate-400">IT</span>
          </div>
        </div>
      </div>

      {/* THE TRIPWIRE TRAP DETECTOR BOX */}
      <div className={`p-4.5 rounded-xl border-l-4 leading-relaxed font-sans ${alertStyle}`} id="tripwire-alert-banner">
        <div className="flex items-center gap-2 mb-1.5">
          <ShieldAlert className="flex-shrink-0" size={18} />
          <span className="font-extrabold text-xs uppercase tracking-widest font-mono">
            TRIPWIRE ANALYSIS: {trapStatus}
          </span>
        </div>
        <p className="text-xs font-semibold leading-relaxed font-sans mt-1">
          {trapMsg}
        </p>

        {/* Visual score bar represent how much of the heavy weights is dragging red */}
        <div className="mt-3.5 pt-3 border-t border-slate-100/40">
          <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold font-mono mb-1">
            <span>Heavyweights Red Weight drag (Max 30.7%)</span>
            <span className={redWeightContribution > 15 ? "text-rose-600 font-extrabold" : "text-emerald-600"}>
              {redWeightContribution.toFixed(1)}% / 30.7% (Red Drag)
            </span>
          </div>
          <div className="relative w-full h-2 rounded-full overflow-hidden bg-slate-100">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                redWeightContribution > 15 ? "bg-rose-500" :
                redWeightContribution > 5 ? "bg-amber-400" : "bg-emerald-500"
              }`}
              style={{ width: `${(redWeightContribution / 30.7) * 100}%` }}
            />
          </div>
        </div>

        {/* Dynamic warning bar when trap is triggered */}
        {isNiftyUp && totalRedCount >= 3 && (
          <div className="mt-4 pt-3 border-t border-rose-200 text-[11px] font-bold text-rose-700 font-mono flex items-center gap-2 animate-bounce">
            <AlertTriangle size={14} className="text-rose-600" />
            NIFTY HEAVYWEIGHTS HARSH TRAP LEVEL 5: SMART MONEY IS SHORTING HIGHS IN BULK!
          </div>
        )}
      </div>
    </div>
  );
}
