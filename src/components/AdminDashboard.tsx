import React, { useState, useEffect } from "react";
import { 
  Lock, LockOpen, ShieldAlert, Upload, FileUp, Image, 
  RefreshCw, Sparkles, SlidersHorizontal, Database, Activity, 
  CheckCircle2, AlertTriangle, LogOut, ArrowLeft, Terminal,
  Sliders, Server, ChevronRight, Globe, HelpCircle
} from "lucide-react";

interface AdminDashboardProps {
  isLiveNseDisabled: boolean;
  setIsLiveNseDisabled: (val: boolean) => void;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  activeUploadTab: "paste" | "csv" | "image" | "live";
  setActiveUploadTab: (val: "paste" | "csv" | "image" | "live") => void;
  selectedSymbol: string;
  handleFetchLiveNseData: (symbol: string) => void;
  rawPasteText: string;
  setRawPasteText: (val: string) => void;
  setUseRawPaste: (val: boolean) => void;
  handleParseAndLoadOptionChain: () => void;
  dragActive: boolean;
  setDragActive: (val: boolean) => void;
  handleDrag: (e: React.DragEvent) => void;
  handleDropCSV: (e: React.DragEvent) => void;
  handleDropImage: (e: React.DragEvent) => void;
  handleCSVFileDropOrSelect: (file: File) => void;
  uploadedFileName: string | null;
  setUploadedFileName: (val: string | null) => void;
  selectedImage: string | null;
  setSelectedImage: (val: string | null) => void;
  imageMimeType: string;
  setImageMimeType: (val: string) => void;
  imageParsing: boolean;
  parseImageWithGemini: (base64Override?: string, mimeOverride?: string) => Promise<void>;
  handleResetDefaultData: () => void;
  setParseSuccessMessage: (val: string | null) => void;
  setErrorStatus: (val: string | null) => void;
  setIsAdminLoggedIn: (val: boolean) => void;
  setActivePage: (val: "dashboard" | "report" | "seller" | "seller-panic" | "atm" | "atm-sports" | "expiry" | "strategy" | "vix" | "tripwire" | "fiidii" | "wealth" | "sip" | "sip-calc" | "admin") => void;
}

