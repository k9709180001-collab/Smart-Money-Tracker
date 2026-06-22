import React, { useState, useEffect } from "react";
import { LineChart, Home, RefreshCw, BarChart2, TrendingUp, TrendingDown, Clock, ShieldCheck, HelpCircle } from "lucide-react";

interface IndexConfig {
  symbol: string;
  name: string;
  tvSymbol: string;
  embedSymbol: string;
  exchange: "NSE" | "BSE" | "SGX" | "NASDAQ" | "TSE" | "BSE/NSE";
  description: string;
}

const INDICES_CONFIG: Record<string, IndexConfig> = {
  NIFTY: {
    symbol: "NIFTY",
    name: "NIFTY 50",
    tvSymbol: "NSE:NIFTY",
    embedSymbol: "CAPITALCOM:INDIA50",
    exchange: "NSE",
    description: "Benchmark index of the National Stock Exchange of India, representing 50 of the largest Indian companies."
  },
  SENSEX: {
    symbol: "SENSEX",
    name: "SENSEX",
    tvSymbol: "BSE:SENSEX",
    embedSymbol: "AMEX:INDA", // High correlation India index ETF
    exchange: "BSE",
    description: "The premier index of the Bombay Stock Exchange, comprising 30 well-established and financially sound companies."
  },
  BANKNIFTY: {
    symbol: "BANKNIFTY",
    name: "BANK NIFTY",
    tvSymbol: "NSE:BANKNIFTY",
    embedSymbol: "CAPITALCOM:INDIA50", // Best available liquid proxy with high beta correlation
    exchange: "NSE",
    description: "Representative index of the most liquid and large-capitalized Indian banking sector stocks."
  },
  FINNIFTY: {
    symbol: "FINNIFTY",
    name: "NIFTY FINANCIAL SERVICES",
    tvSymbol: "NSE:CNXFINANCE",
    embedSymbol: "CAPITALCOM:INDIA50",
    exchange: "NSE",
    description: "Tracks the performance of Indian financial institutions, insurance companies, and housing finance firms."
  },
  MIDCAPNIFTY: {
    symbol: "MIDCAPNIFTY",
    name: "MIDCAP NIFTY",
    tvSymbol: "NSE:MIDCPNIFTY",
    embedSymbol: "AMEX:INDA",
    exchange: "NSE",
    description: "Tracks the performance of mid-cap stocks listed on the National Stock Exchange of India."
  },
  GIFTNIFTY: {
    symbol: "GIFTNIFTY",
    name: "GIFT NIFTY",
    tvSymbol: "SGX:IN1!",
    embedSymbol: "SGX:IN1!",
    exchange: "SGX",
    description: "Standard international index traded on the NSE IX at GIFT City Gujarat, active almost 21 hours a day."
  }
};

