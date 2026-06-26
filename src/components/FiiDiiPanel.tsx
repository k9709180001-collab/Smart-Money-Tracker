import React from "react";
import { FiiDiiData } from "../types";
import { TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, Shield } from "lucide-react";

interface FiiDiiPanelProps {
  fiiDii: FiiDiiData;
  onUpdateFiiDii: (updatedData: FiiDiiData) => void;
  spotPrice: number;
}

export default function FiiDiiPanel({ fiiDii, onUpdateFiiDii, spotPrice }: FiiDiiPanelProps) {
  const handleChange = (field: keyof FiiDiiData, value: number | string) => {
    onUpdateFiiDii({
      ...fiiDii,
      [field]: typeof value === "number" ? value : parseFloat(value) || 0,
    });
  };

  const getFlowSentiment = (net: number) => {
    if (net < -500) return { label: "Strong Bearish", text: "text-red-700 bg-red-50 border-red-200" };
    if (net < 0) return { label: "Mild Bearish", text: "text-rose-700 bg-rose-50 border-rose-200" };
    if (net === 0) return { label: "Neutral", text: "text-slate-600 bg-slate-100 border-slate-200" };
    if (net > 500) return { label: "Strong Bullish", text: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    return { label: "Mild Bullish", text: "text-teal-700 bg-teal-50 border-teal-200" };
  };

  const cashSentiment = getFlowSentiment(fiiDii.fiiCashNet);
  const diiSentiment = getFlowSentiment(fiiDii.diiCashNet);
  const futuresSentiment = getFlowSentiment(fiiDii.fiiIndexFuturesNet / 10); // Normalizing scales

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="fii-dii-card">
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield className="text-indigo-600" size={18} />
          <h3 className="text-lg font-bold text-slate-800 font-sans tracking-tight">
            Institutional activity (FII / DII Flows)
          </h3>
        </div>
        <span className="text-slate-600 font-mono text-[10px] bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200 font-bold">
          DATA DATE: {fiiDii.date}
        </span>
      </div>

      <div className="p-6">
        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          Institutional cash flows and derivative contracts tell us where Smart Money is building their multi-day base.
          Modify the values in the inputs below to see how changes to institutional bias affect your overall trade strategy.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {/* FII Cash flow */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 font-mono font-bold">FII Cash Net Flow</span>
              <div className="text-lg font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
                {fiiDii.fiiCashNet < 0 ? (
                  <ArrowDownCircle className="text-red-600 flex-shrink-0" size={16} />
                ) : (
                  <ArrowUpCircle className="text-emerald-700 flex-shrink-0" size={16} />
                )}
                <span>₹{fiiDii.fiiCashNet.toLocaleString("en-IN")} Cr</span>
              </div>
            </div>
            <div className="mt-4">
              <input
                type="number"
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-400"
                value={fiiDii.fiiCashNet}
                onChange={(e) => handleChange("fiiCashNet", parseFloat(e.target.value) || 0)}
              />
              <span className={`inline-block text-[10px] font-bold mt-2 px-2 py-0.5 rounded border ${cashSentiment.text}`}>
                {cashSentiment.label}
              </span>
            </div>
          </div>

          {/* DII Cash flow */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 font-mono font-bold">DII Cash Net Flow</span>
              <div className="text-lg font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
                {fiiDii.diiCashNet < 0 ? (
                  <ArrowDownCircle className="text-red-600 flex-shrink-0" size={16} />
                ) : (
                  <ArrowUpCircle className="text-emerald-700 flex-shrink-0" size={16} />
                )}
                <span>₹{fiiDii.diiCashNet.toLocaleString("en-IN")} Cr</span>
              </div>
            </div>
            <div className="mt-4">
              <input
                type="number"
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={fiiDii.diiCashNet}
                onChange={(e) => handleChange("diiCashNet", parseFloat(e.target.value) || 0)}
              />
              <span className={`inline-block text-[10px] font-bold mt-2 px-2 py-0.5 rounded border ${diiSentiment.text}`}>
                {diiSentiment.label}
              </span>
            </div>
          </div>

          {/* FII Index Futures */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 font-mono font-bold">FII Index Futures Net</span>
              <div className="text-lg font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
                {fiiDii.fiiIndexFuturesNet < 0 ? (
                  <TrendingDown className="text-red-600 flex-shrink-0" size={16} />
                ) : (
                  <TrendingUp className="text-emerald-700 flex-shrink-0" size={16} />
                )}
                <span>{fiiDii.fiiIndexFuturesNet.toLocaleString()} Contracts</span>
              </div>
            </div>
            <div className="mt-4">
              <input
                type="number"
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={fiiDii.fiiIndexFuturesNet}
                onChange={(e) => handleChange("fiiIndexFuturesNet", parseInt(e.target.value) || 0)}
              />
              <span className={`inline-block text-[10px] font-bold mt-2 px-2 py-0.5 rounded border ${futuresSentiment.text}`}>
                {futuresSentiment.label}
              </span>
            </div>
          </div>

          {/* FII Index Options */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 font-mono font-bold">FII Index Options Net</span>
              <div className="text-lg font-extrabold text-slate-800 mt-1 flex items-center gap-1.5 text-indigo-700">
                <TrendingUp size={16} className="text-indigo-600 flex-shrink-0" />
                <span>{fiiDii.fiiIndexOptionsNet.toLocaleString()} Contracts</span>
              </div>
            </div>
            <div className="mt-4">
              <input
                type="number"
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={fiiDii.fiiIndexOptionsNet}
                onChange={(e) => handleChange("fiiIndexOptionsNet", parseInt(e.target.value) || 0)}
              />
              <span className="inline-block text-[10px] text-indigo-800 font-bold mt-2 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                Heavy Derivatives Activity
              </span>
            </div>
          </div>
        </div>

        {/* Note on CONTRADITING flows */}
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex gap-3 text-slate-700">
          <div className="font-extrabold flex-shrink-0 text-amber-800 font-sans">📝 Net Flow Note:</div>
          <div className="text-xs leading-relaxed font-sans text-slate-700">
            Agar FII Cash mein continuously Net Sellers (Negative ₹Cr) hain par index options mein heavy long (positive option positions or heavy put writing) create kar rahe hain, toh iska saf-saf matlab hai: **Dynamic Hedging**. Institutions apne mid-term cash portfolio shares ko unload ya hedge karne ke liye derivatives segment (index puts) mein support writing defense create karte hain to hold spot indices in a consolidating range.
          </div>
        </div>
      </div>
    </div>
  );
}
