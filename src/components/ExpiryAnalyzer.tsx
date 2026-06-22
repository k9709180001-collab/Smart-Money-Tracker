import React, { useState, useMemo } from "react";
import { OptionChainRow } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, ShieldAlert, Sparkles, AlertTriangle, ArrowRightLeft, 
  TrendingUp, BarChart2, Zap, Clock, Compass, HelpCircle, FileBarChart, Timer
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface ExpiryAnalyzerProps {
  optionChain: OptionChainRow[];
  spotPrice: number;
  selectedSymbol: string;
  indicesStatus?: any;
}

export default function ExpiryAnalyzer({ optionChain, spotPrice, selectedSymbol, indicesStatus }: ExpiryAnalyzerProps) {
  const [decayHour, setDecayHour] = useState<number>(11); // 9 = Morning open, 11 = Pre-noon, 13 = Afternoon, 15 = Final hour
  const [heroCostLevel, setHeroCostLevel] = useState<number>(30); // Max premium user is willing to play for Hero-Zero
  const [panicLevel, setPanicLevel] = useState<number>(1.5); // Threshold multiplier for seller panic

  // Fetch VIX value to calculate VIX-implied moves
  const vixValue = useMemo(() => {
    if (indicesStatus?.indiavix?.value) {
      return parseFloat(indicesStatus.indiavix.value);
    }
    return 13.5; // Default standard India VIX
  }, [indicesStatus]);

  // Compute Expiry Max Pain Point mathematically from actual Option Chain
  // Max Pain Strike is where the cumulative payoff (loss) of all option buyers of Calls & Puts is minimized!
  const maxPainCalculation = useMemo(() => {
    if (!optionChain || optionChain.length === 0) {
      return { maxPainStrike: spotPrice, payoffData: [] };
    }

    const sortedStrikes = [...optionChain].map(r => r.strike).sort((a, b) => a - b);
    
    // Calculate total buyer loss if market expired at each unique strike
    const payoffData = sortedStrikes.map((expiryCandidate) => {
      let totalCallLoss = 0;
      let totalPutLoss = 0;

      optionChain.forEach((row) => {
        // Call Buyers have value only if candidate > row.strike
        const callIntrinsicValue = Math.max(0, expiryCandidate - row.strike);
        // Buyer Profit/Payoff underwriter pain is equivalent to open interest contracts multiplied by intrinsic payouts
        // Since we evaluate aggregate writer payouts mapping, total premium loss for buyers is calculated:
        // Payout = OI * Intrinsic value
        totalCallLoss += row.callOI * callIntrinsicValue;

        // Put Buyers have value only if candidate < row.strike
        const putIntrinsicValue = Math.max(0, row.strike - expiryCandidate);
        totalPutLoss += row.putOI * putIntrinsicValue;
      });

      const totalPain = totalCallLoss + totalPutLoss;

      return {
        strike: expiryCandidate,
        "Total Buyer Payoff Pain": parseFloat((totalPain / 100000).toFixed(2)), // in lakhs units
        "Call Buyer Payoff": parseFloat((totalCallLoss / 100000).toFixed(2)),
        "Put Buyer Payoff": parseFloat((totalPutLoss / 100000).toFixed(2)),
      };
    });

    // Find the strike with the minimum total pain to identify Max Pain Strike
    let minPainRow = payoffData[0];
    payoffData.forEach((row) => {
      if (row["Total Buyer Payoff Pain"] < minPainRow["Total Buyer Payoff Pain"]) {
        minPainRow = row;
      }
    });

    return {
      maxPainStrike: minPainRow ? minPainRow.strike : spotPrice,
      payoffData
    };
  }, [optionChain, spotPrice]);

  const { maxPainStrike, payoffData } = maxPainCalculation;

  // Implied volatility expiry range calculator
  // Daily Expected range = Spot * (VIX / 100) / Math.sqrt(365) [for same-day expiry]
  const expiryRange = useMemo(() => {
    const dailyVolatility = (vixValue / 100) / Math.sqrt(365);
    const rangeBoundOffset = spotPrice * dailyVolatility;
    const lowerBound = Math.round((spotPrice - rangeBoundOffset) / 50) * 50;
    const upperBound = Math.round((spotPrice + rangeBoundOffset) / 50) * 50;
    return {
      lowerBound,
      upperBound,
      offset: Math.round(rangeBoundOffset)
    };
  }, [vixValue, spotPrice]);

  // theta decay calculations simulation based on hours of expiry day
  const decaySimulatorData = useMemo(() => {
    const hours = [
      { h: 9.25, label: "09:15 AM (Open)", decay: 1.0 },
      { h: 10.5, label: "10:30 AM (Consolidation)", decay: 0.8 },
      { h: 12.0, label: "12:00 PM (Mid-Session)", decay: 0.55 },
      { h: 13.5, label: "01:30 PM (European Open)", decay: 0.35 },
      { h: 14.5, label: "02:30 PM (Panic Window)", decay: 0.18 },
      { h: 15.25, label: "03:15 AM (MOC Settle)", decay: 0.05 },
    ];
    return hours;
  }, []);

  const activeDecayMultiplier = useMemo(() => {
    if (decayHour <= 9) return 1.0;
    if (decayHour === 11) return 0.72;
    if (decayHour === 13) return 0.44;
    return 0.12; // Final hour decay (15)
  }, [decayHour]);

  // Expiry Day Hero-Zero scanner
  // Find At-The-Money Call & Put contracts that meet the threshold
  const heroZeroContracts = useMemo(() => {
    if (!optionChain || optionChain.length === 0) return [];
    
    // Find closest strikes to ATM
    const sorted = [...optionChain].sort((a, b) => Math.abs(a.strike - spotPrice) - Math.abs(b.strike - spotPrice));
    const targetStrikes = sorted.slice(0, 3); // Get 3 closest strikes

    return targetStrikes.map(row => {
      const callScore = row.callOIchg > 50 ? "Aggressive Call Addition" : "Call Unwinding";
      const putScore = row.putOIchg > 50 ? "Aggressive Put Addition" : "Put Unwinding";
      
      const callHeroViable = row.callLtp <= heroCostLevel && row.callLtp > 2;
      const putHeroViable = row.putLtp <= heroCostLevel && row.putLtp > 2;

      return {
        strike: row.strike,
        callLtp: row.callLtp,
        putLtp: row.putLtp,
        callOIchg: row.callOIchg,
        putOIchg: row.putOIchg,
        callHeroViable,
        putHeroViable,
        comment: Math.abs(row.strike - spotPrice) <= 25 
          ? "ATM Golden Contract! High Gamma multiplier potential." 
          : row.strike > spotPrice 
            ? "OTM Call Chase - High risk momentum player" 
            : "OTM Put Chase - High risk fallback player"
      };
    });
  }, [optionChain, spotPrice, heroCostLevel]);

  // Expiry Day net index pressure
  const expiryNetBias = useMemo(() => {
    let callOITotal = 0;
    let putOITotal = 0;
    optionChain.forEach(r => {
      callOITotal += r.callOI;
      putOITotal += r.putOI;
    });
    const ratio = callOITotal > 0 ? (putOITotal / callOITotal) : 1;
    
    if (ratio < 0.75) return { bias: "Bearish Sell Trap", color: "text-rose-500", desc: "Calls are heavily sold. Spot price is highly likely to expire below Max Pain under aggressive ceiling pressure." };
    if (ratio > 1.25) return { bias: "Supportive Bull Lock", color: "text-emerald-500", desc: "Puts are heavily written. Puts OI is driving a solid market floor, making expires below major spot pivots very unlikely." };
    return { bias: "Balanced Premium Grind", color: "text-amber-500", desc: "Balanced Call & Put writing. Market will likely remain in range to decay option buyers completely (Max theta drain profile)." };
  }, [optionChain]);

  return (
    <div className="space-y-6" id="expiry-day-analyzer-view">
      
      {/* EXPIRES METADATA PANEL HEAD */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 text-slate-800 shadow-sm" id="expiry-metrics-header-banner">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-rose-600 text-[10px] uppercase font-black tracking-widest font-mono text-white rounded">
                Expiry Sentinel Live
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Symbol: <span className="font-bold text-slate-805">{selectedSymbol}</span>
              </span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight font-sans text-slate-800 mt-1 uppercase">
              Specialized {selectedSymbol} Expiry &amp; Max Pain Analyzer
            </h2>
            <p className="text-xs text-slate-550 mt-1 font-sans font-medium">
              Option sellers align Spot Price with the **Max Pain Point** on final expiry hour to minimize total payout. Monitor this magnet!
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white border border-sky-250 p-3 rounded-xl font-mono shrink-0 shadow-xs">
            <div>
              <div className="text-[8px] text-slate-500 uppercase tracking-widest leading-none font-bold">Current Spot Price</div>
              <div className="text-lg font-black text-emerald-700 mt-1">₹{spotPrice.toLocaleString("en-IN")}</div>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <div className="text-[8px] text-slate-500 uppercase tracking-widest leading-none font-bold">Max Pain Strike</div>
              <div className="text-lg font-black text-amber-700 mt-1">₹{maxPainStrike.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CORE BENTO ROW: MATH CURVES AND METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 1. AGGREGATE BUYER PAIN CURVE (RECHARTS AREA CHART) - 8 COLLS */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" id="max-pain-recharts-panel">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider font-mono flex items-center gap-1.5">
                <FileBarChart size={15} className="text-indigo-600" /> Option Buyers' Aggregate Loss Pain Curve
              </h3>
              <p className="text-[11px] text-slate-500">
                The lowest valley represents when sellers pocket the absolute maximum premium. Spot gravitates here!
              </p>
            </div>
            <span className="text-[9.5px] bg-amber-50 text-amber-700 font-bold border border-amber-200 px-2.5 py-0.5 rounded font-mono">
              Magnet Strike Pinpoint: ₹{maxPainStrike}
            </span>
          </div>

          {/* Aggregate math chart */}
          <div className="h-56 text-[9.5px]">
            {payoffData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payoffData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4338ca" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4338ca" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="strike" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} label={{ value: 'Loss Pain (Lakh Contracts)', angle: -90, position: 'insideLeft', style: {fontSize: '8px'}, offset: 5 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc", borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#e2e8f0' }}
                    labelStyle={{ fontSize: '10px', color: '#fbbf24', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Total Buyer Payoff Pain" 
                    stroke="#4338ca" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#painGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs">
                Analyzing Option Chain contracts layout...
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-[10px] text-slate-500 font-mono">
            <span>🧲 <span className="font-bold text-indigo-700">Max Pain Principle:</span> Market tends to expire within +/- 50 strike interval of the absolute lowest point of this curve.</span>
          </div>
        </div>

        {/* 2. EXPRIY BIAS CONTROLS & COMPASS - 4 COLLS */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between" id="implied-exp-range-panel">
          
          <div>
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider font-mono mb-3">
              🎯 VIX-Implied Expiry Compass
            </h3>

            {/* Exp range values */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl text-slate-805 border border-slate-200 space-y-3 font-mono shadow-xs">
                <div className="text-center">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Expected Expiry Range</div>
                  <div className="text-[17px] font-black text-amber-750 text-amber-800 mt-1">
                    ₹{expiryRange.lowerBound} – ₹{expiryRange.upperBound}
                  </div>
                  <div className="text-[10px] text-slate-650 mt-0.5">
                    ({vixValue}% Implied daily move: ±{expiryRange.offset} points)
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2.5 space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Resistance Ceiling:</span>
                    <span className="font-bold text-rose-700 font-sans">₹{expiryRange.upperBound}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Support Foundation:</span>
                    <span className="font-bold text-emerald-700 font-sans">₹{expiryRange.lowerBound}</span>
                  </div>
                </div>
              </div>

              {/* Net pressure assessment */}
              <div className="border rounded-xl p-3.5 bg-slate-50 border-slate-200 text-xs space-y-2 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-slate-705 font-mono">
                  <Compass size={13} className="text-slate-550" /> Options Expiry Net Target
                </div>
                <div>
                  <span className={`font-black uppercase text-[11px] ${expiryNetBias.color} block font-mono`}>
                    {expiryNetBias.bias}
                  </span>
                  <p className="text-slate-600 mt-1">
                    {expiryNetBias.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-150 pt-3.5 mt-4 text-[9.5px] text-slate-500 font-mono font-medium">
            VIX calculation handles standard same-day standard deviations automatically.
          </div>
        </div>

      </div>

      {/* THREE-COLUMN ADVISOR GRID: THETA DECAY, HERO-ZERO SCANS, EXPRIY RULES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. THETA TIME-DECAY PRESSURE SLIDER */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="theta-decay-panel">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider font-mono flex items-center gap-1.5">
              <Clock size={14} className="text-rose-600 text-rose-700" /> Theta Premium Decay Speedometer
            </h4>
            <p className="text-[11px] text-slate-500">
              Drag Expiry Hour to simulate intraday theta decay on options premium contracts.
            </p>
          </div>

          {/* Interactive hour simulator */}
          <div className="bg-slate-550 bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 font-mono space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-550 uppercase tracking-wider font-bold">Active Simulator Time:</span>
              <span className="text-xs font-bold text-amber-700">
                {decayHour === 9 ? "09:15 AM (Pre-Open)" : decayHour === 11 ? "11:30 AM (Europe Ready)" : decayHour === 13 ? "01:45 PM (Decay Acceleration)" : "03:00 PM (Super Squeeze)"}
              </span>
            </div>

            {/* Simple slider component */}
            <input 
              type="range"
              min="9"
              max="15"
              step="2" // 9, 11, 13, 15
              value={decayHour}
              onChange={(e) => setDecayHour(parseInt(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />

            <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-center leading-none">
              <div className="text-[8px] text-slate-550 uppercase font-black">Premium Extrinsic Value Retained</div>
              <div className="text-xl font-black text-rose-700 mt-1">{(activeDecayMultiplier * 100).toFixed(0)}%</div>
              <p className="text-[9.5px] text-slate-600 mt-1 font-sans">
                {decayHour >= 15 
                  ? "⚠️ Super-decay phase! Extrinsic options disintegrate down directly to intrinsic values." 
                  : "Normal premium rates. Best for credit spreads."}
              </p>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 italic font-sans leading-relaxed">
            *Option writers exploit decay. If index moves sideways for 1 hour, ATM strangle premiums drop by roughly 10-15%.
          </div>
        </div>

        {/* 2. DYNAMIC HERO-ZERO SCANNERS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="hero-zero-panel">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider font-mono flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500 animate-pulse" /> ATM "Hero-Zero" Strategic Scanner
            </h4>
            <p className="text-[11px] text-slate-500">
              Scans contracts with premiums beneath threshold limit for high-gamma momentum spikes on expiry day.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-150 p-2 rounded-xl text-xs">
            <span className="font-mono text-slate-500 font-bold">Max Cost Target:</span>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-slate-400">₹</span>
              <input 
                type="number"
                className="w-14 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center text-slate-800 font-bold"
                value={heroCostLevel}
                onChange={(e) => setHeroCostLevel(parseFloat(e.target.value) || 10)}
              />
            </div>
          </div>

          {/* List scanned Hero Zero contracts */}
          <div className="space-y-2 max-h-[145px] overflow-y-auto pr-1">
            {heroZeroContracts.map((c) => {
              const callViable = c.callHeroViable;
              const putViable = c.putHeroViable;

              return (
                <div key={c.strike} className="border border-slate-100 rounded-lg p-2 text-[10.5px] space-y-1 bg-slate-50">
                  <div className="flex justify-between font-mono font-bold text-slate-800">
                    <span>Strike {c.strike}</span>
                    <span className="text-slate-400 font-normal">ATM Dist: {Math.abs(c.strike - spotPrice)} pts</span>
                  </div>
                  <div className="flex gap-2">
                    {/* Call Hero Box */}
                    <div className={`flex-1 p-1 rounded border text-center ${
                      callViable 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold' 
                        : 'bg-slate-105 border-slate-200 text-slate-400'
                    }`}>
                      CE: ₹{c.callLtp.toFixed(1)} {callViable ? "⚡ Viable" : "OTM Skip"}
                    </div>

                    {/* Put Hero Box */}
                    <div className={`flex-1 p-1 rounded border text-center ${
                      putViable 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold' 
                        : 'bg-slate-105 border-slate-200 text-slate-400'
                    }`}>
                      PE: ₹{c.putLtp.toFixed(1)} {putViable ? "⚡ Viable" : "OTM Skip"}
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-500 italic block">
                    {c.comment}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. EXPIRES TACTICAL CHECKLIST / COOPERATE PLAY */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="expiry-rules-panel">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider font-mono flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-indigo-600" /> Expiry Day Action Checklist (Mandatory Rules)
            </h4>
            <p className="text-[11px] text-slate-500">
              Adhere to institutional risk parameters tightly on final session transitions.
            </p>
          </div>

          <div className="space-y-2.5 text-xs text-slate-650 leading-relaxed font-sans">
            <div className="flex gap-2 items-start">
              <span className="w-4 h-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">1</span>
              <div>
                <span className="font-bold text-slate-800">Don't Hold OTM Premium beyond 2 PM:</span> Theta decay becomes purely vertical, shedding 50% of outstanding extrinsic values within mere minutes.
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <span className="w-4 h-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">2</span>
              <div>
                <span className="font-bold text-slate-800">Monitor ATM Strike Battle:</span> When spot trades within 10 points of a major strike, short gamma sellers will fiercely defend their margins. Expect heavy volatility shakes!
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <span className="w-4 h-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">3</span>
              <div>
                <span className="font-bold text-slate-800">Max Pain Gravitational Drift:</span> Over 68% of sessions in Nifty settle within 35 index points of the pre-calculated Max Pain strike. Trade in align with the magnet.
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
