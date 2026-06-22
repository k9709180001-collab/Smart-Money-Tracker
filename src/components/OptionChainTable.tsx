import React, { useState } from "react";
import { OptionChainRow } from "../types";
import { Edit2, Save, Undo2, Plus, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

interface OptionChainTableProps {
  optionChain: OptionChainRow[];
  spotPrice: number;
  onUpdateOptionChain: (updatedChain: OptionChainRow[]) => void;
  onResetChain: () => void;
  selectedSymbol?: string;
  isFetchingLive?: boolean;
  nseTimestamp?: string;
  isLiveFeedSimulated?: boolean;
  onRefreshLive?: () => void;
}

export default function OptionChainTable({
  optionChain,
  spotPrice,
  onUpdateOptionChain,
  onResetChain,
  selectedSymbol = "NIFTY",
  isFetchingLive = false,
  nseTimestamp = "",
  isLiveFeedSimulated = false,
  onRefreshLive,
}: OptionChainTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<OptionChainRow | null>(null);

  // For adding a custom strike
  const [newStrike, setNewStrike] = useState("");
  const [newCallOI, setNewCallOI] = useState("");
  const [newCallLtp, setNewCallLtp] = useState("");
  const [newPutOI, setNewPutOI] = useState("");
  const [newPutLtp, setNewPutLtp] = useState("");

  // Find max OI in calls and puts for visual scale (heatmap bars)
  const maxCallOI = Math.max(...optionChain.map((r) => r.callOI), 1);
  const maxPutOI = Math.max(...optionChain.map((r) => r.putOI), 1);

  // Find the strike closest to Spot Price to label ATM
  const findAtmStrike = () => {
    let closestRow = optionChain[0];
    let minDiff = Math.abs(optionChain[0].strike - spotPrice);
    
    for (const row of optionChain) {
      const diff = Math.abs(row.strike - spotPrice);
      if (diff < minDiff) {
        minDiff = diff;
        closestRow = row;
      }
    }
    return closestRow?.strike;
  };

  const atmStrike = findAtmStrike();

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditRow({ ...optionChain[index] });
  };

  const handleSaveEdit = (index: number) => {
    if (!editRow) return;
    const newChain = [...optionChain];
    newChain[index] = editRow;
    newChain.sort((a, b) => a.strike - b.strike);
    onUpdateOptionChain(newChain);
    setEditingIndex(null);
    setEditRow(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditRow(null);
  };

  const handleDeleteRow = (index: number) => {
    const newChain = optionChain.filter((_, i) => i !== index);
    onUpdateOptionChain(newChain);
  };

  const handleAddStrike = (e: React.FormEvent) => {
    e.preventDefault();
    const strikeNum = parseFloat(newStrike);
    if (isNaN(strikeNum)) return;

    // Check if duplicate strike already exists
    if (optionChain.some((r) => r.strike === strikeNum)) {
      alert("This Strike Price is already on the Option Chain.");
      return;
    }

    const newRow: OptionChainRow = {
      strike: strikeNum,
      callOI: parseFloat(newCallOI) || 10000,
      callOIchg: 0,
      callLtp: parseFloat(newCallLtp) || 50,
      putLtp: parseFloat(newPutLtp) || 50,
      putOIchg: 0,
      putOI: parseFloat(newPutOI) || 10000,
    };

    const newChain = [...optionChain, newRow].sort((a, b) => a.strike - b.strike);
    onUpdateOptionChain(newChain);

    // Clear inputs in form
    setNewStrike("");
    setNewCallOI("");
    setNewCallLtp("");
    setNewPutOI("");
    setNewPutLtp("");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="option-chain-card">
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800 font-sans tracking-tight">
              Live Option Chain Analyzer
            </h3>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded font-mono">
              {selectedSymbol}
            </span>
            <span className="text-[9.5px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live Feed Active
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-mono mt-1">
            <span>
              Spot Price: <span className="text-emerald-700 font-bold font-sans">₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </span>
            {nseTimestamp && (
              <>
                <span className="text-slate-300">|</span>
                <span>Last Sync: {new Date(nseTimestamp).toLocaleTimeString()}</span>
              </>
            )}
            <span className="text-slate-300">|</span>
            <span className="text-indigo-600 font-sans font-medium">
              Real-time calculations synced. For 100% exact option contracts, use the "Paste Data" tab above.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshLive && (
            <button
              onClick={onRefreshLive}
              disabled={isFetchingLive}
              className={`flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer`}
              id="btn-quick-refresh-option-chain"
            >
              <RefreshCw size={13} className={isFetchingLive ? "animate-spin" : ""} />
              {isFetchingLive ? "Updating..." : `Lively Update Chain — ${selectedSymbol}`}
            </button>
          )}
          <button
            onClick={onResetChain}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-705 rounded-lg text-xs font-medium border border-slate-200 shadow-sm transition active:scale-95 cursor-pointer font-semibold"
            id="btn-reset-option-chain"
          >
            <Undo2 size={13} />
            Reset Default
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            {/* Headers Group */}
            <tr className="bg-slate-50 text-center border-b border-slate-200 text-slate-700 font-semibold">
              <th colSpan={3} className="py-2.5 border-r border-slate-200 bg-red-100/30 text-red-700 text-xs tracking-wider uppercase font-sans font-bold">
                Calls (Sellers/Resistance)
              </th>
              <th className="py-2.5 bg-indigo-50 font-bold text-xs uppercase tracking-widest text-indigo-800 border-x border-indigo-100">
                Strike
              </th>
              <th colSpan={3} className="py-2.5 border-l border-slate-200 bg-emerald-100/30 text-emerald-700 text-xs tracking-wider uppercase font-sans font-bold">
                Puts (Buyers/Support)
              </th>
              <th className="py-2.5 bg-slate-100 w-16 text-slate-500 font-mono text-[10px]">
                Actions
              </th>
            </tr>
            {/* Detailed Columns Headers */}
            <tr className="text-[11px] text-slate-500 bg-slate-50 border-b border-slate-200 font-mono tracking-wider uppercase">
              <th className="py-2 px-3 text-center w-28 border-r border-slate-200/50">CE OI (Lots)</th>
              <th className="py-2 px-2 text-center w-20 border-r border-slate-200/50">CE Chg%</th>
              <th className="py-2 px-3 text-center w-24 border-r border-slate-200/50">CE Price LTP</th>
              
              <th className="py-2 px-4 text-center bg-indigo-50/40 font-sans font-bold text-indigo-900 border-x border-indigo-100">Price (K)</th>
              
              <th className="py-2 px-3 text-center w-24 border-l border-slate-200/50">PE Price LTP</th>
              <th className="py-2 px-2 text-center w-20 border-l border-slate-200/50">PE Chg%</th>
              <th className="py-2 px-3 text-center w-28 border-l border-slate-200/50">PE OI (Lots)</th>
              <th className="py-2 px-2 text-center">Ctrl</th>
            </tr>
          </thead>
          <tbody>
            {optionChain.map((row, index) => {
              const isEditing = editingIndex === index;
              const isAtm = row.strike === atmStrike;

              // Calculate percentage widths for backdrops
              const callOIWidth = (row.callOI / maxCallOI) * 100;
              const putOIWidth = (row.putOI / maxPutOI) * 100;

              return (
                <tr
                  key={row.strike}
                  className={`border-b border-slate-100 transition-all ${
                    isAtm 
                      ? "bg-amber-50 hover:bg-amber-100/60 border-y border-amber-200" 
                      : "hover:bg-slate-50"
                  }`}
                >
                  {/* === CALLS === */}
                  {/* CE OI with inline red bar graph */}
                  <td className="relative py-2 px-3 border-r border-slate-200/40 font-mono text-center overflow-hidden h-11 w-28">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-red-100/25 border-r border-red-200"
                      style={{ width: `${callOIWidth}%` }}
                    />
                    <div className="relative font-bold text-slate-800">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-full bg-white text-slate-800 border border-slate-300 text-xs px-1 text-center py-0.5 rounded"
                          value={editRow?.callOI ?? 0}
                          onChange={(e) =>
                            setEditRow(prev => prev ? { ...prev, callOI: parseInt(e.target.value) || 0 } : null)
                          }
                        />
                      ) : (
                        row.callOI.toLocaleString()
                      )}
                    </div>
                  </td>

                  {/* CE Change % */}
                  <td className="py-2 px-2 border-r border-slate-200/40 text-center font-mono text-xs w-20">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-full bg-white text-slate-800 border border-slate-300 text-xs px-1 text-center py-0.5 rounded"
                        value={editRow?.callOIchg ?? 0}
                        onChange={(e) =>
                          setEditRow(prev => prev ? { ...prev, callOIchg: parseFloat(e.target.value) || 0 } : null)
                        }
                      />
                    ) : (
                      <span className={`inline-flex items-center gap-0.5 font-bold ${row.callOIchg >= 0 ? 'text-red-650' : 'text-slate-500'}`}>
                        {row.callOIchg >= 0 ? <ArrowUpRight size={10} className="text-red-500" /> : <ArrowDownRight size={10} />}
                        {row.callOIchg.toFixed(1)}%
                      </span>
                    )}
                  </td>

                  {/* CE LTP */}
                  <td className="py-2 px-3 border-r border-slate-200/40 text-center font-mono font-bold text-slate-700 text-xs w-24">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-full bg-white text-slate-800 border border-slate-300 text-xs px-1 text-center py-0.5 rounded"
                        value={editRow?.callLtp ?? 0}
                        step="0.05"
                        onChange={(e) =>
                          setEditRow(prev => prev ? { ...prev, callLtp: parseFloat(e.target.value) || 0 } : null)
                        }
                      />
                    ) : (
                      `₹${row.callLtp.toFixed(2)}`
                    )}
                  </td>

                  {/* === STRIKE === */}
                  <td className="py-2 px-3 text-center bg-indigo-50/30 font-sans font-extrabold text-indigo-900 text-sm relative border-x border-indigo-100">
                    <span className="relative z-10 font-mono">{row.strike}</span>
                    {isAtm && (
                      <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 text-[8px] bg-amber-100 border border-amber-300 text-amber-800 font-extrabold tracking-wider uppercase px-1 rounded-sm">
                        ATM
                      </span>
                    )}
                  </td>

                  {/* === PUTS === */}
                  {/* PE LTP */}
                  <td className="py-2 px-3 border-l border-slate-200/40 text-center font-mono font-bold text-slate-700 text-xs w-24">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-full bg-white text-slate-800 border border-slate-300 text-xs px-1 text-center py-0.5 rounded"
                        value={editRow?.putLtp ?? 0}
                        step="0.05"
                        onChange={(e) =>
                          setEditRow(prev => prev ? { ...prev, putLtp: parseFloat(e.target.value) || 0 } : null)
                        }
                      />
                    ) : (
                      `₹${row.putLtp.toFixed(2)}`
                    )}
                  </td>

                  {/* PE Change % */}
                  <td className="py-2 px-2 border-l border-slate-200/40 text-center font-mono text-xs w-20">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-full bg-white text-slate-800 border border-slate-300 text-xs px-1 text-center py-0.5 rounded"
                        value={editRow?.putOIchg ?? 0}
                        onChange={(e) =>
                          setEditRow(prev => prev ? { ...prev, putOIchg: parseFloat(e.target.value) || 0 } : null)
                        }
                      />
                    ) : (
                      <span className={`inline-flex items-center gap-0.5 font-bold ${row.putOIchg >= 0 ? 'text-emerald-750' : 'text-slate-500'}`}>
                        {row.putOIchg >= 0 ? <ArrowUpRight size={10} className="text-emerald-500" /> : <ArrowDownRight size={10} />}
                        {row.putOIchg.toFixed(1)}%
                      </span>
                    )}
                  </td>

                  {/* PE OI with inline green bar graph */}
                  <td className="relative py-2 px-3 border-l border-slate-200/40 font-mono text-center overflow-hidden h-11 w-28">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-emerald-100/25 border-l border-emerald-200"
                      style={{ width: `${putOIWidth}%` }}
                    />
                    <div className="relative font-bold text-slate-800">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-full bg-white text-slate-800 border border-slate-300 text-xs px-1 text-center py-0.5 rounded"
                          value={editRow?.putOI ?? 0}
                          onChange={(e) =>
                            setEditRow(prev => prev ? { ...prev, putOI: parseInt(e.target.value) || 0 } : null)
                          }
                        />
                      ) : (
                        row.putOI.toLocaleString()
                      )}
                    </div>
                  </td>

                  {/* EDIT ACTION UTILITIES */}
                  <td className="py-2 px-2 text-center text-slate-700">
                    {isEditing ? (
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={() => handleSaveEdit(index)}
                          className="p-1 hover:text-emerald-600 bg-white rounded border border-slate-250 hover:bg-slate-50 shadow-sm transition"
                          title="Save Changes"
                        >
                          <Save size={12} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 hover:text-red-500 bg-white rounded border border-slate-250 hover:bg-slate-50 shadow-sm transition"
                          title="Cancel"
                        >
                          <Undo2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center gap-1.5 opacity-60 hover:opacity-100 transition">
                        <button
                          onClick={() => handleStartEdit(index)}
                          className="p-1 text-slate-500 hover:text-indigo-650 bg-slate-100 rounded hover:bg-white border border-slate-200 shadow-sm transition"
                          title="Edit Strike"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteRow(index)}
                          className="p-1 text-slate-500 hover:text-red-650 bg-slate-100 rounded hover:bg-white border border-slate-200 shadow-sm transition"
                          title="Delete Strike"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Insert Custom Strike Form */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 font-mono">
          + Add Custom Option Chain Strike Price
        </h4>
        <form onSubmit={handleAddStrike} className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 font-mono font-semibold">Strike Price</label>
            <input
              type="number"
              placeholder="e.g. 22650"
              required
              className="w-full bg-white border border-slate-250 text-xs rounded p-1.5 text-slate-850 font-mono focus:border-indigo-550 focus:outline-none"
              value={newStrike}
              onChange={(e) => setNewStrike(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-mono font-semibold">CE OI (Lots)</label>
            <input
              type="number"
              placeholder="e.g. 45000"
              className="w-full bg-white border border-slate-250 text-xs rounded p-1.5 text-slate-850 font-mono focus:border-indigo-550 focus:outline-none"
              value={newCallOI}
              onChange={(e) => setNewCallOI(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-mono font-semibold">CE Price LTP (₹)</label>
            <input
              type="number"
              placeholder="e.g. 85.2"
              step="0.05"
              className="w-full bg-white border border-slate-250 text-xs rounded p-1.5 text-slate-850 font-mono focus:border-indigo-550 focus:outline-none"
              value={newCallLtp}
              onChange={(e) => setNewCallLtp(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-mono font-semibold">PE Price LTP (₹)</label>
            <input
              type="number"
              placeholder="e.g. 64.9"
              step="0.05"
              className="w-full bg-white border border-slate-250 text-xs rounded p-1.5 text-slate-850 font-mono focus:border-indigo-550 focus:outline-none"
              value={newPutLtp}
              onChange={(e) => setNewPutLtp(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-mono font-semibold">PE OI (Lots)</label>
            <input
              type="number"
              placeholder="e.g. 38000"
              className="w-full bg-white border border-slate-250 text-xs rounded p-1.5 text-slate-850 font-mono focus:border-indigo-550 focus:outline-none"
              value={newPutOI}
              onChange={(e) => setNewPutOI(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 text-white rounded text-xs py-2 font-bold cursor-pointer transition flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus size={14} /> Add Row
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
