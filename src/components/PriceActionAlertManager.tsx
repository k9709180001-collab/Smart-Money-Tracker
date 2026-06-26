import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, BellOff, Volume2, VolumeX, Plus, Trash2, Play, AlertCircle, 
  CheckCircle, ShieldAlert, Sparkles, Sliders, HelpCircle, RefreshCw, Undo, Search 
} from "lucide-react";

interface AlertRule {
  id: string;
  asset: string;        // 'nifty' | 'banknifty' | 'reliance' | 'hdfcbank' | 'infy' | 'tcs' | 'indiavix'
  assetLabel: string;
  type: "PRICE_ABOVE" | "PRICE_BELOW" | "TRAP_DANGER" | "VIX_FEAR_DIVERGENCE" | "TREND_BREAKOUT";
  value: number;        // Price level threshold (if applicable)
  description: string;  // Roman Hindi alert guide message
  mode: "ONCE" | "RECURRING";
  status: "ACTIVE" | "FIRED" | "MUTED";
}

interface AlertLog {
  id: string;
  timestamp: string;
  asset: string;
  assetLabel: string;
  currentValue: number;
  triggerType: string;
  message: string;
}

interface PriceActionAlertManagerProps {
  indicesStatus: any;
}

export default function PriceActionAlertManager({ indicesStatus }: PriceActionAlertManagerProps) {
  // Voice and sound options
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceVoiceEnabled, setVoiceVoiceEnabled] = useState(true);
  const [activeToast, setActiveToast] = useState<{ id: string; msg: string; label: string } | null>(null);

  // Initializing default rules
  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: "rule-1",
      asset: "nifty",
      assetLabel: "Nifty 50",
      type: "PRICE_ABOVE",
      value: 24100,
      description: "Nifty ₹24,100 ke strong option resistance barrier ko exceed kar gaya hai! Shorts exit karein aur momentum buy analyze karein.",
      mode: "RECURRING",
      status: "ACTIVE"
    },
    {
      id: "rule-2",
      asset: "indiavix",
      assetLabel: "India VIX",
      type: "PRICE_ABOVE",
      value: 15.5,
      description: "ALERT: India VIX 15.5 se upar nikla hai! Option writing range unsafe ho chuki hai, tight hedges backup karein.",
      mode: "RECURRING",
      status: "ACTIVE"
    },
    {
      id: "rule-3",
      asset: "reliance",
      assetLabel: "Reliance Ind",
      type: "PRICE_BELOW",
      value: 2920,
      description: "RELIANCE ₹2920 ke dynamic consolidation floor se neeche aa gaya hai! Nifty holds pressure.",
      mode: "RECURRING",
      status: "ACTIVE"
    },
    {
      id: "rule-4",
      asset: "index-trap",
      assetLabel: "Heavyweight Trap",
      type: "TRAP_DANGER",
      value: 0,
      description: "Nifty is green par Reliance aur HDFC dono RED hain! Smart money fake-up trap active hai.",
      mode: "RECURRING",
      status: "ACTIVE"
    }
  ]);

  const [logs, setLogs] = useState<AlertLog[]>([
    {
      id: "log-init",
      timestamp: new Date().toLocaleTimeString(),
      asset: "vix",
      assetLabel: "Alert Sentinel Initialized",
      currentValue: 13.2,
      triggerType: "SYSTEM_ON",
      message: "Sentinel active. Market price action and heavyweight levels system successfully loaded in Hindi/Urdu. Swings analyze ho rahe hain!"
    }
  ]);

  // Form Wizard states
  const [formAsset, setFormAsset] = useState("nifty");
  const [formType, setFormType] = useState("PRICE_ABOVE");
  const [formValue, setFormValue] = useState("24050");
  const [formMode, setFormMode] = useState<"ONCE" | "RECURRING">("RECURRING");
  const [formDescription, setFormDescription] = useState("");
  const [showWizard, setShowWizard] = useState(false);

  // Keep a reference to the previous values to prevent duplicate triggers on the same price point
  const lastCheckedValues = useRef<Record<string, number>>({});

  // Helper mapping
  const getAssetLabel = (assetKey: string) => {
    const mapping: Record<string, string> = {
      nifty: "Nifty 50",
      banknifty: "Bank Nifty",
      reliance: "Reliance Ind",
      hdfcbank: "HDFC Bank",
      infy: "Infosys",
      tcs: "TCS",
      indiavix: "India VIX"
    };
    return mapping[assetKey] || assetKey.toUpperCase();
  };

  // Pre-fill Roman Hindi text description dynamically when they adjust form values
  useEffect(() => {
    const label = getAssetLabel(formAsset);
    let autoText = "";
    if (formType === "PRICE_ABOVE") {
      autoText = `${label} support level cheer kar ke ₹${formValue} ke Upar badha hai! Bullish structural breakout call ban sakti hai.`;
    } else if (formType === "PRICE_BELOW") {
      autoText = `${label} price level crash ho kar ₹${formValue} ke Neeche break down ho chuka hai! Sell volumes aur breakdown strength check kijiye.`;
    } else if (formType === "TRAP_DANGER") {
      autoText = `ALERT: Nifty Index high touch kar raha hai lekin heavyweights are drag-down red zone me distribution trap kar rahe hain.`;
    }
    setFormDescription(autoText);
  }, [formAsset, formType, formValue]);

  // Sythensize local notification beep via HTML5 AudioContext
  const playChime = (type: "beep" | "success" | "alarm" | "test") => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === "beep") {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "success" || type === "test") {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(750, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "alarm") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1050, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Speech Synthesis audio fail:", e);
    }
  };

  // Physical computer speech reading alert
  const speakAlertText = (text: string) => {
    if (!voiceVoiceEnabled) return;
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel(); // kill overlapping voice
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "hi-IN"; // Set hindi dialect fallback if available
        utterance.rate = 1.05;
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Voice speech synthesizer is barred:", e);
    }
  };

  // Evaluate live indicators price status
  useEffect(() => {
    if (!indicesStatus) return;

    let alertTriggered = false;

    // Evaluate rules
    const updatedRules = rules.map((rule) => {
      if (rule.status !== "ACTIVE") return rule;

      // Extract current status
      let currentValue = 0;
      let matched = false;

      if (rule.asset === "nifty" && indicesStatus.nifty) {
        currentValue = indicesStatus.nifty.value;
      } else if (rule.asset === "banknifty" && indicesStatus.banknifty) {
        currentValue = indicesStatus.banknifty.value;
      } else if (rule.asset === "reliance" && indicesStatus.reliance) {
        currentValue = indicesStatus.reliance.value;
      } else if (rule.asset === "hdfcbank" && indicesStatus.hdfcbank) {
        currentValue = indicesStatus.hdfcbank.value;
      } else if (rule.asset === "infy" && indicesStatus.infy) {
        currentValue = indicesStatus.infy.value;
      } else if (rule.asset === "tcs" && indicesStatus.tcs) {
        currentValue = indicesStatus.tcs.value;
      } else if (rule.asset === "indiavix" && indicesStatus.indiavix) {
        currentValue = indicesStatus.indiavix.value;
      } else if (rule.asset === "index-trap" && indicesStatus.nifty && indicesStatus.reliance && indicesStatus.hdfcbank) {
        // Special evaluated complex rule
        const isNiftyUp = indicesStatus.nifty.change > 0;
        const isRelianceRed = indicesStatus.reliance.change < 0;
        const isHdfcRed = indicesStatus.hdfcbank.change < 0;
        currentValue = indicesStatus.nifty.value;
        if (isNiftyUp && isRelianceRed && isHdfcRed) {
          matched = true;
        }
      }

      // Check if price crossing event actually happened
      if (rule.type === "PRICE_ABOVE" && currentValue > rule.value) {
        // Only trigger if last value was below or unknown, to prevent continuous alerts
        const lastVal = lastCheckedValues.current[rule.asset];
        if (!lastVal || lastVal <= rule.value) {
          matched = true;
        }
      } else if (rule.type === "PRICE_BELOW" && currentValue < rule.value && currentValue > 0) {
        const lastVal = lastCheckedValues.current[rule.asset];
        if (!lastVal || lastVal >= rule.value) {
          matched = true;
        }
      }

      if (matched) {
        alertTriggered = true;
        const messageHeader = `TRIGGER: ${rule.assetLabel} alert!`;
        const actionMessage = `${rule.description} Current: ${currentValue.toFixed(2)}`;

        // Trigger notifications
        playChime("alarm");
        speakAlertText(`${rule.assetLabel} Alert. ${rule.description}`);

        // Update logs
        const newLog: AlertLog = {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString(),
          asset: rule.asset,
          assetLabel: rule.assetLabel,
          currentValue: currentValue,
          triggerType: rule.type,
          message: rule.description
        };

        setLogs((prev) => [newLog, ...prev].slice(0, 50)); // cap at 50 logs

        // Show floating UI card notify
        setActiveToast({
          id: rule.id,
          label: rule.assetLabel,
          msg: rule.description
        });

        // Autoclose toast after 8 seconds
        setTimeout(() => setActiveToast(null), 8000);

        return {
          ...rule,
          status: rule.mode === "ONCE" ? "FIRED" : "ACTIVE"
        };
      }

      return rule;
    });

    // Update last evaluated checkpoint values for next cycle crossover calculation
    const newLastValues: Record<string, number> = {};
    if (indicesStatus.nifty) newLastValues.nifty = indicesStatus.nifty.value;
    if (indicesStatus.banknifty) newLastValues.banknifty = indicesStatus.banknifty.value;
    if (indicesStatus.reliance) newLastValues.reliance = indicesStatus.reliance.value;
    if (indicesStatus.hdfcbank) newLastValues.hdfcbank = indicesStatus.hdfcbank.value;
    if (indicesStatus.infy) newLastValues.infy = indicesStatus.infy.value;
    if (indicesStatus.tcs) newLastValues.tcs = indicesStatus.tcs.value;
    if (indicesStatus.indiavix) newLastValues.indiavix = indicesStatus.indiavix.value;
    lastCheckedValues.current = newLastValues;

    if (alertTriggered) {
      setRules(updatedRules);
    }
  }, [indicesStatus, rules]);

  // Trigger simulated demo alert to inspect output & sound
  const handleTriggerSimulatedTest = () => {
    playChime("test");
    speakAlertText("Bong! Live levels alert checker active and fully loaded.");
    const testLog: AlertLog = {
      id: `log-test-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      asset: "test",
      assetLabel: "System Testing Chime",
      currentValue: 24040,
      triggerType: "TEST_SUCCESSION",
      message: "Test beep check and verbal audio synthesized correctly. Ready for real trade levels trigger."
    };
    setLogs((prev) => [testLog, ...prev]);
  };

  // Enable/Disable single rule
  const handleToggleRuleStatus = (ruleId: string) => {
    setRules(
      rules.map((r) => {
        if (r.id === ruleId) {
          const nextStatus = r.status === "ACTIVE" ? "MUTED" : "ACTIVE";
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
    playChime("beep");
  };

  // Add rule
  const handleAddNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    const valFloat = parseFloat(formValue);
    if (isNaN(valFloat)) return;

    const newRule: AlertRule = {
      id: `rule-${Date.now()}`,
      asset: formAsset,
      assetLabel: getAssetLabel(formAsset),
      type: formType as any,
      value: valFloat,
      description: formDescription || `${getAssetLabel(formAsset)} limit cross logic activated.`,
      mode: formMode,
      status: "ACTIVE"
    };

    setRules([newRule, ...rules]);
    setShowWizard(false);
    playChime("success");

    // Add log
    const logAdd: AlertLog = {
      id: `log-add-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      asset: formAsset,
      assetLabel: "Rule Added Successfully",
      currentValue: valFloat,
      triggerType: "RULE_CONFIGURED",
      message: `Naya alert set kiya gaya hai: ${newRule.assetLabel} crossing limit ₹${valFloat}. Option chain aur premium monitoring sentinel active!`
    };
    setLogs((prev) => [logAdd, ...prev]);
  };

  // Delete rule
  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter((r) => r.id !== ruleId));
    playChime("beep");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl relative" id="alert-sentinel-panel">
      {/* Absolute floating persistent active notice toast */}
      {activeToast && (
        <div className="absolute top-4 right-4 z-50 p-4 bg-rose-950 border border-rose-500 rounded-xl text-rose-100 shadow-2xl max-w-sm flex items-start gap-3 animate-bounce">
          <ShieldAlert className="text-rose-400 flex-shrink-0 animate-pulse mt-1" size={18} />
          <div>
            <div className="font-extrabold text-xs font-mono text-rose-300 flex items-center justify-between">
              <span>🚨 LIVE ALERT DETECTED!</span>
              <button onClick={() => setActiveToast(null)} className="text-[9px] hover:underline hover:text-white uppercase">Dismiss</button>
            </div>
            <p className="text-xs font-bold font-sans mt-1 text-white leading-relaxed">{activeToast.label}: {activeToast.msg}</p>
          </div>
        </div>
      )}

      {/* Header and status control segment */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <h3 className="text-sm font-bold tracking-widest text-rose-500 uppercase font-mono flex items-center gap-2">
              <Bell size={16} /> Live Price Action &amp; Levels Alert Sentinel
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Support levels, resistance breakouts, aur negative heavyweight divergences par instant sound alarm set karein.
          </p>
        </div>

        {/* Global alarm controls */}
        <div className="flex items-center gap-2">
          {/* Sound enable button */}
          <button 
            type="button"
            onClick={() => { setSoundEnabled(!soundEnabled); playChime("beep"); }}
            title={soundEnabled ? "Mute alert beep" : "Unmute alert beep"}
            className={`p-2 rounded-lg border transition text-xs flex items-center gap-1.5 font-mono ${
              soundEnabled ? "bg-slate-800 text-emerald-400 border-slate-700" : "bg-slate-950 text-slate-500 border-slate-800"
            }`}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>Sound {soundEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Voice enable button */}
          <button 
            type="button"
            onClick={() => { setVoiceVoiceEnabled(!voiceVoiceEnabled); playChime("beep"); }}
            title={voiceVoiceEnabled ? "Mute spoken voice alerts" : "Enable spoken voice alerts"}
            className={`p-2 rounded-lg border transition text-xs flex items-center gap-1.5 font-mono ${
              voiceVoiceEnabled ? "bg-slate-800 text-sky-400 border-slate-700" : "bg-slate-950 text-slate-500 border-slate-800"
            }`}
          >
            <Volume2 size={13} className="text-sky-300 animate-pulse" />
            <span>Chime voice {voiceVoiceEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Test button */}
          <button 
            type="button"
            onClick={handleTriggerSimulatedTest}
            className="px-3 py-2 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-755 rounded-lg text-xs font-mono transition-colors"
          >
            Test Sound 🔊
          </button>

          {/* Wizard toggle */}
          <button 
            onClick={() => setShowWizard(!showWizard)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add Levels Rule
          </button>
        </div>
      </div>

      {/* Adding Naye Rules Form Wizard */}
      {showWizard && (
        <form onSubmit={handleAddNewRule} className="mb-6 p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4 animate-fade-in" id="add-rule-wizard-box">
          <div className="flex items-center justify-between text-xs font-bold text-rose-400 font-mono border-b border-slate-800 pb-2 mb-2 uppercase">
            <span className="flex items-center gap-1"><Sliders size={13} /> Naya Live Alert Rule Configuration</span>
            <button type="button" onClick={() => setShowWizard(false)} className="text-[10px] hover:underline uppercase text-slate-500">Cancel</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
            {/* Select Asset */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block">1. Select Asset (अंडरलाइंग)</label>
              <select 
                value={formAsset}
                onChange={(e) => setFormAsset(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-100"
              >
                <option value="nifty">Nifty 50 Index</option>
                <option value="banknifty">Bank Nifty Index</option>
                <option value="reliance">Reliance Industry</option>
                <option value="hdfcbank">HDFC Bank Ltd</option>
                <option value="infy">Infosys Ltd</option>
                <option value="tcs">TCS Ltd</option>
                <option value="indiavix">India VIX Fear Index</option>
                <option value="index-trap">Special: Heavyweight Trap</option>
              </select>
            </div>

            {/* Select Condition */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block">2. Condition (शर्त या ट्रिगर)</label>
              <select 
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-100"
                disabled={formAsset === "index-trap"}
              >
                <option value="PRICE_ABOVE">Crosses Above (से ऊपर)</option>
                <option value="PRICE_BELOW">Crosses Below (से नीचे)</option>
                <option value="TRAP_DANGER">Heavyweight Distribution Trap (दिग्गज दबाव)</option>
              </select>
            </div>

            {/* Price Level Target */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block">3. Triger Level (₹ या Index Price)</label>
              <input 
                type="number"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-100 focus:outline-none"
                placeholder="Limit target"
                disabled={formAsset === "index-trap"}
                step="0.05"
              />
            </div>

            {/* Mode selection */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold block">4. Mode (दौरान)</label>
              <select 
                value={formMode}
                onChange={(e) => setFormMode(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-100"
              >
                <option value="RECURRING">Recurring (बार बार alert)</option>
                <option value="ONCE">Once Only (एक बार trigger)</option>
              </select>
            </div>
          </div>

          {/* Description Guide preview text */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold font-mono block">Preview English/Hinglish Voice &amp; Alarm Narrative Text:</label>
            <textarea 
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full h-16 bg-slate-900 border border-slate-800 rounded p-2 text-xs font-sans text-slate-200 focus:outline-none focus:border-rose-950"
              placeholder="Yahan dynamic live feedback description generate hogi..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button 
              type="button" 
              onClick={() => setShowWizard(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-bold rounded flex items-center gap-1"
            >
              <CheckCircle size={14} /> Active Alert Rule
            </button>
          </div>
        </form>
      )}

      {/* Main interface layout: Rules vs Logs split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="alerts-sentinel-dashboards-split">
        {/* LEFT COLUMN: ACTIVE TRADING EXECUTIONS AND RULES */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 font-mono tracking-widest uppercase mb-1">
            <span>⚙️ Configured Breakout &amp; Price Action Rules</span>
            <span className="text-[10px] bg-slate-800 text-rose-400 px-1.5 py-0.5 rounded-full font-mono font-semibold">
              {rules.length} Rules Active
            </span>
          </div>

          {rules.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-xl border border-dashed border-slate-800 leading-relaxed font-sans">
              <BellOff className="mx-auto text-slate-700 mb-2" size={32} />
              <p className="font-semibold text-slate-400">Rules empty hai!</p>
              <p className="text-xs text-slate-500 mt-1">Please use 'Add Levels Rule' button block upar to set new price alert thresholds.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" id="rules-cards-grid">
              {rules.map((rule) => {
                const isActive = rule.status === "ACTIVE";
                const isFired = rule.status === "FIRED";

                return (
                  <div 
                    key={rule.id} 
                    className={`p-3.5 rounded-xl border transition-all duration-300 relative ${
                      isActive 
                        ? "bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950" 
                        : isFired 
                          ? "bg-rose-950/10 border-rose-900/20 text-slate-400" 
                          : "bg-slate-900/30 border-slate-800 text-slate-500"
                    }`}
                  >
                    {/* Trash delete button */}
                    <button 
                      onClick={() => handleDeleteRule(rule.id)}
                      className="absolute top-3.5 right-3.5 p-1 bg-slate-900/40 hover:bg-red-950 hover:text-red-400 rounded transition text-slate-500"
                      title="Deactivate & delete rule"
                    >
                      <Trash2 size={12} />
                    </button>

                    <div className="flex items-start gap-2 pr-7">
                      <div className={`p-1.5 rounded-lg mt-0.5 ${
                        isActive ? "bg-rose-950 text-rose-400 animate-pulse" : "bg-slate-800 text-slate-500"
                      }`}>
                        <Bell size={13} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black font-mono text-slate-200 uppercase">{rule.assetLabel}</span>
                          <span className={`text-[8.5px] font-mono font-black uppercase px-1 rounded ${
                            rule.type.includes("ABOVE") ? "bg-emerald-950/50 text-emerald-400" : "bg-rose-950/50 text-rose-400"
                          }`}>
                            {rule.type === "PRICE_ABOVE" ? "> Above" : rule.type === "PRICE_BELOW" ? "< Below" : "Trap Alarm"}
                          </span>

                          <span className="text-[9.5px] text-slate-400 font-mono font-bold">
                            {rule.type !== "TRAP_DANGER" ? `₹${rule.value.toLocaleString("en-IN")}` : ""}
                          </span>
                        </div>

                        <p className="text-[11px] leading-relaxed font-sans text-slate-405 font-medium">
                          {rule.description}
                        </p>

                        <div className="flex items-center gap-2 pt-2.5">
                          {/* Active / Mute toggle */}
                          <button
                            onClick={() => handleToggleRuleStatus(rule.id)}
                            className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-extrabold transition ${
                              isActive 
                                ? "bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-900/40" 
                                : "bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {isActive ? "STATUS: ACTIVE 🔔" : isFired ? "STATUS: FIRED ⚡" : "STATUS: MUTED 🔕"}
                          </button>

                          <span className="text-[9px] font-mono text-slate-500 hover:underline cursor-none">
                            {rule.mode}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: REALTIME SENTINEL ACTIVITY TRIGGER LOGS */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 font-mono tracking-widest uppercase mb-1">
            <span className="flex items-center gap-1.5">⚡ Chronological Live Alert Tracker Logs</span>
            <button 
              onClick={() => { setLogs([]); playChime("beep"); }}
              className="text-[9px] text-slate-500 hover:text-slate-300 hover:underline uppercase"
            >
              Clear Logs
            </button>
          </div>

          <div 
            className="p-4 bg-slate-950 rounded-xl border border-slate-800 h-[325px] overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
            id="alerts-running-logs-box"
          >
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs font-sans">
                <p>Logs clear hain।</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Jaise hi live prices level breakdown karenge, triggers yahan real-time trace honge.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="text-[11.5px] border-b border-slate-900/80 pb-3 last:border-0 hover:bg-white/[0.01] p-1.5 rounded transition">
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-slate-500">
                    <span className="text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded font-black uppercase text-[9px] tracking-wider">
                      {log.assetLabel}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {log.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 font-sans font-medium leading-relaxed">
                    {log.message}
                  </p>

                  <div className="flex items-center gap-2 mt-2 font-mono text-[9px] text-slate-500">
                    <span>Type: <span className="text-rose-400">{log.triggerType}</span></span>
                    <span>|</span>
                    <span>Hit Value: <span className="text-sky-400 font-semibold">{log.currentValue > 0 ? log.currentValue.toLocaleString("en-IN") : "Complex Conditions Match"}</span></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
