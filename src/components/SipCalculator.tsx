import React, { useState } from "react";
import { 
  Calculator, HelpCircle, ChevronRight, TrendingUp, Sparkles, 
  ArrowRight, Info, AlertCircle, ChevronDown, CheckCircle 
} from "lucide-react";

export default function SipCalculator() {
  const [monthlyInvest, setMonthlyInvest] = useState<number>(15000);
  const [expectedReturn, setExpectedReturn] = useState<number>(13.5);
  const [years, setYears] = useState<number>(15);
  const [stepUpPct, setStepUpPct] = useState<number>(10); // Standard 10% step-up per year
  
  // Schedule toggle
  const [showSchedule, setShowSchedule] = useState<boolean>(true);

  // Month-by-month simulation to respect Step-Up value accurately
  const runSimulation = () => {
    let currentMonthly = monthlyInvest;
    let accumulatedValue = 0;
    const r = expectedReturn / 12 / 100;
    let cumulativeInvested = 0;
    
    // For year-by-year schedule metrics
    const annualSchedule: {
      year: number;
      monthlySip: number;
      investedThisYear: number;
      totalInvested: number;
      wealthValue: number;
      returnsEarned: number;
    }[] = [];

    for (let yr = 1; yr <= years; yr++) {
      let investedThisYear = 0;
      for (let month = 1; month <= 12; month++) {
        // Compound the existing value and add new monthly SIP amount
        accumulatedValue = (accumulatedValue + currentMonthly) * (1 + r);
        investedThisYear += currentMonthly;
        cumulativeInvested += currentMonthly;
      }
      
      annualSchedule.push({
        year: yr,
        monthlySip: Math.round(currentMonthly),
        investedThisYear,
        totalInvested: Math.round(cumulativeInvested),
        wealthValue: Math.round(accumulatedValue),
        returnsEarned: Math.round(Math.max(0, accumulatedValue - cumulativeInvested))
      });

      // Apply annual step-up increment for the next year
      currentMonthly = currentMonthly * (1 + stepUpPct / 100);
    }

    const finalValue = Math.round(accumulatedValue);
    const totalInvested = Math.round(cumulativeInvested);
    const returnsGained = Math.round(Math.max(0, finalValue - totalInvested));

    return {
      finalValue,
      totalInvested,
      returnsGained,
      annualSchedule
    };
  };

  const results = runSimulation();

  // Cost of Delay Math: Helper to run custom sim
  const simulateCustom = (m: number, y: number, r: number, s: number) => {
    let cur = m;
    let acc = 0;
    const rate = r / 12 / 105; // Slightly safe conversion
    for (let yr = 1; yr <= y; yr++) {
      for (let month = 1; month <= 12; month++) {
        acc = (acc + cur) * (1 + r / 12 / 100);
      }
      cur = cur * (1 + s / 100);
    }
    return Math.round(acc);
  };

  const delayOneYear = simulateCustom(monthlyInvest, Math.max(1, years - 1), expectedReturn, stepUpPct);
  const delayTwoYears = simulateCustom(monthlyInvest, Math.max(1, years - 2), expectedReturn, stepUpPct);
  const delayThreeYears = simulateCustom(monthlyInvest, Math.max(1, years - 3), expectedReturn, stepUpPct);

  return (
    <div className="space-y-6" id="sip-stepup-calculator-desk">
      {/* Dynamic Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 border border-indigo-800 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl text-xs">
        <div id="calculator-hero-text">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Calculator className="text-indigo-400 animate-pulse" size={18} />
            Step-Up Systematic Investment Plan (SIP) Calculator
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Recalculate custom compounding tables with step-up rates. Standard investment advises raising compounding limits as salary/earnings increase over time.
          </p>
        </div>
        <div className="bg-slate-800/80 border border-indigo-950 p-2.5 rounded-xl text-center shrink-0">
          <div className="text-[10px] text-indigo-400 font-bold uppercase font-mono tracking-wider">Step-Up Bonus</div>
          <div className="text-xs font-black font-mono text-white mt-0.5">SIP + 10% Stepup = Double Wealth</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sliders Input Column */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6" id="calculator-inputs">
          <div>
            <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider font-mono flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span>Primary Modifiers</span>
            </h3>
          </div>

          <div className="space-y-5">
            {/* Monthly investment */}
            <div className="space-y-1.5 bg-slate-50/80 p-3.5 border border-slate-150 rounded-xl">
              <div className="flex justify-between items-center text-xs font-bold text-slate-850">
                <span className="font-mono">Initial Monthly Deposit</span>
                <span className="text-indigo-700 font-mono text-sm">₹{monthlyInvest.toLocaleString()}</span>
              </div>
              <input 
                type="range"
                min="500"
                max="500000"
                step="500"
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                value={monthlyInvest}
                onChange={(e) => setMonthlyInvest(Number(e.target.value))}
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>₹500</span>
                <span>₹5,00,000</span>
              </div>
            </div>

            {/* expected return */}
            <div className="space-y-1.5 bg-slate-50/80 p-3.5 border border-slate-150 rounded-xl">
              <div className="flex justify-between items-center text-xs font-bold text-slate-850">
                <span className="font-mono">Expected Annual Rate of Return</span>
                <span className="text-indigo-700 font-mono text-sm">{expectedReturn}%</span>
              </div>
              <input 
                type="range"
                min="1"
                max="30"
                step="0.1"
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>1% (Inflation rate)</span>
                <span>30% (High Volatility Alpha)</span>
              </div>
            </div>

            {/* Years tenure */}
            <div className="space-y-1.5 bg-slate-50/80 p-3.5 border border-slate-150 rounded-xl">
              <div className="flex justify-between items-center text-xs font-bold text-slate-850">
                <span className="font-mono">Investment Tenure years</span>
                <span className="text-indigo-700 font-mono text-sm">{years} Years</span>
              </div>
              <input 
                type="range"
                min="1"
                max="40"
                step="1"
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>1 Year</span>
                <span>40 Years</span>
              </div>
            </div>

            {/* Step up percentage */}
            <div className="space-y-1.5 bg-slate-50/80 p-3.5 border border-slate-150 rounded-xl">
              <div className="flex justify-between items-center text-xs font-bold text-slate-850">
                <span className="font-mono flex items-center gap-1">
                  <span>Annual Step-Up growth %</span>
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1 py-0.2 rounded">
                    BOOST ALPHA
                  </span>
                </span>
                <span className="text-indigo-700 font-mono text-sm">{stepUpPct}% y-o-y</span>
              </div>
              <input 
                type="range"
                min="0"
                max="50"
                step="1"
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer cursor-grab accent-indigo-650"
                value={stepUpPct}
                onChange={(e) => setStepUpPct(Number(e.target.value))}
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>0% (Regular SIP)</span>
                <span>50% (Strategic Scaling)</span>
              </div>
              <p className="text-[10px] text-slate-450 font-sans mt-1">
                Increases monthly investment budget automatically at the end of each year.
              </p>
            </div>
          </div>
        </div>

        {/* Live Calculation Output Column */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6" id="calculator-outputs">
          <div>
            <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider font-mono flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span>Financial Output Dashboard</span>
            </h3>
          </div>

          {/* Core bento statistical results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="simulated-metrics-grid">
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl relative overflow-hidden text-center">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-450 block">Capital Invested</span>
              <span className="text-base font-mono font-black text-slate-800 mt-1 block">₹{results.totalInvested.toLocaleString()}</span>
              <p className="text-[9.5px] text-slate-400 mt-1">Cumulative principal</p>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-150 rounded-2xl relative overflow-hidden text-center">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-450 block">Compound Interest</span>
              <span className="text-base font-mono font-black text-emerald-700 mt-1 block">₹{results.returnsGained.toLocaleString()}</span>
              <p className="text-[9.5px] text-emerald-600 mt-1">Profit earned on capital</p>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-2xl relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 p-1 bg-indigo-600 text-white rounded-bl-lg">
                <Sparkles size={8} />
              </div>
              <span className="text-[9px] uppercase font-mono font-bold text-slate-450 block">Final Portfolio Value</span>
              <span className="text-base font-mono font-black text-indigo-950 mt-1 block">₹{results.finalValue.toLocaleString()}</span>
              <p className="text-[9.5px] text-indigo-700 mt-1">Total terminal wealth</p>
            </div>
          </div>

          {/* Interactive visual progress meter */}
          <div className="space-y-2 bg-slate-50 p-4 border border-slate-200 rounded-2xl" id="compounding-distribution-progress">
            <div className="flex justify-between items-center text-[10.5px] font-mono font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-sm inline-block"></span>
                <span>Invested Capital ({Math.round((results.totalInvested / results.finalValue) * 100)}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-sm inline-block animate-pulse"></span>
                <span className="text-indigo-800">Compound Returns ({Math.round((results.returnsGained / results.finalValue) * 100)}%)</span>
              </span>
            </div>
            
            <div className="h-4.5 w-full bg-slate-200 rounded-lg overflow-hidden flex">
              <div 
                className="h-full bg-slate-400 transition-all duration-300"
                style={{ width: `${Math.max(1, (results.totalInvested / results.finalValue) * 100)}%` }}
              />
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${Math.max(1, (results.returnsGained / results.finalValue) * 100)}%` }}
              />
            </div>
          </div>

          {/* Delay Cost Matrix */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3" id="cost-of-delay-matrix">
            <h4 className="text-xs font-bold font-mono text-slate-750 uppercase tracking-widest flex items-center gap-1">
              <AlertCircle size={13} className="text-amber-500 animate-bounce" />
              <span>Cost of delay indicator</span>
            </h4>
            
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-sans">
              <div className="bg-white border border-slate-200 p-2 rounded-lg">
                <span className="text-slate-400 block font-mono">Delay 1 Year</span>
                <span className="text-xs font-mono font-bold text-rose-700 mt-1 block">₹{delayOneYear.toLocaleString()}</span>
                <span className="text-[8.5px] text-red-500 font-medium">Lost: ₹{(results.finalValue - delayOneYear).toLocaleString()}</span>
              </div>
              <div className="bg-white border border-slate-200 p-2 rounded-lg">
                <span className="text-slate-400 block font-mono">Delay 2 Years</span>
                <span className="text-xs font-mono font-bold text-rose-700 mt-1 block">₹{delayTwoYears.toLocaleString()}</span>
                <span className="text-[8.5px] text-red-500 font-medium">Lost: ₹{(results.finalValue - delayTwoYears).toLocaleString()}</span>
              </div>
              <div className="bg-white border border-slate-200 p-2 rounded-lg">
                <span className="text-slate-400 block font-mono">Delay 3 Years</span>
                <span className="text-xs font-mono font-bold text-rose-700 mt-1 block">₹{delayThreeYears.toLocaleString()}</span>
                <span className="text-[8.5px] text-red-500 font-medium">Lost: ₹{(results.finalValue - delayThreeYears).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* COMP compounding Year-by-Year detailed schedule */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6.5 shadow-xs space-y-4" id="sip-compounding-schedule">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-600 animate-pulse" />
            <span className="font-bold text-sm text-slate-800 font-mono">Sequential Compounding Timeline Schedule</span>
          </div>
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="text-[10.5px] font-bold font-mono text-indigo-600 hover:text-indigo-850 cursor-pointer flex items-center gap-1 bg-indigo-50 border border-indigo-150 py-1.5 px-3 rounded-lg"
          >
            <span>{showSchedule ? "Hide detailed ledger" : "Reveal detailed ledger"}</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${showSchedule ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showSchedule && (
          <div className="overflow-x-auto text-[10px]" id="schedule-scroll-table">
            <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold font-mono">
                  <th className="p-3">Timeline Year</th>
                  <th className="p-3">Monthly SIP Amount</th>
                  <th className="p-3">Annual Contributions</th>
                  <th className="p-3">Total Invested to Date</th>
                  <th className="p-3">Earned Yield Returns</th>
                  <th className="p-3 bg-indigo-50/50 text-indigo-900">Total Accumulation Wealth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {results.annualSchedule.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/70 font-sans text-slate-705 transition-colors">
                    <td className="p-3 font-semibold font-mono text-slate-800">Year {row.year}</td>
                    <td className="p-3 font-mono font-bold">₹{row.monthlySip.toLocaleString()}</td>
                    <td className="p-3 font-mono">₹{row.investedThisYear.toLocaleString()}</td>
                    <td className="p-3 font-mono font-medium text-slate-600">₹{row.totalInvested.toLocaleString()}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600">+₹{row.returnsEarned.toLocaleString()}</td>
                    <td className="p-3 font-mono font-extrabold text-indigo-950 bg-indigo-50/20">₹{row.wealthValue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
