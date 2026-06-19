/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { OptionChainRow, FiiDiiData, DerivativesReport } from "./types";
import { DEFAULT_OPTION_CHAIN, DEFAULT_FII_DII, DEFAULT_SPOT_PRICE } from "./data/defaults";
import { USER_PASTED_OPTION_CHAIN } from "./data/pastedData";
import OptionChainTable from "./components/OptionChainTable";
import FiiDiiPanel from "./components/FiiDiiPanel";
import AnalystReport from "./components/AnalystReport";
import AtmCoiTracker from "./components/AtmCoiTracker";
import PcrLiveIndicator from "./components/PcrLiveIndicator";
import HeavyweightsTripwire from "./components/HeavyweightsTripwire";
import IndiaVixTracker from "./components/IndiaVixTracker";
import PriceActionAlertManager from "./components/PriceActionAlertManager";
import SellerPanicDashboard from "./components/SellerPanicDashboard";
import SellerPanicChatBot from "./components/SellerPanicChatBot";
import { parseSensibullCSV } from "./utils/csvParser";
import { 
  TrendingUp, TrendingDown, Clipboard, AlertTriangle, Play, HelpCircle, 
  BrainCircuit, Sparkles, BookOpen, BarChart3, LineChart, FileText, ChevronRight,
  Upload, Image, RefreshCw, FileUp, CheckCircle2, Globe 
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function App() {
  // Option Chain, FII/DII, Spot Price states
  const [optionChain, setOptionChain] = useState<OptionChainRow[]>(DEFAULT_OPTION_CHAIN);
  const [fiiDii, setFiiDii] = useState<FiiDiiData>(DEFAULT_FII_DII);
  const [spotPrice, setSpotPrice] = useState<number>(DEFAULT_SPOT_PRICE);
  
  // Custom upload tab: "paste" | "csv" | "image" | "live"
  const [activeUploadTab, setActiveUploadTab] = useState<"paste" | "csv" | "image" | "live">("live");

  // Live NSE States
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NIFTY");
  const [liveExpiry, setLiveExpiry] = useState<string>("");
  const [allLiveExpiries, setAllLiveExpiries] = useState<string[]>([]);
  const [nseTimestamp, setNseTimestamp] = useState<string>("");
  const [liveFetching, setLiveFetching] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [isLiveFeedSimulated, setIsLiveFeedSimulated] = useState<boolean>(false);

  // Market indices status with live backend feeds
  const [indicesStatus, setIndicesStatus] = useState<any>(null);
  const [overrideSymbol, setOverrideSymbol] = useState<string | null>(null);
  const [overrideVal, setOverrideVal] = useState<string>("");

  // Custom clipboard text parsing
  const [rawPasteText, setRawPasteText] = useState(USER_PASTED_OPTION_CHAIN);
  const [useRawPaste, setUseRawPaste] = useState(true);

  // States for Image and CSV drag and drop
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("");
  const [imageParsing, setImageParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Analysis result & loading states
  const [report, setReport] = useState<DerivativesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [parseSuccessMessage, setParseSuccessMessage] = useState<string | null>(null);

  // Manual Index value override callback
  const handleOverrideIndex = async (symbol: string, val: number) => {
    try {
      const response = await fetch("/api/market-indices/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, value: val }),
      });
      if (response.ok) {
        setParseSuccessMessage(`${symbol} successfully aligned to ₹${val.toLocaleString("en-IN")} ! Synchronizing live options chain with local override...`);
        fetchIndicesStatus();
        if (selectedSymbol === symbol) {
          handleFetchLiveNseData(symbol);
        }
        setTimeout(() => setParseSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error("Failed to override index:", err);
    }
  };

  // Load indices benchmarks from server
  const fetchIndicesStatus = async () => {
    try {
      const response = await fetch("/api/market-indices");
      if (response.ok) {
        const data = await response.json();
        setIndicesStatus(data);
      }
    } catch (err) {
      console.warn("Failed fetching indices status:", err);
    }
  };

  // Load live FII & DII flows from server
  const fetchFiiDiiStatus = async () => {
    try {
      const response = await fetch("/api/fii-dii");
      if (response.ok) {
        const data = await response.json();
        setFiiDii(data);
      }
    } catch (err) {
      console.warn("Failed fetching FII/DII status:", err);
    }
  };

  // Helper to render high-fidelity custom index card
  const renderIndexCard = (key: string, item: any) => {
    const isPositive = item.change >= 0;
    // Highlight active option chain index
    const isCurrentActive = selectedSymbol === item.symbol;
    const canFetchOptionChain = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"].includes(item.symbol);
    const isOverriddenMode = overrideSymbol === item.symbol;

    const getSessionBadge = (keyName: string) => {
      if (keyName === "dowjones" || keyName === "nasdaq") {
        return <span className="text-[7px] text-amber-700 bg-amber-50 border border-amber-100 px-1 rounded font-bold font-mono uppercase">USA Close</span>;
      }
      if (keyName === "nikkei" || keyName === "hangseng") {
        return <span className="text-[7px] text-teal-750 bg-teal-50 border border-teal-100 px-1 rounded font-bold font-mono uppercase">Asian Session</span>;
      }
      if (keyName === "giftnifty") {
        return <span className="text-[7px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 rounded font-bold font-mono uppercase">GIFT Live</span>;
      }
      return null;
    };

    if (isOverriddenMode) {
      return (
        <div
          key={key}
          className="text-left p-2.5 rounded-xl border bg-yellow-50/60 border-yellow-300 shadow-sm flex flex-col justify-between h-20"
        >
          <div className="text-[9px] font-bold text-slate-650 font-mono tracking-wide truncate flex justify-between items-center">
            <span>{item.name} Price</span>
            {getSessionBadge(key)}
          </div>
          <input
            type="number"
            autoFocus
            className="w-full text-xs font-bold font-mono px-1.5 py-0.5 border border-slate-300 rounded focus:outline-indigo-500 bg-white"
            placeholder={item.value.toString()}
            value={overrideVal}
            onChange={(e) => setOverrideVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const num = parseFloat(overrideVal);
                if (!isNaN(num) && num > 0) {
                  handleOverrideIndex(item.symbol, num);
                }
                setOverrideSymbol(null);
                setOverrideVal("");
              } else if (e.key === "Escape") {
                setOverrideSymbol(null);
                setOverrideVal("");
              }
            }}
          />
          <div className="flex justify-between w-full text-[8.5px] mt-0.5">
            <button
              type="button"
              onClick={() => {
                const num = parseFloat(overrideVal);
                if (!isNaN(num) && num > 0) {
                  handleOverrideIndex(item.symbol, num);
                }
                setOverrideSymbol(null);
                setOverrideVal("");
              }}
              className="text-emerald-700 font-extrabold hover:underline"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setOverrideSymbol(null);
                setOverrideVal("");
              }}
              className="text-rose-600 font-extrabold hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={key}
        onDoubleClick={() => {
          setOverrideSymbol(item.symbol);
          setOverrideVal(item.value.toString());
        }}
        className={`group text-left p-3 rounded-xl border transition-all duration-150 relative flex flex-col justify-between h-20 cursor-pointer ${
          isCurrentActive
            ? "bg-indigo-50/50 border-indigo-400 shadow-sm ring-1 ring-indigo-400/30"
            : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-305"
        }`}
      >
        <div className="flex justify-between items-center w-full">
          <span className="text-[9.5px] font-bold text-slate-550 font-mono tracking-wide truncate">{item.name}</span>
          <div className="flex items-center gap-1">
            {getSessionBadge(key)}
            {/* Edit Override Button on Hover */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOverrideSymbol(item.symbol);
                setOverrideVal(item.value.toString());
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
              title="Click to manually correct/set price"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            {isCurrentActive && (
              <span className="text-[8px] bg-indigo-650 text-white font-bold font-mono px-1 rounded uppercase scale-90">
                Active
              </span>
            )}
          </div>
        </div>
        
        {/* Centered value list trigger */}
        <button
          type="button"
          onClick={() => {
            if (canFetchOptionChain) {
              setSelectedSymbol(item.symbol);
              setActiveUploadTab("live");
              handleFetchLiveNseData(item.symbol);
            } else {
              setParseSuccessMessage(`${item.name} connects automatically as a macro indicator! Option chain streaming is fully automated for Nifty, Bank Nifty, and Fin Nifty.`);
              setTimeout(() => setParseSuccessMessage(null), 5000);
            }
          }}
          className="w-full text-left focus:outline-none cursor-pointer"
        >
          <div className="flex items-baseline justify-between w-full mt-1">
            <div className="text-xs font-black font-mono text-slate-800">
              {item.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-[10px] font-black font-mono flex items-center gap-0.5 ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
              {isPositive ? "▲" : "▼"}{isPositive ? "+" : ""}{item.change}%
            </div>
          </div>
        </button>

        <div className="text-[8.5px] text-slate-405 font-mono flex justify-between w-full pt-1 border-t border-slate-200/50 mt-1">
          <span>Prev. Close</span>
          <span>{item.prevClose.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    );
  };

  // Automatically fetch live NIFTY options data and index status ticker on mount
  useEffect(() => {
    handleFetchLiveNseData("NIFTY");
    fetchIndicesStatus();
    fetchFiiDiiStatus();
    // Refresh indices list every 5 seconds to provide standard high-fidelity updates
    const timer = setInterval(fetchIndicesStatus, 5000);
    // Refresh FII/DII data every 30 seconds
    const fiiDiiTimer = setInterval(fetchFiiDiiStatus, 30000);
    return () => {
      clearInterval(timer);
      clearInterval(fiiDiiTimer);
    };
  }, []);

  // Set up auto-refresh interval (every 60 seconds) when switch is toggled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      console.log(`[Auto-Refresh Interval] Ticked for ${selectedSymbol}`);
      handleFetchLiveNseData(selectedSymbol);
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedSymbol]);

  const handleRunAnalysis = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          optionChain,
          fiiDii,
          spotPrice,
          pastedRawText: useRawPaste ? rawPasteText : "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze option chain data.");
      }

      const generatedReport: DerivativesReport = await response.json();
      setReport(generatedReport);
      
      // If Gemini recalculated Spot Price or PCR inside, we synchronize or preserve it
      if (generatedReport.supportResistance?.maxPain) {
        console.log("Calculated Option pain: " + generatedReport.supportResistance.maxPain);
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLiveNseData = async (symbolToFetch: string = selectedSymbol) => {
    setLiveFetching(true);
    setErrorStatus(null);
    setParseSuccessMessage(null);
    try {
      const response = await fetch(`/api/fetch-nse?symbol=${symbolToFetch}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch live data from NSE.");
      }
      const data = await response.json();
      if (data && data.rows && data.rows.length > 0) {
        setOptionChain(data.rows);
        setSpotPrice(data.spotPrice);
        setLiveExpiry(data.expiry);
        setAllLiveExpiries(data.allExpiries || []);
        setNseTimestamp(data.timestamp);
        setIsLiveFeedSimulated(data.isSimulated || false);
        
        if (data.isSimulated) {
          setParseSuccessMessage(`${symbolToFetch} Live Chain simulated successfully! (NSE closed or cookie restricted fallback activated). Spot Price: ₹${data.spotPrice}, Expiry: ${data.expiry}`);
        } else {
          setParseSuccessMessage(`NSE India से सफलतापूर्वक ${symbolToFetch} की लाइव ऑप्शन चेन लोड हो गई है! Expiry: ${data.expiry}, Spot: ₹${data.spotPrice}`);
        }
        
        // Auto trigger fresh quantitative report analysis
        triggerAutoAnalysis(data.rows, data.spotPrice, `NSE Live Option Chain Fetch for ${symbolToFetch}`);

        setTimeout(() => {
          setParseSuccessMessage(null);
        }, 6500);
      } else {
        throw new Error("NSE API returned zero rows of option data.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus("NSE Live Fetch Failed: " + (err.message || err));
    } finally {
      setLiveFetching(false);
    }
  };

  const triggerAutoAnalysis = (rows: OptionChainRow[], currentSpot: number, rawText?: string) => {
    setLoading(true);
    fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        optionChain: rows,
        fiiDii,
        spotPrice: currentSpot,
        pastedRawText: rawText || "",
      }),
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed analysis call");
      return res.json();
    })
    .then(data => {
      setReport(data);
    })
    .catch(err => {
      setErrorStatus(err.message || "Failed post-parsing analysis.");
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const handleParseAndLoadOptionChain = () => {
    try {
      const result = parseSensibullCSV(rawPasteText);
      if (result) {
        setOptionChain(result.rows);
        setSpotPrice(result.spotPrice);
        setParseSuccessMessage(`सफलतापूर्वक ${result.rows.length} स्ट्राइक प्राइसेज और स्पॉट प्राइस ₹${result.spotPrice} को लोड कर लिया गया है!`);
        setErrorStatus(null);
        
        // Auto trigger fresh quantitative report analysis
        triggerAutoAnalysis(result.rows, result.spotPrice, rawPasteText);

        // Auto clear success message after 6 seconds
        setTimeout(() => {
          setParseSuccessMessage(null);
        }, 6050);
      } else {
        setErrorStatus("पेस्ट किए गए डेटा को पहचाना नहीं जा सका। कृपया Sensibull / NSE ऑप्शन चैन की सही रो कॉपी करके दोबारा प्रयास करें।");
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus("डेटा को प्रोसेस करने में एरर आई: " + (err.message || err));
    }
  };

  const handleCSVTextLoaded = (text: string) => {
    try {
      const result = parseSensibullCSV(text);
      if (result) {
        setOptionChain(result.rows);
        setSpotPrice(result.spotPrice);
        setRawPasteText(text);
        setUseRawPaste(true);
        setParseSuccessMessage(`CSV फ़ाइल से सफलतापूर्वक ${result.rows.length} स्ट्राइक प्राइसेज और स्पॉट प्राइस ₹${result.spotPrice} लोड कर लिया गया है!`);
        setErrorStatus(null);
        
        // Auto trigger fresh quantitative report analysis
        triggerAutoAnalysis(result.rows, result.spotPrice, text);

        setTimeout(() => {
          setParseSuccessMessage(null);
        }, 6050);
      } else {
        setErrorStatus("CSV फ़ाइल को पहचाना नहीं जा सका। कृपया Sensibull / NSE ऑप्शन चैन की सही CSV फ़ाइल अपलोड करें।");
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus("CSV को प्रोसेस करने में एरर आई: " + (err.message || err));
    }
  };

  const handleCSVFileDropOrSelect = (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        handleCSVTextLoaded(e.target.result);
      }
    };
    reader.onerror = () => {
      setErrorStatus("CSV फ़ाइल को लोड करने में असमर्थ।");
    };
    reader.readAsText(file);
  };

  const parseImageWithGemini = async () => {
    if (!selectedImage) return;
    setImageParsing(true);
    setErrorStatus(null);
    try {
      const response = await fetch("/api/parse-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64Data: selectedImage,
          mimeType: imageMimeType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gemini can't extract options from this image.");
      }

      const data = await response.json();
      if (data && data.rows && data.rows.length > 0) {
        const rows: OptionChainRow[] = data.rows;
        const spot: number = data.spotPrice > 0 ? data.spotPrice : spotPrice;

        // Sort by strike price ascending
        rows.sort((a, b) => a.strike - b.strike);

        setOptionChain(rows);
        setSpotPrice(spot);
        setParseSuccessMessage(`Gemini AI ने सफलतापूर्वक ${rows.length} स्ट्राइक प्राइसेज और स्पॉट प्राइस ₹${spot} को इमेज से एक्सट्रैक्ट कर लिया है!`);
        setErrorStatus(null);

        // Auto trigger fresh quantitative report analysis
        triggerAutoAnalysis(rows, spot, "Image multimodal analysis parsing");

        setTimeout(() => {
          setParseSuccessMessage(null);
        }, 6050);
      } else {
        throw new Error("इमेज में कोई वैध ऑप्शन चैन डेटा या स्ट्राइक प्राइसेज नहीं मिल सकीं।");
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus("इमेज पार्सिंग में एरर: " + (err.message || err));
    } finally {
      setImageParsing(false);
    }
  };

  const handleResetDefaultData = () => {
    setOptionChain(DEFAULT_OPTION_CHAIN);
    setFiiDii(DEFAULT_FII_DII);
    setSpotPrice(DEFAULT_SPOT_PRICE);
    setRawPasteText("");
    setUseRawPaste(false);
    setParseSuccessMessage(null);
    setSelectedImage(null);
    setUploadedFileName(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDropCSV = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result && typeof evt.target.result === "string") {
          handleCSVTextLoaded(evt.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result && typeof evt.target.result === "string") {
          setSelectedImage(evt.target.result);
          setImageMimeType(file.type);
          setErrorStatus(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert option chain into Recharts friendly format
  const barChartData = optionChain.map((row) => ({
    strike: row.strike.toString(),
    "Call Open Interest (CE)": row.callOI,
    "Put Open Interest (PE)": row.putOI,
  }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900" id="trader-app-root">
      
      {/* PROFESSIONAL TITLE / HEADER BAR */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 px-6 py-4 flex flex-wrap justify-between items-center gap-4" id="main-header">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-650 text-white rounded-lg shadow-sm" id="header-logo-container">
            <BrainCircuit size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-800 font-sans">
                QuantaTrader Pro
              </h1>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                DERIVATIVES INTELLIGENCE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Professional Derivatives Trader &amp; Quantitative Analysis Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 font-mono" id="spot-indicator">
            <span className="text-slate-600 font-semibold">ATM SPOT INDEX:</span>
            <input 
              type="number"
              className="bg-transparent text-emerald-700 font-bold w-20 focus:outline-none"
              value={spotPrice}
              onChange={(e) => setSpotPrice(parseFloat(e.target.value) || 0)}
              step="0.05"
            />
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all shadow-sm active:bg-indigo-700 flex items-center gap-1.5 cursor-pointer"
            id="btn-trigger-ai-analysis"
          >
            <Sparkles size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Analyzing..." : "Generate Derivatives Intelligence"}
          </button>
        </div>
      </header>

      {/* COMPONENT BODY VIEWPORT */}
      <main className="max-w-7xl mx-auto p-6 space-y-6" id="trader-dashboard-content">
        
        {/* Error notification banner */}
        {errorStatus && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex gap-3" id="alert-banner">
            <AlertTriangle size={16} className="text-red-650 flex-shrink-0" />
            <div>
              <p className="font-bold">Analysis Engine Failed</p>
              <p className="mt-0.5 leading-relaxed">{errorStatus}</p>
            </div>
          </div>
        )}

        {/* Success parsed notification banner */}
        {parseSuccessMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex gap-3 transition-all duration-350" id="parse-success-banner">
            <Sparkles size={16} className="text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold">सफलतापूर्वक पार्स किया गया (Option Chain Applied)</p>
              <p className="mt-0.5 leading-relaxed font-sans">{parseSuccessMessage}</p>
            </div>
          </div>
        )}

        {/* Real-time Ticking Indices HUD */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-fade-in" id="realtime-market-ticker">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h2 className="text-[11.5px] font-extrabold text-slate-800 uppercase tracking-wider font-mono">
                Live Server-Side Market Benchmarks Status
              </h2>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex flex-wrap items-center gap-2">
              <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[9.5px] font-bold">💡 Double-click or click ✏️ to set exact price</span>
              <span className="text-slate-200">|</span>
              <span><span className="text-emerald-500">●</span> Live Sync: {indicesStatus?.timestamp ? new Date(indicesStatus.timestamp).toLocaleTimeString() : "Syncing..."}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Domestic Indices */}
            <div>
              <div className="flex items-center gap-1.5 text-[9.5px] font-extrabold text-indigo-600/90 uppercase tracking-widest mb-2 font-mono">
                <span>🇮🇳 Domestic Indices (भारतीय सूचकांक)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {indicesStatus ? (
                  Object.entries(indicesStatus)
                    .filter(([key]) => ["nifty", "sensex", "banknifty", "finnifty", "midcapnifty"].includes(key))
                    .map(([key, item]: any) => renderIndexCard(key, item))
                ) : (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl h-20 animate-pulse flex flex-col justify-between">
                      <div className="h-3 w-16 bg-slate-200 rounded" />
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                      <div className="h-2 w-12 bg-slate-200 rounded" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Global/International Indices */}
            <div>
              <div className="flex items-center gap-1.5 text-[9.5px] font-extrabold text-slate-550 uppercase tracking-widest mb-2 font-mono pt-1">
                <span>🌐 Global Benchmarks & GIFT Nifty (वैश्विक सूचकांक)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {indicesStatus ? (
                  Object.entries(indicesStatus)
                    .filter(([key]) => ["giftnifty", "dowjones", "nasdaq", "nikkei", "hangseng"].includes(key))
                    .map(([key, item]: any) => renderIndexCard(key, item))
                ) : (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl h-20 animate-pulse flex flex-col justify-between">
                      <div className="h-3 w-16 bg-slate-200 rounded" />
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                      <div className="h-2 w-12 bg-slate-200 rounded" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* LIVE PRICE ACTION & LEVELS ALERT SENTINEL */}
        <section id="price-action-alerts-sentinel-section">
          <PriceActionAlertManager indicesStatus={indicesStatus} />
        </section>

        {/* TOP ROW bento grids: CLIPBOARD PASTE + VISUAL OI CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="overview-bento-grid">
          
          {/* Clipboard & Multi-Format Options Loader - 4 columns */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between" id="clipboard-panel">
            <div>
              {/* Modern tabs selector */}
              <div className="flex border-b border-slate-150 mb-3" id="upload-tab-headers">
                <button
                  onClick={() => { setActiveUploadTab("paste"); setErrorStatus(null); }}
                  className={`flex-1 pb-2 text-[10.5px] font-bold font-mono tracking-wider uppercase transition-all duration-150 text-center cursor-pointer ${
                    activeUploadTab === "paste"
                      ? "border-b-2 border-indigo-600 text-indigo-600 font-extrabold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  📋 Paste
                </button>
                <button
                  onClick={() => { setActiveUploadTab("csv"); setErrorStatus(null); }}
                  className={`flex-1 pb-2 text-[10.5px] font-bold font-mono tracking-wider uppercase transition-all duration-150 text-center cursor-pointer ${
                    activeUploadTab === "csv"
                      ? "border-b-2 border-indigo-600 text-indigo-600 font-extrabold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  📊 CSV File
                </button>
                <button
                  onClick={() => { setActiveUploadTab("image"); setErrorStatus(null); }}
                  className={`flex-1 pb-2 text-[10.5px] font-bold font-mono tracking-wider uppercase transition-all duration-150 text-center cursor-pointer ${
                    activeUploadTab === "image"
                      ? "border-b-2 border-indigo-600 text-indigo-600 font-extrabold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  📸 Screen
                </button>
                <button
                  onClick={() => { setActiveUploadTab("live"); setErrorStatus(null); }}
                  className={`flex-1 pb-2 text-[10.5px] font-bold font-mono tracking-wider uppercase transition-all duration-150 text-center cursor-pointer ${
                    activeUploadTab === "live"
                      ? "border-b-2 border-indigo-600 text-indigo-600 font-extrabold"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  🔴 Live
                </button>
              </div>

              {/* TAB 0: LIVE DATA */}
              {activeUploadTab === "live" && (
                <div className="space-y-3" id="tab-live-content">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      NSE LIVE OPTION CHAIN
                    </h4>
                    <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                      LIVE NSE
                    </span>
                  </div>
                  
                  <p className="text-[11.5px] text-slate-600 leading-relaxed font-sans">
                    NSE India se directly live option chain data fetch karo — bina kisi copy-paste ke! Server-side proxy use karta hai.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Index Symbol
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"].map((symbol) => {
                        const isSelected = selectedSymbol === symbol;
                        return (
                          <button
                            key={symbol}
                            type="button"
                            onClick={() => {
                              setSelectedSymbol(symbol);
                              handleFetchLiveNseData(symbol);
                            }}
                            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border duration-150 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow shadow-emerald-250 animate-fade-in"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            {symbol}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5 px-0.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Auto-Refresh
                    </span>
                    <button
                      type="button"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
                        autoRefresh ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow block" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleFetchLiveNseData()}
                    disabled={liveFetching}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow shadow-emerald-100"
                    id="btn-fetch-live"
                  >
                    <span className="relative flex h-2 w-2 mr-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    {liveFetching ? "Connecting to NSE..." : `Abhi Live Data Fetch Karo — ${selectedSymbol}`}
                  </button>

                  {liveExpiry && (
                    <div className="mt-2 bg-indigo-50/70 border border-indigo-100 p-2.5 rounded-lg text-[10px] text-indigo-900 space-y-1 font-mono">
                      <div className="flex justify-between font-semibold">
                        <span>Expiry Date:</span>
                        <span className="text-indigo-700 font-bold">{liveExpiry}</span>
                      </div>
                      {nseTimestamp && (
                        <div className="flex justify-between text-[9.5px] text-slate-500">
                          <span>Last Sync Tick:</span>
                          <span>{new Date(nseTimestamp).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[10px] text-amber-800 space-y-1 leading-relaxed">
                    <span className="font-bold block">⚠️ Note:</span>
                    NSE data fetch karne ke liye market hours (9:15 AM – 3:30 PM IST) mein hi try karein. Market band hone par NSE API blocked ho sakti hai.
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-100 pt-2 text-slate-400">
                    <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <span className="animate-pulse">●</span> {isLiveFeedSimulated ? "NSE Live Mode Simulated" : "NSE Live Mode Ready"}
                    </div>
                    <button 
                      onClick={() => {
                        setOptionChain([]);
                        setSpotPrice(0);
                        setLiveExpiry("");
                        setReport(null);
                        setErrorStatus(null);
                      }}
                      className="text-slate-400 hover:text-indigo-600 transition-all font-bold cursor-pointer"
                    >
                      Clear all buffers
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 1: PASTE */}
              {activeUploadTab === "paste" && (
                <div className="space-y-3" id="tab-paste-content">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Sensibull Clipboard Paste
                    </h4>
                    <span className="text-[9px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-indigo-600 font-mono font-bold uppercase">
                      AUTO-PARSING
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Sensibull ya bank/nifty option table clipboard se copy karke yahan paste karein. AI will auto-structure open interest levels!
                  </p>
                  <textarea
                    placeholder="Paste raw Option Chain or Institutional text data here..."
                    className="w-full h-36 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-lg p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                    value={rawPasteText}
                    onChange={(e) => {
                      setRawPasteText(e.target.value);
                      setUseRawPaste(e.target.value.trim().length > 0);
                    }}
                  />
                  {useRawPaste && (
                    <button
                      onClick={handleParseAndLoadOptionChain}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      id="btn-parse-and-apply"
                    >
                      <Sparkles size={13} />
                      इस ऑप्शन चेन का डेटा लोड करें
                    </button>
                  )}
                </div>
              )}

              {/* TAB 2: CSV FILE */}
              {activeUploadTab === "csv" && (
                <div className="space-y-3" id="tab-csv-content">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Upload Option Chain CSV
                    </h4>
                    <span className="text-[9px] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono font-bold">
                      EXCEL / CSV
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    NSE / Sensibull template se download ki gayi complete Option Chain CSV file yahan select ya drop karein.
                  </p>

                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDropCSV}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                      dragActive ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <input 
                      type="file" 
                      id="csv-file-picker" 
                      accept=".csv,text/csv"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleCSVFileDropOrSelect(e.target.files[0]);
                        }
                      }}
                    />
                    <label htmlFor="csv-file-picker" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                      <FileUp size={28} className="text-slate-400 hover:text-indigo-600 transition-colors" />
                      <span className="text-[11px] text-slate-600 font-medium">
                        Drag your Option CSV here or <span className="text-indigo-600 underline">Browse</span>
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Supports NSE / Sensibull .csv output format
                      </span>
                    </label>
                  </div>

                  {uploadedFileName && activeUploadTab === "csv" && (
                    <div className="flex items-center gap-2 text-[10px] bg-slate-50 border border-slate-150 p-2 rounded-lg text-slate-600">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span className="truncate font-mono font-medium">{uploadedFileName}</span>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[10.5px] text-amber-800 leading-relaxed">
                    <span className="font-semibold block mb-0.5">💡 CSV Instruction:</span>
                    CSV columns must align to standard NSE options output (Strike, CALLS: OI, CHNG IN OI, VOLUME, PUTS: OI, CHNG IN OI, VOLUME).
                  </div>
                </div>
              )}

              {/* TAB 3: IMAGE MULTIMODAL SCREEN UPLOAD */}
              {activeUploadTab === "image" && (
                <div className="space-y-3" id="tab-image-content">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Multimodal Image Extraction
                    </h4>
                    <span className="text-[9px] bg-purple-50 border border-purple-150 px-1.5 py-0.5 rounded text-purple-700 font-mono font-bold flex items-center gap-1">
                      <Sparkles size={8} /> GEMINI AI
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    NSE / Sensibull screen grid ka screenshot lein aur drop karein. Gemini AI numbers coordinates extract karke option tree automatically populates karega!
                  </p>

                  {!selectedImage ? (
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDropImage}
                      className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                        dragActive ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                      }`}
                    >
                      <input 
                        type="file" 
                        id="image-file-picker" 
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setUploadedFileName(file.name);
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result && typeof evt.target.result === "string") {
                                setSelectedImage(evt.target.result);
                                setImageMimeType(file.type);
                                setErrorStatus(null);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label htmlFor="image-file-picker" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                        <Image size={28} className="text-slate-400 hover:text-indigo-600 transition-colors" />
                        <span className="text-[11px] text-slate-600 font-medium">
                          Drag screenshot or <span className="text-indigo-600 underline">Browse image</span>
                        </span>
                        <span className="text-[9px] text-slate-400">
                          PNG, JPG, or JPEG screenshot
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-black flex items-center justify-center">
                        <img 
                          src={selectedImage} 
                          alt="Option screenshot" 
                          className="max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-0.5">
                        <span className="truncate max-w-[150px] font-medium">{uploadedFileName || "Screenshot Loaded"}</span>
                        <button 
                          onClick={() => { setSelectedImage(null); setUploadedFileName(null); }}
                          className="text-red-500 hover:underline cursor-pointer font-bold"
                        >
                          Remove image
                        </button>
                      </div>

                      <button
                        onClick={parseImageWithGemini}
                        disabled={imageParsing}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-slate-800 disabled:bg-slate-350 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        id="btn-gemini-image-parse"
                      >
                        {imageParsing ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            AI reading strike coordinates...
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            AI इमेज़ से ऑप्शन की जानकारी निकालें
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${useRawPaste || selectedImage ? "bg-amber-500" : "bg-slate-400"}`}></span>
                {activeUploadTab === "paste" ? "Raw Paste Mode Active" : (activeUploadTab === "csv" ? "CSV Loader Active" : "Multimodal Image Active")}
              </span>
              <button 
                onClick={handleResetDefaultData}
                className="text-indigo-600 hover:underline cursor-pointer font-semibold"
              >
                Clear all buffers
              </button>
            </div>
          </div>

          {/* Recharts Visual Bar Chart of Open Interest Concentration - 8 columns */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between" id="oi-histogram-panel">
            <div>
              <div className="flex items-center justify-between mb-3 text-slate-700">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <BarChart3 size={15} className="text-emerald-600" /> Visual Open Interest (OI) concentration
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  Total Strikes Simulated: {optionChain.length}
                </span>
              </div>

              {/* Bar Chart Container */}
              <div className="h-44 text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="strike" stroke="#64748b" fontSize={9} />
                    <YAxis stroke="#64748b" fontSize={9} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: '6px' }}
                      labelStyle={{ color: "#475569", fontSize: '10px', fontWeight: 'bold' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '9px', opacity: 0.9 }} />
                    <Bar dataKey="Call Open Interest (CE)" fill="#ef4444" radius={[2, 2, 0, 0]} opacity={0.8} />
                    <Bar dataKey="Put Open Interest (PE)" fill="#10b981" radius={[2, 2, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
              <span>🔴 <span className="font-semibold text-red-600">Red bars</span> represent Call Open Interest (Resistance ceilings where sellers expect drops)</span>
              <span>🟢 <span className="font-semibold text-emerald-600">Green bars</span> represent Put Open Interest (Supports floors where buyers absorb drops)</span>
            </div>
          </div>

        </div>

        {/* MAIN BODY LAYOUT Tabs: ANALYST INTELLIGENCE REPORT */}
        <section className="space-y-4" id="quant-intelligence-report">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            <span>Derivative Advisor Intelligence Report</span>
          </div>
          <AnalystReport report={report} loading={loading} />
        </section>

        {/* HEAVYWEIGHT TRAP DETECTION TRIPWIRE */}
        <section className="space-y-4" id="heavyweights-tripwire-section">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
            <span>Nifty Heavyweights Market Driver Analyzer</span>
          </div>
          <HeavyweightsTripwire indicesStatus={indicesStatus} />
        </section>

        {/* INDIA VIX VOLATILITY ANALYSIS */}
        <section className="space-y-4" id="india-vix-analysis-section">
          <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            <span>Live Market Implied Volatility Index</span>
          </div>
          <IndiaVixTracker indicesStatus={indicesStatus} />
        </section>

        {/* LIVE PCR TREND INDICATOR PANEL */}
        <section className="space-y-4" id="pcr-live-tracker-panel">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            <span>Real-time Put-Call Ratio (PCR) Dashboard</span>
          </div>
          <PcrLiveIndicator optionChain={optionChain} />
        </section>

        {/* LIVE ATM COI TRACKER PANEL */}
        <section className="space-y-4" id="atom-coi-live-tracker">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>ATM Buildup Heatmap (COI Tracker)</span>
          </div>
          <AtmCoiTracker optionChain={optionChain} spotPrice={spotPrice} />
        </section>

        {/* SELLER PANIC INDEX DASHBOARD */}
        <section className="space-y-4" id="seller-panic-radar-section">
          <SellerPanicDashboard 
            optionChain={optionChain}
            indicesStatus={indicesStatus}
          />
        </section>

        {/* OPTION CHAIN INTERACTIVE GRID */}
        <section className="space-y-4" id="chain-interactive-grid">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Option Chain Configurations</span>
          </div>
          <OptionChainTable 
            optionChain={optionChain}
            spotPrice={spotPrice}
            onUpdateOptionChain={setOptionChain}
            onResetChain={handleResetDefaultData}
          />
        </section>

        {/* FII DII FLOW BIAS PANEL */}
        <section className="space-y-4" id="fii-dii-grid">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Institutional Activity &amp; Hedging Records</span>
          </div>
          <FiiDiiPanel 
            fiiDii={fiiDii}
            onUpdateFiiDii={setFiiDii}
            spotPrice={spotPrice}
          />
        </section>



        {/* TACTICAL GLOSSARY / INSTRUCTIONS FOR PRO TRADERS */}
        <div className="p-6 bg-white border border-slate-200 rounded-xl" id="educational-panel">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <BookOpen className="text-indigo-600" size={16} /> Derivatives Quantitative Analyst Manual
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-600 text-xs leading-relaxed">
            <div>
              <p className="font-bold text-slate-850 mb-1 font-mono">1. PCR &amp; Writers Concentration (Support/Resistance)</p>
              <p>
                Option sellers/writers are high-capital players (Institutions or High Net-worth individuals) who absorb premium risk to write contracts. Hence, they dictate key support and resistance zones. Peak Call writer concentration is a heavy ceiling (Resistance), on the other hand peak Put writer concentration is a major floor (Support). PCR shows overall writing bias (Put OI / Call OI).
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-850 mb-1 font-mono">2. Short Covering vs Long Unwinding Breakout Scenarios</p>
              <p>
                When a key Resistance strike is broken on the upside, Call writers get worried and start buying back their short positions quickly to save capital. This panic buying pushes the market higher in an explosive manner (**Short Covering Rally**). Conversely, when a key support strike breaks, Put writers exit, triggering an aggressive dump in underlying spot indices (**Long Unwinding**).
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* FOOTER BAR */}
      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-center text-xs text-slate-500 font-mono" id="main-footer">
        <p>© 2026 QuantaTrader Pro. Designed for Quantitative Option Analytics and High-Fidelity Risk Management.</p>
        <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-slate-400">
          <span>Powered by Gemini 3.5 AI</span> • <span>Non-directional &amp; Directional Spreads Engine</span>
        </p>
      </footer>

      {/* FLOATING ACTION SELLER PANIC ANALYST CHATBOT */}
      <SellerPanicChatBot 
        optionChain={optionChain}
        indicesStatus={indicesStatus}
        fiiDiiData={fiiDii}
        spotPrice={spotPrice}
      />
    </div>
  );
}
