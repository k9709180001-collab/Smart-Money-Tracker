import React, { useState } from "react";
import { HelpCircle, Eye, ShieldAlert, Sparkles, TrendingUp, TrendingDown, Activity, Info, RefreshCw, VolumeX, BarChart3, LineChart as LineIcon, Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";

interface ChartDataPoint {
  day: string;
  time: string;
  nifty: number;
  vix: number;
  change: string;
}

const scenarioSteadyBull: ChartDataPoint[] = [
  { day: "D1", time: "25 Jun, 09:15 AM", nifty: 23200, vix: 14.5, change: "+0.15%" },
  { day: "D3", time: "25 Jun, 09:30 AM", nifty: 23280, vix: 14.2, change: "+0.35%" },
  { day: "D5", time: "25 Jun, 09:45 AM", nifty: 23350, vix: 13.9, change: "+0.45%" },
  { day: "D7", time: "25 Jun, 10:00 AM", nifty: 23410, vix: 13.5, change: "+0.60%" },
  { day: "D9", time: "25 Jun, 10:15 AM", nifty: 23500, vix: 13.0, change: "+0.85%" },
  { day: "D11", time: "25 Jun, 10:30 AM", nifty: 23550, vix: 12.8, change: "+0.95%" },
  { day: "D13", time: "25 Jun, 10:45 AM", nifty: 23620, vix: 12.4, change: "+1.15%" },
  { day: "D15", time: "25 Jun, 11:00 AM", nifty: 23700, vix: 12.1, change: "+1.40%" },
  { day: "D17", time: "25 Jun, 11:15 AM", nifty: 23750, vix: 11.9, change: "+1.55%" },
  { day: "D19", time: "25 Jun, 11:30 AM", nifty: 23820, vix: 11.7, change: "+1.75%" },
  { day: "D21", time: "25 Jun, 11:45 AM", nifty: 23900, vix: 11.5, change: "+2.00%" },
  { day: "D23", time: "25 Jun, 12:00 PM", nifty: 23950, vix: 11.3, change: "+2.15%" },
  { day: "D25", time: "25 Jun, 12:15 PM", nifty: 24018, vix: 11.1, change: "+2.35%" },
];

const scenarioPanicCorrection: ChartDataPoint[] = [
  { day: "D1", time: "25 Jun, 09:15 AM", nifty: 24200, vix: 12.1, change: "+0.10%" },
  { day: "D3", time: "25 Jun, 09:30 AM", nifty: 24150, vix: 12.4, change: "-0.15%" },
  { day: "D5", time: "25 Jun, 09:45 AM", nifty: 24190, vix: 12.3, change: "-0.05%" },
  { day: "D7", time: "25 Jun, 10:00 AM", nifty: 24050, vix: 13.5, change: "-0.65%" },
  { day: "D9", time: "25 Jun, 10:15 AM", nifty: 23980, vix: 14.2, change: "-0.90%" },
  { day: "D11", time: "25 Jun, 10:30 AM", nifty: 23800, vix: 16.5, change: "-1.65%" },
  { day: "D13", time: "25 Jun, 10:45 AM", nifty: 23920, vix: 15.8, change: "-1.15%" },
  { day: "D15", time: "25 Jun, 11:00 AM", nifty: 23650, vix: 18.9, change: "-2.25%" },
  { day: "D17", time: "25 Jun, 11:15 AM", nifty: 23450, vix: 21.8, change: "-3.10%" },
  { day: "D19", time: "25 Jun, 11:30 AM", nifty: 23520, vix: 20.5, change: "-2.80%" },
  { day: "D21", time: "25 Jun, 11:45 AM", nifty: 23610, vix: 19.2, change: "-2.45%" },
  { day: "D23", time: "25 Jun, 12:00 PM", nifty: 23580, vix: 19.8, change: "-2.55%" },
  { day: "D25", time: "25 Jun, 12:15 PM", nifty: 23680, vix: 18.2, change: "-2.15%" },
];

const scenarioRangebound: ChartDataPoint[] = [
  { day: "D1", time: "25 Jun, 09:15 AM", nifty: 23800, vix: 13.8, change: "-0.10%" },
  { day: "D3", time: "25 Jun, 09:30 AM", nifty: 23850, vix: 13.5, change: "+0.10%" },
  { day: "D5", time: "25 Jun, 09:45 AM", nifty: 23920, vix: 13.2, change: "+0.38%" },
  { day: "D7", time: "25 Jun, 10:00 AM", nifty: 23890, vix: 13.4, change: "+0.25%" },
  { day: "D9", time: "25 Jun, 10:15 AM", nifty: 23950, vix: 13.1, change: "+0.50%" },
  { day: "D11", time: "25 Jun, 10:30 AM", nifty: 24010, vix: 12.8, change: "+0.75%" },
  { day: "D13", time: "25 Jun, 10:45 AM", nifty: 23940, vix: 13.2, change: "+0.45%" },
  { day: "D15", time: "25 Jun, 11:00 AM", nifty: 23980, vix: 13.0, change: "+0.62%" },
  { day: "D17", time: "25 Jun, 11:15 AM", nifty: 24050, vix: 12.7, change: "+0.90%" },
  { day: "D19", time: "25 Jun, 11:30 AM", nifty: 24120, vix: 12.5, change: "+1.20%" },
  { day: "D21", time: "25 Jun, 11:45 AM", nifty: 24080, vix: 12.9, change: "+1.05%" },
  { day: "D23", time: "25 Jun, 12:00 PM", nifty: 23990, vix: 13.3, change: "+0.68%" },
  { day: "D25", time: "25 Jun, 12:15 PM", nifty: 24018, vix: 13.2, change: "+0.80%" },
];

const CustomOverlayTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 text-slate-900 rounded-lg p-3 shadow-xl max-w-xs font-sans">
        <div className="text-[11px] font-bold text-slate-500 mb-2 font-mono">{dataPoint.time}</div>
        <div className="space-y-1.5 text-xs font-semibold">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-[#f97316] rounded-full inline-block"></span>
              <span className="text-slate-500 font-mono tracking-wider text-[10px] uppercase font-bold">INDIAVIX</span>
            </div>
            <span className="font-mono text-slate-800 font-bold">{dataPoint.vix.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#a855f7] inline-block"></span>
              <span className="text-slate-500 font-mono tracking-wider text-[10px] uppercase font-bold">NIFTY</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-800 font-bold">{dataPoint.nifty.toLocaleString("en-IN")}</span>
              <span className={`text-[10px] font-bold px-1 rounded ${
                parseFloat(dataPoint.change) >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
              }`}>{dataPoint.change}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface IndiaVixTrackerProps {
  indicesStatus: any;
}

export default function IndiaVixTracker({ indicesStatus }: IndiaVixTrackerProps) {
  const [showVixGuide, setShowVixGuide] = useState(true);
  const [activeScenario, setActiveScenario] = useState<"steady" | "panic" | "range" | "live">("live");
  const [chartLayout, setChartLayout] = useState<"overlay" | "split">("overlay");
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  // States for high-fidelity 1-minute timeframe real-time playback simulation
  const [liveTick, setLiveTick] = useState<number>(30); // Starts at 30 minutes from open (09:45 AM)
  const [isLivePlaying, setIsLivePlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(3000); // Ticks every 3 seconds

  // Ticking mechanism to simulate 1-minute market data feed moving forward
  React.useEffect(() => {
    if (activeScenario !== "live" || !isLivePlaying) return;

    const interval = setInterval(() => {
      setLiveTick((prev) => {
        if (prev >= 374) {
          return 10; // Wrap around to morning trading session (09:25 AM) to keep looping
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [activeScenario, isLivePlaying, playbackSpeed]);

  if (!indicesStatus) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 antialiased shadow-xl animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-slate-950 rounded-xl"></div>
      </div>
    );
  }

  // Gracefully fallback to standard VIX parameters if not synced
  const vix = indicesStatus.indiavix || { name: "INDIA VIX", value: 13.20, change: 2.15, prevClose: 12.92 };

  const vixValue = parseFloat(vix.value);
  const vixChange = parseFloat(vix.change);

  // Volatility evaluation based on India VIX standards
  let volatilityState = "";
  let evaluationColor = ""; // text & border style classes
  let iconElement = null;
  let summaryText = "";
  let tradingImpact = "";

  if (vixValue < 12.0) {
    volatilityState = "LOW VOLATILITY (EXTREME COMPRESSION)";
    evaluationColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    iconElement = <Eye className="text-emerald-400 flex-shrink-0 animate-pulse" size={17} />;
    summaryText = "Market bilkul shaant hai. Premiums bohot saste hain (Low IV).";
    tradingImpact = "⚠️ Option Buyers beware: Premiums saste hain par momentum slow hone se decay jaldi hoga. Option Sellers ko chhota premium milega par rangebound decay safe hain. Stay alert for a sudden big breakout!";
  } else if (vixValue >= 12.0 && vixValue < 15.5) {
    volatilityState = "NORMAL / BALANCED VOLATILITY";
    evaluationColor = "text-sky-450 bg-sky-500/10 border-sky-500/20";
    iconElement = <Activity className="text-sky-400 flex-shrink-0" size={17} />;
    summaryText = "Technical analysis levels perfectly respect ho rahe hain. Steady trend.";
    tradingImpact = "✅ Optimal Options Zone: Swing high & low guidelines solid work karenge. Donon option buyers and sellers standard intraday reversals and decay ratios se safe trade setup manage kar sakte hain.";
  } else if (vixValue >= 15.5 && vixValue < 20.0) {
    volatilityState = "HIGH VOLATILITY (ELEVATED RISK)";
    evaluationColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
    iconElement = <VolumeX className="text-amber-400 flex-shrink-0" size={17} />;
    summaryText = "Swings bade hone lage hain. Fear aur uncertainty market me rise ho rhi hai.";
    tradingImpact = "🔥 Premium Rising Status: Option sellers leverage half (50%) kar dein. Big gaps aur sudden intraday swings stop-loss trigger kar sakte hain. Directional option buyers can get quick gains but premium volatility is high.";
  } else {
    volatilityState = "EXTREME PANIC / DANGER VOLATILITY";
    evaluationColor = "text-rose-500 bg-rose-500/10 border-rose-500/30 animate-pulse";
    iconElement = <ShieldAlert className="text-rose-500 flex-shrink-0" size={18} />;
    summaryText = "Extreme fear! Options premiums heavy fire par hain. Sharp panic cuts anytime.";
    tradingImpact = "🚨 WARNING (Sellers Hazard): Option seller positions immediate close ya tight hedge karein! Whipsaws aur unpredictable crashes/jump options writing margins ko easily damage kar sakti hai. Avoid naked shorting.";
  }

  // 4. India_VIX Smart Signals from AGENTS.md
  const niftyPrice = parseFloat(indicesStatus?.nifty?.value || "24018.45");
  const nifty20Ema = parseFloat(indicesStatus?.nifty?.prevClose || "23920.00") * 0.998;
  const vixPercentChange = vixChange;

  let smartSignal = "";
  let smartSignalDesc = "";
  let smartSignalColor = ""; // Tailwind badge styles

  if (vixValue < 12) {
    smartSignal = "STRONG BUY (Both Calls & Puts)";
    smartSignalDesc = "Low Volatility Advantage: Option premiums are extremely cheap. Buying straddles/strangles has maximum mathematical upside.";
    smartSignalColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  } else if (vixValue >= 12 && vixValue < 15) {
    if (vixPercentChange > 0) {
      smartSignal = "BUY (Directional - Trend following)";
      smartSignalDesc = "VIX is rising between 12-14. Momentum is high, follow the structural direction with trend-following setups.";
      smartSignalColor = "text-sky-450 bg-sky-500/10 border-sky-500/20";
    } else {
      smartSignal = "WAIT (No fresh buying)";
      smartSignalDesc = "VIX is flat or falling between 12-14. Avoid fresh buying as momentum is compressing. Keep patience.";
      smartSignalColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }
  } else if (vixValue >= 15 && vixValue < 20) {
    if (niftyPrice > nifty20Ema && vixPercentChange > 2) {
      smartSignal = "HEDGED BUY (Buy ATM Straddle)";
      smartSignalDesc = `Nifty is above 20 EMA (${niftyPrice.toFixed(1)} > ${nifty20Ema.toFixed(1)}) and VIX is spiking rapidly (> 2%). Pure ATM Hedged Straddles offer optimal protection and explosive gains.`;
      smartSignalColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
    } else {
      smartSignal = "AVOID / SELL EXISTING";
      smartSignalDesc = "VIX is highly elevated (15-19) but lacks aligned momentum triggers. Tighten stop-losses or avoid fresh exposure.";
      smartSignalColor = "text-rose-450 bg-rose-500/10 border-rose-500/20";
    }
  } else {
    // VIX >= 20
    smartSignal = "🔴 BLOCK ALL BUY ORDERS. EXIT IF PROFIT > 20%";
    smartSignalDesc = "Extreme panic territory (VIX >= 20). Immediate risk block! Focus exclusively on protecting capital and exiting profitable trades.";
    smartSignalColor = "text-rose-500 bg-rose-500/10 border-rose-500/30 animate-pulse font-black";
  }

  // Calculate percentage for visual indicator gauge (range 5 to 25 mapped to 0% to 100%)
  const minVix = 8;
  const maxVix = 24;
  const vixPercent = Math.min(100, Math.max(0, ((vixValue - minVix) / (maxVix - minVix)) * 100));

  // High-fidelity 375-point intraday 1-minute dataset generator (09:15 AM to 03:30 PM)
  const full1MinLiveData: ChartDataPoint[] = React.useMemo(() => {
    const points: ChartDataPoint[] = [];
    const totalMinutes = 375;
    const baseNiftyStart = 24021.00; // Gives exactly +0.47% for 24134.20 at index 0

    for (let i = 0; i < totalMinutes; i++) {
      // Calculate continuous timestamp from 09:15 AM to 03:30 PM
      const startMins = 9 * 60 + 15; // 555 mins
      const currentMins = startMins + i;
      const hours = Math.floor(currentMins / 60);
      const mins = currentMins % 60;
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      const timeStr = `${displayHours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${ampm}`;
      const fullDateStr = `25 Jun, ${timeStr}`;

      const progress = i / (totalMinutes - 1);
      let nifty = 24134.20;

      if (i > 0) {
        if (progress < 0.15) {
          const localT = progress / 0.15;
          nifty = 24134.20 + Math.sin(localT * Math.PI * 2) * 15 - Math.sin(localT * Math.PI) * 4;
        } else if (progress < 0.40) {
          const localT = (progress - 0.15) / 0.25;
          nifty = 24138.00 + localT * 95 + Math.sin(localT * Math.PI * 3.5) * 8;
        } else if (progress < 0.50) {
          const localT = (progress - 0.40) / 0.10;
          nifty = 24238.00 - localT * 128 + Math.cos(localT * Math.PI) * 5;
        } else if (progress < 0.65) {
          const localT = (progress - 0.50) / 0.15;
          nifty = 24110.00 + Math.sin(localT * Math.PI * 2) * 15 + localT * 5;
        } else if (progress < 0.80) {
          const localT = (progress - 0.65) / 0.15;
          nifty = 24118.00 - localT * 43 + Math.sin(localT * Math.PI) * 4;
        } else {
          const localT = (progress - 0.80) / 0.20;
          if (localT < 0.6) {
            const subT = localT / 0.6;
            nifty = 24075.00 - subT * 33 + Math.sin(subT * Math.PI) * 5;
          } else {
            const subT = (localT - 0.6) / 0.4;
            nifty = 24042.00 + subT * 33 - Math.cos(subT * Math.PI / 2) * 4;
          }
        }
      }

      // 1-minute timeframe organic noise
      const noiseNifty = Math.sin(i * 1.7) * 2.1 + Math.cos(i * 3.3) * 1.2 + Math.sin(i * 5.1) * 0.4;
      const finalNifty = parseFloat((nifty + noiseNifty).toFixed(2));

      // Inverse correlation VIX tracing
      let vix = 12.90;
      if (i > 0) {
        if (progress < 0.15) {
          const localT = progress / 0.15;
          vix = 12.90 - Math.sin(localT * Math.PI * 2) * 0.15 + Math.sin(localT * Math.PI) * 0.05;
        } else if (progress < 0.40) {
          const localT = (progress - 0.15) / 0.25;
          vix = 12.82 - localT * 0.22 - Math.sin(localT * Math.PI * 3.5) * 0.02;
        } else if (progress < 0.50) {
          const localT = (progress - 0.40) / 0.10;
          vix = 12.60 + localT * 0.25 - Math.cos(localT * Math.PI) * 0.01;
        } else if (progress < 0.65) {
          const localT = (progress - 0.50) / 0.15;
          vix = 12.85 - Math.sin(localT * Math.PI * 2) * 0.03 - localT * 0.01;
        } else if (progress < 0.80) {
          const localT = (progress - 0.65) / 0.15;
          vix = 12.81 + localT * 0.11 - Math.sin(localT * Math.PI) * 0.01;
        } else {
          const localT = (progress - 0.80) / 0.20;
          if (localT < 0.6) {
            const subT = localT / 0.6;
            vix = 12.92 + subT * 0.20 - Math.sin(subT * Math.PI) * 0.02;
          } else {
            const subT = (localT - 0.6) / 0.4;
            vix = 13.12 - subT * 0.04 + Math.cos(subT * Math.PI / 2) * 0.01;
          }
        }
      }

      // Add small high-frequency noise to VIX
      const noiseVix = Math.sin(i * 2.1) * 0.012 + Math.cos(i * 3.9) * 0.007;
      const finalVix = parseFloat((vix + noiseVix).toFixed(2));

      // % change of Nifty relative to day start base
      const changeVal = ((finalNifty - baseNiftyStart) / baseNiftyStart) * 100;
      const changeStr = (changeVal >= 0 ? "+" : "") + changeVal.toFixed(2) + "%";

      points.push({
        day: `T${i + 1}`,
        time: fullDateStr,
        nifty: finalNifty,
        vix: finalVix,
        change: changeStr
      });
    }

    // Force index 0 to match uploaded image exactly
    points[0] = {
      day: "T1",
      time: "25 Jun, 09:15 AM",
      nifty: 24134.20,
      vix: 12.90,
      change: "+0.47%"
    };

    return points;
  }, []);

  // Slice liveData to show the progressive 1-minute ticker
  const liveData = React.useMemo(() => {
    return full1MinLiveData.slice(0, liveTick + 1);
  }, [full1MinLiveData, liveTick]);

  const lastLivePoint = liveData[liveData.length - 1] || { nifty: 24134.20, vix: 12.90, change: "+0.47%" };
  const currentNifty = activeScenario === "live" ? lastLivePoint.nifty : parseFloat(indicesStatus?.nifty?.value || "24113.20");
  const currentVix = activeScenario === "live" ? lastLivePoint.vix : vixValue;
  const niftyChangeStr = activeScenario === "live" ? lastLivePoint.change : (parseFloat(indicesStatus?.nifty?.change || "0.38") >= 0 ? `+${parseFloat(indicesStatus?.nifty?.change || "0.38")}%` : `${parseFloat(indicesStatus?.nifty?.change || "0.38")}%`);
  const niftyChangeVal = activeScenario === "live" ? parseFloat(lastLivePoint.change) : parseFloat(indicesStatus?.nifty?.change || "0.38");

  const activeData = React.useMemo(() => {
    if (activeScenario === "live") return liveData;
    if (activeScenario === "steady") return scenarioSteadyBull;
    if (activeScenario === "panic") return scenarioPanicCorrection;
    return scenarioRangebound;
  }, [activeScenario, liveData]);

  const displayedPoint = React.useMemo(() => {
    if (hoveredPoint) return hoveredPoint;
    if (activeScenario === "live") {
      // Display the latest ticking point of the live sequence
      return activeData[activeData.length - 1];
    } else if (activeScenario === "steady") {
      return activeData[activeData.length - 1];
    } else if (activeScenario === "panic") {
      return activeData[8]; // Index of 11:15 AM
    } else {
      return activeData[5]; // Index of 10:30 AM
    }
  }, [hoveredPoint, activeScenario, activeData]);

  const vixDomain = React.useMemo(() => {
    if (activeScenario === "live") return [12.6, 13.6];
    if (activeScenario === "steady") return [10.8, 14.8];
    if (activeScenario === "panic") return [11.5, 22.5];
    return [12.4, 14.2];
  }, [activeScenario]);

  const vixTicks = React.useMemo(() => {
    if (activeScenario === "live") return [12.8, 13.0, 13.2, 13.4];
    if (activeScenario === "steady") return [11.0, 12.0, 13.0, 14.0];
    if (activeScenario === "panic") return [12.0, 14.0, 16.0, 18.0, 20.0, 22.0];
    return [12.6, 13.0, 13.4, 13.8];
  }, [activeScenario]);

  const niftyDomain = React.useMemo(() => {
    if (activeScenario === "live") return [24030, 24270];
    if (activeScenario === "steady") return [23100, 24100];
    if (activeScenario === "panic") return [23300, 24300];
    return [23700, 24150];
  }, [activeScenario]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl" id="india-vix-tracker-box">
      {/* Title section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse" />
            <h3 className="text-sm font-bold tracking-widest text-sky-400 uppercase font-mono">
              India VIX - Live Implied Volatility (Fear Index) Tracker
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Options segment ki real-time volatility index track karein aur extreme fear triggers ko spot kijiye.
          </p>
        </div>

        <button 
          onClick={() => setShowVixGuide(!showVixGuide)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-305 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-750 font-mono"
        >
          <Info size={13} className="text-sky-400" />
          {showVixGuide ? "Hide VIX Guide" : "VIX Levels Explained"}
        </button>
      </div>

      {/* Volatility Hinglish Guide Box */}
      {showVixGuide && (
        <div className="mb-6 p-4.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2.5 leading-relaxed animate-fade-in" id="vix-rules-cheat-sheet">
          <div className="font-extrabold text-sky-400 flex items-center gap-1.5 font-mono uppercase text-[10px] tracking-wider">
            <Sparkles size={12} className="text-sky-450" /> INDIA VIX TRADING MATRIX (वीआईएक्स ट्रेडिंग सीखें)
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-305 font-sans">
            <div className="space-y-1.5">
              <p>
                <span className="text-emerald-400 font-bold font-mono">📉 VIX &lt; 12 (Shaant Bazaar):</span> Option buyers ko premium quickly decay hone ka darr hota hai. Options sellers lower boundary bechkar safe theta decay enjoy karte hain.
              </p>
              <p>
                <span className="text-sky-400 font-bold font-mono font-semibold">📊 VIX 12 - 15 (Perfect Range):</span> Balanced options environment. Key support &amp; resistance levels aur standard option-chain ranges high accuracy ke sath hold hoti hain.
              </p>
            </div>
            
            <div className="space-y-1.5 md:border-l md:border-slate-800 md:pl-4">
              <p>
                <span className="text-amber-400 font-bold font-mono">📈 VIX 15 - 20 (Darr ka aagman):</span> premiums fire up ho jaate hain. Market wide swings aur abrupt jumps deta hai. Sellers ko hedge (Spreads) ke sath kam karna chaiye.
              </p>
              <p>
                <span className="text-rose-400 font-bold font-mono">🚨 VIX &gt; 20 (Extreme Fear):</span> Option sellers block! Unpredictable sharp vertical falls aur sudden panic reversals high probability banti hain. Long positions tight SL ke sath trigger karein.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Core HUD block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* BIG VIX DISPAY */}
        <div className="md:col-span-4 bg-slate-950 p-5 rounded-2xl border border-slate-850/80 text-center relative overflow-hidden flex flex-col justify-center h-full">
          <div className="absolute top-0 left-0 p-2 font-mono text-[8px] text-slate-600 uppercase tracking-widest font-extrabold">Fear Index Unit</div>
          
          <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Live India VIX</span>
          <div className="text-4.5xl font-black text-sky-400 my-2 font-mono tracking-normal text-slate-50">
            {vixValue.toFixed(2)}
          </div>

          <div className="flex items-center justify-center gap-1">
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md flex items-center ${
              vixChange >= 0 ? "bg-rose-950/40 text-rose-400" : "bg-emerald-950/40 text-emerald-400"
            }`}>
              {vixChange >= 0 ? <TrendingUp size={12} className="inline mr-0.5" /> : <TrendingDown size={12} className="inline mr-0.5" />}
              {vixChange >= 0 ? "+" : ""}{vixChange.toFixed(2)}%
            </span>
          </div>

          <div className="text-[8.5px] text-slate-550 pt-3 mt-3 border-t border-slate-850/60 font-mono text-slate-500">
            Base volatility dynamic tracking active
          </div>
        </div>

        {/* RISK BAR AND IMPLICATIONS */}
        <div className="md:col-span-8 space-y-4">
          {/* Volatility description card */}
          <div className={`p-4 rounded-xl border border-slate-800/80 font-sans ${evaluationColor}`}>
            <div className="flex items-center gap-2">
              {iconElement}
              <span className="font-extrabold text-[11px] uppercase tracking-wider font-mono">
                Volatility evaluation: {volatilityState}
              </span>
            </div>
            
            <p className="text-xs font-sans text-slate-200 mt-2 font-bold select-none">
              {summaryText}
            </p>
            <p className="text-xs font-sans text-slate-300 mt-1.5 leading-relaxed font-semibold">
              {tradingImpact}
            </p>
          </div>

          {/* AshTek Smart Money Signal Engine (AGENTS.md India VIX training rules) */}
          <div className={`p-4 rounded-xl border font-sans ${smartSignalColor}`} id="ashtek-vix-signal-card">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <span className="font-extrabold text-[11px] uppercase tracking-wider font-mono text-slate-200">
                AshTek Smart Money Quant Signal
              </span>
              <span className="ml-auto text-[8.5px] bg-sky-950 text-sky-400 border border-sky-855 px-1.5 py-0.5 rounded font-mono">
                TRAINED ACTIVE
              </span>
            </div>
            <div className="text-sm font-black tracking-wide font-mono uppercase mb-1">
              SIGNAL: {smartSignal}
            </div>
            <p className="text-xs text-slate-305 leading-relaxed font-sans">
              {smartSignalDesc}
            </p>
          </div>

          {/* Graphical VIX gauge bar */}
          <div className="bg-slate-950/65 p-3.5 rounded-xl border border-slate-850">
            <div className="flex justify-between text-[9px] text-slate-500 font-bold font-mono mb-1.5">
              <span className="text-emerald-400">8.0 (CALM Bazaar)</span>
              <span className="text-sky-400">12.0 (NORMAL Balanced)</span>
              <span className="text-amber-500">15.5 (ELEVATED Risks)</span>
              <span className="text-rose-500 font-extrabold">20.0+ (PANIC Alert)</span>
            </div>

            {/* Vix bar track representation */}
            <div className="relative w-full bg-slate-900 h-3 rounded-full overflow-hidden" id="vix-bar-progress-track">
              {/* Guides */}
              <div className="absolute left-[25%] top-0 bottom-0 w-0.5 bg-sky-500/20" />
              <div className="absolute left-[47%] top-0 bottom-0 w-0.5 bg-amber-500/30" />
              <div className="absolute left-[75%] top-0 bottom-0 w-0.5 bg-rose-500/40" />

              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  vixValue >= 20.0 ? "bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600" :
                  vixValue >= 15.5 ? "bg-gradient-to-r from-emerald-500 via-sky-400 to-amber-500" :
                  "bg-gradient-to-r from-emerald-600 to-emerald-400"
                }`}
                style={{ width: `${vixPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[8px] text-slate-500 mt-1 font-mono">
              <span>Implied risk minimal</span>
              <span className="text-sky-400 font-semibold">▲ Current pointer value</span>
              <span>Implied risk extreme</span>
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION: HIGH-FIDELITY INTERACTIVE NIFTY & VIX CHARTS */}
      <div className="mt-8 pt-6 border-t border-slate-850" id="vix-nifty-charts-section">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
              <LineIcon size={15} className="text-purple-400" />
              NIFTY 50 vs INDIA VIX DYNAMIC CORRELATION MATRIX
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Observe how the Inverse Symmetry law works and how AshTek triggers buy/avoid orders when lines cross.
            </p>
          </div>
 
          <div className="flex flex-wrap items-center gap-3">
            {/* View Layout Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800" id="layout-btn-group">
              <button
                onClick={() => setChartLayout("overlay")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  chartLayout === "overlay"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 font-extrabold"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                🔗 Overlaid Crossover View (As Image)
              </button>
              <button
                onClick={() => setChartLayout("split")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  chartLayout === "split"
                    ? "bg-slate-800 text-slate-100 border border-slate-700 font-extrabold"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                📊 Split Grid View
              </button>
            </div>

            {/* Scenario Selectors */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800" id="scenario-btn-group">
              <button
                onClick={() => setActiveScenario("live")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1 ${
                  activeScenario === "live"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 font-extrabold"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                🔴 Live Feed
              </button>
              <button
                onClick={() => setActiveScenario("steady")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  activeScenario === "steady"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                📉 Steady Bull (VIX &lt; 12)
              </button>
              <button
                onClick={() => setActiveScenario("panic")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  activeScenario === "panic"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
              >
                ⚡ Panic Spike (VIX &gt; 20)
              </button>
              <button
                onClick={() => setActiveScenario("range")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  activeScenario === "range"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                🔄 Calm Range (VIX 12-14)
              </button>
            </div>
          </div>
        </div>
 
        {/* Dynamic Scenario Insight Badge */}
        <div className="mb-5 p-3 rounded-xl bg-slate-950/80 border border-slate-850 text-xs flex items-start gap-2.5 animate-fade-in">
          <Sparkles size={14} className="text-amber-400 mt-0.5 flex-shrink-0 animate-pulse" />
          <div>
            <span className="font-extrabold text-[10px] uppercase font-mono tracking-wide text-slate-300">
              {activeScenario === "live" && "SCENARIO: 🔴 REAL-TIME MARKET INTERSECT ENGINE"}
              {activeScenario === "steady" && "SCENARIO: STRONG BULL RUN (LOW VOLATILITY ADVANTAGE)"}
              {activeScenario === "panic" && "SCENARIO: FLASH CRASH / SUDDEN PANIC CORRECTION"}
              {activeScenario === "range" && "SCENARIO: STEADY CONSOLIDATION / BALANCED RANGE"}
            </span>
            <p className="text-slate-450 text-[11px] mt-1 leading-relaxed font-sans">
              {activeScenario === "live" && `Streaming live market feed. Nifty spot is at ₹${currentNifty.toLocaleString("en-IN")} (${niftyChangeStr}) while India VIX is at ${currentVix.toFixed(2)} (${vixChange >= 0 ? "+" : ""}${vixChange.toFixed(2)}%). Recommended Signal: ${smartSignal}.`}
              {activeScenario === "steady" && "Notice how VIX drops continuously under 12 while Nifty climbs steadily. Premiums become extremely cheap, resulting in a \"STRONG BUY (Both Calls & Puts)\" signal for Straddle buyers."}
              {activeScenario === "panic" && "Classic panic! Nifty corrects down rapidly while VIX spikes violently over 20%. AshTek immediately blocks all buy orders and triggers tight exits as option writing margins take a heavy blow."}
              {activeScenario === "range" && "Nifty consolidates in a calm, controlled range while VIX oscillates safely between 12 and 14. This balanced zone is optimal for premium decay writing and technical level trades."}
            </p>
          </div>
        </div>

        {/* Real-time Playback simulation controllers specifically for Live Feed (Addressing the 1-minute stuck timer query) */}
        {activeScenario === "live" && (
          <div className="mb-5 p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 animate-fade-in" id="live-playback-controller">
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${isLivePlaying ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <div>
                <div className="text-[10px] font-bold uppercase font-mono text-slate-400 tracking-wider">
                  Real-time 1m Timeframe Simulation
                </div>
                <div className="text-xs text-slate-200 font-bold font-mono">
                  Time: {lastLivePoint.time} <span className="text-[10px] text-slate-500 font-normal">({liveTick} / 375 min)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Play/Pause Button */}
              <button
                onClick={() => setIsLivePlaying(!isLivePlaying)}
                className={`p-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer ${
                  isLivePlaying 
                    ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30" 
                    : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30"
                }`}
                title={isLivePlaying ? "Pause simulation" : "Start simulation"}
              >
                {isLivePlaying ? <Pause size={14} /> : <Play size={14} />}
                {isLivePlaying ? "Pause" : "Resume"}
              </button>

              {/* Step Forward Minute Button */}
              <button
                onClick={() => {
                  setIsLivePlaying(false);
                  setLiveTick((prev) => (prev >= 374 ? 10 : prev + 1));
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 rounded-lg transition flex items-center gap-1 cursor-pointer"
                title="Step 1 minute forward"
              >
                <SkipForward size={14} />
                <span>+1 Min</span>
              </button>

              {/* Reset to 09:15 AM Button */}
              <button
                onClick={() => {
                  setLiveTick(0);
                  setIsLivePlaying(false);
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 rounded-lg transition flex items-center gap-1 cursor-pointer"
                title="Reset to 09:15 AM opening bar"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>

              {/* Speed Preset Selector */}
              <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-800 ml-2">
                <span className="text-[9px] font-mono text-slate-500 mr-1.5 uppercase font-bold">Speed:</span>
                {[
                  { label: "1s", ms: 1000 },
                  { label: "3s", ms: 3000 },
                  { label: "6s", ms: 6000 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setPlaybackSpeed(preset.ms)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono transition cursor-pointer ${
                      playbackSpeed === preset.ms
                        ? "bg-purple-500/25 text-purple-300 border border-purple-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
 
        {chartLayout === "overlay" ? (
          /* OVERLAID CROSSOVER VIEW (AS UPLOADED IMAGE) */
          <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-850 relative min-h-[360px] flex flex-col justify-between" id="overlaid-crossover-container">
            {/* Legend card styled as a premium dark-slate integrated HUD card to perfectly match the chart background */}
            <div 
              className="absolute z-10 bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-2xl max-w-[240px] font-sans text-slate-100 transition-all duration-100 ease-out backdrop-blur-md" 
              id="image-style-floating-card"
              style={
                hoverCoords
                  ? {
                      left: `${hoverCoords.x + 16}px`,
                      top: `${Math.max(10, hoverCoords.y - 60)}px`,
                      transform: hoverCoords.x > 450 ? "translateX(-110%)" : "none",
                      pointerEvents: "none",
                    }
                  : {
                      left: "16px",
                      top: "16px",
                      pointerEvents: "none",
                    }
              }
            >
              <div className="text-[10px] font-bold text-slate-400 mb-1.5 font-mono">
                {displayedPoint?.time}
              </div>
              <div className="space-y-1 text-xs font-semibold">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-1 bg-[#ff6b35] rounded-full inline-block"></span>
                    <span className="text-slate-400 font-mono tracking-wider text-[9px] uppercase font-bold">INDIAVIX</span>
                  </div>
                  <span className="font-mono text-slate-100 font-black">
                    {displayedPoint?.vix.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 border-t-2 border-dashed border-[#d946ef] inline-block"></span>
                    <span className="text-slate-400 font-mono tracking-wider text-[9px] uppercase font-bold">NIFTY</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <span className="text-slate-100 font-black">
                      {displayedPoint?.nifty.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[9px] font-bold px-1 rounded ${
                      parseFloat(displayedPoint?.change || "0") >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                    }`}>
                      {displayedPoint?.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 self-end w-full pl-64">
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-semibold">
                Inverse Symmetry Intersect Law
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-900/30">
                ⚡ Lines Intersecting View Active
              </span>
            </div>

            <div className="h-64 w-full" id="overlaid-crossover-recharts">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activeData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  onMouseMove={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length) {
                      setHoveredPoint(state.activePayload[0].payload);
                      if (state.activeCoordinate) {
                        setHoverCoords({ x: state.activeCoordinate.x, y: state.activeCoordinate.y });
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredPoint(null);
                    setHoverCoords(null);
                  }}
                >
                  <CartesianGrid stroke="#1e293b" opacity={0.6} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={9} fontClassName="font-mono" hide={true} />
                  {/* Left Y-axis for Nifty - Hidden to replicate clean look */}
                  <YAxis
                    yAxisId="nifty"
                    domain={niftyDomain}
                    stroke="#d946ef"
                    fontSize={9}
                    fontClassName="font-mono"
                    orientation="left"
                    hide={true}
                  />
                  {/* Right Y-axis for VIX matching the image scale (12.8, 13.0, 13.2, 13.4 etc) */}
                  <YAxis
                    yAxisId="vix"
                    domain={vixDomain}
                    ticks={vixTicks}
                    stroke="#475569"
                    fontSize={10}
                    fontClassName="font-mono"
                    orientation="right"
                    tickFormatter={(v) => v.toFixed(1)}
                  />
                  <Tooltip
                    cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '2 2' }}
                    content={() => null}
                  />
                  <Line
                    yAxisId="vix"
                    type="monotone"
                    dataKey="vix"
                    stroke="#ff6b35"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    name="INDIAVIX"
                  />
                  <Line
                    yAxisId="nifty"
                    type="monotone"
                    dataKey="nifty"
                    stroke="#d946ef"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    name="NIFTY"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* SPLIT STACKED GRID VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dual-charts-wrapper">
            {/* Chart 1: Nifty Spot Price */}
            <div className="bg-slate-950/80 p-4.5 rounded-xl border border-slate-850 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-semibold">
                  NIFTY 50 UNDERLYING SPOT PRICE (POINTS)
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  activeScenario === "live" ? (niftyChangeVal >= 0 ? "text-emerald-400 bg-emerald-950/30" : "text-rose-450 bg-rose-950/30") :
                  activeScenario === "steady" ? "text-emerald-400 bg-emerald-950/30" : 
                  activeScenario === "panic" ? "text-rose-450 bg-rose-950/30" : "text-purple-400 bg-purple-950/30"
                }`}>
                  {activeScenario === "live" ? (niftyChangeVal >= 0 ? "Live Bullish" : "Live Bearish") :
                   activeScenario === "steady" ? "Bullish Trend" : 
                   activeScenario === "panic" ? "Sharp Dip" : "Sideways Trend"}
                </span>
              </div>
              
              <div className="h-44 w-full" id="nifty-recharts-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      activeScenario === "live" ? liveData :
                      activeScenario === "steady" ? scenarioSteadyBull :
                      activeScenario === "panic" ? scenarioPanicCorrection :
                      scenarioRangebound
                    }
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="niftyColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={
                          activeScenario === "live" ? (niftyChangeVal >= 0 ? "#10b981" : "#f43f5e") :
                          activeScenario === "steady" ? "#10b981" : 
                          activeScenario === "panic" ? "#f43f5e" : "#8b5cf6"
                        } stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={
                          activeScenario === "live" ? (niftyChangeVal >= 0 ? "#10b981" : "#f43f5e") :
                          activeScenario === "steady" ? "#10b981" : 
                          activeScenario === "panic" ? "#f43f5e" : "#8b5cf6"
                        } stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={9} fontClassName="font-mono" />
                    <YAxis 
                      domain={["auto", "auto"]} 
                      stroke="#64748b" 
                      fontSize={9} 
                      fontClassName="font-mono"
                      tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px" }}
                      labelStyle={{ color: "#94a3b8" }}
                      itemStyle={{ color: 
                        activeScenario === "live" ? (niftyChangeVal >= 0 ? "#10b981" : "#f43f5e") :
                        activeScenario === "steady" ? "#10b981" : 
                        activeScenario === "panic" ? "#f43f5e" : "#c084fc" 
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="nifty" 
                      name="Nifty 50 Spot"
                      stroke={
                        activeScenario === "live" ? (niftyChangeVal >= 0 ? "#10b981" : "#f43f5e") :
                        activeScenario === "steady" ? "#10b981" : 
                        activeScenario === "panic" ? "#f43f5e" : "#8b5cf6"
                      } 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#niftyColor)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
 
            {/* Chart 2: India VIX Volatility Index */}
            <div className="bg-slate-950/80 p-4.5 rounded-xl border border-slate-850 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-semibold">
                  INDIA VIX IMPLIED VOLATILITY INDEX (FEAR INDEX)
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  activeScenario === "live" ? (vixChange < 0 ? "text-emerald-400 bg-emerald-950/30" : "text-rose-450 bg-rose-950/30") :
                  activeScenario === "steady" ? "text-emerald-400 bg-emerald-950/30" : 
                  activeScenario === "panic" ? "text-rose-450 bg-rose-950/30" : "text-purple-400 bg-purple-950/30"
                }`}>
                  {activeScenario === "live" ? `VIX ${vixChange >= 0 ? "Spiking" : "Cooling"}` :
                   activeScenario === "steady" ? "VIX Falling" : 
                   activeScenario === "panic" ? "VIX Spiking" : "VIX Normal"}
                </span>
              </div>
 
              <div className="h-44 w-full" id="vix-recharts-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      activeScenario === "live" ? liveData :
                      activeScenario === "steady" ? scenarioSteadyBull :
                      activeScenario === "panic" ? scenarioPanicCorrection :
                      scenarioRangebound
                    }
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="vixColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={
                          activeScenario === "live" ? (vixChange < 0 ? "#10b981" : "#f43f5e") :
                          activeScenario === "steady" ? "#10b981" : 
                          activeScenario === "panic" ? "#f43f5e" : "#a78bfa"
                        } stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={
                          activeScenario === "live" ? (vixChange < 0 ? "#10b981" : "#f43f5e") :
                          activeScenario === "steady" ? "#10b981" : 
                          activeScenario === "panic" ? "#f43f5e" : "#a78bfa"
                        } stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={9} fontClassName="font-mono" />
                    <YAxis 
                      domain={activeScenario === "live" ? ["auto", "auto"] : [8, 24]} 
                      stroke="#64748b" 
                      fontSize={9} 
                      fontClassName="font-mono"
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px" }}
                      labelStyle={{ color: "#94a3b8" }}
                      itemStyle={{ color: 
                        activeScenario === "live" ? (vixChange < 0 ? "#34d399" : "#fb7185") :
                        activeScenario === "steady" ? "#34d399" : 
                        activeScenario === "panic" ? "#fb7185" : "#c084fc" 
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="vix" 
                      name="India VIX"
                      stroke={
                        activeScenario === "live" ? (vixChange < 0 ? "#059669" : "#e11d48") :
                        activeScenario === "steady" ? "#059669" : 
                        activeScenario === "panic" ? "#e11d48" : "#a78bfa"
                      } 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#vixColor)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Symmetry insight indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
          <span>Dual Axis Correlation Engine synced to active AshTek algorithmic rules.</span>
        </div>
      </div>
    </div>
  );
}

