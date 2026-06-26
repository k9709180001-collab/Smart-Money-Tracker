import React, { useState, useMemo, useEffect } from "react";
import { 
  Play, Pause, RotateCcw, Info, Settings, HelpCircle, Check, 
  ChevronDown, Search, ArrowUpRight, ArrowDownRight, Sparkles, Activity,
  AlertCircle, Send, Target, Eye
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

interface StraddlePoint {
  time: string;
  nifty: number;
  straddleLtp: number;
  straddleVwap: number;
  niftyChangePercent: string;
  straddleChangeVal: string;
  isStartOfDay?: boolean;
}

export default function LongStraddleDashboard() {
  // Config states matching sample image
  const [showLtp, setShowLtp] = useState(true);
  const [showVwap, setShowVwap] = useState(false);
  const [showNifty, setShowNifty] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState("30 Jun");
  const [activeTimeframe, setActiveTimeframe] = useState("1m");
  
  // Bot training input parameters matching AGENTS.md requirements
  const [botVix, setBotVix] = useState(12.50);
  const [botDte, setBotDte] = useState(12);
  const [botSma10, setBotSma10] = useState(260);
  const [botEvent, setBotEvent] = useState("Union Budget");
  const [botEventInDays, setBotEventInDays] = useState(2);
  const [alertSentToday, setAlertSentToday] = useState(false);
  const [niftyOneHourMove, setNiftyOneHourMove] = useState(0.4); // 0.4% move in last hour (rule says if >1% don't alert)
  
  // Simulation and dynamic ticker states
  const [isPlaying, setIsPlaying] = useState(true);
  const [tickIndex, setTickIndex] = useState(25); // Starts partially through the morning session
  const [playbackSpeed, setPlaybackSpeed] = useState(2000); // 2 seconds per minute bar
  const [hoveredPoint, setHoveredPoint] = useState<StraddlePoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("NIFTY");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);

  // Strategy database matching option parameters
  const strategyDetails: Record<string, { strike: number; basePremium: number; drift: number }> = {
    "30 Jun": { strike: 24100, basePremium: 290.50, drift: -0.15 },
    "07 Jul": { strike: 24150, basePremium: 345.00, drift: -0.12 },
    "14 Jul": { strike: 24200, basePremium: 388.20, drift: -0.10 },
    "21 Jul": { strike: 24250, basePremium: 412.50, drift: -0.08 },
    "28 Jul": { strike: 24300, basePremium: 435.00, drift: -0.06 },
    "04 Aug": { strike: 24350, basePremium: 468.00, drift: -0.05 },
  };

  const currentStrategyInfo = strategyDetails[selectedStrategy] || strategyDetails["30 Jun"];

  // Generate 1-minute intraday dataset (09:15 AM to 03:30 PM = 375 minutes)
  const fullIntradayData: StraddlePoint[] = useMemo(() => {
    const points: StraddlePoint[] = [];
    const baseNifty = 24021.00; // Gives +0.38% around 24113
    const totalMinutes = 375;
    
    // Seed random generator to ensure consistency
    let seed = 42;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < totalMinutes; i++) {
      const startMins = 9 * 60 + 15; // 09:15 AM
      const currentMins = startMins + i;
      const hours = Math.floor(currentMins / 60);
      const mins = currentMins % 60;
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      const timeStr = `${displayHours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${ampm}`;
      const dateLabel = `25 Jun, ${timeStr}`;

      const progress = i / (totalMinutes - 1);

      // 1. Simulating underlying NIFTY movement matching the actual shape of the uploaded image
      // Initial dip, followed by a sharp recovery, and steady decline in the second half
      let nifty = baseNifty;
      if (progress < 0.10) {
        // Drop in first 10%
        const t = progress / 0.10;
        nifty = baseNifty - t * 45 + Math.sin(t * Math.PI) * 10;
      } else if (progress < 0.40) {
        // Recovery up to peak around 11:30 AM
        const t = (progress - 0.10) / 0.30;
        nifty = (baseNifty - 35) + t * 148 + Math.sin(t * Math.PI * 2) * 12;
      } else if (progress < 0.70) {
        // Consolidation and decline
        const t = (progress - 0.40) / 0.30;
        nifty = (baseNifty + 113) - t * 105 + Math.cos(t * Math.PI * 3) * 15;
      } else {
        // Final drag down
        const t = (progress - 0.70) / 0.30;
        nifty = (baseNifty + 8) - t * 30 + Math.sin(t * Math.PI * 4) * 8;
      }

      // Add high-frequency micro noises to make it look like real market line
      const microNoiseNifty = (random() - 0.5) * 4 + Math.sin(i * 1.5) * 1.5;
      const finalNifty = parseFloat((nifty + microNoiseNifty).toFixed(2));

      // 2. Simulating option premium behavior of the Straddle (Put + Call combined premium)
      // Straddles experience massive theta decay in the first 2 hours and slowly stabilize
      const basePremium = currentStrategyInfo.basePremium;
      const decayFactor = Math.exp(-progress * 1.6); // Fast decay
      
      // Option premium also reacts to index movement (implied volatility and delta changes)
      // It expands when the index moves away from the strike (24100) and contracts near the strike
      const strikeDifference = Math.abs(finalNifty - currentStrategyInfo.strike);
      const intrinsicMove = strikeDifference * 0.45; // Simulated straddle delta acceleration

      let straddleLtp = basePremium * (0.70 + 0.30 * decayFactor) + intrinsicMove * 0.55;
      
      // Custom dip at the very beginning to match sample image (-38.3 points dip at 09:16 AM)
      if (i === 1) {
        straddleLtp = 242.10;
      } else if (i === 0) {
        straddleLtp = 280.40;
      } else {
        // Volatility spikes/dips simulation
        const wave = Math.sin(progress * Math.PI * 5) * 8;
        straddleLtp += wave + (random() - 0.5) * 2;
      }

      // Make sure premium stays above a logical minimum
      straddleLtp = Math.max(160, straddleLtp);

      // Generate simulated VWAP (smoothed cumulative premium average)
      let sumLtp = 0;
      for (let j = 0; j <= i; j++) {
        // Quick deterministic helper to mock VWAP curve
        sumLtp += straddleLtp * (1 + (Math.sin(j * 0.1) * 0.01));
      }
      const straddleVwap = parseFloat((sumLtp / (i + 1)).toFixed(2));

      const finalLtp = parseFloat(straddleLtp.toFixed(2));

      // Calculate Nifty change relative to the morning opening baseline (24021.00)
      const niftyChangePercentVal = ((finalNifty - 24021.00) / 24021.00) * 100;
      const niftyChangePercent = (niftyChangePercentVal >= 0 ? "+" : "") + niftyChangePercentVal.toFixed(2) + "%";

      // Calculate straddle absolute change from opening bar (index 0)
      const changeVal = finalLtp - points[0]?.straddleLtp;
      const straddleChangeVal = (changeVal >= 0 ? "+" : "") + changeVal.toFixed(1);

      points.push({
        time: dateLabel,
        nifty: finalNifty,
        straddleLtp: finalLtp,
        straddleVwap,
        niftyChangePercent,
        straddleChangeVal,
        isStartOfDay: i === 12 // Labeled "Start of day"
      });
    }

    return points;
  }, [currentStrategyInfo]);

  // Handle active playback simulation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTickIndex((prev) => {
        if (prev >= fullIntradayData.length - 1) {
          return 5; // Loop back
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, fullIntradayData]);

  // Downsample data based on active timeframe
  const displayData = useMemo(() => {
    const sliced = fullIntradayData.slice(0, tickIndex + 1);
    if (activeTimeframe === "1m") return sliced;
    
    let interval = 5;
    if (activeTimeframe === "5m") interval = 5;
    else if (activeTimeframe === "15m") interval = 15;
    else if (activeTimeframe === "30m") interval = 30;
    else if (activeTimeframe === "1hr") interval = 60;
    else return sliced; // Default / Intraday fallback

    return sliced.filter((_, idx) => idx % interval === 0 || idx === sliced.length - 1);
  }, [fullIntradayData, tickIndex, activeTimeframe]);

  const lastPoint = displayData[displayData.length - 1] || { nifty: 24113.20, straddleLtp: 242.10, niftyChangePercent: "+0.38%", straddleChangeVal: "-38.3" };
  const currentNifty = lastPoint.nifty;
  const currentStraddle = lastPoint.straddleLtp;

  // The displayed hover item (if hovered, show hovered point, else show latest point to keep dashboard responsive)
  const activeDisplayedPoint = hoveredPoint || lastPoint;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden font-sans antialiased text-slate-800" id="long-straddle-dashboard-container">
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Search Widget */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-450 pointer-events-none">
              <Search size={15} />
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              className="pl-9 pr-3.5 py-1.5 w-64 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
              placeholder="Search Symbol (e.g. NIFTY)"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg border border-emerald-200/80">
            <span className="text-xs font-black font-mono">₹{currentNifty.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] font-bold font-mono">{lastPoint.niftyChangePercent}</span>
          </div>

          <button 
            onClick={() => setGuideOpen(!guideOpen)}
            className="px-3 py-1.5 border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1 transition"
          >
            <Info size={13} />
            <span>Info</span>
          </button>
        </div>

        {/* Timeframe Presets & Navigation Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg border border-slate-200">
            {["1m", "5m", "15m", "30m", "1hr", "1d", "Intraday"].map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTimeframe === tf 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Scrolling/Jump controls */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => {
                setIsPlaying(false);
                setTickIndex(prev => Math.max(0, prev - 10));
              }}
              className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition" 
              title="Step backward 10 mins"
            >
              <RotateCcw size={14} className="transform rotate-180" />
            </button>
            
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded transition ${isPlaying ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"}`}
              title={isPlaying ? "Pause simulated feed" : "Resume simulated feed"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>

            <button 
              onClick={() => {
                setIsPlaying(false);
                setTickIndex(prev => Math.min(fullIntradayData.length - 1, prev + 10));
              }}
              className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition"
              title="Step forward 10 mins"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Settings trigger */}
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>

          {/* Jump options */}
          <div className="relative">
            <select 
              onChange={(e) => {
                setIsPlaying(false);
                const timeStr = e.target.value;
                const idx = fullIntradayData.findIndex(p => p.time.includes(timeStr));
                if (idx !== -1) setTickIndex(idx);
              }}
              className="appearance-none bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 pr-8 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">Jump...</option>
              <option value="09:15 AM">09:15 AM (Open)</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:30 AM">11:30 AM (Peak)</option>
              <option value="01:00 PM">01:00 PM</option>
              <option value="02:30 PM">02:30 PM</option>
              <option value="03:30 PM">03:30 PM (Close)</option>
            </select>
            <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown size={14} />
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN LAYOUT GRID (LEFT SIDEBAR PANEL + RIGHT CHART STAGE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        
        {/* SIDEBAR PANEL (COL-SPAN-3) */}
        <div className="lg:col-span-3 bg-slate-50/80 border-r border-slate-100 p-5 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-800 tracking-tight font-mono">Auto ATM Straddle</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-amber-500 text-white font-sans uppercase animate-pulse">
                New
              </span>
            </div>
            <span className="text-slate-400 hover:text-slate-600 transition cursor-help" title="ATM straddles bundle ATM CE & PE premiums to track volatility breakups automatically.">
              <HelpCircle size={15} />
            </span>
          </div>

          {/* Price Display Checkboxes */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Price Display
            </h4>
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showLtp}
                  onChange={(e) => setShowLtp(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 w-4 h-4"
                />
                <span className="flex items-center gap-2">
                  <span className="w-4 h-1 bg-[#ff6b35] rounded-full" />
                  LTP
                </span>
              </label>

              <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showVwap}
                  onChange={(e) => setShowVwap(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 w-4 h-4"
                />
                <span className="flex items-center gap-2">
                  <span className="w-4 h-0.5 border-t-2 border-dotted border-blue-500" />
                  VWAP
                </span>
              </label>
            </div>
          </div>

          {/* Show Stock Price */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Show Stock Price
            </h4>
            <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showNifty}
                onChange={(e) => setShowNifty(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 w-4 h-4"
              />
              <span className="flex items-center gap-2">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#d946ef]" />
                NIFTY
              </span>
            </label>
          </div>

          {/* Select Strategy (Expiry Selection) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Select Strategy
            </h4>
            <div className="space-y-2">
              {Object.keys(strategyDetails).map((expiry) => (
                <label 
                  key={expiry}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${
                    selectedStrategy === expiry 
                      ? "bg-blue-50/50 border-blue-200 text-blue-700" 
                      : "bg-white border-slate-200 hover:bg-slate-100 text-slate-650"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="radio"
                      name="strategy-expiry"
                      checked={selectedStrategy === expiry}
                      onChange={() => setSelectedStrategy(expiry)}
                      className="text-blue-600 focus:ring-blue-500/20 w-3.5 h-3.5"
                    />
                    <span>{expiry} Expiry</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ₹{strategyDetails[expiry].strike} ATM
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ATM Strike Status Panel */}
          <div className="pt-4 border-t border-slate-200/60 text-xs">
            <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2.5 font-mono shadow-inner">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                ATM Strike Parameters
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Selected Expiry Strike:</div>
                <div className="text-sm font-black text-amber-400">
                  {currentStrategyInfo.strike} ({selectedStrategy})
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <div>
                  <div className="text-[9px] text-slate-500">Live Straddle LTP:</div>
                  <div className="text-xs font-bold text-slate-200">₹{currentStraddle.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">Today's Drift:</div>
                  <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                    parseFloat(lastPoint.straddleChangeVal) >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {lastPoint.straddleChangeVal}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT CHART GRID PORT (COL-SPAN-9) */}
        <div className="lg:col-span-9 p-5 flex flex-col justify-between space-y-5 bg-white relative">
          
          {/* Informative Guide box if expanded */}
          {guideOpen && (
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 flex justify-between items-start gap-4 shadow-lg animate-fade-in" id="straddle-guide-infobox">
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <Sparkles size={13} className="text-amber-400" /> Auto ATM Long Straddle Playbook (Hinglish Guide)
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  जब <span className="font-bold text-white underline">India VIX low ho (&lt;12)</span> tab options ka premium sasta ho jata hai. Aise me volatility break-up aane par, <span className="text-teal-400 font-bold">Long Straddle (Call & Put dono buy karna)</span> automatic profit deta hai. Screen par Orange Line options ke Straddle price ko aur Purple dashed line Nifty Index spot ko darshati hai. Crossover patterns trigger hone par smart signals auto-generate hote hain!
                </p>
              </div>
              <button 
                onClick={() => setGuideOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition font-mono shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Chart Metadata Indicator bar */}
          <div className="flex items-center justify-between px-2 text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-4">
              <span>ACTIVE SERIES: <strong className="text-slate-800">{selectedStrategy} Expiry Straddle</strong></span>
              <span>BASE ATM STRIKE: <strong className="text-slate-800">₹{currentStrategyInfo.strike}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full inline-block" />
              <span>Straddle premium</span>
              <span className="w-2.5 h-0.5 border-t-2 border-dashed border-purple-500 inline-block ml-2" />
              <span>Nifty Index</span>
            </div>
          </div>

          {/* Interactive Recharts Stage */}
          <div className="bg-slate-50 border border-slate-150/80 rounded-2xl p-4.5 relative h-[380px] w-full" id="straddle-charts-viewport">
            
            {/* Interactive Floating Tooltip Card, styled EXACTLY like the white overlay floating box in the user's uploaded image */}
            <div 
              className="absolute z-20 bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xl max-w-[250px] font-sans text-slate-900 transition-all duration-100 ease-out animate-fade-in" 
              id="image-style-floating-card-straddle"
              style={
                hoverCoords
                  ? {
                      left: `${hoverCoords.x + 20}px`,
                      top: `${Math.max(10, hoverCoords.y - 70)}px`,
                      transform: hoverCoords.x > 500 ? "translateX(-110%)" : "none",
                      pointerEvents: "none",
                    }
                  : {
                      left: "24px",
                      top: "24px",
                      pointerEvents: "none",
                    }
              }
            >
              <div className="text-[10px] font-bold text-slate-400 mb-1.5 font-mono">
                {activeDisplayedPoint.time}
              </div>
              <div className="space-y-1 text-xs font-semibold">
                
                {/* Straddle Premium Info */}
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-1 bg-[#ff6b35] rounded-full inline-block"></span>
                    <span className="text-slate-500 font-mono tracking-wider text-[9px] uppercase font-bold">
                      {selectedStrategy} Auto ATM Straddle - {currentStrategyInfo.strike}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <span className="text-slate-800 font-black">
                      {activeDisplayedPoint.straddleLtp.toFixed(2)}
                    </span>
                    <span className={`text-[9px] font-bold px-1 rounded ${
                      parseFloat(activeDisplayedPoint.straddleChangeVal) >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                    }`}>
                      {activeDisplayedPoint.straddleChangeVal}
                    </span>
                  </div>
                </div>

                {/* Index Info */}
                {showNifty && (
                  <div className="flex items-center justify-between gap-6 pt-1 border-t border-slate-100 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 border-t-2 border-dashed border-[#d946ef] inline-block"></span>
                      <span className="text-slate-500 font-mono tracking-wider text-[9px] uppercase font-bold">
                        NIFTY
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono">
                      <span className="text-slate-800 font-black">
                        {activeDisplayedPoint.nifty.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] font-bold px-1 rounded text-emerald-600 bg-emerald-50">
                        {activeDisplayedPoint.niftyChangePercent}
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Recharts LineChart */}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={displayData}
                margin={{ top: 20, right: 30, left: 15, bottom: 5 }}
                onMouseMove={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length) {
                    setHoveredPoint(state.activePayload[0].payload);
                    if (state.activeCoordinate) {
                      setHoverCoords({ x: state.activeCoordinate.x, y: state.activeCoordinate.y });
                    }
                  }
                }}
                onMouseLeave={() => {
                  setHoveredPoint(null);
                  setHoverCoords(null);
                }}
              >
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" opacity={0.6} />
                
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  fontFamily="monospace"
                  tickFormatter={(val) => val.split(", ")[1] || val} 
                  hide={false}
                />
                
                {/* Left YAxis for Straddle Options Premium */}
                <YAxis
                  yAxisId="premium"
                  domain={["auto", "auto"]}
                  stroke="#ff6b35"
                  fontSize={10}
                  fontFamily="monospace"
                  orientation="right"
                  tickFormatter={(v) => `₹${v.toFixed(0)}`}
                />

                {/* Right YAxis for Nifty Spot Price */}
                <YAxis
                  yAxisId="nifty"
                  domain={["auto", "auto"]}
                  stroke="#d946ef"
                  fontSize={10}
                  fontFamily="monospace"
                  orientation="left"
                  tickFormatter={(v) => v.toLocaleString("en-IN")}
                  hide={!showNifty}
                />

                {/* Custom Start of Day reference marker line */}
                <ReferenceLine 
                  x={fullIntradayData[12]?.time} 
                  stroke="#cbd5e1" 
                  strokeWidth={1.5}
                  label={{
                    value: "Start of day",
                    position: "bottom",
                    fill: "#64748b",
                    fontSize: 8,
                    fontFamily: "monospace",
                  }}
                  yAxisId="premium"
                />

                {/* Straddle Premium LTP line */}
                {showLtp && (
                  <Line
                    yAxisId="premium"
                    type="monotone"
                    dataKey="straddleLtp"
                    stroke="#ff6b35"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
                    name="STRADDLE_LTP"
                  />
                )}

                {/* Straddle Premium VWAP line */}
                {showVwap && (
                  <Line
                    yAxisId="premium"
                    type="monotone"
                    dataKey="straddleVwap"
                    stroke="#3b82f6"
                    strokeDasharray="3 3"
                    strokeWidth={1.8}
                    dot={false}
                    activeDot={{ r: 4, stroke: "#ffffff", strokeWidth: 1.5 }}
                    name="STRADDLE_VWAP"
                  />
                )}

                {/* Nifty Spot line */}
                {showNifty && (
                  <Line
                    yAxisId="nifty"
                    type="monotone"
                    dataKey="nifty"
                    stroke="#d946ef"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 1.8 }}
                    name="NIFTY_SPOT"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 3. LIVE ATM STRADDLE ALERT BOT & INDIA_VIX STRATEGY INTEGRATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1.5 animate-fade-in" id="live-bot-training-integration">
            
            {/* LEFT: Live Parameter Control & Indicator Checklist */}
            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse inline-block" />
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-mono">
                    Bot Training Input Simulator
                  </h4>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                  Rule Engine v1.5
                </span>
              </div>

              {/* Sliders and Selectors */}
              <div className="space-y-3.5 text-xs">
                {/* VIX Control */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">India VIX Spot:</span>
                    <strong className={botVix < 14 ? "text-emerald-600 font-bold" : "text-slate-700"}>{botVix.toFixed(2)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="9.00" 
                    max="22.00" 
                    step="0.25"
                    value={botVix} 
                    onChange={(e) => setBotVix(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>Low (&lt;14.00)</span>
                    <span>High (&ge;14.00)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Days to Expiry */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 text-[11px]">Days to Exp (DTE):</span>
                      <strong className={botDte >= 7 ? "text-emerald-600 font-bold" : "text-amber-600"}>{botDte}d</strong>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="30" 
                      value={botDte} 
                      onChange={(e) => setBotDte(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                    />
                  </div>

                  {/* 10-Day SMA of Straddle */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 text-[11px]">SMA-10 Baseline:</span>
                      <strong className="text-slate-700 font-bold">₹{botSma10}</strong>
                    </div>
                    <input 
                      type="range" 
                      min="200" 
                      max="350" 
                      step="5"
                      value={botSma10} 
                      onChange={(e) => setBotSma10(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                    />
                  </div>
                </div>

                {/* Economic Event Config */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Economic Event</label>
                    <select 
                      value={botEvent} 
                      onChange={(e) => setBotEvent(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-bold"
                    >
                      <option value="Union Budget">Union Budget</option>
                      <option value="RBI Monetary Policy">RBI Monetary Policy</option>
                      <option value="US Fed FOMC Meet">US Fed FOMC Meet</option>
                      <option value="Election Results">Election Results</option>
                      <option value="None">None (No Event)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Days to Event</label>
                    <input 
                      type="number"
                      min="1"
                      max="10"
                      value={botEventInDays}
                      onChange={(e) => setBotEventInDays(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-200 p-1 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Additional simulated variables for extra blocking rules */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">1h Nifty Move:</span>
                    <select 
                      value={niftyOneHourMove}
                      onChange={(e) => setNiftyOneHourMove(parseFloat(e.target.value))}
                      className="bg-white border border-slate-200 p-0.5 rounded text-[10px] font-mono"
                    >
                      <option value="0.4">0.4% (Normal)</option>
                      <option value="1.2">1.2% (Too High)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">Limit check:</span>
                    <button 
                      onClick={() => setAlertSentToday(!alertSentToday)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                        alertSentToday ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {alertSentToday ? "Sent today" : "No alert yet"}
                    </button>
                  </div>
                </div>

                {/* Section 4: Live India_VIX General Signal Calculation */}
                <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-3 space-y-1 mt-2.5">
                  <div className="text-[9px] text-blue-500 font-bold uppercase tracking-wider font-mono">
                    Section 4: India_VIX General Market Signal
                  </div>
                  <div className="flex justify-between items-center text-xs font-sans">
                    <span className="text-slate-655 font-bold">VIX Signal Result:</span>
                    <strong className="text-blue-700 font-mono text-[11px] bg-white border border-blue-100 px-2 py-0.5 rounded shadow-sm font-bold">
                      {(() => {
                        if (botVix < 12) {
                          return "STRONG BUY (Both Calls & Puts)";
                        } else if (botVix >= 12 && botVix <= 14) {
                          return "BUY (Directional - Trend following)";
                        } else if (botVix >= 15 && botVix <= 19) {
                          return "HEDGED BUY (Buy ATM Straddle)";
                        } else {
                          return "🔴 BLOCK ALL BUY ORDERS";
                        }
                      })()}
                    </strong>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT: Live Simulated Bot Output Console Terminal */}
            <div className="p-5 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col justify-between shadow-xl min-h-[300px]">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-black text-slate-300 font-mono uppercase tracking-wider">
                    Telegram Alert Console (Option Buyer)
                  </span>
                </div>
                <span className="text-[9px] text-rose-400 font-mono uppercase border border-rose-900 px-1.5 py-0.5 rounded font-black">
                  LIVE OUT
                </span>
              </div>

              {/* Live Terminal Message Area */}
              <div className="flex-1 my-3 bg-slate-900/40 rounded-xl p-4 overflow-y-auto font-mono text-xs text-slate-200 border border-slate-900/60 relative min-h-[220px]">
                {(() => {
                  const isVixOk = botVix < 14.00;
                  const isStraddleCheap = currentStraddle < botSma10 || parseFloat(lastPoint.straddleChangeVal) < -24;
                  const isExpirySafe = botDte >= 7;
                  const isEventOk = botEvent !== "None" && botEventInDays <= 3;
                  const isEventBackupActive = botEvent === "None" && isVixOk && currentStraddle < (botSma10 * 0.9) && botDte >= 10;
                  const isSignalActive = isVixOk && isStraddleCheap && isExpirySafe && (isEventOk || isEventBackupActive);
                  const isBlockNiftyMove = niftyOneHourMove > 1.0;
                  const isBlockExpiryTooNear = botDte < 3;
                  const finalSignalTriggered = isSignalActive && !isBlockNiftyMove && !isBlockExpiryTooNear;

                  if (finalSignalTriggered && !alertSentToday) {
                    return (
                      <div className="space-y-3 whitespace-pre-wrap select-text selection:bg-rose-500/30 selection:text-white leading-relaxed animate-fade-in" id="live-telegram-message-alert">
                        <div className="text-rose-400 font-black text-xs tracking-wider">🚨 BUY SIGNAL: ATM STRADDLE 🚨</div>
                        
                        <div className="space-y-1 text-slate-300">
                          <div>• <strong>समय:</strong> {lastPoint.time}</div>
                          <div>• <strong>Nifty Spot:</strong> ₹{currentNifty.toFixed(2)}</div>
                          <div>• <strong>Strike Price:</strong> {currentStrategyInfo.strike} ATM</div>
                          <div>• <strong>Straddle Premium:</strong> ₹{currentStraddle.toFixed(2)} <span className="text-emerald-400 font-bold">({(((currentStraddle - botSma10) / botSma10) * 100).toFixed(1)}% vs SMA-10)</span></div>
                          <div>• <strong>VIX:</strong> {botVix.toFixed(2)} (बहुत कम है, मतलब Premium सस्ता है)</div>
                          <div>• <strong>Expiry:</strong> {botDte} दिन बचे हैं (Theta का ज्यादा असर नहीं होगा)</div>
                          <div>• <strong>अगला बड़ा इवेंट:</strong> {botEvent} {botEventInDays} दिन में</div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 text-slate-300">
                          💡 <strong>क्यों खरीदें?:</strong> [VIX कम है, स्ट्रैडल सस्ता है, और आने वाले इवेंट ({botEvent}) में बड़ी Move की उम्मीद है]
                        </div>

                        <div className="text-amber-400">
                          ⚠️ <strong>Exit Strategy:</strong> इसे {Math.min(botEventInDays, 3)} दिन में बेच दें या अगर Premium ₹{(currentStraddle * 1.35).toFixed(0)} तक पहुंच जाए तो मुनाफा बुक करें।
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-5 text-center space-y-2.5">
                      <Eye className="text-slate-700 stroke-1 animate-pulse mb-1" size={24} />
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        Bot Status: Active & Listening
                      </div>
                      <p className="text-[10px] text-slate-600 max-w-[280px] leading-relaxed">
                        {isBlockExpiryTooNear 
                          ? "⚠️ Alert blocked: Days to Expiry is less than 3 days (Theta decay risk)."
                          : isBlockNiftyMove 
                          ? "⚠️ Alert blocked: Nifty moved >1% in last hour (Pre-empted movement limit)."
                          : alertSentToday
                          ? "⚠️ Alert blocked: Limit reached! Only 1 high-confidence alert per day permitted."
                          : "No alert generated. Conditions are not perfectly met, so the bot is staying quiet according to rule guidelines."}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Bot Checklist HUD Indicators */}
              {(() => {
                const isVixOk = botVix < 14.00;
                const isStraddleCheap = currentStraddle < botSma10 || parseFloat(lastPoint.straddleChangeVal) < -24;
                const isExpirySafe = botDte >= 7;
                const isEventOk = botEvent !== "None" && botEventInDays <= 3;
                return (
                  <div className="grid grid-cols-4 gap-1.5 text-[9px] font-mono font-bold text-slate-400">
                    <div className={`p-1 rounded border text-center transition ${isVixOk ? "bg-emerald-950/30 border-emerald-900/60 text-emerald-400" : "bg-slate-900 border-slate-800 text-slate-600"}`}>
                      VIX &lt; 14
                    </div>
                    <div className={`p-1 rounded border text-center transition ${isStraddleCheap ? "bg-emerald-950/30 border-emerald-900/60 text-emerald-400" : "bg-slate-900 border-slate-800 text-slate-600"}`}>
                      PREM &lt; SMA
                    </div>
                    <div className={`p-1 rounded border text-center transition ${isExpirySafe ? "bg-emerald-950/30 border-emerald-900/60 text-emerald-400" : "bg-slate-900 border-slate-800 text-slate-600"}`}>
                      DTE &ge; 7
                    </div>
                    <div className={`p-1 rounded border text-center transition ${isEventOk ? "bg-emerald-950/30 border-emerald-900/60 text-emerald-400" : "bg-slate-900 border-slate-800 text-slate-600"}`}>
                      EVENT &le; 3d
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>

          {/* 3. SIMULATOR FOOTER & MARKET INTERSECT LAWS */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-650">
              <Activity className="text-blue-500 animate-pulse" size={14} />
              <span className="font-mono text-[11px]">
                Active Index: <strong className="text-slate-800">Nifty Intraday Spot</strong> | Live Tracking: <strong className="text-slate-800">1-Min Interval Playback</strong>
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono font-bold text-slate-600">
                1m Feed Loop: Active
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-mono text-[10px]">Speed:</span>
                {[
                  { label: "1s", ms: 1000 },
                  { label: "2s", ms: 2000 },
                  { label: "5s", ms: 5000 }
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setPlaybackSpeed(s.ms)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition cursor-pointer ${
                      playbackSpeed === s.ms 
                        ? "bg-slate-900 text-white" 
                        : "bg-slate-200 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* SETTINGS DIALOG MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="settings-dialog">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Settings size={16} className="text-slate-500" />
                Auto Straddle Chart Settings
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-mono font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Baseline Spot Index Reference</label>
                <select className="w-full bg-slate-50 border border-slate-250 p-2 rounded-lg font-mono">
                  <option value="NIFTY">NIFTY SPOT (₹24,021.00 Open Baseline)</option>
                  <option value="BANKNIFTY">BANKNIFTY SPOT (₹52,100.00 Open Baseline)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Atm Strike Option Pricing Formula</label>
                <select className="w-full bg-slate-50 border border-slate-250 p-2 rounded-lg font-mono">
                  <option value="black-scholes">Standard Black-Scholes Formula (Vol = 12.8%)</option>
                  <option value="empirical">Real-Time Historical Spline Formula</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Simulation Playback Speed</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => { setPlaybackSpeed(1000); setShowSettingsModal(false); }}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-center font-mono"
                  >
                    Fast (1s)
                  </button>
                  <button 
                    onClick={() => { setPlaybackSpeed(3000); setShowSettingsModal(false); }}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-center font-mono"
                  >
                    Medium (3s)
                  </button>
                  <button 
                    onClick={() => { setPlaybackSpeed(6000); setShowSettingsModal(false); }}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-center font-mono"
                  >
                    Slow (6s)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Apply Configuration
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