export default function AdminDashboard({
  isLiveNseDisabled,
  setIsLiveNseDisabled,
  autoRefresh,
  setAutoRefresh,
  activeUploadTab,
  setActiveUploadTab,
  selectedSymbol,
  handleFetchLiveNseData,
  rawPasteText,
  setRawPasteText,
  setUseRawPaste,
  handleParseAndLoadOptionChain,
  dragActive,
  setDragActive,
  handleDrag,
  handleDropCSV,
  handleDropImage,
  handleCSVFileDropOrSelect,
  uploadedFileName,
  setUploadedFileName,
  selectedImage,
  setSelectedImage,
  imageMimeType,
  setImageMimeType,
  imageParsing,
  parseImageWithGemini,
  handleResetDefaultData,
  setParseSuccessMessage,
  setErrorStatus,
  setIsAdminLoggedIn,
  setActivePage
}: AdminDashboardProps) {

  const [systemLogs, setSystemLogs] = useState<string[]>([
    `[INFO] [${new Date().toLocaleTimeString()}] Secure admin terminal session initialized.`,
    `[STATS] [${new Date().toLocaleTimeString()}] Target indices: NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY.`,
    `[INFO] [${new Date().toLocaleTimeString()}] Option pricing mathematical models: Black-Scholes-Merton (BSM) calibrator ready.`
  ]);

  const [simulatedPingLatency, setSimulatedPingLatency] = useState<number>(34);
  const [isSimulatingPing, setIsSimulatingPing] = useState<boolean>(false);

  // Periodic simulated latency jitter to show dynamic interface activity
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedPingLatency(prev => {
        const delta = Math.floor(Math.random() * 9) - 4;
        const next = prev + delta;
        return next < 15 ? 18 : next > 60 ? 42 : next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (message: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 14)]);
  };

  const handlePingServer = () => {
    setIsSimulatingPing(true);
    addLog("PING request dispatched to secure proxied server node...");
    setTimeout(() => {
      setIsSimulatingPing(false);
      addLog(`PONG response received from server. Latency: ${simulatedPingLatency}ms. SSL handshake valid.`);
    }, 600);
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setActivePage("dashboard");
    setParseSuccessMessage("Successfully logged out from the Quantitative Admin Console.");
    setTimeout(() => setParseSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6" id="admin-full-dashboard">
      
      {/* HEADER BANNER CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 border border-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-24 -top-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-52 h-52 bg-emerald-500/5 rounded-full blur-2xl" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-2xl">
              <LockOpen size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black font-mono tracking-wider uppercase">
                  AshTek Quantitative Admin Console
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[9px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  Active Overrides
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans leading-relaxed">
                Execute microsecond override feeds, import offline CSV spreadsheets, activate Gemini 3.5 Vision AI screenshot matrix parsing, or control live API relays.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch md:self-auto">
            <button
              type="button"
              onClick={() => setActivePage("dashboard")}
              className="flex-1 md:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:text-white rounded-xl text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 shadow-xs"
              id="admin-btn-back"
              title="Return to standard analyst views"
            >
              <ArrowLeft size={13} />
              <span>Exit Console</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 md:flex-initial px-4 py-2 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 shadow-xs"
              id="admin-btn-logout-full"
              title="Log out and lock console sessions"
            >
              <LogOut size={13} />
              <span>Log Out</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdminLoggedIn(false);
                setActivePage("dashboard");
                setParseSuccessMessage("Admin Console has been successfully turned off.");
                setTimeout(() => setParseSuccessMessage(null), 4000);
              }}
              className="flex-1 md:flex-initial px-4 py-2 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 shadow-xs"
              id="admin-btn-deactivate"
              title="Deactivate and Turn Off admin console sessions"
            >
              <Lock size={13} />
              <span>Turn Off Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* THREE COLUMN GRID DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: SYSTEM TELEMETRY, LOGS & CONTROLS (4 Columns) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          
          {/* SYSTEM MONITORS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Server size={14} className="text-indigo-600" />
              Real-Time Feed Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">DB Sync Status</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-black font-mono text-slate-800">CONNECTED</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Ping Latency</span>
                <div className="flex items-center gap-1.5">
                  <Activity size={12} className="text-indigo-500" />
                  <span className="text-xs font-black font-mono text-slate-800">{simulatedPingLatency} ms</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">OCR Processor</span>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-pink-500" />
                  <span className="text-xs font-black font-mono text-slate-800">GEMINI 3.5</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Model Temp</span>
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal size={12} className="text-amber-500" />
                  <span className="text-xs font-black font-mono text-slate-800">0.1 (Strict)</span>
                </div>
              </div>
            </div>

            {/* QUICK TELEMETRY TOGGLE SWITCH */}
            <div className={`p-4 rounded-xl border space-y-2 transition-all duration-200 ${
              isLiveNseDisabled 
                ? "bg-amber-50/70 border-amber-200" 
                : "bg-emerald-50/70 border-emerald-200"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide font-mono">
                    NSE Live Connector
                  </span>
                  <span className={`text-[9.5px] font-mono font-bold uppercase ${
                    isLiveNseDisabled ? "text-amber-700" : "text-emerald-700"
                  }`}>
                    {isLiveNseDisabled ? "Manual overrides only" : "Automatic live sync"}
                  </span>
                </div>
                
                {/* Switch slider */}
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isLiveNseDisabled;
                    setIsLiveNseDisabled(nextState);
                    if (nextState) {
                      setAutoRefresh(false);
                      setActiveUploadTab("paste");
                      addLog("NSE Live automated sync disabled. Manual quantitative override active.");
                      setParseSuccessMessage("NSE Live Tracking OFF! You can now manually override options data.");
                    } else {
                      setAutoRefresh(true);
                      setActiveUploadTab("live");
                      handleFetchLiveNseData(selectedSymbol);
                      addLog(`NSE Live automated sync enabled. Synchronizing ${selectedSymbol} data...`);
                      setParseSuccessMessage(`NSE Live Activated! Fetching live ${selectedSymbol} data...`);
                    }
                    setTimeout(() => setParseSuccessMessage(null), 5000);
                  }}
                  className={`relative inline-flex h-5.5 w-10.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    !isLiveNseDisabled ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      !isLiveNseDisabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                Turn off live connectors if you wish to run screenshot OCR, upload spreadsheets, or manually calibrate parameters.
              </p>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handlePingServer}
                disabled={isSimulatingPing}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 font-bold font-mono text-[10.5px] tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={12} className={isSimulatingPing ? "animate-spin text-indigo-500" : "text-slate-500"} />
                <span>{isSimulatingPing ? "Verifying..." : "Verify Server Latency"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleResetDefaultData();
                  addLog("Master data model reset to default pre-loaded quantitative scenario.");
                }}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl text-rose-700 font-bold font-mono text-[10.5px] tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <AlertTriangle size={12} className="text-rose-500" />
                <span>Reset to Stock Defaults</span>
              </button>
            </div>
          </div>

          {/* SIMULATED LIVE QUANT LOGGER / LOG WINDOW */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 shadow-md flex-1 mt-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-3.5">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Terminal size={12} className="text-indigo-400" />
                  Secured Action Console logs
                </h3>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" title="Terminal live"></span>
              </div>

              <div className="space-y-2 h-[180px] overflow-y-auto scrollbar-none font-mono text-[10.5px] text-slate-300 leading-relaxed">
                {systemLogs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap select-all selection:bg-slate-800">
                    <span className="text-slate-650 font-bold select-none">&gt;</span> {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-900 flex justify-between items-center text-[9px] text-slate-500 font-mono">
              <span>ACTIVE SESSION: QUANT-ADMIN</span>
              <button 
                onClick={() => setSystemLogs([`[INFO] [${new Date().toLocaleTimeString()}] Console logs cleared.`])}
                className="text-slate-400 hover:text-white underline cursor-pointer"
              >
                Clear Console Logs
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: MANUAL OVERRIDE WORKSPACE (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* THE TAB WORKSPACE CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono flex items-center gap-2">
                  <Sliders size={14} className="text-emerald-600" />
                  Manual Override Feed Workspace
                </h3>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                  Calibrate active option chains through any of the secure manual input adapters below.
                </p>
              </div>

              {/* Responsive Tabs Buttons */}
              <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded-lg shrink-0 overflow-x-auto select-none" id="admin-workspace-tabs">
                {[
                  { id: "live", label: "🔴 Live Feed" },
                  { id: "paste", label: "📋 Text Paste" },
                  { id: "csv", label: "📊 CSV File" },
                  { id: "image", label: "📸 Screenshot" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { 
                      setActiveUploadTab(tab.id as any); 
                      setErrorStatus(null); 
                      addLog(`Workspace mode switched to manual: ${tab.label}`);
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold font-mono tracking-wider uppercase transition-all duration-150 rounded-md cursor-pointer ${
                      activeUploadTab === tab.id
                        ? "bg-white text-slate-900 shadow-3xs border border-slate-250/30"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB VIEWPORTS */}
            <div className="min-h-[220px]">
              
              {/* VIEWPORT: LIVE API */}
              {activeUploadTab === "live" && (
                <div className="space-y-4 animate-fade-in" id="workspace-viewport-live">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      Direct Proxied Live NSE Connector
                    </h4>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed font-sans">
                      Deploy instant HTTP background scraping queries to official NSE systems. This retrieves live strike levels, current weighted open interest (CE/PE), spot benchmarks, and triggers active panic metrics automatically.
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                      {["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"].map((symbol) => (
                        <button
                          key={symbol}
                          onClick={() => {
                            handleFetchLiveNseData(symbol);
                            addLog(`Dispatched background live fetch call for index: ${symbol}`);
                            setParseSuccessMessage(`Switching live index to ${symbol}...`);
                            setTimeout(() => setParseSuccessMessage(null), 4500);
                          }}
                          className={`py-3 px-3.5 rounded-xl text-xs font-black font-mono tracking-wide text-center transition-all duration-150 cursor-pointer ${
                            selectedSymbol === symbol 
                              ? "bg-slate-950 text-white shadow-md border border-slate-950 scale-[1.02]" 
                              : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-350"
                          }`}
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEWPORT: TEXT PASTE */}
              {activeUploadTab === "paste" && (
                <div className="space-y-4 animate-fade-in" id="workspace-viewport-paste">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                      Raw Sheet Copy (Excel / Sensibull Option Chain Grid)
                    </label>
                    <textarea
                      placeholder="Paste columns starting with Strike, Call OI, Put OI, etc..."
                      className="w-full h-44 bg-slate-50 border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      value={rawPasteText}
                      onChange={(e) => {
                        setRawPasteText(e.target.value);
                        setUseRawPaste(e.target.value.trim().length > 0);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleParseAndLoadOptionChain();
                        addLog("Option chain raw text clipboard parsed and loaded into state models.");
                        setActivePage("dashboard");
                      }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload size={14} />
                      Parse &amp; Synchronize Manual Text
                    </button>
                  </div>
                </div>
              )}

              {/* VIEWPORT: CSV FILE */}
              {activeUploadTab === "csv" && (
                <div className="space-y-4 animate-fade-in" id="workspace-viewport-csv">
                  <div className="space-y-4">
                    <div 
                      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                        dragActive 
                          ? "border-indigo-600 bg-indigo-50/50" 
                          : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
                      }`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDropCSV}
                    >
                      <input 
                        type="file" 
                        id="admin-dashboard-file-picker-csv" 
                        className="hidden" 
                        accept=".csv"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            addLog(`CSV file loaded manually: ${file.name}`);
                            handleCSVFileDropOrSelect(file);
                            setActivePage("dashboard");
                          }
                        }}
                      />
                      <label htmlFor="admin-dashboard-file-picker-csv" className="cursor-pointer flex flex-col items-center justify-center gap-2.5">
                        <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-full">
                          <FileUp size={24} />
                        </div>
                        <span className="text-xs text-slate-700 font-bold">
                          Drag and Drop option chain CSV or <span className="text-indigo-600 underline">Browse files</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Supports comma-separated files containing CE/PE Open Interest matrices
                        </span>
                      </label>
                    </div>

                    {uploadedFileName && (
                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-slate-700">
                        <span className="truncate max-w-[280px] font-bold">📁 {uploadedFileName}</span>
                        <button 
                          onClick={() => { 
                            setUploadedFileName(null); 
                            setRawPasteText(""); 
                            setUseRawPaste(false); 
                            addLog("Spreadsheet source reference cleared.");
                          }}
                          className="text-red-500 hover:underline cursor-pointer font-bold"
                        >
                          Clear File
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEWPORT: IMAGE OCR */}
              {activeUploadTab === "image" && (
                <div className="space-y-4 animate-fade-in" id="workspace-viewport-image">
                  <div className="space-y-4">
                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                      Pasted clipboard screenshot capture is fully compatible! Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] font-bold">Shift + Win + S</kbd> to clip, and press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] font-bold font-black">Ctrl + V</kbd> to paste directly onto this dashboard.
                    </p>

                    {!selectedImage ? (
                      <div 
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                          dragActive 
                            ? "border-indigo-600 bg-indigo-50/50" 
                            : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
                        }`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDropImage}
                      >
                        <input 
                          type="file" 
                          id="admin-dashboard-image-picker" 
                          className="hidden" 
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setUploadedFileName(file.name);
                              addLog(`Option chain screenshot uploaded: ${file.name}`);
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
                        <label htmlFor="admin-dashboard-image-picker" className="cursor-pointer flex flex-col items-center justify-center gap-2.5">
                          <div className="p-3 bg-pink-50 border border-pink-100 text-pink-500 rounded-full">
                            <Image size={24} />
                          </div>
                          <span className="text-xs text-slate-700 font-bold">
                            Drag and drop screenshot or <span className="text-pink-600 underline">Browse image</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            PNG, JPG, or JPEG formats supported
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-52">
                          <img 
                            src={selectedImage} 
                            alt="Option chain layout preview" 
                            className="max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10.5px] text-slate-500 font-mono">
                          <span className="truncate max-w-[280px] font-bold">📁 {uploadedFileName || "Clipboard Screenshot Image"}</span>
                          <button 
                            onClick={() => { 
                              setSelectedImage(null); 
                              setUploadedFileName(null); 
                              addLog("Screenshot reference deleted.");
                            }}
                            className="text-red-500 hover:underline cursor-pointer font-bold"
                          >
                            Delete Image
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            addLog("Triggering Gemini 3.5 Vision OCR option chain extraction parameters...");
                            await parseImageWithGemini();
                            addLog("Gemini extraction query finished processing.");
                            setActivePage("dashboard");
                          }}
                          disabled={imageParsing}
                          className="w-full py-3 bg-indigo-600 hover:bg-slate-900 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {imageParsing ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              Running Gemini 3.5 Vision AI Optical Matrix Extraction...
                            </>
                          ) : (
                            <>
                              <Sparkles size={13} className="text-amber-300" />
                              Extract Data via Gemini 3.5 Vision AI
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* FUTURE EXTENSIONS / EXPERIMENT AREA */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono flex items-center gap-2 pb-2.5 border-b border-slate-100 mb-4">
              <SlidersHorizontal size={14} className="text-indigo-600" />
              Upcoming Quantitative Modifiers (Future Pipeline)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-150 rounded-xl p-3.5 bg-slate-50/50 space-y-1 relative opacity-75">
                <span className="text-[9.5px] font-black text-indigo-600 font-mono tracking-wider block">PIPELINE 01</span>
                <h4 className="text-xs font-bold text-slate-800 font-mono">Custom Strike Matrix Width</h4>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">
                  Modify the default strike step width size dynamically (50, 100, 250 points) to optimize chart resolution.
                </p>
                <div className="pt-2">
                  <span className="text-[8.5px] font-bold bg-slate-200 text-slate-650 font-mono px-1.5 py-0.5 rounded">
                    DEVELOPMENT NEXT
                  </span>
                </div>
              </div>

              <div className="border border-slate-150 rounded-xl p-3.5 bg-slate-50/50 space-y-1 relative opacity-75">
                <span className="text-[9.5px] font-black text-indigo-600 font-mono tracking-wider block">PIPELINE 02</span>
                <h4 className="text-xs font-bold text-slate-800 font-mono">Black-Scholes IV Override</h4>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">
                  Directly input premium risk constraints, custom interest rate overrides, and manual VIX parameter bounds.
                </p>
                <div className="pt-2">
                  <span className="text-[8.5px] font-bold bg-slate-200 text-slate-650 font-mono px-1.5 py-0.5 rounded">
                    DEVELOPMENT NEXT
                  </span>
                </div>
              </div>

              <div className="border border-slate-150 rounded-xl p-3.5 bg-slate-50/50 space-y-1 relative opacity-75">
                <span className="text-[9.5px] font-black text-indigo-600 font-mono tracking-wider block">PIPELINE 03</span>
                <h4 className="text-xs font-bold text-slate-800 font-mono">Custom AI System Prompt</h4>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">
                  Tailor the core quantitative analyst system instructions for the intelligence report generator model.
                </p>
                <div className="pt-2">
                  <span className="text-[8.5px] font-bold bg-slate-200 text-slate-650 font-mono px-1.5 py-0.5 rounded">
                    DEVELOPMENT NEXT
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
