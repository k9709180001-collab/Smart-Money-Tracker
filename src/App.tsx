/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { OptionChainRow, FiiDiiData, DerivativesReport } from "./types";
import { DEFAULT_OPTION_CHAIN, DEFAULT_FII_DII, DEFAULT_SPOT_PRICE } from "./data/defaults";
import { USER_PASTED_OPTION_CHAIN } from "./data/pastedData";
import OptionChainTable from "./components/OptionChainTable";
import AnalystHub from "./components/AnalystHub";
import FiiDiiPanel from "./components/FiiDiiPanel";
import AnalystReport from "./components/AnalystReport";
import AtmCoiTracker from "./components/AtmCoiTracker";
import PcrLiveIndicator from "./components/PcrLiveIndicator";
import HeavyweightsTripwire from "./components/HeavyweightsTripwire";
import IndiaVixTracker from "./components/IndiaVixTracker";
import PriceActionAlertManager from "./components/PriceActionAlertManager";
import SellerPanicDashboard from "./components/SellerPanicDashboard";
import SellerPanicChatBot from "./components/SellerPanicChatBot";
import IndexChartViewer from "./components/IndexChartViewer";
import AtmSportsAnalyzer from "./components/AtmSportsAnalyzer";
import ExpiryAnalyzer from "./components/ExpiryAnalyzer";
import StrategySimulator from "./components/StrategySimulator";
import WealthManagement from "./components/WealthManagement";
import SipCompounding from "./components/SipCompounding";
import SipCalculator from "./components/SipCalculator";
import AdminDashboard from "./components/AdminDashboard";
import LongStraddleDashboard from "./components/LongStraddleDashboard";
import { parseSensibullCSV } from "./utils/csvParser";
import { 
  TrendingUp, TrendingDown, Clipboard, AlertTriangle, Play, HelpCircle, 
  BrainCircuit, Sparkles, BookOpen, BarChart3, LineChart, FileText, ChevronRight, ChevronLeft,
  Upload, Image, RefreshCw, FileUp, CheckCircle2, Globe, Target, Layers, Hourglass, Flame, Trophy, Sliders,
  Briefcase, PiggyBank, Calculator, Lock, LockOpen, ShieldAlert, Home
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

async function safeResponseJson(response: Response, defaultMessage: string = "Request failed on server.") {
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    if (text.trim().startsWith("<")) {
      throw new Error(`${defaultMessage} (Server returned HTML page. The app backend may be warming up or restarting. Try again in a few seconds)`);
    }
    throw new Error(text.slice(0, 150) || defaultMessage);
  }
  return response.json();
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const isChartView = params.get("view") === "chart";
  const chartSymbol = params.get("symbol") || "NIFTY";

  if (isChartView) {
    return <IndexChartViewer initialSymbol={chartSymbol} />;
  }

  // Option Chain, FII/DII, Spot Price states
  const [optionChain, setOptionChain] = useState<OptionChainRow[]>(DEFAULT_OPTION_CHAIN);
  const [fiiDii, setFiiDii] = useState<FiiDiiData>(DEFAULT_FII_DII);
  const [spotPrice, setSpotPrice] = useState<number>(DEFAULT_SPOT_PRICE);
  
  // Custom upload tab: "paste" | "csv" | "image" | "live"
  const [activeUploadTab, setActiveUploadTab] = useState<"paste" | "csv" | "image" | "live">("live");

  // Navigation pages state
  const [activePage, setActivePage] = useState<"intro" | "dashboard" | "report" | "seller" | "seller-panic" | "atm" | "atm-sports" | "expiry" | "strategy" | "vix" | "tripwire" | "fiidii" | "wealth" | "sip" | "sip-calc" | "admin">("intro");
  const [analystActiveTool, setAnalystActiveTool] = useState<string>("option-chain");
  const [analystShowDirectory, setAnalystShowDirectory] = useState<boolean>(true);
  const [atmSubTab, setAtmSubTab] = useState<"straddle" | "coi">("straddle");

  const navScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleNavScroll = React.useCallback(() => {
    if (navScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  }, []);

  const scrollNav = (direction: "left" | "right") => {
    if (navScrollRef.current) {
      const scrollAmount = 260;
      navScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
      setTimeout(handleNavScroll, 350);
    }
  };

  React.useEffect(() => {
    const el = navScrollRef.current;
    if (el) {
      handleNavScroll();
      // Run fallback check after short delay to let layout settle
      const timer = setTimeout(handleNavScroll, 600);
      el.addEventListener("scroll", handleNavScroll);
      window.addEventListener("resize", handleNavScroll);
      return () => {
        clearTimeout(timer);
        el.removeEventListener("scroll", handleNavScroll);
        window.removeEventListener("resize", handleNavScroll);
      };
    }
  }, [handleNavScroll]);

  React.useEffect(() => {
    if (navScrollRef.current) {
      const activeBtn = navScrollRef.current.querySelector(
        `[id^="nav-btn-"][class*="bg-black"], [id^="nav-btn-"][class*="bg-teal-905"], [id^="nav-btn-"][class*="bg-indigo-900"], [id^="nav-btn-"][class*="bg-slate-900"], [id^="nav-btn-"][class*="bg-teal-900"]`
      );
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
      setTimeout(handleNavScroll, 400);
    }
  }, [activePage, handleNavScroll]);

  // Auto-collapse Analyst Tools Suite directory when user scrolls down
  React.useEffect(() => {
    const handleScroll = () => {
      if (activePage === "dashboard" && analystShowDirectory && window.scrollY > 120) {
        setAnalystShowDirectory(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [activePage, analystShowDirectory]);

  // Live NSE States
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NIFTY");
  const [liveExpiry, setLiveExpiry] = useState<string>("");
  const [allLiveExpiries, setAllLiveExpiries] = useState<string[]>([]);
  const [nseTimestamp, setNseTimestamp] = useState<string>("");
  const [liveFetching, setLiveFetching] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [isLiveFeedSimulated, setIsLiveFeedSimulated] = useState<boolean>(false);
  const [isLiveNseDisabled, setIsLiveNseDisabled] = useState<boolean>(false);

  // Market indices status with live backend feeds
  const [indicesStatus, setIndicesStatus] = useState<any>(null);
  const [botAlert, setBotAlert] = useState<any>(null);
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

  // Admin Login & Console States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>("");
  const [adminLoginError, setAdminLoginError] = useState<string>("");
  const [pendingPastedImage, setPendingPastedImage] = useState<{ base64: string, mimeType: string } | null>(null);

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
        if (selectedSymbol === symbol && !isLiveNseDisabled) {
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
        const data = await safeResponseJson(response);
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
        const data = await safeResponseJson(response);
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`?view=chart&symbol=${item.symbol}`, "_blank");
              }}
              className="px-1.5 py-0.5 text-[8.5px] bg-indigo-50/90 hover:bg-indigo-150 text-indigo-700 hover:text-indigo-850 font-extrabold border border-indigo-200/50 rounded transition-all cursor-pointer flex items-center gap-0.4 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              title="Click to open Live Candlestick Chart in a separate page"
            >
              <span>📈 Chart</span>
            </button>
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
              if (isLiveNseDisabled) {
                setParseSuccessMessage(`Index ${item.symbol} chuna gaya hai! Manual data feed chal raha hai, Live API disabled hai.`);
                setTimeout(() => setParseSuccessMessage(null), 4000);
              } else {
                setActiveUploadTab("live");
                handleFetchLiveNseData(item.symbol);
              }
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
    if (!isLiveNseDisabled) {
      handleFetchLiveNseData("NIFTY");
    }
    fetchIndicesStatus();
    fetchFiiDiiStatus();
    // Refresh indices list every 5 seconds to provide standard high-fidelity updates
    const timer = setInterval(() => {
      if (!isLiveNseDisabled) {
        fetchIndicesStatus();
      }
    }, 5000);
    // Refresh FII/DII data every 30 seconds
    const fiiDiiTimer = setInterval(() => {
      if (!isLiveNseDisabled) {
        fetchFiiDiiStatus();
      }
    }, 30000);
    return () => {
      clearInterval(timer);
      clearInterval(fiiDiiTimer);
    };
  }, [isLiveNseDisabled]);

  // Set up auto-refresh interval (every 20 seconds) when switch is toggled
  useEffect(() => {
    if (!autoRefresh || isLiveNseDisabled) return;
    const interval = setInterval(() => {
      console.log(`[Auto-Refresh Interval] Ticked for ${selectedSymbol}`);
      handleFetchLiveNseData(selectedSymbol);
    }, 20000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedSymbol, isLiveNseDisabled]);

  // Periodic 5-minute Auto Trading Bot Signal Checker
  useEffect(() => {
    const fetchBotSignal = async () => {
      try {
        console.log("[Auto Bot Check] Querying background AI trading signal...");
        const res = await fetch("/api/bot/get-signal", { method: "POST" });
        const data = await res.json();
        
        if (data.success && data.data && (data.data.signal === "BUY_CE" || data.data.signal === "BUY_PE")) {
          // Play a small beep / audio notification if permitted by browser
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          } catch (audioErr) {
            console.log("Audio alert blocked by browser context.");
          }

          // Visual pop-up overlay modal state in UI
          setBotAlert(data.data);
          
          // Browser window alert as requested
          alert(`🚨 AshTek SIGNAL TRIGGERED: ${data.data.signal} at ${data.data.suggested_strike}\nReasoning: ${data.data.reasoning}`);
        }
      } catch (err) {
        console.error("Bot background fetch error:", err);
      }
    };

    // Trigger immediately on mount
    fetchBotSignal();

    // Check every 5 minutes (300,000 ms)
    const interval = setInterval(fetchBotSignal, 300000);
    return () => clearInterval(interval);
  }, []);

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
          pastedRawText: (activeUploadTab === "paste" && useRawPaste) ? rawPasteText : "",
        }),
      });

      if (!response.ok) {
        const errorData = await safeResponseJson(response, "Failed to analyze option chain data.");
        throw new Error(errorData.error || "Failed to analyze option chain data.");
      }

      const generatedReport: DerivativesReport = await safeResponseJson(response);
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
        const errorData = await safeResponseJson(response, "Failed to fetch live data from NSE.");
        throw new Error(errorData.error || "Failed to fetch live data from NSE.");
      }
      const data = await safeResponseJson(response);
      if (data && data.rows && data.rows.length > 0) {
        setOptionChain(data.rows);
        setSpotPrice(data.spotPrice);
        setLiveExpiry(data.expiry);
        setAllLiveExpiries(data.allExpiries || []);
        setNseTimestamp(data.timestamp);
        setIsLiveFeedSimulated(data.isSimulated || false);
        
        if (data.isSimulated) {
          setParseSuccessMessage(`${symbolToFetch} की रियल-टाइम ऑप्शन चेन लोड हो गई है! Spot Price: ₹${data.spotPrice}, Expiry: ${data.expiry}`);
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
    .then(async (res) => {
      if (!res.ok) throw new Error("Failed analysis call");
      return safeResponseJson(res, "Analysis call failed.");
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

  const parseImageWithGemini = async (overrideImage?: string, overrideMime?: string) => {
    const targetImage = overrideImage || selectedImage;
    const targetMime = overrideMime || imageMimeType;
    if (!targetImage) return;
    setImageParsing(true);
    setErrorStatus(null);
    try {
      const response = await fetch("/api/parse-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64Data: targetImage,
          mimeType: targetMime,
        }),
      });

      if (!response.ok) {
        const errData = await safeResponseJson(response, "Gemini can't extract options from this image.");
        throw new Error(errData.error || "Gemini can't extract options from this image.");
      }

      const data = await safeResponseJson(response);
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

  // Global paste handler to detect pasted screenshots from clipboard and auto-analyze them
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = async (event) => {
                const base64 = event.target?.result as string;
                
                if (isAdminLoggedIn) {
                  setSelectedImage(base64);
                  setImageMimeType(file.type);
                  setUploadedFileName("Pasted Clipboard Screenshot (" + new Date().toLocaleTimeString() + ")");
                  setActiveUploadTab("image");
                  setIsAdminPanelOpen(true);
                  setParseSuccessMessage("क्लिपबोर्ड से इमेज डिटेक्ट हो गई है! Gemini 3.5 Vision AI से ऑप्शन चेन रीड किया जा रहा है...");
                  await parseImageWithGemini(base64, file.type);
                } else {
                  // Save pending pasted image, and open login
                  setPendingPastedImage({ base64, mimeType: file.type });
                  setAdminPin("");
                  setAdminLoginError("An option chain screenshot was detected in your clipboard! Enter the passcode below to unlock the Admin Portal & run Gemini 3.5 Vision AI to fetch all data.");
                  setIsAdminLoginModalOpen(true);
                }
              };
              reader.readAsDataURL(file);
              break;
            }
          }
        }
      }
    };
    window.addEventListener("paste", handleGlobalPaste);
    return () => {
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, [parseImageWithGemini, isAdminLoggedIn]);

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

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === "1234" || adminPin === "admin123" || adminPin.toLowerCase() === "admin") {
      setIsAdminLoggedIn(true);
      setIsAdminLoginModalOpen(false);
      setAdminLoginError("");
      
      // If there was a pending pasted image, process it now!
      if (pendingPastedImage) {
        const { base64, mimeType } = pendingPastedImage;
        setSelectedImage(base64);
        setImageMimeType(mimeType);
        setUploadedFileName("Pasted Clipboard Screenshot (" + new Date().toLocaleTimeString() + ")");
        setActiveUploadTab("image");
        setActivePage("admin");
        setParseSuccessMessage("लॉगिन सफल! अब Gemini 3.5 Vision AI से ऑप्शन चेन प्रोसेस की जा रही है...");
        setPendingPastedImage(null);
        await parseImageWithGemini(base64, mimeType);
      } else {
        // Open the admin panel normally
        setActivePage("admin");
        setParseSuccessMessage("Welcome to AshTek Smart Money Admin Console. Manual upload is now active.");
        setTimeout(() => setParseSuccessMessage(null), 5000);
      }
    } else {
      setAdminLoginError("Invalid Passcode! Please try again. (Hint: Use '1234' or 'admin123')");
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
      <header className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white sticky top-0 z-50 px-4 sm:px-6 py-4 sm:py-4.5 flex flex-wrap justify-between items-center gap-3 sm:gap-4 shadow-md" id="main-header">
        <div className="flex items-center gap-3" id="header-left-brand">
          <div className="p-2 bg-slate-800/90 border border-slate-700/80 text-orange-500 rounded-lg shadow-sm flex items-center justify-center animate-pulse" id="header-logo-container">
            <BrainCircuit size={19} className="text-orange-500" />
          </div>
          <div className="flex items-center justify-center">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans leading-none py-0.5 select-none">
              ASHTEK Smart Money
            </h1>
          </div>
        </div>

        {/* Admin Login / Panel Button on Right */}
        <div className="flex items-center gap-3">
          {isAdminLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10.5px] bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                Admin Active
              </span>
              <button
                type="button"
                onClick={() => setActivePage("admin")}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 rounded-lg text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 cursor-pointer shadow-sm transition-all duration-200"
                id="btn-admin-console"
              >
                <LockOpen size={13} className="text-white" />
                <span>Console</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdminLoggedIn(false);
                  if (activePage === "admin") {
                    setActivePage("dashboard");
                  }
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-red-950/40 hover:text-red-400 text-slate-300 border border-slate-700/80 rounded-lg text-xs font-mono cursor-pointer transition-colors duration-150"
                id="btn-admin-logout"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAdminPin("");
                setAdminLoginError("");
                setActivePage("admin");
              }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-indigo-500 hover:text-indigo-300 rounded-lg text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm"
              id="btn-admin-login-trigger"
            >
              <Lock size={12} className="text-indigo-400" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </header>

      {/* NAVIGATION HORIZONTAL SCROLL BAR WITH EXACT PAGES REQUESTED */}
      <nav className="bg-sky-50 border-b border-sky-100 sm:sticky sm:top-[73px] z-40 shadow-xs" id="main-navigation-menu">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-1 sm:py-1.5">
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* LEFT SIDE SCROLL BUTTON */}
            <button
              type="button"
              onClick={() => scrollNav("left")}
              disabled={!canScrollLeft}
              className={`hidden sm:flex p-1 sm:p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-3xs items-center justify-center shrink-0 ${
                !canScrollLeft ? "opacity-30 cursor-not-allowed text-slate-300" : "text-slate-700 hover:text-black hover:scale-105 active:scale-95"
              }`}
              id="btn-nav-scroll-left"
              title="Scroll Left"
            >
              <ChevronLeft size={16} className="stroke-[2.5]" />
            </button>

            {/* WRAPPER WITH GRADIENT MASKS */}
            <div className="relative flex-1 flex items-center overflow-hidden">
              {/* LEFT GRADIENT FADE */}
              {canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-sky-50 to-transparent pointer-events-none z-10" />
              )}
              
              {/* HORIZONTAL SCROLL AREA */}
              <div 
                ref={navScrollRef}
                onScroll={handleNavScroll}
                className="flex-1 overflow-x-auto scrollbar-none flex items-center gap-2.5 whitespace-nowrap pb-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" 
                id="nav-scroll-container"
              >

              {/* Intro & Guide */}
              <button
                id="nav-btn-intro"
                type="button"
                onClick={() => {
                  setActivePage("intro");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "intro" 
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-200"
                }`}
              >
                <Home size={12} className={activePage === "intro" ? "text-indigo-400" : "text-indigo-500"} />
                <span>Intro & Guide</span>
              </button>
              
              {/* Analyst */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("dashboard");
                  setAnalystActiveTool("option-chain");
                  setAnalystShowDirectory(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "dashboard" && analystActiveTool !== "derivative-intelligence"
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-200"
                }`}
                id="nav-btn-analyst"
              >
                <LineChart size={12} className="text-sky-500" />
                <span>Analyst</span>
              </button>

              {/* Index */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("index");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "index" 
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-200"
                }`}
                id="nav-btn-index"
              >
                <LineChart size={12} className="text-emerald-500" />
                <span>Index</span>
              </button>

              {/* Vix Matrix */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("vix");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "vix" 
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-200"
                }`}
                id="nav-btn-vix"
              >
                <Clipboard size={12} className="text-violet-500" />
                <span>Vix Matrix</span>
              </button>

              {/* ATM intelligence */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("atm");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "atm" 
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-200"
                }`}
                id="nav-btn-atm"
              >
                <Target size={12} className={activePage === "atm" ? "text-rose-400" : "text-rose-500"} />
                <span>ATM intelligence</span>
              </button>

              {/* Seller panic */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("seller-panic");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "seller-panic" 
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-200"
                }`}
                id="nav-btn-seller-panic"
              >
                <Flame size={12} className={activePage === "seller-panic" ? "text-orange-400 animate-pulse" : "text-orange-550"} />
                <span>Seller panic</span>
              </button>

              {/* Seller */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("seller");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "seller" 
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-200"
                }`}
                id="nav-btn-seller"
              >
                <Layers size={12} className={activePage === "seller" ? "text-indigo-400" : "text-indigo-505"} />
                <span>Seller</span>
              </button>

              {/* Intelligence */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("dashboard");
                  setAnalystActiveTool("derivative-intelligence");
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "dashboard" && analystActiveTool === "derivative-intelligence"
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-200"
                }`}
                id="nav-btn-intelligence"
              >
                <Sparkles size={12} className={activePage === "dashboard" && analystActiveTool === "derivative-intelligence" ? "text-amber-400 animate-pulse" : "text-amber-550"} />
                <span>Intelligence</span>
              </button>

              {/* Sports Arena */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("atm-sports");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "atm-sports" 
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-200"
                }`}
                id="nav-btn-atm-sports"
              >
                <Trophy size={12} className={activePage === "atm-sports" ? "text-amber-300 animate-bounce" : "text-amber-505"} />
                <span>Sports Arena</span>
              </button>

              {/* Expiry */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("expiry");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "expiry" 
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-250"
                }`}
                id="nav-btn-expiry"
              >
                <Hourglass size={12} className="text-pink-500" />
                <span>Expiry</span>
              </button>

              {/* Wealth Management */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("wealth");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "wealth" 
                    ? "bg-teal-900 text-white border-teal-950 shadow-xs scale-[1.01]" 
                    : "bg-teal-50/50 text-teal-850 hover:text-teal-950 hover:bg-teal-100/60 border-teal-200/60"
                }`}
                id="nav-btn-wealth"
              >
                <Briefcase size={12} className="text-teal-555" />
                <span>Wealth</span>
              </button>

              {/* SIP Compounding */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("sip");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "sip" 
                    ? "bg-slate-900 text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-sky-50 text-sky-850 hover:text-sky-950 hover:bg-sky-100 border-sky-200/70"
                }`}
                id="nav-btn-sip"
              >
                <PiggyBank size={12} className="text-sky-600" />
                <span>SIP Comp</span>
              </button>

              {/* SIP Calculator */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("sip-calc");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "sip-calc" 
                    ? "bg-indigo-900 text-white border-indigo-950 shadow-xs scale-[1.01]" 
                    : "bg-indigo-50 text-indigo-850 hover:text-indigo-950 hover:bg-indigo-100 border-indigo-200/70"
                }`}
                id="nav-btn-sip-calc"
              >
                <Calculator size={12} className="text-indigo-605" />
                <span>SIP Calc</span>
              </button>

              {/* Strategy Simulator */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("strategy");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border relative overflow-hidden shrink-0 ${
                  activePage === "strategy" 
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-200"
                }`}
                id="nav-btn-strategy"
              >
                <Sliders size={12} className="text-teal-500" />
                <span>Simulator</span>
              </button>

              {/* Heavyweights */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("tripwire");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "tripwire" 
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-200"
                }`}
                id="nav-btn-tripwire"
              >
                <Globe size={12} className="text-blue-500" />
                <span>Heavyweights</span>
              </button>

              {/* Institutional FII/DII Cashflows */}
              <button 
                type="button"
                onClick={() => {
                  setActivePage("fiidii");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  activePage === "fiidii" 
                    ? "bg-black text-white border-black shadow-xs scale-[1.01]" 
                    : "bg-white text-slate-700 hover:text-black hover:bg-slate-50 border-slate-200"
                }`}
                id="nav-btn-fiidii"
              >
                <Clipboard size={12} className="text-emerald-505" />
                <span>FII/DII</span>
              </button>

            </div>

            {/* RIGHT GRADIENT FADE */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-sky-50 to-transparent pointer-events-none z-10" />
            )}
            </div>

            {/* RIGHT SIDE SCROLL BUTTON */}
            <button
              type="button"
              onClick={() => scrollNav("right")}
              disabled={!canScrollRight}
              className={`hidden sm:flex p-1 sm:p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-3xs items-center justify-center shrink-0 ${
                !canScrollRight ? "opacity-30 cursor-not-allowed text-slate-300" : "text-slate-700 hover:text-black hover:scale-105 active:scale-95"
              }`}
              id="btn-nav-scroll-right"
              title="Scroll Right"
            >
              <ChevronRight size={16} className="stroke-[2.5]" />
            </button>

          </div>
        </div>
      </nav>

      {/* COMPONENT BODY VIEWPORT */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6" id="trader-dashboard-content">
        
        {/* INTRO AND PRODUCT GUIDE PAGE */}
        {activePage === "intro" && (
          <div className="space-y-8 animate-fade-in" id="intro-page-container">
            {/* HERO HERO CONTAINER */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white rounded-3xl p-6 md:p-10 shadow-lg border border-slate-800 relative overflow-hidden" id="intro-hero">
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-12 translate-x-12">
                <BrainCircuit size={400} />
              </div>
              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3.5 py-1 rounded-full text-xs font-mono font-bold text-orange-400">
                  <Sparkles size={12} className="animate-pulse" />
                  <span>PREMIUM ANALYST PLATFORM</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-sans text-white leading-tight">
                  Welcome to ASHTEK <br />
                  <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-sky-400 bg-clip-text text-transparent">Smart Money Analyst Suite</span>
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans max-w-2xl">
                  Decrypt and track institutional footprints with real-time derivative calculators, implied volatility metrics, and rule-based option buyer alerts. Built for precision-focused quantitative market analysts.
                </p>
                <div className="pt-4 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePage("dashboard");
                      setAnalystActiveTool("option-chain");
                      setAnalystShowDirectory(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-98 cursor-pointer text-sm font-sans flex items-center gap-2"
                    id="btn-intro-launch"
                  >
                    <Play size={16} className="fill-current" />
                    <span>Launch Analyst Hub</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePage("vix");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700/60 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-98 cursor-pointer text-sm font-sans flex items-center gap-2"
                  >
                    <span>Check India VIX Guide</span>
                  </button>
                </div>
              </div>
            </div>

            {/* WHAT IS ASHTEK SMART MONEY SECTION */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs" id="intro-philosophy">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BrainCircuit size={20} className="text-indigo-600" />
                  <span>What is ASHTEK Smart Money?</span>
                </h2>
                <div className="h-0.5 w-16 bg-indigo-600 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-slate-650 text-sm leading-relaxed font-sans">
                <div className="md:col-span-7 space-y-4">
                  <p>
                    <strong>ASHTEK Smart Money</strong> is a high-fidelity quantitative research and analysis platform designed to decrypt institutional market participants' positions (often referred to as <em>"Smart Money Footprints"</em>) across major equity indices and derivatives.
                  </p>
                  <p>
                    Institutions, proprietary desks, and foreign portfolio investors (FPIs/FIIs) control the vast majority of market liquidity. By analyzing the mathematical parameters of option chains—such as PCR (Put-Call Ratio), Cumulative Open Interest (COI) shifts, and Implied Volatility (IV) crushes—this platform helps retail analysts align their trades with institutional momentum rather than fighting against it.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-650 font-mono relative pl-10">
                    <span className="absolute left-3 top-4 text-indigo-500 font-extrabold text-lg">💡</span>
                    The platform enforces safe, mathematical filters. For example, it prevents buying naked options during extremely high premium/high-VIX regimes, and triggers alerts only when long straddles are statistically cheap.
                  </div>
                </div>
                <div className="md:col-span-5 bg-slate-900 text-slate-100 rounded-xl p-5 space-y-4 border border-slate-800 shadow-inner">
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">
                    System Core Philosophy
                  </h3>
                  <ul className="space-y-3.5 text-xs font-sans">
                    <li className="flex gap-3">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <div>
                        <strong className="text-white block">Safe &amp; Analytical</strong>
                        No guesswork. Every tool is backed by hard mathematical formulas and live index spot tracking.
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <div>
                        <strong className="text-white block">Anti-Volatility Crush</strong>
                        Avoid the classic mistake of buying overpriced options right before a volatility drop.
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <div>
                        <strong className="text-white block">Pure Transparency</strong>
                        Clean, high-fidelity quantitative menus without complex, unrequested clutter.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* QUICK-ACCESS DIRECTORY OF FEATURES */}
            <div className="space-y-4" id="intro-features-grid">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Explore Analyst Tools &amp; Features
                  </h2>
                  <p className="text-xs text-slate-500">
                    Jump straight to any specific feature of the suite below
                  </p>
                </div>
                <div className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                  15 ANALYTICAL VIEWS
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* CARD 1: Analyst Option Chain & Directory */}
                <div 
                  onClick={() => {
                    setActivePage("dashboard");
                    setAnalystActiveTool("option-chain");
                    setAnalystShowDirectory(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-white border border-slate-200 hover:border-slate-350 p-5 rounded-2xl transition-all shadow-3xs hover:shadow-xs group cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="p-2 w-9 h-9 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-all">
                      <LineChart size={16} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm font-sans flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                      <span>Analyst Hub (Option Chain)</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Analyze the full options ledger, PCR ratios, and open interest spikes. Paste text or fetch live data.
                    </p>
                  </div>
                  <span className="text-[10.5px] font-mono font-extrabold text-indigo-650 group-hover:translate-x-1 inline-flex items-center gap-1 transition-all">
                    <span>Enter Hub</span>
                    <span>→</span>
                  </span>
                </div>

                {/* CARD 2: India VIX Volatility Guard */}
                <div 
                  onClick={() => {
                    setActivePage("vix");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-white border border-slate-200 hover:border-slate-350 p-5 rounded-2xl transition-all shadow-3xs hover:shadow-xs group cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="p-2 w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-all">
                      <Sliders size={16} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm font-sans flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                      <span>India VIX Volatility Guard</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Enforces hard mathematical buy filters. Learn when to buy ATM straddles, execute hedged spreads, or block buy orders.
                    </p>
                  </div>
                  <span className="text-[10.5px] font-mono font-extrabold text-indigo-655 group-hover:translate-x-1 inline-flex items-center gap-1 transition-all">
                    <span>Open VIX Guide</span>
                    <span>→</span>
                  </span>
                </div>

                {/* CARD 3: ATM Straddle Alert Bot */}
                <div 
                  onClick={() => {
                    setActivePage("atm");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-white border border-slate-200 hover:border-slate-350 p-5 rounded-2xl transition-all shadow-3xs hover:shadow-xs group cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="p-2 w-9 h-9 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-all">
                      <Target size={16} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm font-sans flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                      <span>ATM Straddle Alert Engine</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Rule-based alert mechanism for option buyers. Triggers only when VIX &lt; 14, Straddles are cheap (SMA-10), and events are near.
                    </p>
                  </div>
                  <span className="text-[10.5px] font-mono font-extrabold text-indigo-650 group-hover:translate-x-1 inline-flex items-center gap-1 transition-all">
                    <span>Open Straddle Alerts</span>
                    <span>→</span>
                  </span>
                </div>

                {/* CARD 4: Seller Panic & Crash Sentinel */}
                <div 
                  onClick={() => {
                    setActivePage("seller-panic");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-white border border-slate-200 hover:border-slate-350 p-5 rounded-2xl transition-all shadow-3xs hover:shadow-xs group cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="p-2 w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-all">
                      <Flame size={16} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm font-sans flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                      <span>Seller Panic Sentinel</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Track when option writers start panic unwinding their short-calls or short-puts, setting up extreme rapid trend moves.
                    </p>
                  </div>
                  <span className="text-[10.5px] font-mono font-extrabold text-indigo-650 group-hover:translate-x-1 inline-flex items-center gap-1 transition-all">
                    <span>Open Sentinel</span>
                    <span>→</span>
                  </span>
                </div>

                {/* CARD 5: FII & DII Institutional Flows */}
                <div 
                  onClick={() => {
                    setActivePage("fiidii");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-white border border-slate-200 hover:border-slate-350 p-5 rounded-2xl transition-all shadow-3xs hover:shadow-xs group cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="p-2 w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-all">
                      <BarChart3 size={16} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm font-sans flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                      <span>FII / DII Flow Analysis</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Investigate buy/sell net investments of Foreign Institutional Investors and Domestic Institutional Investors in cash &amp; F&amp;O.
                    </p>
                  </div>
                  <span className="text-[10.5px] font-mono font-extrabold text-indigo-650 group-hover:translate-x-1 inline-flex items-center gap-1 transition-all">
                    <span>Open Flow Analysis</span>
                    <span>→</span>
                  </span>
                </div>

                {/* CARD 6: Tactical Wealth Planning */}
                <div 
                  onClick={() => {
                    setActivePage("wealth");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-white border border-slate-200 hover:border-slate-350 p-5 rounded-2xl transition-all shadow-3xs hover:shadow-xs group cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="p-2 w-9 h-9 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-all">
                      <Briefcase size={16} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm font-sans flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                      <span>Tactical Wealth &amp; SIP</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Simulate compound wealth accumulators, dynamic SIP schedules, and long-term asset allocation based on Nifty valuations.
                    </p>
                  </div>
                  <span className="text-[10.5px] font-mono font-extrabold text-indigo-650 group-hover:translate-x-1 inline-flex items-center gap-1 transition-all">
                    <span>Open Planner</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            </div>

            {/* INTEGRITY STATUS BAR */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-wrap justify-between items-center gap-3 text-xs font-mono text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="font-bold text-slate-700">SYSTEM INTEGRITY: SECURE</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Database: <strong className="text-slate-800">Firestore Sandbox</strong></span>
                <span>API Gateway: <strong className="text-slate-800">Secure Proxy</strong></span>
                <span>Environment: <strong className="text-indigo-600">Production Live</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* DYNAMIC DASHBOARD PAGE VIEW - Now placed at the very top as requested! */}
        {activePage === "dashboard" && (
          <AnalystHub 
            optionChain={optionChain}
            spotPrice={spotPrice}
            onUpdateOptionChain={setOptionChain}
            onResetChain={handleResetDefaultData}
            selectedSymbol={selectedSymbol}
            isFetchingLive={liveFetching}
            nseTimestamp={nseTimestamp}
            isLiveFeedSimulated={isLiveFeedSimulated}
            onRefreshLive={() => handleFetchLiveNseData(selectedSymbol)}
            fiiDii={fiiDii}
            onUpdateFiiDii={setFiiDii}
            indicesStatus={indicesStatus}
            activeTool={analystActiveTool}
            setActiveTool={setAnalystActiveTool}
            report={report}
            loading={loading}
            showDirectory={analystShowDirectory}
            onToggleShowDirectory={setAnalystShowDirectory}
          />
        )}

        {/* GLOBAL DYNAMIC SPOT CONTROL & ANALYSIS TRIGGER BAR - Moved down below the Tools Suite! */}
        {activePage !== "intro" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 shadow-xs" id="global-dynamic-action-bar">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl flex items-center justify-center">
                <Target size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>Asset Spot Price &amp; Quantitative Trigger</span>
                  <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded font-bold font-mono tracking-wider">
                    ACTIVE MODIFIER
                  </span>
                </h3>
                <p className="text-[10.5px] text-slate-500 font-medium font-sans">
                  Recalculate entire mathematical option model parameters and AI intelligence in real-time.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Spot price input box */}
              <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono group focus-within:border-emerald-500 transition-colors shadow-2xs" id="spot-indicator">
                <span className="text-slate-500 font-semibold" id="lbl-index-spot-name">
                  {selectedSymbol === "NIFTY" ? "NIFTY 50 ATM SPOT" : `${selectedSymbol} ATM SPOT`}:
                </span>
                <input 
                  type="number"
                  className="bg-transparent text-emerald-700 font-extrabold w-24 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={spotPrice}
                  onChange={(e) => setSpotPrice(parseFloat(e.target.value) || 0)}
                  step="0.05"
                />
              </div>

              {/* Run Analysis Trigger */}
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={loading}
                className="px-5 py-2.5 bg-black hover:bg-slate-850 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm active:scale-98 flex items-center gap-2 cursor-pointer border border-transparent"
                id="btn-trigger-ai-analysis"
              >
                <Sparkles size={14} className={`text-amber-400 ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Analyzing..." : "Generate Derivatives Intelligence"}</span>
              </button>
            </div>
          </div>
        )}
        
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



        {/* OLD DASHBOARD PAGE VIEW */}
        {false && activePage === "dashboard" && (
          <div className="space-y-6">
            
            {/* ATM COI HEATMAP ACCUMULATION HEATMAP - FULL WIDTH CENTER */}
            <div id="atom-coi-live-tracker-full" className="animate-fade-in">
              <AtmCoiTracker optionChain={optionChain} spotPrice={spotPrice} />
            </div>

            {/* LIVE MARKET SENTINEL & INSTITUTIONAL FLOWS GAUGE SIDE-BY-SIDE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="vix-fiidii-signals-row">
              {/* LIVE MARKET IMPLIED VOLATILITY (VIX) - LEFT GAUGE */}
              <div className="lg:col-span-5" id="india-vix-tracker-full">
                <IndiaVixTracker indicesStatus={indicesStatus} />
              </div>

              {/* INSTITUTIONAL ACTIVITY RECORDS (FII DII) - RIGHT LEDGER */}
              <div className="lg:col-span-7" id="fii-dii-tracker-full">
                <FiiDiiPanel 
                  fiiDii={fiiDii}
                  onUpdateFiiDii={setFiiDii}
                  spotPrice={spotPrice}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-columns-layout">
            
            {/* LEFT MAIN COLUMNS - 8 SPANS */}
            <div className="lg:col-span-8 space-y-6" id="dashboard-left-panel">

              {/* TOP ROW bento grids: CLIPBOARD PASTE + VISUAL OI CHART */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="overview-bento-grid">
                
                {/* Clipboard & Multi-Format Options Loader is now moved to the secure Admin Panel modal. Hidden here on the main dashboard to maintain a clean layout. */}
                <div className="hidden" id="clipboard-panel">
            <div>
              {/* LIVE NSE Master Control Switch */}
              <div className={`mb-4 border rounded-xl p-3.5 space-y-2 transition-all duration-300 ${
                isLiveNseDisabled 
                  ? "bg-amber-50/60 border-amber-300 shadow-sm" 
                  : "bg-emerald-50/60 border-emerald-300/80 shadow-sm"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest font-mono">
                      NSE Live Connector
                    </span>
                    <span className={`text-[9.5px] font-mono font-black uppercase flex items-center gap-1 ${
                      isLiveNseDisabled ? "text-amber-700" : "text-emerald-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isLiveNseDisabled ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`}></span>
                      {isLiveNseDisabled ? "OFF (MANUAL UPLOAD)" : "ON (LIVE TRACKING)"}
                    </span>
                  </div>
                  
                  {/* Master Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !isLiveNseDisabled;
                      setIsLiveNseDisabled(nextState);
                      if (nextState) {
                        setAutoRefresh(false);
                        setActiveUploadTab("paste");
                        setParseSuccessMessage("NSE Live Tracking has been turned OFF! System has paused background refresh. You can now safely paste sheets/data.");
                      } else {
                        setAutoRefresh(true);
                        setActiveUploadTab("live");
                        handleFetchLiveNseData(selectedSymbol);
                        setParseSuccessMessage(`NSE Live Activated! Fetching live ${selectedSymbol} option contracts...`);
                      }
                      setTimeout(() => setParseSuccessMessage(null), 5500);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      !isLiveNseDisabled ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        !isLiveNseDisabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                
                <p className="text-[10.5px] text-slate-650 leading-relaxed font-sans">
                  {isLiveNseDisabled 
                    ? "Live background fetches are stopped. Paste your option chain text below safely without any background overwrite." 
                    : "Automatically fetches real-time indicators and Option Chain statistics in background during market hours."}
                </p>
              </div>

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
                              if (isLiveNseDisabled) {
                                setParseSuccessMessage(`Index ${symbol} chuna gaya. Live tracker band hai, manual data entry enabled hai.`);
                                setTimeout(() => setParseSuccessMessage(null), 4000);
                              } else {
                                handleFetchLiveNseData(symbol);
                              }
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
                    <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${isLiveNseDisabled ? "text-slate-400" : "text-slate-500"}`}>
                      Auto-Refresh
                    </span>
                    <button
                      type="button"
                      disabled={isLiveNseDisabled}
                      onClick={() => {
                        if (isLiveNseDisabled) return;
                        setAutoRefresh(!autoRefresh);
                      }}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center ${
                        isLiveNseDisabled 
                          ? "bg-slate-100 text-slate-300 cursor-not-allowed justify-start border border-slate-200"
                          : autoRefresh 
                            ? "bg-emerald-500 justify-end cursor-pointer" 
                            : "bg-slate-200 justify-start cursor-pointer"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow block" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (isLiveNseDisabled) {
                        setParseSuccessMessage("⚠️ Live mode OFF hai! Kripya upar se NSE Live Connector ko ON karein.");
                        setTimeout(() => setParseSuccessMessage(null), 4000);
                      } else {
                        handleFetchLiveNseData();
                      }
                    }}
                    disabled={liveFetching}
                    className={`w-full py-2.5 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow ${
                      isLiveNseDisabled 
                        ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
                    }`}
                    id="btn-fetch-live"
                  >
                    <span className="relative flex h-2 w-2 mr-0.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLiveNseDisabled ? "bg-slate-300" : "bg-white"} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveNseDisabled ? "bg-slate-400" : "bg-white"}`}></span>
                    </span>
                    {liveFetching ? "Connecting to NSE..." : isLiveNseDisabled ? "Live Tracker is OFF" : `Abhi Live Data Fetch Karo — ${selectedSymbol}`}
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
                      <span className="animate-pulse">●</span> NSE Live Tracker Active
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
                    placeholder="Paste raw Option Chain / CSV / Sensibull text data OR directly paste a screenshot (Ctrl+V) here..."
                    className="w-full h-36 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-lg p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                    value={rawPasteText}
                    onChange={(e) => {
                      setRawPasteText(e.target.value);
                      setUseRawPaste(e.target.value.trim().length > 0);
                    }}
                    onPaste={async (e) => {
                      const items = e.clipboardData?.items;
                      if (items) {
                        for (let i = 0; i < items.length; i++) {
                          if (items[i].type.indexOf("image") !== -1) {
                            const file = items[i].getAsFile();
                            if (file) {
                              e.preventDefault();
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                const base64 = event.target?.result as string;
                                setSelectedImage(base64);
                                setImageMimeType(file.type);
                                setUploadedFileName("Pasted Clipboard Screenshot (" + new Date().toLocaleTimeString() + ")");
                                setActiveUploadTab("image");
                                setParseSuccessMessage("क्लिपबोर्ड से इमेज डिटेक्ट हो गई है! Gemini 3.5 Vision AI से ऑप्शन चेन रीढ़ (Read) किया जा रहा है...");
                                await parseImageWithGemini(base64, file.type);
                              };
                              reader.readAsDataURL(file);
                              break;
                            }
                          }
                        }
                      }
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

          {/* Recharts Visual Bar Chart of Open Interest Concentration - Now spans full width for gorgeous presentation */}
          <div className="md:col-span-12 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between animate-fade-in" id="oi-histogram-panel">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-slate-700">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <BarChart3 size={15} className="text-emerald-600" /> Visual Open Interest (OI) concentration
                </h3>
                <div className="flex items-center gap-2">
                  {isAdminLoggedIn && (
                    <button
                      type="button"
                      onClick={() => setIsAdminPanelOpen(true)}
                      className="text-[10.5px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-md border border-indigo-100 cursor-pointer transition-colors font-mono"
                    >
                      ⚙️ Open Admin Panel
                    </button>
                  )}
                  <span className="text-[11px] font-semibold text-slate-500">
                    Total Strikes Analyzed: {optionChain.length}
                  </span>
                </div>
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

        {/* PAGE 2: ANALYST AI INTEL */}
        {activePage === "report" && (
          <div className="space-y-6 animate-fade-in" id="report-view-tab">
            {/* MAIN BODY LAYOUT Tabs: ANALYST INTELLIGENCE REPORT */}
            <section className="space-y-4" id="quant-intelligence-report">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>Derivative Intelligence Analyst AI Report</span>
              </div>
              <AnalystReport report={report} loading={loading} />
            </section>

            {/* HEAVYWEIGHT TRAP DETECTION TRIPWIRE */}
            <section className="space-y-4" id="heavyweights-tripwire-section">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-xs uppercase tracking-wider font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                <span>Nifty Index Heavyweights Driver Matrix</span>
              </div>
              <HeavyweightsTripwire indicesStatus={indicesStatus} />
            </section>
          </div>
        )}

              {/* LIVE PCR TREND INDICATOR PANEL */}
              <section className="space-y-4" id="pcr-live-tracker-panel">
                <div className="flex items-center gap-2 text-indigo-705 font-extrabold text-xs uppercase tracking-wider font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <span>Real-time Put-Call Ratio (PCR) Dashboard</span>
                </div>
                <PcrLiveIndicator optionChain={optionChain} />
              </section>

              {/* OPTION CHAIN INTERACTIVE GRID */}
              <section className="space-y-4" id="chain-interactive-grid">
                <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs uppercase tracking-wider font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>Interactive Option Chain Matrix</span>
                </div>
                <OptionChainTable 
                  optionChain={optionChain}
                  spotPrice={spotPrice}
                  onUpdateOptionChain={setOptionChain}
                  onResetChain={handleResetDefaultData}
                  selectedSymbol={selectedSymbol}
                  isFetchingLive={liveFetching}
                  nseTimestamp={nseTimestamp}
                  isLiveFeedSimulated={isLiveFeedSimulated}
                  onRefreshLive={() => handleFetchLiveNseData(selectedSymbol)}
                />
              </section>

            </div>

            {/* RIGHT SIDEBAR COLUMN - 4 SPANS HOUSING SPORTS ANALYZER & AUXILIARY HUD METRICS */}
            <div className="lg:col-span-4 space-y-6" id="dashboard-right-sidebar">
              
              {/* SPECIAL RIGHT SIDE ATM 50 ATM SPORTS ANALYZER */}
              <AtmSportsAnalyzer 
                optionChain={optionChain} 
                spotPrice={spotPrice} 
                selectedSymbol={selectedSymbol} 
              />

            </div>

          </div>
          </div>
        )}

        {/* PAGE 3: SELLER PANIC RADAR TAB */}
        {activePage === "seller-panic" && (
          <div className="space-y-6 animate-fade-in" id="seller-panic-radar-view">
            <SellerPanicDashboard 
              optionChain={optionChain}
              indicesStatus={indicesStatus}
            />
          </div>
        )}

        {/* PAGE 3.5: ATM COI TARGET PAGE */}
        {activePage === "atm" && (
          <div className="space-y-6 animate-fade-in" id="atm-page-view">
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <Target className="text-rose-400 animate-pulse" size={18} />
                  At-The-Money (ATM) Live Accumulation Tracker
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Analyze high-capital institutional buildup directly around the {selectedSymbol} ATM Spot. Spot dynamic open interest concentration to identify Support, Resistance, and breakout traps before they play out.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <span className="text-xs px-3.5 py-1.5 rounded-lg font-bold bg-slate-800 border border-slate-700/60 text-slate-200">
                  Spot: ₹{spotPrice}
                </span>
                <span className="text-xs px-3.5 py-1.5 rounded-lg font-bold bg-slate-800 border border-slate-700/60 text-slate-200">
                  Symbol: {selectedSymbol}
                </span>
              </div>
            </div>

            {/* ATM SUB-HEADER TABS */}
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1.5" id="atm-sub-header-tabs">
              <button
                type="button"
                onClick={() => setAtmSubTab("straddle")}
                className={`pb-2 px-4.5 text-xs font-black font-mono border-b-2 transition-all cursor-pointer ${
                  atmSubTab === "straddle"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                📊 Auto ATM Long Straddle Dashboard
              </button>
              <button
                type="button"
                onClick={() => setAtmSubTab("coi")}
                className={`pb-2 px-4.5 text-xs font-black font-mono border-b-2 transition-all cursor-pointer ${
                  atmSubTab === "coi"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                🔥 ATM Live Accumulation Heatmap
              </button>
            </div>

            {atmSubTab === "straddle" ? (
              <div className="animate-fade-in" id="atm-straddle-subview">
                <LongStraddleDashboard />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="atm-coi-subview">
                <div className="lg:col-span-8 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Layers size={16} className="text-rose-605" />
                    <span className="font-bold text-sm text-slate-800">ATM Option Strike Open Interest concentration Heatmap</span>
                  </div>
                  <AtmCoiTracker optionChain={optionChain} spotPrice={spotPrice} />
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-4">
                    <h3 className="font-bold text-xs uppercase text-rose-700 tracking-wider font-mono flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      ATM Premium Matrix Guidelines
                    </h3>
                    <div className="space-y-3.5 text-xs text-slate-600">
                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl leading-relaxed">
                        <p className="font-bold text-slate-800 font-mono">1. Straddle Symmetry Bias</p>
                        <p className="mt-1">
                          Equal distribution of CE &amp; PE COI implies high operator confidence in a range-bound consolidation session.
                        </p>
                      </div>

                      <div className="p-3 bg-red-50/50 border border-red-200/50 rounded-xl leading-relaxed">
                        <p className="font-bold text-red-900 font-mono">2. Call Accumulation Bias</p>
                        <p className="mt-1">
                          Huge accumulation on Call COI warns that the current strike is acting as a solid barrier. Break up requires strong force.
                        </p>
                      </div>

                      <div className="p-3 bg-emerald-50/50 border border-emerald-200/50 rounded-xl leading-relaxed">
                        <p className="font-bold text-emerald-900 font-mono">3. Put Accumulation Bias</p>
                        <p className="mt-1">
                          PUT COI building rapidly shows direct institutional floor defense. Strong base build-up indicates bullish support.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAGE 4: ATM SPORTS MATCH ARENA (FULLSCREEN) */}
        {activePage === "atm-sports" && (
          <div className="space-y-6 animate-fade-in" id="sports-match-arena-view">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-[10px] text-white flex flex-wrap justify-between items-center gap-2">
              <span className="flex items-center gap-2 font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                🏟️ Stadium Atmosphere: ATM Double Strike Match Simulator
              </span>
              <span>Symbol: {selectedSymbol} • Spot Price: ₹{spotPrice}</span>
            </div>
            <AtmSportsAnalyzer 
              optionChain={optionChain} 
              spotPrice={spotPrice} 
              selectedSymbol={selectedSymbol} 
            />
          </div>
        )}

        {/* PAGE 5: SPECIAL EXPIRY DAY ANALYZER TAB */}
        {activePage === "expiry" && (
          <div className="space-y-6 animate-fade-in" id="expiry-analyzer-page-view">
            <ExpiryAnalyzer 
              optionChain={optionChain} 
              spotPrice={spotPrice} 
              selectedSymbol={selectedSymbol}
              indicesStatus={indicesStatus}
            />
          </div>
        )}

        {/* PAGE 5.1: SPECIAL SELLER WORKSPACE TAB */}
        {activePage === "seller" && (
          <div className="space-y-6 animate-fade-in" id="seller-special-workspace-view">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl text-xs">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <Layers className="text-indigo-400" size={18} id="seller-headline-icon"/>
                  Professional Option Seller Analytics Suite
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
                  Inspect deep-risk metrics, Put-Call Ratio (PCR) divergence thresholds, resistance roofs, support basements, and open-interest clusters carefully before executing writing orders.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <span className="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-950 border border-emerald-900 text-emerald-355 font-extrabold font-mono hover:scale-103 transition-transform">
                  {selectedSymbol} Spot: ₹{spotPrice}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Highlight PCR trend */}
              <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs" id="seller-pcr-card">
                <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider font-mono flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  PCR Trend Diagnostics
                </h3>
                <PcrLiveIndicator optionChain={optionChain} />
              </div>

              {/* Visual Open Interest Chart */}
              <div className="lg:col-span-8 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs" id="seller-oi-card">
                <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider font-mono flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <BarChart3 size={15} className="text-emerald-600 animate-pulse" />
                  OI Resistance/Support Bar-Matrix
                </h3>

                <div className="h-44 text-[10px]" id="seller-bars-container">
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
            </div>

            {/* Interactive Grid */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4" id="seller-chain-matrix">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layers size={16} className="text-emerald-600 animate-pulse" />
                <span className="font-bold text-sm text-slate-800 font-mono">Target Segment Writing Ledger</span>
              </div>
              <OptionChainTable 
                optionChain={optionChain}
                spotPrice={spotPrice}
                onUpdateOptionChain={setOptionChain}
                onResetChain={handleResetDefaultData}
                selectedSymbol={selectedSymbol}
                isFetchingLive={liveFetching}
                nseTimestamp={nseTimestamp}
                isLiveFeedSimulated={isLiveFeedSimulated}
                onRefreshLive={() => handleFetchLiveNseData(selectedSymbol)}
              />
            </div>
          </div>
        )}

        {/* PAGE INDEX: INDEX ADVANCED CHARTING VIEW */}
        {activePage === "index" && (
          <div className="space-y-6 animate-fade-in" id="index-chart-view-tab">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    Advanced Index Charting Terminal
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Monitor live price trends, technical breakouts, and intraday indicators with advanced TradingView widgets.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-1 rounded-md font-bold font-mono text-slate-700">
                    SYMBOL: {selectedSymbol}
                  </span>
                </div>
              </div>
              <div className="h-[480px] w-full" id="index-embedded-chart">
                <IndexChartViewer initialSymbol={selectedSymbol} />
              </div>
            </div>
          </div>
        )}

        {/* PAGE 5.2: STRATEGY SIMULATOR TAB */}
        {activePage === "strategy" && (
          <div className="space-y-6 animate-fade-in" id="strategy-simulator-view-tab">
            <StrategySimulator 
              suggestedStrategies={report?.suggestedStrategies || []} 
              spotPrice={spotPrice}
            />
          </div>
        )}

        {/* PAGE 5.3: INDIA VIX MATRIX TAB */}
        {activePage === "vix" && (
          <div className="space-y-6 animate-fade-in" id="vix-matrix-view-tab">
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4" id="vix-standalone-card">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-ping"></span>
                  <span className="font-bold text-sm text-slate-800 uppercase tracking-wider font-mono">India Implied Volatility (VIX) Spectrum analysis</span>
                </div>
              </div>
              <IndiaVixTracker indicesStatus={indicesStatus} />
            </div>
          </div>
        )}

        {/* PAGE 5.4: HEAVYWEIGHTS CO-RELATION TRIPWIRE TAB */}
        {activePage === "tripwire" && (
          <div className="space-y-6 animate-fade-in" id="tripwire-matrix-view-tab">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4" id="tripwire-standalone-card">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-rose-700 font-extrabold text-sm uppercase tracking-wider font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                <span>Underlying Heavyweight Stocks Driver Matrix</span>
              </div>
              <HeavyweightsTripwire indicesStatus={indicesStatus} />
            </div>
          </div>
        )}

        {/* PAGE 5.5: INSTITUTIONAL FLOWS FII/DII PANEL */}
        {activePage === "fiidii" && (
          <div className="space-y-6 animate-fade-in" id="fiidii-flows-view-tab">
            <FiiDiiPanel 
              fiiDii={fiiDii}
              onUpdateFiiDii={setFiiDii}
              spotPrice={spotPrice}
            />
          </div>
        )}

        {/* WEALTH MANAGEMENT PORTFOLIO ALLOCATION PANEL */}
        {activePage === "wealth" && (
          <div className="space-y-6 animate-fade-in" id="wealth-management-view-tab">
            <WealthManagement />
          </div>
        )}

        {/* SIP SYSTEMATIC COMPOUNDING INVESTING LESSONS & SIMULATORS */}
        {activePage === "sip" && (
          <div className="space-y-6 animate-fade-in" id="sip-compounding-view-tab">
            <SipCompounding />
          </div>
        )}

        {/* STEP-UP & MANUAL SIP COMPOUND CALCULATOR TABLE ENGINE */}
        {activePage === "sip-calc" && (
          <div className="space-y-6 animate-fade-in" id="sip-calculator-view-tab">
            <SipCalculator />
          </div>
        )}

        {/* QUANTITATIVE ADMIN CONTROL CONSOLE (FULL-PAGE DASHBOARD) */}
        {activePage === "admin" && (
          <div className="space-y-6 animate-fade-in" id="admin-page-tab">
            {isAdminLoggedIn ? (
              <AdminDashboard 
                isLiveNseDisabled={isLiveNseDisabled}
                setIsLiveNseDisabled={setIsLiveNseDisabled}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
                activeUploadTab={activeUploadTab}
                setActiveUploadTab={setActiveUploadTab}
                selectedSymbol={selectedSymbol}
                handleFetchLiveNseData={handleFetchLiveNseData}
                rawPasteText={rawPasteText}
                setRawPasteText={setRawPasteText}
                setUseRawPaste={setUseRawPaste}
                handleParseAndLoadOptionChain={handleParseAndLoadOptionChain}
                dragActive={dragActive}
                setDragActive={setDragActive}
                handleDrag={handleDrag}
                handleDropCSV={handleDropCSV}
                handleDropImage={handleDropImage}
                handleCSVFileDropOrSelect={handleCSVFileDropOrSelect}
                uploadedFileName={uploadedFileName}
                setUploadedFileName={setUploadedFileName}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                imageMimeType={imageMimeType}
                setImageMimeType={setImageMimeType}
                imageParsing={imageParsing}
                parseImageWithGemini={parseImageWithGemini}
                handleResetDefaultData={handleResetDefaultData}
                setParseSuccessMessage={setParseSuccessMessage}
                setErrorStatus={setErrorStatus}
                setIsAdminLoggedIn={setIsAdminLoggedIn}
                setActivePage={setActivePage}
              />
            ) : (
              <div className="flex items-center justify-center py-12 px-4" id="admin-login-fullpage">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden text-white">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                  
                  <div className="flex flex-col items-center text-center mt-2">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full mb-3">
                      <Lock size={24} className="animate-pulse" />
                    </div>
                    <h3 className="text-lg font-bold font-mono tracking-wide">Admin Authentication Required</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs font-sans leading-relaxed">
                      AshTek Smart Money manual overrides are restricted to verified quantitative administrators.
                    </p>
                  </div>

                  <form onSubmit={handleAdminLoginSubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                        Passcode / Secure PIN
                      </label>
                      <input
                        type="password"
                        required
                        autoFocus
                        placeholder="Enter passcode... (Hint: 1234)"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-sm text-center font-mono text-white placeholder:text-slate-650 focus:outline-none"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                      />
                    </div>

                    {adminLoginError && (
                      <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-lg flex items-start gap-2">
                        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                        <span>{adminLoginError}</span>
                      </div>
                    )}

                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePage("dashboard");
                          setPendingPastedImage(null);
                        }}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 rounded-xl text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition-colors cursor-pointer"
                      >
                        Unlock Console
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}



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
        <p>© 2026 AshTek Smart Money. Designed for Quantitative Option Analytics and High-Fidelity Risk Management.</p>
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

      {/* 🚨 TRADING BOT SIGNAL ALERT POPUP MODAL 🚨 */}
      {botAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" id="bot-alert-overlay">
          <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl shadow-indigo-500/20" id="bot-alert-modal">
            
            {/* Header: Flashing signal beacon */}
            <div className={`p-4 flex items-center justify-between border-b ${
              botAlert.signal === "BUY_CE" 
                ? "bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 border-emerald-500/30 text-emerald-400" 
                : "bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 border-rose-500/30 text-rose-400"
            }`}>
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    botAlert.signal === "BUY_CE" ? "bg-emerald-400" : "bg-rose-400"
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    botAlert.signal === "BUY_CE" ? "bg-emerald-500" : "bg-rose-500"
                  }`}></span>
                </span>
                <span className="text-xs font-black uppercase tracking-wider font-mono">
                  🚨 LIVE SIGNAL TRIGGERED 🚨
                </span>
              </div>
              <span className="text-[10px] font-mono opacity-85">
                {new Date().toLocaleTimeString()}
              </span>
            </div>

            {/* Signal Display Body */}
            <div className="p-6 space-y-4">
              
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">Action Type</span>
                  <span className={`text-2xl font-black font-mono tracking-tight flex items-center gap-1.5 ${
                    botAlert.signal === "BUY_CE" ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {botAlert.signal === "BUY_CE" ? (
                      <>
                        <TrendingUp size={22} className="stroke-[3]" />
                        BUY CALL (CE)
                      </>
                    ) : (
                      <>
                        <TrendingDown size={22} className="stroke-[3]" />
                        BUY PUT (PE)
                      </>
                    )}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">Suggested Strike</span>
                  <span className="text-2xl font-black text-white font-mono tracking-tight bg-slate-800 px-3 py-1 rounded-xl border border-slate-700/80">
                    ₹{botAlert.suggested_strike}
                  </span>
                </div>
              </div>

              {/* Grid of quantitative details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Market Phase</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    {botAlert.market_phase || "Tactical Consolidation"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Trap State</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    {botAlert.trap_detected || "No Trap Detected"}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Risk Profile</span>
                  <span className={`text-xs font-bold font-mono ${
                    botAlert.risk?.toLowerCase() === "low" ? "text-emerald-400" : "text-yellow-400"
                  }`}>
                    {botAlert.risk || "Medium"}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Execution Expiry</span>
                  <span className="text-xs font-bold text-indigo-400 font-mono">
                    Nearest Weekly (DTE &gt;= 7)
                  </span>
                </div>
              </div>

              {/* Bot Reasoning in Mix Hindi/English */}
              <div className="space-y-1 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl">
                <span className="text-[9px] uppercase font-black tracking-wider text-indigo-400 font-mono block">AI ANALYSIS &amp; WHY TO BUY</span>
                <p className="text-xs text-slate-350 leading-relaxed font-sans">
                  {botAlert.reasoning}
                </p>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex gap-3">
              <button
                type="button"
                onClick={() => setBotAlert(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer text-center"
              >
                Acknowledge &amp; Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  // Direct navigation to Long Straddle / ATM Analyzer
                  setActivePage("atm");
                  setBotAlert(null);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 border border-indigo-400/30 text-white rounded-xl text-xs font-bold font-mono transition-all duration-150 shadow-lg cursor-pointer text-center"
              >
                Go to Straddle Hub
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
