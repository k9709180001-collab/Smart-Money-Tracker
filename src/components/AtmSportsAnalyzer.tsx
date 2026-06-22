import React, { useState } from "react";
import { OptionChainRow } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, Shield, HelpCircle, Swords, Play, Sparkles, 
  Flag, Volume2, Flame, Award, Zap, ChevronRight, RotateCcw
} from "lucide-react";

interface AtmSportsAnalyzerProps {
  optionChain: OptionChainRow[];
  spotPrice: number;
  selectedSymbol?: string;
}

export default function AtmSportsAnalyzer({ optionChain, spotPrice, selectedSymbol = "NIFTY" }: AtmSportsAnalyzerProps) {
  const [activeStrategy, setActiveStrategy] = useState<string>("all-round");
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [commentaryFilter, setCommentaryFilter] = useState<"all" | "critical">("all");

  // Filter strikes close to the spot price, ordered by strike ascending.
  // Options indices (like NIFTY) have 50-point strike widths.
  const sortedChain = [...optionChain].sort((a, b) => a.strike - b.strike);

  // Find the exact ATM strike index
  let closestIndex = 0;
  if (sortedChain.length > 0) {
    let minDiff = Math.abs(sortedChain[0].strike - spotPrice);
    for (let i = 1; i < sortedChain.length; i++) {
      const diff = Math.abs(sortedChain[i].strike - spotPrice);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
  }

  // Slice ATM +/- 2 strikes to represent 5 key strikes (the 50-point interval playfield)
  const startIndex = Math.max(0, closestIndex - 2);
  const endIndex = Math.min(sortedChain.length - 1, closestIndex + 2);
  const sportsStrikes = sortedChain.slice(startIndex, endIndex + 1);

  // General metrics around these 5 sports strikes
  const totalCallsOI = sportsStrikes.reduce((sum, item) => sum + (item.callOI || 0), 0);
  const totalPutsOI = sportsStrikes.reduce((sum, item) => sum + (item.putOI || 0), 0);
  
  const totalCallsOIchg = sportsStrikes.reduce((sum, item) => sum + Math.abs(item.callOIchg || 0), 0);
  const totalPutsOIchg = sportsStrikes.reduce((sum, item) => sum + Math.abs(item.putOIchg || 0), 0);

  // Determine current Stadium Score
  const callScore = Math.max(1, Math.round(totalCallsOI / 100000) || Math.round(totalCallsOIchg / 10));
  const putScore = Math.max(1, Math.round(totalPutsOI / 100000) || Math.round(totalPutsOIchg / 10));

  // Determine who is dominating the pitch
  let leader: "Bulls" | "Bears" | "Draw" = "Draw";
  let statusBanner = "Vigorous Match in Progress";
  let statusColor = "from-amber-600 to-amber-700";
  let statusTextColor = "text-amber-100";

  if (totalPutsOI > totalCallsOI * 1.15) {
    leader = "Bulls";
    statusBanner = "Team Put Bulls Dominating! Pitch Supporting Strong Floors.";
    statusColor = "from-emerald-650 to-emerald-800 bg-emerald-900 border-emerald-800";
    statusTextColor = "text-emerald-100";
  } else if (totalCallsOI > totalPutsOI * 1.15) {
    leader = "Bears";
    statusBanner = "Team Call Bears Dominating! Heavy Resistance Ceiling Forcing Drop.";
    statusColor = "from-rose-650 to-rose-800 bg-rose-900 border-rose-800";
    statusTextColor = "text-rose-100";
  } else {
    statusBanner = "Intense Straddle Lock! Neutral Midfield Tug-of-war.";
  }

  // Sports commentary builder (Hinglish + high-fidelity sports dynamic prose)
  const getStrikeCommentary = (item: OptionChainRow) => {
    const strikeDiff = item.strike - spotPrice;
    const isAtTheMoney = Math.abs(strikeDiff) <= 25;
    const isCallHeavy = item.callOIchg > item.putOIchg * 1.2;
    const isPutHeavy = item.putOIchg > item.callOIchg * 1.2;

    if (isAtTheMoney) {
      if (isCallHeavy) {
        return `🥅 ATM ${item.strike} is the Active Pitch Line! Call Bears have placed heavy fielders restricting the upward drive. Resistance ceiling here is solid.`;
      }
      if (isPutHeavy) {
        return `🔥 ATM ${item.strike} under heavy attack! Put Bulls are sliding in with heavy supportive padding. Buyers are aggressively holding line!`;
      }
      return `⚖️ Pure Middle Pitch! ${item.strike} has symmetrical straddle tension. Squeeze loading up for a lightning-fast breakout.`;
    } else if (strikeDiff > 0) {
      // Out Of the Money Calls
      if (isCallHeavy) {
        return `🚫 Outfielder Blocks! Call Bears are setting deep goalposts at ${item.strike}. If spot rises there, expect heavy block pressure.`;
      }
      return `🏃 Upward open track! Low goalie presence at ${item.strike} means index has an easy chase window above spot.`;
    } else {
      // In The Money Calls / Out Of the Money Puts
      if (isPutHeavy) {
        return `🛡️ Defensive Goalpost! Put Bulls have reinforced concrete floor at ${item.strike}. Selling below this wicket looks extremely difficult.`;
      }
      return `⚠️ Floor Creak! Strike ${item.strike} has weak bull presence. Bears will try to intercept if index undergoes dynamic panic selling.`;
    }
  };

  // Playbook simulations options
  const playbookStrategies = [
    {
      id: "all-round",
      name: "Stadium Overview",
      description: "Complete pitch details across all five 50-interval strikes.",
      icon: Trophy
    },
    {
      id: "bull-rush",
      name: "Put Bull Attack Layout",
      description: "Highlights key support wickets where Put Sellers are catching long runs.",
      icon: Shield
    },
    {
      id: "bear-trap",
      name: "Call Bear Defense Layout",
      description: "Visualizes the heavy resistance lines where Call short sellers are intercepting.",
      icon: Swords
    },
    {
      id: "breakout",
      name: "Referee Breakout Watch",
      description: "Finds strikes where straddle squeeze increases the probability of panic covering.",
      icon: Flag
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6" id="atm-sports-analyzer-widget">
      {/* HEADER SECTION WITH REPLAY AND AUDIO SIM */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-600 text-white rounded-lg font-mono">
              <Zap size={14} className="animate-pulse" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold tracking-wider text-slate-800 font-mono uppercase flex items-center gap-2">
                Nifty ATM 50 Spot-Sports Arena
                <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-black font-mono">
                  PRO LEVEL
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Dynamic 50-strike interval tracker visualizing buyer strength &amp; seller resistance locks like a match play.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle mockup */}
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`p-2 rounded-lg border text-xs font-mono transition-all duration-150 cursor-pointer ${
              soundOn 
                ? "bg-emerald-50 border-emerald-350 text-emerald-700 font-bold" 
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
            title="Toggle Live Arena Commentary Sound (simulate)"
          >
            <Volume2 size={14} className={soundOn ? "animate-bounce" : ""} />
          </button>
          
          <button
            onClick={() => {
              // Simulating game refresh
              const alertAudio = typeof window !== 'undefined' ? new Audio() : null;
              if (alertAudio && soundOn) {
                // Play subtle tick
              }
            }}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-mono transition cursor-pointer"
            title="Simulate Match Tick Update"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* THE PITCH MAP (STADIUM TURF DESIGN) */}
      <div className="relative mb-6 border border-emerald-200 rounded-2xl bg-gradient-to-b from-emerald-50/40 via-emerald-100/30 to-emerald-50/40 p-5 shadow-inner" id="option-pitch-turf">
        
        {/* Subtle pitch grid lines overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06)_0%,transparent_80%)] pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-emerald-300/40 pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px border-l border-dashed border-emerald-300/40 pointer-events-none" />

        {/* TEAM NAMES AND CORE MATCH SCORE */}
        <div className="flex justify-between items-center relative z-10 bg-white border border-emerald-200/80 rounded-xl p-3 mb-5 shadow-xs">
          {/* Bears (Calls) */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center font-black text-rose-650 text-basis shadow-xs">
              🐻
            </div>
            <div className="text-left leading-none">
              <span className="block text-[8px] font-mono text-slate-550 uppercase tracking-widest font-bold">TEAM CALL</span>
              <span className="text-xs font-bold text-rose-700 font-mono">BEARS</span>
            </div>
          </div>

          {/* Stadium Score scoreboard */}
          <div className="bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-lg text-center font-mono shadow-inner">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Score (OI units)</div>
            <div className="text-lg font-black tracking-widest text-amber-600 flex items-center gap-1.5 justify-center">
              <span className="text-rose-600">{callScore}</span>
              <span className="text-slate-400 text-sm">:</span>
              <span className="text-emerald-600">{putScore}</span>
            </div>
          </div>

          {/* Bulls (Puts) */}
          <div className="flex items-center gap-2">
            <div className="text-right leading-none">
              <span className="block text-[8px] font-mono text-slate-550 uppercase tracking-widest font-bold">TEAM PUT</span>
              <span className="text-xs font-bold text-emerald-700 font-mono">BULLS</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center font-black text-emerald-650 text-basis shadow-xs">
              🐂
            </div>
          </div>
        </div>

        {/* LIVE REFEREE STATUS BAR */}
        <div className={`p-3 rounded-xl border mb-5 bg-gradient-to-r ${statusColor} text-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-sm`} id="live-ball-position-bar">
          <div className="flex items-center gap-2 text-white">
            <Flame size={14} className="animate-pulse" />
            <span className="font-extrabold tracking-tight text-[11px] font-sans">
              {statusBanner}
            </span>
          </div>
          <div className="text-[10px] bg-slate-900/40 border border-white/20 px-2 py-0.5 rounded font-mono font-bold text-white uppercase self-end">
            Ball Position: ₹{spotPrice}
          </div>
        </div>

        {/* 5 KEY PLAYFIELD STRIKES (50-INTERVALS) */}
        <div className="space-y-3 relative z-10" id="pitch-strike-playfield">
          {sportsStrikes.map((s, idx) => {
            const isAtm = Math.abs(s.strike - spotPrice) <= 25;
            
            // Total volume ratio
            const maxVal = Math.max(...sportsStrikes.map(st => Math.max(st.callOI, st.putOI, 1)), 1);
            const callOIPercent = Math.min(100, Math.max(5, (s.callOI / maxVal) * 100));
            const putOIPercent = Math.min(100, Math.max(5, (s.putOI / maxVal) * 100));

            // Rate of dynamic change
            const isCallAdding = s.callOIchg >= 0;
            const isPutAdding = s.putOIchg >= 0;

            const isFilteredOut = 
              (activeStrategy === "bull-rush" && s.putOIchg <= s.callOIchg) ||
              (activeStrategy === "bear-trap" && s.callOIchg <= s.putOIchg);

            return (
              <motion.div 
                key={s.strike}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isFilteredOut ? 0.3 : 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className={`border rounded-xl p-3.5 transition-all duration-200 relative ${
                  isAtm 
                    ? "bg-amber-50/95 border-amber-400 shadow-sm shadow-amber-200/50" 
                    : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-350"
                }`}
              >
                {/* STRIKE YARDS & LABELS */}
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      {isCallAdding ? "CALL WRITING" : "CALL UNWINDING"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (CE Chg: {isCallAdding ? "+" : ""}{s.callOIchg.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="text-center font-mono relative">
                    <span className={`text-xs font-black tracking-tight ${isAtm ? "text-amber-805 text-amber-900 font-extrabold" : "text-slate-800"}`}>
                      Strike {s.strike}
                    </span>
                    {isAtm && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[7px] bg-amber-500 text-slate-950 px-1 py-0.2 rounded font-black uppercase tracking-wider whitespace-nowrap animate-pulse">
                        ATM Wicket
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-[10px] text-slate-500 font-mono">
                      (PE Chg: {isPutAdding ? "+" : ""}{s.putOIchg.toFixed(1)}%)
                    </span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-705 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      {isPutAdding ? "PUT WRITING" : "PUT UNWINDING"}
                    </span>
                  </div>
                </div>

                {/* VISUAL DUEL BAR PROGRESS */}
                <div className="grid grid-cols-12 items-center gap-3">
                  {/* Left Side: Call Team OI Defend Bar */}
                  <div className="col-span-5 flex justify-end items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-rose-700">
                      {(s.callOI / 100000).toFixed(1)}L
                    </span>
                    <div className="w-full bg-slate-100 border border-slate-205 h-3 rounded-full overflow-hidden flex justify-end">
                      <div 
                        className={`h-full rounded-l-full transition-all duration-300 ${isCallAdding ? 'bg-rose-500' : 'bg-slate-400'}`}
                        style={{ width: `${callOIPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Centered Strike indicator */}
                  <div className="col-span-2 text-center text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                    {isAtm ? "🥅 GOAL" : s.strike > spotPrice ? "UPFIELD" : "DNFIELD"}
                  </div>

                  {/* Right Side: Put Team OI Attack Bar */}
                  <div className="col-span-5 flex justify-start items-center gap-2">
                    <div className="w-full bg-slate-100 border border-slate-205 h-3 rounded-full overflow-hidden flex justify-start">
                      <div 
                        className={`h-full rounded-r-full transition-all duration-300 ${isPutAdding ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        style={{ width: `${putOIPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">
                      {(s.putOI / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>

                {/* PLAY commentary for current strike */}
                <div className="mt-2.5 bg-white rounded-lg p-2 border border-slate-200 text-[10px] text-slate-700 italic flex items-center gap-2 shadow-xs">
                  <Volume2 size={12} className="text-slate-400 flex-shrink-0" />
                  <span className="font-sans leading-relaxed">{getStrikeCommentary(s)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* STRATEGIST PLAYBOOK ACTION SELECTORS */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5" id="stadium-playbook">
        <label className="text-[10px] font-extrabold font-mono text-slate-500 uppercase tracking-widest block mb-3">
          📋 Premium Playbook Tactics Editor
        </label>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          {playbookStrategies.map((item) => {
            const IconComp = item.icon;
            const isActive = activeStrategy === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveStrategy(item.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                  isActive
                    ? "bg-indigo-50 border-indigo-400 text-indigo-950 shadow-xs"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-350 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <IconComp size={15} className={isActive ? "text-indigo-600" : "text-slate-405"} />
                  {isActive && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                </div>
                <div className="text-[10px] font-extrabold uppercase font-mono tracking-wide">
                  {item.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Strategy description */}
        <p className="text-[11px] text-slate-650 font-sans italic bg-white p-2.5 rounded-lg border border-slate-200">
          <span className="font-bold font-mono text-slate-705 not-italic uppercase text-[9px] tracking-wider block mb-0.5">Active Play:</span>
          {playbookStrategies.find(s => s.id === activeStrategy)?.description}
        </p>
      </div>

      {/* SPORTS CONSOLIDATED HEATMAP PROGRESS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center text-slate-800">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="text-[8px] uppercase tracking-wider text-slate-550 font-mono font-bold">Fielding Coverage (Calls)</div>
          <div className="text-sm font-extrabold text-rose-600 font-mono mt-0.5">
            {totalCallsOIchg >= 0 ? "+" : ""}{totalCallsOIchg.toFixed(1)}% Velocity
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="text-[8px] uppercase tracking-wider text-slate-550 font-mono font-bold">Goal Attack Coverage (Puts)</div>
          <div className="text-sm font-extrabold text-emerald-600 font-mono mt-0.5">
            {totalPutsOIchg >= 0 ? "+" : ""}{totalPutsOIchg.toFixed(1)}% Velocity
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="text-[8px] uppercase tracking-wider text-slate-550 font-mono font-bold">Match Status Winner</div>
          <div className={`text-xs font-black uppercase mt-1 ${
            leader === "Bulls" ? "text-emerald-600" : leader === "Bears" ? "text-rose-605 text-rose-700" : "text-amber-600"
          }`}>
            {leader === "Bulls" ? "🏆 BULLS ON RUN" : leader === "Bears" ? "🏆 BEARS HOLD CEILING" : "⚖️ DYNAMIC EQUILIBRIUM"}
          </div>
        </div>
      </div>
    </div>
  );
}
