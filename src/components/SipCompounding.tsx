import React, { useState } from "react";
import { 
  PiggyBank, ArrowDownRight, ArrowUpRight, CheckCircle2, 
  HelpCircle, Calendar, LineChart, ShieldAlert, Award, Star, BarChart2 
} from "lucide-react";

type MarketCycle = "bull" | "bear" | "sideways";

export default function SipCompounding() {
  const [activeCycle, setActiveCycle] = useState<MarketCycle>("sideways");
  
  // Custom interactive sliders for Early Start Priority
  const [monthlyInvest, setMonthlyInvest] = useState<number>(10000);
  const [growthPct, setGrowthPct] = useState<number>(12);

  // Scenario formulas
  const calculateCompoundTotal = (monthly: number, years: number, rate: number) => {
    const monthlyRate = rate / 12 / 100;
    const totalMonths = years * 12;
    if (monthlyRate === 0) return monthly * totalMonths;
    return monthly * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  };

  const earlyInvestor = {
    ageText: "Compounds from Age 25 to 60 (35 Years)",
    investYears: 35,
    investTotal: monthlyInvest * 12 * 35,
    wealthAcc: Math.round(calculateCompoundTotal(monthlyInvest, 35, growthPct)),
  };

  const lateInvestor = {
    ageText: "Compounds from Age 35 to 60 (25 Years)",
    investYears: 25,
    investTotal: monthlyInvest * 12 * 25,
    wealthAcc: Math.round(calculateCompoundTotal(monthlyInvest, 25, growthPct)),
  };

  // SIP vs Lump Sum simulation values under different scenarios
  const cycleData = {
    sideways: {
      marketMovement: "Market index drops from 22,000 to 18,000, then recovers back to 22,000.",
      lumpSumOutcome: "₹1,20,000 invested at 22,000 spot yields exactly 0% returns inside raw sideways levels.",
      sipOutcome: "₹10,000 raw monthly dynamic purchase acquires many more units at 18,000 spot, resulting in positive gains of ~14.8%.",
      advantage: "SIP captures cheap pricing during crashes using rupee-cost averaging.",
      dataRows: [
        { month: "Month 1 (Start)", spotPrice: 22000, lumpUnits: 5.45, sipUnits: 0.45, notes: "Indices trading at peak" },
        { month: "Month 4 (Dip)", spotPrice: 19000, lumpUnits: 0.00, sipUnits: 0.53, notes: "Index slides down" },
        { month: "Month 7 (Bottom)", spotPrice: 17500, lumpUnits: 0.00, sipUnits: 0.57, notes: "Units acquired 26% cheaper!" },
        { month: "Month 10 (Recovery)", spotPrice: 20000, lumpUnits: 0.00, sipUnits: 0.50, notes: "Core recovery begins" },
        { month: "Month 12 (Target)", spotPrice: 22000, lumpUnits: 0.00, sipUnits: 0.45, notes: "Back to starting point" },
      ]
    },
    bull: {
      marketMovement: "Market index goes on a vertical run from 20,000 straight up to 26,000.",
      lumpSumOutcome: "Lump Sum earns absolute high premium alpha since 100% principal was exposed to original low baseline pricing.",
      sipOutcome: "SIP buys units progressively higher, resulting in positive but slightly lower compound yield than Lump Sum.",
      advantage: "Lump-sum excels in one-sided bull runs but carries risk of buying at peak.",
      dataRows: [
        { month: "Month 1 (Start)", spotPrice: 20000, lumpUnits: 6.00, sipUnits: 0.50, notes: "Initial market launch" },
        { month: "Month 4", spotPrice: 21500, lumpUnits: 0.00, sipUnits: 0.47, notes: "Slow upward trajectory" },
        { month: "Month 7", spotPrice: 23000, lumpUnits: 0.00, sipUnits: 0.43, notes: "Breakout takes momentum" },
        { month: "Month 10", spotPrice: 24500, lumpUnits: 0.00, sipUnits: 0.41, notes: "Sellers retreat completely" },
        { month: "Month 12 (Target)", spotPrice: 26000, lumpUnits: 0.00, sipUnits: 0.38, notes: "All-time highs established" },
      ]
    },
    bear: {
      marketMovement: "Market falls aggressively from 23,000 to 16,000 with high institutional panic.",
      lumpSumOutcome: "Lump Sum experiences severe drawdown of -30.43%, capital is trapped at higher prices with no dry powder left.",
      sipOutcome: "SIP is down temporarily but accumulates double the items at cheaper price points, slashing average holding costs.",
      advantage: "SIP shields emotional capital and automates buying during times of maximum fear.",
      dataRows: [
        { month: "Month 1 (Start)", spotPrice: 23000, lumpUnits: 5.22, sipUnits: 0.43, notes: "Buying at pre-crash value" },
        { month: "Month 4 (Crash)", spotPrice: 19500, lumpUnits: 0.00, sipUnits: 0.51, notes: "Indices hit initial support" },
        { month: "Month 7 (Sell Panic)", spotPrice: 16000, lumpUnits: 0.00, sipUnits: 0.63, notes: "Institutional panic radar active" },
        { month: "Month 10 (Consolidate)", spotPrice: 16500, lumpUnits: 0.00, sipUnits: 0.61, notes: "Base stabilization layer" },
        { month: "Month 12 (Current)", spotPrice: 17200, lumpUnits: 0.00, sipUnits: 0.58, notes: "Minor bounce, average cost low" },
      ]
    }
  };

  return (
    <div className="space-y-6" id="sip-compounding-insights">
      {/* Premium Header banner */}
      <div className="bg-gradient-to-r from-blue-900 via-sky-950 to-slate-900 border border-sky-800 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div id="sip-hero-text">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <PiggyBank className="text-sky-400 animate-pulse" size={18} />
            Systematic Investment Plan (SIP) Power Compounding Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Understand how consistent, automated rupee-cost averaging eliminates the emotional traps of market timing. Build dynamic generation wealth with structured equity allocations.
          </p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl text-center shrink-0">
          <div className="text-[10px] text-sky-400 font-bold uppercase font-mono tracking-wider">SIP Philosophy</div>
          <div className="text-xs font-black font-mono text-white mt-0.5">Dicipline &gt; Timing</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Column 1: SIP vs Lump-Sum Cycle Simulator */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5" id="cycle-comparer">
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 font-mono">
              <Calendar className="text-sky-600" size={16} />
              SIP vs. Lump Sum Market Simulator
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Select key market phases to visualize the powerful impact of dollar-cost averaging under different cycles.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl" id="cycle-tabs">
            <button
              onClick={() => setActiveCycle("sideways")}
              className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer text-center ${
                activeCycle === "sideways" 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              🔄 Volatile/Sideways
            </button>
            <button
              onClick={() => setActiveCycle("bull")}
              className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer text-center ${
                activeCycle === "bull" 
                  ? "bg-white text-emerald-700 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              📈 Bull Run
            </button>
            <button
              onClick={() => setActiveCycle("bear")}
              className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer text-center ${
                activeCycle === "bear" 
                  ? "bg-white text-red-700 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              📉 Deep Bear Market
            </button>
          </div>

          {/* Quick analysis output */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-sans text-xs">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">
              <span>Simulation Mechanics</span>
            </div>
            
            <p className="text-slate-500 leading-relaxed">
              <b className="text-slate-800">Index Action:</b> {cycleData[activeCycle].marketMovement}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-red-50/50 border border-red-150 rounded-xl">
                <span className="font-extrabold text-red-900 block font-mono text-[10.5px]">Lumpsum Outcome (₹1,20,000)</span>
                <p className="text-[10px] text-red-800 mt-1">{cycleData[activeCycle].lumpSumOutcome}</p>
              </div>
              <div className="p-3 bg-emerald-50/50 border border-emerald-150 rounded-xl">
                <span className="font-extrabold text-emerald-900 block font-mono text-[10.5px]">SIP Plan (₹10,000 / month)</span>
                <p className="text-[10px] text-emerald-800 mt-1">{cycleData[activeCycle].sipOutcome}</p>
              </div>
            </div>

            <div className="p-3.5 bg-sky-50 border border-sky-150 rounded-xl flex gap-2">
              <Award className="text-sky-600 shrink-0 mt-0.5" size={15} />
              <div className="text-[10.5px] text-sky-850">
                <b className="font-mono">Compounding Advantage:</b> {cycleData[activeCycle].advantage}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto text-[10.5px]" id="sip-simulation-table">
            <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 font-bold font-mono">
                  <th className="p-3">Timeline</th>
                  <th className="p-3">Spot Price (₹)</th>
                  <th className="p-3">Lumpsum Units accumulated</th>
                  <th className="p-3">SIP Units accumulated</th>
                  <th className="p-3">Cycle Phase Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {cycleData[activeCycle].dataRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 font-sans text-slate-705">
                    <td className="p-3 font-semibold font-mono">{row.month}</td>
                    <td className="p-3 font-bold font-mono">₹{row.spotPrice.toLocaleString()}</td>
                    <td className="p-3 font-mono text-slate-400">{row.lumpUnits > 0 ? `${row.lumpUnits} units` : "-"}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{row.sipUnits} units</td>
                    <td className="p-3 text-slate-500 font-medium">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 2: Compounding Power of Timing - Start Early */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6" id="early-start-priority">
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 font-mono">
              <BarChart2 className="text-sky-600" size={16} />
              Cost of Delay: Start Early Priority
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Adjust parameters to witness how delaying compounding by just 10 years impacts final retirement wealth.
            </p>
          </div>

          {/* Interactive controls */}
          <div className="space-y-4" id="insights-sliders">
            {/* Monthly SIP slider */}
            <div className="space-y-1.5 bg-slate-50/80 p-3.5 border border-slate-150 rounded-xl">
              <div className="flex justify-between items-center text-xs font-bold text-slate-850">
                <span className="font-mono">Monthly SIP Target</span>
                <span className="text-sky-700 font-mono text-sm">₹{monthlyInvest.toLocaleString()}</span>
              </div>
              <input 
                type="range"
                min="1000"
                max="100000"
                step="1000"
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                value={monthlyInvest}
                onChange={(e) => setMonthlyInvest(Number(e.target.value))}
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>₹1,000</span>
                <span>₹1,00,000</span>
              </div>
            </div>

            {/* Growth return slider */}
            <div className="space-y-1.5 bg-slate-50/80 p-3.5 border border-slate-150 rounded-xl">
              <div className="flex justify-between items-center text-xs font-bold text-slate-850">
                <span className="font-mono">Expected Annual Compound Interest</span>
                <span className="text-sky-700 font-mono text-sm">{growthPct}% p.a.</span>
              </div>
              <input 
                type="range"
                min="5"
                max="25"
                step="0.5"
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                value={growthPct}
                onChange={(e) => setGrowthPct(Number(e.target.value))}
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>5%</span>
                <span>25%</span>
              </div>
            </div>
          </div>

          {/* Interactive outputs comparing 25 vs 35 age brackets */}
          <div className="space-y-4" id="comparative-outcomes-box">
            
            {/* Early Compounding Card */}
            <div className="border border-emerald-100 p-4 rounded-xl space-y-2.5 relative bg-emerald-50/40 hover:bg-emerald-50/70 transition-all">
              <div className="absolute top-3.5 right-3.5 bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-bold font-mono uppercase">
                Peak Compound
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 font-mono block">Early Investor (Starts Age 25)</span>
                <span className="text-[10px] text-slate-400 block">{earlyInvestor.ageText}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs bg-white p-2 border border-slate-100 rounded-lg">
                <div>
                  <span className="text-[8.5px] uppercase font-mono font-bold text-slate-400 block">Total Invested</span>
                  <span className="text-xs font-mono font-semibold text-slate-700">₹{earlyInvestor.investTotal.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase font-mono font-bold text-slate-400 block">Wealth Value</span>
                  <span className="text-xs font-mono font-black text-emerald-700">₹{earlyInvestor.wealthAcc.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Late Compounding Card */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-2.5 relative bg-slate-50/40 hover:bg-slate-50/70 transition-all">
              <div className="absolute top-3.5 right-3.5 bg-slate-200 text-slate-650 text-[9px] px-2 py-0.5 rounded-full font-bold font-mono uppercase">
                LostCompounding
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 font-mono block">Late Investor (Starts Age 35)</span>
                <span className="text-[10px] text-slate-400 block">{lateInvestor.ageText}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs bg-white p-2 border border-slate-100 rounded-lg">
                <div>
                  <span className="text-[8.5px] uppercase font-mono font-bold text-slate-400 block">Total Invested</span>
                  <span className="text-xs font-mono font-semibold text-slate-700">₹{lateInvestor.investTotal.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase font-mono font-bold text-slate-400 block">Wealth Value</span>
                  <span className="text-xs font-mono font-orange font-bold text-rose-700">₹{lateInvestor.wealthAcc.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Total Cost of Delay */}
            <div className="bg-red-50 border border-red-150 p-4 rounded-xl flex gap-3 leading-relaxed">
              <div className="p-2 bg-red-100 text-rose-700 rounded-lg h-9 w-9 flex items-center justify-center shrink-0">
                <ShieldAlert size={18} />
              </div>
              <div>
                <span className="text-rose-950 font-extrabold text-xs block font-mono">The Absolute Cost of 10-Year Delay</span>
                <p className="text-[10.5px] text-rose-800 mt-0.5 font-medium">
                  By starting 10 years late, you lose a staggering <b className="font-mono text-sm text-rose-900">₹{(earlyInvestor.wealthAcc - lateInvestor.wealthAcc).toLocaleString()}</b> in terminal compounding value, even though you saved only ₹{(earlyInvestor.investTotal - lateInvestor.investTotal).toLocaleString()} in capital.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
