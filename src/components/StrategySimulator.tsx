import React, { useState, useEffect } from "react";
import { OptionLeg, TradingStrategy, StrategyPayoffPoint } from "../types";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { Plus, Trash2, Sliders, Play, Calculator, HelpCircle } from "lucide-react";

interface StrategySimulatorProps {
  suggestedStrategies: TradingStrategy[];
  spotPrice: number;
}

export default function StrategySimulator({ suggestedStrategies, spotPrice }: StrategySimulatorProps) {
  const [selectedStrategyIndex, setSelectedStrategyIndex] = useState<number>(0);
  const [legs, setLegs] = useState<OptionLeg[]>([]);
  const [strategyName, setStrategyName] = useState("Custom Strategy");
  const [lotSize, setLotSize] = useState(25); // Target lot size, e.g. 25 for Nifty, 15 for Bank Nifty

  // If suggested strategies are loaded, preset the active selector
  useEffect(() => {
    if (suggestedStrategies && suggestedStrategies.length > 0) {
      const activeStrat = suggestedStrategies[selectedStrategyIndex];
      if (activeStrat) {
        setLegs(activeStrat.legs || []);
        setStrategyName(activeStrat.name || "Suggested Setup");
      }
    }
  }, [suggestedStrategies, selectedStrategyIndex]);

  const handleAddLeg = () => {
    // Propose an ATM call to add
    const defaultStrike = Math.round(spotPrice / 50) * 50;
    const newLeg: OptionLeg = {
      strike: defaultStrike,
      type: "CE",
      action: "BUY",
      premium: 100,
    };
    setLegs([...legs, newLeg]);
    setStrategyName("Custom Strategy");
  };

  const handleUpdateLeg = (index: number, key: keyof OptionLeg, value: any) => {
    const updatedLegs = [...legs];
    updatedLegs[index] = {
      ...updatedLegs[index],
      [key]: value,
    };
    setLegs(updatedLegs);
    setStrategyName("Custom Strategy");
  };

  const handleDeleteLeg = (index: number) => {
    setLegs(legs.filter((_, i) => i !== index));
    setStrategyName("Custom Strategy");
  };

  // Payoff calculations
  const calculateOptionPayoff = (leg: OptionLeg, expiryPrice: number): number => {
    const premiumMultiplier = leg.action === "BUY" ? -1 : 1;
    let intrinsicValue = 0;
    
    if (leg.type === "CE") {
      intrinsicValue = Math.max(0, expiryPrice - leg.strike);
    } else {
      intrinsicValue = Math.max(0, leg.strike - expiryPrice);
    }

    if (leg.action === "BUY") {
      return (intrinsicValue - leg.premium) * lotSize;
    } else {
      return (leg.premium - intrinsicValue) * lotSize;
    }
  };

  const getPayoffPoints = (): StrategyPayoffPoint[] => {
    if (legs.length === 0) return [];
    
    // Determine reasonable min and max prices around active legs
    const strikes = legs.map((l) => l.strike);
    const minStrike = Math.min(...strikes, spotPrice) - 300;
    const maxStrike = Math.max(...strikes, spotPrice) + 300;

    const points: StrategyPayoffPoint[] = [];
    const step = 20;

    for (let price = Math.round(minStrike); price <= Math.round(maxStrike); price += step) {
      let totalProfit = 0;
      for (const leg of legs) {
        totalProfit += calculateOptionPayoff(leg, price);
      }
      points.push({
        stockPrice: price,
        profit: parseFloat(totalProfit.toFixed(1)),
      });
    }

    return points;
  };

  const payoffPoints = getPayoffPoints();

  // Highlight key stats
  const getMaxStats = () => {
    if (payoffPoints.length === 0) return { maxProfit: "N/A", maxLoss: "N/A", riskReward: "N/A" };
    
    const profits = payoffPoints.map((p) => p.profit);
    const minProfit = Math.min(...profits);
    const maxProfitVal = Math.max(...profits);
    
    // Simple heuristic to evaluate if it's unlimited
    const firstVal = profits[0];
    const lastVal = profits[profits.length - 1];
    
    const maxProfitText = (lastVal > maxProfitVal - 5 || firstVal > maxProfitVal - 5) && maxProfitVal > 50000 
      ? "Unlimited" 
      : `₹${maxProfitVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      
    const maxLossText = (lastVal < minProfit + 5 || firstVal < minProfit + 5) && minProfit < -50000 
      ? "Unlimited" 
      : `₹${Math.abs(minProfit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    let rrRatioText = "N/A";
    if (minProfit < 0 && maxProfitVal > 0) {
      const loss = Math.abs(minProfit);
      const gain = maxProfitVal;
      if (loss > 0 && gain > 0 && maxProfitText !== "Unlimited" && maxLossText !== "Unlimited") {
        rrRatioText = `1:${(gain / loss).toFixed(2)}`;
      }
    }

    return {
      maxProfit: maxProfitText,
      maxLoss: maxLossText,
      riskReward: rrRatioText,
    };
  };

  const stats = getMaxStats();

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="strategy-simulator-card">
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Sliders className="text-emerald-700 font-bold" size={18} />
          <h3 className="text-lg font-bold text-slate-800 font-sans tracking-tight">
            Options Strategy Payoff Simulator
          </h3>
        </div>

        {suggestedStrategies && suggestedStrategies.length > 0 && (
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {suggestedStrategies.map((strat, idx) => (
              <button
                key={strat.name}
                onClick={() => setSelectedStrategyIndex(idx)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                  selectedStrategyIndex === idx 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-850 hover:bg-white"
                }`}
              >
                {strat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-slate-100">
        {/* Legs Config Side: 5 Column */}
        <div className="lg:col-span-5 p-6 border-r border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Legs Configuration ({strategyName})
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono font-bold">Lot Size:</span>
              <input
                type="number"
                className="w-12 bg-white border border-slate-250 text-xs text-center rounded py-0.5 text-emerald-700 font-bold focus:outline-none"
                value={lotSize}
                onChange={(e) => setLotSize(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto mb-4 pr-1">
            {legs.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Calculator className="mx-auto text-slate-400 mb-2" size={24} />
                <p className="text-xs text-slate-650">No active positions yet.</p>
                <button
                  onClick={handleAddLeg}
                  className="mt-3 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-1 rounded hover:bg-indigo-100 transition cursor-pointer shadow-xs"
                >
                  Create Custom Leg
                </button>
              </div>
            ) : (
              legs.map((leg, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-extrabold text-slate-500">LEG #{idx + 1}</span>
                    <button
                      onClick={() => handleDeleteLeg(idx)}
                      className="text-slate-400 hover:text-red-650 transition"
                      title="Remove position leg"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {/* BS */}
                    <div>
                      <select
                        className="w-full bg-white text-xs border border-slate-200 rounded p-1 text-slate-800 font-bold cursor-pointer focus:outline-none"
                        value={leg.action}
                        onChange={(e) => handleUpdateLeg(idx, "action", e.target.value)}
                      >
                        <option value="BUY" className="text-emerald-700 font-bold">BUY</option>
                        <option value="SELL" className="text-red-700 font-bold">SELL</option>
                      </select>
                    </div>

                    {/* STRIKE */}
                    <div>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded p-1 text-xs text-slate-850 text-center font-mono font-bold focus:border-indigo-550 focus:outline-none"
                        value={leg.strike}
                        onChange={(e) => handleUpdateLeg(idx, "strike", parseInt(e.target.value) || 0)}
                      />
                    </div>

                    {/* TYPE */}
                    <div>
                      <select
                        className="w-full bg-white text-xs border border-slate-200 rounded p-1 text-slate-800 font-bold cursor-pointer focus:outline-none"
                        value={leg.type}
                        onChange={(e) => handleUpdateLeg(idx, "type", e.target.value)}
                      >
                        <option value="CE">CE</option>
                        <option value="PE">PE</option>
                      </select>
                    </div>

                    {/* PREMIUM */}
                    <div>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full bg-white border border-slate-200 rounded p-1 text-xs text-slate-850 text-center font-mono font-bold focus:border-indigo-550 focus:outline-none"
                        value={leg.premium}
                        onChange={(e) => handleUpdateLeg(idx, "premium", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {legs.length > 0 && (
            <button
              onClick={handleAddLeg}
              className="w-full text-center py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 text-indigo-750 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Add Position Leg
            </button>
          )}

          {/* Quick Stats Panel */}
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 py-2 px-1.5 rounded border border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase font-mono font-bold tracking-wider">Max Profit</span>
              <p className="text-sm font-extrabold text-emerald-700 mt-0.5">{stats.maxProfit}</p>
            </div>
            <div className="bg-slate-50 py-2 px-1.5 rounded border border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase font-mono font-bold tracking-wider">Max Loss</span>
              <p className="text-sm font-extrabold text-red-650 mt-0.5">{stats.maxLoss}</p>
            </div>
            <div className="bg-slate-50 py-2 px-1.5 rounded border border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase font-mono font-bold tracking-wider">Risk / Reward</span>
              <p className="text-sm font-extrabold text-indigo-700 mt-0.5">{stats.riskReward}</p>
            </div>
          </div>
        </div>

        {/* Visual Strategy Graph: 7 Column */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-4">
              Payoff Graph at Expiry (₹ Net Profit)
            </h4>

            {legs.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-sans">Setup position legs on the left side to see your potential payoff.</p>
              </div>
            ) : (
              <div className="h-64 scale-95 md:scale-100">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={payoffPoints} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="stockPrice" 
                      stroke="#475569" 
                      fontSize={10} 
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={10}
                      tickFormatter={(v) => `₹${v >= 0 ? v.toLocaleString('en-IN') : `-${Math.abs(v).toLocaleString('en-IN')}`}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                      labelStyle={{ color: "#334155", fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: "#047857", fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: any) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, "Total Payoff"]}
                      labelFormatter={(label) => `Stock Price at Expiry: ₹${label}`}
                    />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
                    <ReferenceLine x={spotPrice} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'SPOT', fill: '#d97706', fontSize: 9, position: 'top', fontWeight: 'bold' }} />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2 text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            <HelpCircle className="text-slate-500 fill-white flex-shrink-0" size={14} />
            <span className="leading-relaxed">
              **How To Read Payoff?** The green line represents your net profit/loss (₹) at options expiry relative to the spot index settlement price. Utilizing spreads limits risk beautifully.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