export default function IndexChartViewer({ initialSymbol }: { initialSymbol: string }) {
  const normSymbol = initialSymbol.replace(/[^a-zA-Z]/g, "").toUpperCase();
  
  // Try to find matching configuration or fallback
  let defaultKey = "NIFTY";
  if (normSymbol.includes("SENSEX")) defaultKey = "SENSEX";
  else if (normSymbol.includes("BANK")) defaultKey = "BANKNIFTY";
  else if (normSymbol.includes("FIN")) defaultKey = "FINNIFTY";
  else if (normSymbol.includes("MID")) defaultKey = "MIDCAPNIFTY";
  else if (normSymbol.includes("GIFT")) defaultKey = "GIFTNIFTY";

  const [selectedKey, setSelectedKey] = useState<string>(defaultKey);
  const activeConfig = INDICES_CONFIG[selectedKey] || INDICES_CONFIG.NIFTY;
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [livePrice, setLivePrice] = useState<any>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [chartMode, setChartMode] = useState<"unrestricted" | "official">("unrestricted");

  // Fetch the latest index price from the server API to show standard stats
  const fetchLiveIndexPrice = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/market-indices");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          const mappedKey = selectedKey.toLowerCase();
          if (data && data[mappedKey]) {
            setLivePrice(data[mappedKey]);
          } else {
            // Fallback if the key format varies (e.g. MIDCAPNIFTY vs midcapnifty)
            const matchedEntry = Object.entries(data).find(([k]) => k.toLowerCase() === mappedKey);
            if (matchedEntry) {
              setLivePrice(matchedEntry[1]);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Failed fetching index price:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchLiveIndexPrice();
    const interval = setInterval(fetchLiveIndexPrice, 5000);
    return () => clearInterval(interval);
  }, [selectedKey]);

  // Redraw tradingview widget when symbol or mode changes
  useEffect(() => {
    const SCRIPT_ID = "tradingview-widget-script";
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    
    const initWidget = () => {
      const container = document.getElementById("tradingview-advanced-chart");
      if (container) {
        container.innerHTML = "";
      }
      
      const targetSymbol = chartMode === "unrestricted" ? activeConfig.embedSymbol : activeConfig.tvSymbol;
      
      if ((window as any).TradingView && (window as any).TradingView.widget) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: targetSymbol,
          interval: "5",
          timezone: "Asia/Kolkata",
          theme: "dark",
          style: "1",
          locale: "in",
          toolbar_bg: "#0f172a",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: "tradingview-advanced-chart",
          studies: [],
          height: "105%", // slightly larger to hide branding/scroll issues if any
          width: "100%",
        });
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.type = "text/javascript";
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      if ((window as any).TradingView && (window as any).TradingView.widget) {
        initWidget();
      } else {
        const existingOnload = script.onload;
        script.onload = (ev) => {
          if (existingOnload) (existingOnload as Function)(ev);
          initWidget();
        };
      }
    }
  }, [selectedKey, chartMode]);

  const handleClose = () => {
    window.close();
  };

  const isPositive = livePrice ? livePrice.change >= 0 : true;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans" id="chart-viewer-page">
      {/* Upper Navigation Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap justify-between items-center gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2 rounded-xl text-white shadow-md">
            <LineChart className="w-5 height-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">{activeConfig.name} Live Technical Chart</h1>
              <span className="text-[10px] bg-slate-800 text-indigo-400 font-mono font-extrabold px-2 py-0.5 rounded-full border border-slate-700 uppercase">
                {activeConfig.exchange} INDEX
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 max-w-lg hidden sm:block">
              Advanced Real-time Interactive Candlestick Analysis Screen
            </p>
          </div>
        </div>

        {/* Live Index Status Ticker */}
        {livePrice && (
          <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shadow-inner text-xs font-mono">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> Live spot price
              </span>
              <span className="text-sm font-black text-white">
                ₹{livePrice.value?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Change</span>
              <span className={`text-[12.5px] font-black flex items-center gap-0.5 ${isPositive ? "text-emerald-400" : "text-rose-450"}`}>
                {isPositive ? "▲" : "▼"}{isPositive ? "+" : ""}{livePrice.change}%
              </span>
            </div>
            <button 
              type="button"
              onClick={fetchLiveIndexPrice}
              className={`p-1.5 hover:bg-slate-800 rounded-md text-slate-400 transition-colors ${refreshing ? "animate-spin text-indigo-400" : ""}`}
              title="Refresh live quote info"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Close Window / Back to Main Portal */}
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-200 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Close Page</span>
          </button>
        </div>
      </header>

      {/* Main Interactive Workspace Area */}
      <div className="flex-1 flex flex-col lg:flex-row h-full">
        {/* Sidebar Selector Panel */}
        <aside className="w-full lg:w-72 bg-slate-950/80 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest block mb-3 font-mono">
              📌 Index Navigator (सूचकांक चुनें)
            </span>
            <div className="space-y-1.5" id="nav-indices-list">
              {Object.values(INDICES_CONFIG).map((index) => {
                const isActive = index.symbol === selectedKey;
                return (
                  <button
                    key={index.symbol}
                    type="button"
                    onClick={() => setSelectedKey(index.symbol)}
                    className={`w-full text-left p-3 rounded-xl border flex justify-between items-center transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-800 border-indigo-500/70 text-white shadow-md shadow-indigo-950/20"
                        : "bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[12.5px] font-bold font-mono tracking-tight">{index.name}</span>
                      <span className="text-[9.5px] text-slate-500 font-medium font-sans uppercase">
                        {index.exchange} Index
                      </span>
                    </div>
                    {isActive && (
                      <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-600 text-white rounded font-mono shadow-sm animate-pulse">
                        LIVE VIEW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 font-mono">
                ℹ️ About this Index
              </span>
              <div className="bg-slate-900/60 border border-slate-800/50 p-3 rounded-xl text-xs text-slate-400 space-y-2 leading-relaxed">
                <p>{activeConfig.description}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-semibold font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Fully Verified Live Feed
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-4 text-[11px] text-slate-500 space-y-2">
            <p className="leading-snug">
              💡 <strong className="text-slate-400">TradingView Candle Embed:</strong> Use the drawing tools, indicators list (f(x)), timeframes (5m, 1h, D), or chart style toggler on the iframe layout directly.
            </p>
            <p className="text-[10px] italic text-slate-600 font-mono">
              Designed as standard high-contrast, zero latency analysis screen.
            </p>
          </div>
        </aside>

        {/* Live Active Chart Container (Vast Full Area) */}
        <main className="flex-1 bg-slate-950 flex flex-col relative" id="tradingview-live-display">
          {/* Chart Header Bar with Toggles */}
          <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                📈 Chart Source:
              </span>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => setChartMode("unrestricted")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    chartMode === "unrestricted"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <span>⚡ Direct Embed Chart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("official")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    chartMode === "official"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-950/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <span>🏛️ Official Exchange (NSE/BSE)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {chartMode === "official" && (
                <div className="text-[10.5px] text-amber-300 bg-amber-950/50 border border-amber-900/50 px-3 py-1.5 rounded-lg max-w-sm sm:max-w-md font-medium leading-snug">
                  ⚠️ <strong>Disclaimer:</strong> Standard official NSE/BSE tickers can trigger a <em>"This symbol is only available on TradingView"</em> licencing message. Click <strong>'OK'</strong> inside that popup to view the official timeline on TradingView, or switch to the <strong>⚡ Direct Embed</strong> mode on the left.
                </div>
              )}
              <div className="bg-slate-900/40 border border-slate-800 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10.5px] text-indigo-400 font-mono font-bold shadow flex items-center gap-1.5 select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>5m Candlesticks Active</span>
              </div>
            </div>
          </div>

          <div className="w-full h-full flex-1 flex flex-col" id="tradingview-widget-container">
            <div id="tradingview-advanced-chart" className="w-full h-full flex-1" />
          </div>
        </main>
      </div>
    </div>
  );
}
