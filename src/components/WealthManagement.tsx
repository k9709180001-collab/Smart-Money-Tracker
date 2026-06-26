import React, { useState } from "react";
import { 
  Briefcase, TrendingUp, Compass, Shield, Award, Landmark, 
  HelpCircle, ChevronRight, Zap, Target, Plus, Trash2, CheckCircle2 
} from "lucide-react";

interface Goal {
  id: string;
  name: string;
  targetAmt: number;
  currentAmt: number;
  monthlySip: number;
  years: number;
  expectedReturn: number;
}

export default function WealthManagement() {
  const [riskProfile, setRiskProfile] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [goals, setGoals] = useState<Goal[]>([
    { id: "1", name: "Financial Freedom Fund", targetAmt: 50000000, currentAmt: 500000, monthlySip: 25000, years: 15, expectedReturn: 13.5 },
    { id: "2", name: "Dream Tech-Villa", targetAmt: 15000000, currentAmt: 200000, monthlySip: 15000, years: 8, expectedReturn: 12.0 }
  ]);

  // Goal Form
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState(10000000);
  const [newGoalCurrent, setNewGoalCurrent] = useState(100000);
  const [newGoalSip, setNewGoalSip] = useState(20000);
  const [newGoalYears, setNewGoalYears] = useState(10);
  const [newGoalReturn, setNewGoalReturn] = useState(12.0);

  // Asset allocation percentages based on profile
  const allocations = {
    conservative: [
      { asset: "High-Yield Debt & Bonds", pct: 50, color: "bg-blue-600", desc: "Stable AAA sovereign/corporate bonds" },
      { asset: "Large-Cap Equities", pct: 25, color: "bg-emerald-600", desc: "Blue-chip leaders & index funds" },
      { asset: "Gold & Sovereign Gold Bonds", pct: 15, color: "bg-amber-500", desc: "Universal hedge against inflation" },
      { asset: "Liquid Arbitrage Funds", pct: 10, color: "bg-indigo-500", desc: "Tax-efficient steady cash equivalent" }
    ],
    moderate: [
      { asset: "Large & Mid-Cap Equities", pct: 45, color: "bg-emerald-600", desc: "Core compounding multi-cap equity" },
      { asset: "High-Quality Corporate Debt", pct: 25, color: "bg-blue-600", desc: "Regular coupon stream for rebalancing" },
      { asset: "Gold (SGB or Physical ETF)", pct: 10, color: "bg-amber-500", desc: "Strategic downside buffer" },
      { asset: "Small-Cap & Active Alpha Funds", pct: 15, color: "bg-rose-500", desc: "High momentum growth catalyst" },
      { asset: "Tax-Efficient Liquid Reserves", pct: 5, color: "bg-indigo-500", desc: "Ready liquidity to buy market corrections" }
    ],
    aggressive: [
      { asset: "Small-Cap & Mid-Cap Equities", pct: 40, color: "bg-rose-600", desc: "High-growth potential market disruptors" },
      { asset: "Large-Cap & Sectoral Bluechips", pct: 30, color: "bg-emerald-600", desc: "Bedrock foundational compounding" },
      { asset: "International Tech Equities & ETFs", pct: 15, color: "bg-indigo-600", desc: "Global asset & geographical diversification" },
      { asset: "Strategic High-Yield Debt / REITS", pct: 10, color: "bg-blue-600", desc: "Real estate trusts & yield-boosters" },
      { asset: "Gold ETF Hedging", pct: 5, color: "bg-amber-500", desc: "Minimal dry powder allocation" }
    ]
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;

    const goal: Goal = {
      id: Date.now().toString(),
      name: newGoalName,
      targetAmt: Number(newGoalTarget),
      currentAmt: Number(newGoalCurrent),
      monthlySip: Number(newGoalSip),
      years: Number(newGoalYears),
      expectedReturn: Number(newGoalReturn)
    };

    setGoals([...goals, goal]);
    setNewGoalName("");
    // Reset defaults
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  // Math for goal summary
  const calculateGoalWealth = (g: Goal) => {
    const monthlyRate = g.expectedReturn / 12 / 100;
    const totalMonths = g.years * 12;
    
    // Future value of lump sum
    const lumpSumGrowth = g.currentAmt * Math.pow(1 + monthlyRate, totalMonths);
    
    // Future value of SIP
    let sipGrowth = 0;
    if (monthlyRate > 0) {
      sipGrowth = g.monthlySip * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    } else {
      sipGrowth = g.monthlySip * totalMonths;
    }
    
    const projectAmt = lumpSumGrowth + sipGrowth;
    const progressPct = Math.min(100, Math.round((projectAmt / g.targetAmt) * 100));
    
    return {
      projected: Math.round(projectAmt),
      invested: g.currentAmt + (g.monthlySip * totalMonths),
      gains: Math.round(projectAmt - (g.currentAmt + (g.monthlySip * totalMonths))),
      progressPct
    };
  };

  return (
    <div className="space-y-6" id="wealth-management-engine">
      {/* Dynamic Header */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 border border-emerald-800 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div id="wealth-hero-text">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Briefcase className="text-emerald-450 animate-pulse" size={18} />
            Institutional Wealth Management &amp; Asset Compounding Desk
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Maximize your secondary earnings and target robust long-term portfolios. Balance risk, allocate capital surgically, and align active derivatives profits back into core compounding assets.
          </p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl text-center shrink-0">
          <div className="text-[10px] text-emerald-450 font-bold uppercase font-mono tracking-wider">Compound Rule</div>
          <div className="text-base font-black font-mono text-white mt-0.5">72 / Rate = Double</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Strategic Risk Profiler & Asset Allocation */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs space-y-6" id="allocation-panel">
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 font-mono">
              <Compass className="text-emerald-600" size={16} />
              Strategic Portfolio Allocation Allocator
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Select your behavioral risk appetite to generate customized asset allocation frameworks.
            </p>
          </div>

          {/* Risk Toggle */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl" id="risk-selectors">
            <button
              onClick={() => setRiskProfile("conservative")}
              className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer ${
                riskProfile === "conservative" 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              🛡️ Conservative
            </button>
            <button
              onClick={() => setRiskProfile("moderate")}
              className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer ${
                riskProfile === "moderate" 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              ⚖️ Moderate
            </button>
            <button
              onClick={() => setRiskProfile("aggressive")}
              className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer ${
                riskProfile === "aggressive" 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              🚀 Aggressive
            </button>
          </div>

          {/* Dynamic Visual Allocation Bar */}
          <div className="space-y-4" id="allocation-graphic-module">
            <div className="uppercase text-[9.5px] font-mono text-slate-450 tracking-wider font-extrabold flex justify-between">
              <span>Optimized Framework</span>
              <span className="text-emerald-700 capitalize font-sans">{riskProfile} Profile</span>
            </div>
            
            {/* Visual stacked progress bar */}
            <div className="h-6 w-full rounded-xl overflow-hidden flex shadow-2xs border border-slate-100">
              {allocations[riskProfile].map((item, idx) => (
                <div 
                  key={idx} 
                  className={`${item.color} h-full transition-all duration-500`}
                  style={{ width: `${item.pct}%` }}
                  title={`${item.asset}: ${item.pct}%`}
                />
              ))}
            </div>

            {/* Allocation breakdown list */}
            <div className="space-y-3 pt-2" id="allocation-items-list">
              {allocations[riskProfile].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className={`w-3.5 h-3.5 rounded mt-0.5 shrink-0 ${item.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-800 leading-tight block truncate">
                        {item.asset}
                      </span>
                      <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded ml-2">
                        {item.pct}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-550 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Core Suggestion Box */}
          <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-4 space-y-2.5" id="wealth-adviser-container">
            <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold font-mono">
              <Award size={14} className="text-emerald-600" />
              <span>Core Rebalancing Directives</span>
            </div>
            <p className="text-[10.5px] text-emerald-800 font-sans leading-relaxed">
              We recommend converting at least <b className="font-mono">20-30%</b> of short-term weekly options writer premium payouts into mutual funds or sovereign gold assets every Thursday night to build a highly defensive equity floor.
            </p>
          </div>
        </div>

        {/* Right Side: Multi-Goal Compound Simulator */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs space-y-6" id="goals-simulator-panel">
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 font-mono">
              <Target className="text-emerald-600" size={16} />
              Personal Goal Compounding Tracker
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Add custom goals (house, car, early retirement) to compound in real-time.
            </p>
          </div>

          {/* Goal creator form */}
          <form onSubmit={handleCreateGoal} className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3" id="goal-creator-form">
            <div className="bg-white/80 border border-slate-200 rounded-md py-1 px-2.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">
              Create New Compound Target
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] text-slate-500 font-mono font-bold uppercase mb-1">Goal identifier</label>
                <input 
                  type="text"
                  placeholder="e.g. Dream Retreat Fund"
                  className="w-full text-xs font-sans font-medium bg-white border border-slate-200 rounded-md p-2 focus:outline-none focus:border-indigo-500"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono font-bold uppercase mb-1">Target Wealth (₹)</label>
                <input 
                  type="number"
                  className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded-md p-2 focus:outline-none focus:border-indigo-500"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-mono font-bold uppercase mb-1">Current Capital (₹)</label>
                <input 
                  type="number"
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-md p-2 focus:outline-none"
                  value={newGoalCurrent}
                  onChange={(e) => setNewGoalCurrent(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono font-bold uppercase mb-1">Monthly SIP (₹)</label>
                <input 
                  type="number"
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-md p-2 focus:outline-none"
                  value={newGoalSip}
                  onChange={(e) => setNewGoalSip(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono font-bold uppercase mb-1">Duration (Years)</label>
                <input 
                  type="number"
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-md p-2 focus:outline-none"
                  value={newGoalYears}
                  onChange={(e) => setNewGoalYears(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono font-bold uppercase mb-1">Expected % Return</label>
                <input 
                  type="number"
                  step="0.1"
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-md p-2 focus:outline-none"
                  value={newGoalReturn}
                  onChange={(e) => setNewGoalReturn(Math.max(1, parseFloat(e.target.value) || 1))}
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus size={14} />
                <span>Initialize Goal Tracker</span>
              </button>
            </div>
          </form>

          {/* Active Goals List */}
          <div className="space-y-4" id="goals-live-recap">
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-450 flex items-center gap-1">
              <span>Compounding Ledger</span>
              <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-120/40 px-1.5 py-0.5 rounded">
                {goals.length} ACTIVE
              </span>
            </h4>

            {goals.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                No goals created yet. Use the tool above to specify your targets.
              </div>
            ) : (
              <div className="space-y-4" id="goals-compound-container">
                {goals.map((g) => {
                  const analytics = calculateGoalWealth(g);
                  return (
                    <div key={g.id} className="border border-slate-200 p-4.5 rounded-2xl relative bg-white hover:border-emerald-250 transition-colors shadow-2xs space-y-3.5">
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(g.id)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete Goal"
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Header info */}
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100/55 rounded-lg text-emerald-750">
                          <CheckCircle2 size={14} />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 block leading-tight">{g.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            ₹{g.currentAmt.toLocaleString()} Capital + ₹{g.monthlySip.toLocaleString()}/Mo SIP over {g.years} yrs @ {g.expectedReturn}%
                          </span>
                        </div>
                      </div>

                      {/* Financial outputs */}
                      <div className="grid grid-cols-3 gap-3 bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                        <div>
                          <span className="text-[8.5px] uppercase font-mono font-bold text-slate-400 block">Total Invested</span>
                          <span className="text-xs font-mono font-extrabold text-slate-700">₹{analytics.invested.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] uppercase font-mono font-bold text-slate-450 block">Returns Earned</span>
                          <span className="text-xs font-mono font-extrabold text-emerald-600">+₹{analytics.gains.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] uppercase font-mono font-bold text-slate-450 block">Target Needed</span>
                          <span className="text-xs font-mono font-extrabold text-indigo-750">₹{g.targetAmt.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Progress bar info */}
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500">
                          <span>Progress to Target (Projected ₹{analytics.projected.toLocaleString()})</span>
                          <span className="text-emerald-700">{analytics.progressPct}% achieved</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              analytics.progressPct >= 100 
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                                : "bg-gradient-to-r from-emerald-500 to-indigo-600"
                            }`}
                            style={{ width: `${analytics.progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
