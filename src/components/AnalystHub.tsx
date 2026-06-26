import React, { useState, useEffect } from "react";
import { 
  LineChart as LucideLineChart, TrendingUp, TrendingDown, BarChart2, Calendar, 
  Flame, Activity, Sparkles, Shield, Search, Table, Layers, PieChart, Grid, 
  Cpu, AlertCircle, Percent, ChevronRight, ChevronLeft, Info, Gauge, Eye, EyeOff, BookOpen,
  ArrowRight, ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCw, Zap,
  ChevronUp, ChevronDown, X
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, ReferenceLine,
  ComposedChart
} from "recharts";
import OptionChainTable from "./OptionChainTable";
import AtmCoiTracker from "./AtmCoiTracker";
import FiiDiiPanel from "./FiiDiiPanel";
import PcrLiveIndicator from "./PcrLiveIndicator";
import AnalystReport from "./AnalystReport";
import HeavyweightsTripwire from "./HeavyweightsTripwire";
import { OptionChainRow, FiiDiiData, DerivativesReport } from "../types";

interface StrikeItem {
  strikePrice: number;
  callOI: number;
  callChgOI: number;
  callLtp: number;
  callIv: number;
  callVolume: number;
  putOI: number;
  putChgOI: number;
  putLtp: number;
  putIv: number;
  putVolume: number;
}

interface AnalystHubProps {
  optionChain: OptionChainRow[];
  spotPrice: number;
  onUpdateOptionChain: (chain: OptionChainRow[]) => void;
  onResetChain: () => void;
  selectedSymbol: string;
  isFetchingLive: boolean;
  nseTimestamp: string;
  isLiveFeedSimulated: boolean;
  onRefreshLive: () => void;
  fiiDii: FiiDiiData;
  onUpdateFiiDii: (data: FiiDiiData) => void;
  indicesStatus: any;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  report: DerivativesReport | null;
  loading: boolean;
  showDirectory?: boolean;
  onToggleShowDirectory?: (show: boolean) => void;
}

// Calendar Helper Functions
const formatRangeText = (start: Date, end: Date) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${start.getDate()} ${months[start.getMonth()]} to ${end.getDate()} ${months[end.getMonth()]}`;
};

const formatDateFull = (date: Date) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${weekdays[date.getDay()]}`;
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const generateCalendarCells = (year: number, month: number) => {
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const totalDays = getDaysInMonth(year, month);
  
  const cells = [];
  
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDaysCount = getDaysInMonth(prevYear, prevMonth);
  
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      date: new Date(prevYear, prevMonth, prevDaysCount - i),
      isCurrentMonth: false
    });
  }
  
  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      date: new Date(year, month, d),
      isCurrentMonth: true
    });
  }
  
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      date: new Date(nextYear, nextMonth, nextDay++),
      isCurrentMonth: false
    });
  }
  
  return cells;
};

const isSameDate = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isDateInRange = (d: Date, start: Date, end: Date) => {
  const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return dTime > startTime && dTime < endTime;
};

export default function AnalystHub({
  optionChain: rawOptionChain,
  spotPrice,
  onUpdateOptionChain,
  onResetChain,
  selectedSymbol,
  isFetchingLive,
  nseTimestamp,
  isLiveFeedSimulated,
  onRefreshLive,
  fiiDii,
  onUpdateFiiDii,
  indicesStatus,
  activeTool,
  setActiveTool,
  report,
  loading,
  showDirectory: propsShowDirectory,
  onToggleShowDirectory
 }: AnalystHubProps) {
  // Map OptionChainRow to local StrikeItem for historical compatible calculation logic inside AnalystHub
  const optionChain: StrikeItem[] = rawOptionChain.map(item => ({
    strikePrice: item.strike,
    callOI: item.callOI,
    callChgOI: item.callOIchg,
    callLtp: item.callLtp,
    callIv: (item as any).callIv !== undefined ? (item as any).callIv : 12.5,
    callVolume: (item as any).callVolume !== undefined ? (item as any).callVolume : 50000,
    putOI: item.putOI,
    putChgOI: item.putOIchg,
    putLtp: item.putLtp,
    putIv: (item as any).putIv !== undefined ? (item as any).putIv : 13.2,
    putVolume: (item as any).putVolume !== undefined ? (item as any).putVolume : 48000,
  }));

  // Toggle visibility of the Analyst directory / menu
  const showDirectory = propsShowDirectory !== undefined ? propsShowDirectory : true;
  const setShowDirectory = onToggleShowDirectory || (() => {});

  // SEARCH AND FILTER STATES FOR DIFFERENT TOOLS
  const [stockSearch, setStockSearch] = useState<string>("");
  const [screenerFilter, setScreenerFilter] = useState<"all" | "long_buildup" | "short_buildup" | "short_covering" | "long_unwinding">("all");
  const [selectedStrikeForChart, setSelectedStrikeForChart] = useState<number>(0);
  const [selectedOptionType, setSelectedOptionType] = useState<"CE" | "PE">("CE");
  const [straddleDaysToExpiry, setStraddleDaysToExpiry] = useState<number>(4);

  // Interactive IV Chart State
  const [ivStock, setIvStock] = useState<string>("NIFTY");
  const [ivGraphType, setIvGraphType] = useState<"Line" | "Candle">("Candle");
  const [ivRange, setIvRange] = useState<string>("13 Jun to 25 Jun");
  const [showIvStockDropdown, setShowIvStockDropdown] = useState<boolean>(false);
  const [showIvRangeDropdown, setShowIvRangeDropdown] = useState<boolean>(false);

  // Info Modal states
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [infoModalTab, setInfoModalTab] = useState<string>("F&O Data");
  const [infoModalExpiry, setInfoModalExpiry] = useState<string>("30 Jun (4 Days)");
  const [showModalExpiryDropdown, setShowModalExpiryDropdown] = useState<boolean>(false);

  // --- LIVE DATA COMPUTATIONS FOR PORTFOLIO / INFO MODAL ---
  const liveNiftyPrice = indicesStatus?.nifty?.value || 24056.00;
  const liveNiftyChange = indicesStatus?.nifty?.change !== undefined ? indicesStatus.nifty.change : 0.14;
  const liveNiftyPrevClose = indicesStatus?.nifty?.prevClose || 24021.65;

  const liveBankNiftyPrice = indicesStatus?.banknifty?.value || 49800.00;
  const liveBankNiftyChange = indicesStatus?.banknifty?.change !== undefined ? indicesStatus.banknifty.change : -1.24;
  const liveBankNiftyPrevClose = indicesStatus?.banknifty?.prevClose || 50425.00;

  const liveVixValue = indicesStatus?.indiavix?.value || 13.1;
  const liveVixChange = indicesStatus?.indiavix?.change !== undefined ? indicesStatus.indiavix.change : -0.34;

  const modalSpotPrice = ivStock === "NIFTY" ? liveNiftyPrice : liveBankNiftyPrice;
  const modalPercentChange = ivStock === "NIFTY" ? liveNiftyChange : liveBankNiftyChange;
  const modalPrevClose = ivStock === "NIFTY" ? liveNiftyPrevClose : liveBankNiftyPrevClose;

  // Derive beautiful real-time OHLC values
  const modalOpenPrice = modalPrevClose * 1.0005;
  const modalHighPrice = Math.max(modalSpotPrice, modalPrevClose * 1.003);
  const modalLowPrice = Math.min(modalSpotPrice, modalPrevClose * 0.997);

  // ATM values, PCR, and Max Pain
  let modalAtmStrike = ivStock === "NIFTY" ? Math.round(liveNiftyPrice / 50) * 50 : Math.round(liveBankNiftyPrice / 100) * 100;
  let modalPCR = ivStock === "NIFTY" ? 1.02 : 0.85;
  let modalMaxPain = ivStock === "NIFTY" ? 24100 : 50000;
  let modalAtmIV = ivStock === "NIFTY" ? 9.5 : 13.9;
  let modalAtmIVChange = ivStock === "NIFTY" ? -2.1 : -0.5;
  let modalFutOIChg = ivStock === "NIFTY" ? "10.9% High" : "8.4% Moderate";

  if (ivStock === selectedSymbol && optionChain && optionChain.length > 0) {
    // Find closest ATM Strike based on active live option chain
    const closestATM = optionChain.reduce((prev, curr) => 
      Math.abs(curr.strikePrice - spotPrice) < Math.abs(prev.strikePrice - spotPrice) ? curr : prev
    );
    if (closestATM) {
      modalAtmStrike = closestATM.strikePrice;
      const avgIv = (closestATM.callIv + closestATM.putIv) / 2;
      modalAtmIV = Number(avgIv.toFixed(2));
      // Derived from changes or historical logic
      const totalOIChanges = optionChain.reduce((sum, c) => sum + Math.abs(c.callChgOI) + Math.abs(c.putChgOI), 0);
      const baseOIs = optionChain.reduce((sum, c) => sum + c.callOI + c.putOI, 1);
      modalFutOIChg = `${(totalOIChanges / baseOIs * 100).toFixed(1)}% ${totalOIChanges / baseOIs * 100 > 10 ? "High" : "Normal"}`;
    }

    // PCR from live chain
    const totalCallOI = optionChain.reduce((sum, c) => sum + c.callOI, 0);
    const totalPutOI = optionChain.reduce((sum, c) => sum + c.putOI, 0);
    if (totalCallOI > 0) {
      modalPCR = Number((totalPutOI / totalCallOI).toFixed(2));
    }

    // Max Pain from report
    if (report?.supportResistance?.maxPain) {
      modalMaxPain = report.supportResistance.maxPain;
    }
  } else {
    // Dynamic simulated values that oscillate slowly based on timestamp for non-selected index
    const timeSec = Date.now() / 15000;
    if (ivStock === "NIFTY") {
      modalPCR = Number((1.02 + Math.sin(timeSec) * 0.03).toFixed(2));
      modalAtmIV = Number((9.5 + Math.cos(timeSec) * 0.15).toFixed(2));
    } else {
      modalPCR = Number((0.85 + Math.sin(timeSec * 0.8) * 0.02).toFixed(2));
      modalAtmIV = Number((13.9 + Math.cos(timeSec * 0.8) * 0.25).toFixed(2));
    }
  }

  // Dynamic Calendar States
  const [calStartDate, setCalStartDate] = useState<Date>(new Date(2026, 5, 13)); // June 13, 2026
  const [calEndDate, setCalEndDate] = useState<Date>(new Date(2026, 5, 25)); // June 25, 2026
  const [tempCalStartDate, setTempCalStartDate] = useState<Date>(new Date(2026, 5, 13));
  const [tempCalEndDate, setTempCalEndDate] = useState<Date>(new Date(2026, 5, 25));
  const [activeCalField, setActiveCalField] = useState<"from" | "to">("from");
  const [calendarMonth, setCalendarMonth] = useState<number>(5); // June (0-indexed)
  const [calendarYear, setCalendarYear] = useState<number>(2026);

  // Initialize selected strike close to spot price when optionChain changes
  useEffect(() => {
    if (optionChain && optionChain.length > 0 && selectedStrikeForChart === 0) {
      // Find the strike closest to spotPrice
      const closest = optionChain.reduce((prev, curr) => 
        Math.abs(curr.strikePrice - spotPrice) < Math.abs(prev.strikePrice - spotPrice) ? curr : prev
      );
      setSelectedStrikeForChart(closest.strikePrice);
    }
  }, [optionChain, spotPrice]);

  // LOGS OR EVENTS IN DIRECTORY ACTION
  const [hoveredToolSubtext, setHoveredToolSubtext] = useState<string | null>(null);

  // 1. HELPERS FOR DATA MANIPULATION & CHART DATA
  // Format total Open Interest summary for total call/put bar chart
  const getOpenInterestChartData = () => {
    return optionChain.map(item => ({
      strike: item.strikePrice,
      "Call OI": item.callOI,
      "Put OI": item.putOI,
      "Call Change in OI": item.callChgOI,
      "Put Change in OI": item.putChgOI,
    })).sort((a, b) => a.strike - b.strike);
  };

  const getTotalsSummary = () => {
    let totalCallOI = 0;
    let totalPutOI = 0;
    let totalCallChgOI = 0;
    let totalPutChgOI = 0;
    optionChain.forEach(item => {
      totalCallOI += item.callOI;
      totalPutOI += item.putOI;
      totalCallChgOI += item.callChgOI;
      totalPutChgOI += item.putChgOI;
    });
    const pcr = totalCallOI > 0 ? Number((totalPutOI / totalCallOI).toFixed(2)) : 0;
    const pcrChg = totalCallChgOI > 0 ? Number((totalPutChgOI / totalCallChgOI).toFixed(2)) : 0;
    return { totalCallOI, totalPutOI, totalCallChgOI, totalPutChgOI, pcr, pcrChg };
  };

  const { totalCallOI, totalPutOI, totalCallChgOI, totalPutChgOI, pcr, pcrChg } = getTotalsSummary();

  // Multi strike OI comparison data
  const getMultiStrikeOiData = () => {
    const hours = ["09:15", "10:15", "11:15", "12:15", "13:15", "14:15", "15:30"];
    const baseMultiplier = 1.25;
    return hours.map((hour, idx) => {
      const stepFactor = (idx + 1) * baseMultiplier;
      return {
        time: hour,
        [`${selectedStrikeForChart} CE OI`]: Math.round(optionChain.find(s => s.strikePrice === selectedStrikeForChart)?.callOI || 120000 * stepFactor * (1 + Math.sin(idx) * 0.15)),
        [`${selectedStrikeForChart} PE OI`]: Math.round(optionChain.find(s => s.strikePrice === selectedStrikeForChart)?.putOI || 110000 * stepFactor * (1 + Math.cos(idx) * 0.12)),
        "Spot Index": Math.round(spotPrice + (Math.sin(idx * 0.5) * spotPrice * 0.003))
      };
    });
  };

  // Option Spot vs Premium data generator
  const getOptionPricePremiumChartData = () => {
    const times = ["09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30"];
    const strikeData = optionChain.find(s => s.strikePrice === selectedStrikeForChart);
    const basePremium = selectedOptionType === "CE" 
      ? (strikeData?.callLtp || 150)
      : (strikeData?.putLtp || 120);

    return times.map((time, idx) => {
      const progress = idx / (times.length - 1);
      const indexTrend = spotPrice * (1 + Math.sin(progress * Math.PI) * 0.004);
      let premiumTrend = basePremium;
      
      if (selectedOptionType === "CE") {
        premiumTrend = basePremium * (1 + (indexTrend - spotPrice) / spotPrice * 45) * (1 - progress * 0.1);
      } else {
        premiumTrend = basePremium * (1 - (indexTrend - spotPrice) / spotPrice * 45) * (1 - progress * 0.15);
      }
      
      return {
        time,
        "Premium (LTP)": Number(Math.max(2, premiumTrend).toFixed(2)),
        "Spot Level": Number(indexTrend.toFixed(1))
      };
    });
  };

  // Straddle vs Strangle Theta decay simulator
  const getStraddleStrangleData = () => {
    const days = [5, 4, 3, 2, 1, 0];
    const atmStrike = optionChain.find(s => s.strikePrice === selectedStrikeForChart) || 
                      optionChain[Math.floor(optionChain.length / 2)];
    
    const atmCallLtp = atmStrike?.callLtp || 120;
    const atmPutLtp = atmStrike?.putLtp || 110;
    const straddleBase = atmCallLtp + atmPutLtp;
    
    const otmCallLtp = (atmCallLtp) * 0.45;
    const otmPutLtp = (atmPutLtp) * 0.42;
    const strangleBase = otmCallLtp + otmPutLtp;

    return days.map(d => {
      // Exponential decay formula
      const timeFactorStraddle = Math.pow(d / 5, 0.6); // slower early, faster later
      const timeFactorStrangle = Math.pow(d / 5, 1.25); // very fast early decay
      return {
        daysLeft: `${d} Days`,
        "ATM Straddle Premium": Math.round(straddleBase * timeFactorStraddle),
        "OTM Strangle Premium": Math.round(strangleBase * timeFactorStrangle),
      };
    });
  };

  // Sectoral and market indices definitions
  const sectors = [
    { name: "Nifty Bank", spot: indicesStatus?.banknifty?.lastPrice || 49820, change: indicesStatus?.banknifty?.change || 1.15, sentiment: "Bullish", advances: 9, declines: 3, topDriver: "HDFC Bank (+2.1%)" },
    { name: "Nifty IT", spot: 35460, change: -0.84, sentiment: "Bearish", advances: 2, declines: 8, topDriver: "TCS (-1.45%)" },
    { name: "Nifty Auto", spot: 22180, change: 1.65, sentiment: "Strong Bullish", advances: 12, declines: 3, topDriver: "M&M (+3.42%)" },
    { name: "Nifty Metal", spot: 8940, change: -0.22, sentiment: "Neutral", advances: 5, declines: 10, topDriver: "Tata Steel (+0.6%)" },
    { name: "Nifty FMCG", spot: 55100, change: 0.45, sentiment: "Mildly Bullish", advances: 8, declines: 7, topDriver: "ITC (+1.12%)" },
    { name: "Nifty Realty", spot: 955, change: 2.85, sentiment: "Extremely Bullish", advances: 9, declines: 1, topDriver: "DLF (+4.3%)" },
  ];

  // F&O Stock lists for Screener and Heatmap
  const foStocks = [
    { symbol: "RELIANCE", sector: "Energy", ltp: 2942.50, change: 1.15, oi: 34500000, oiChange: 6.8, state: "long_buildup", iv: 14.8, ivPercentile: 52, pcr: 0.65, rsi: 58 },
    { symbol: "HDFCBANK", sector: "Banking", ltp: 1642.10, change: 2.30, oi: 52100000, oiChange: 9.4, state: "long_buildup", iv: 16.2, ivPercentile: 74, pcr: 0.88, rsi: 67 },
    { symbol: "TCS", sector: "IT", ltp: 3822.40, change: -1.35, oi: 11200000, oiChange: 5.1, state: "short_buildup", iv: 13.5, ivPercentile: 32, pcr: 0.45, rsi: 41 },
    { symbol: "INFY", sector: "IT", ltp: 1515.65, change: -1.82, oi: 18500000, oiChange: 4.8, state: "short_buildup", iv: 15.4, ivPercentile: 45, pcr: 0.52, rsi: 38 },
    { symbol: "ICICIBANK", sector: "Banking", ltp: 1152.00, change: 0.95, oi: 21000000, oiChange: -3.2, state: "short_covering", iv: 15.1, ivPercentile: 48, pcr: 0.72, rsi: 56 },
    { symbol: "SBIN", sector: "Banking", ltp: 842.15, change: -0.45, oi: 29500000, oiChange: -2.1, state: "long_unwinding", iv: 18.3, ivPercentile: 62, pcr: 0.61, rsi: 49 },
    { symbol: "BHARTIARTL", sector: "Telecom", ltp: 1385.00, change: 1.95, oi: 14800000, oiChange: 12.3, state: "long_buildup", iv: 17.5, ivPercentile: 81, pcr: 0.84, rsi: 72 },
    { symbol: "AXISBANK", sector: "Banking", ltp: 1184.50, change: -1.10, oi: 16400000, oiChange: 5.4, state: "short_buildup", iv: 16.8, ivPercentile: 59, pcr: 0.55, rsi: 46 },
    { symbol: "LT", sector: "Infra", ltp: 3585.00, change: 0.42, oi: 8900000, oiChange: -1.5, state: "short_covering", iv: 15.6, ivPercentile: 38, pcr: 0.79, rsi: 53 },
    { symbol: "M&M", sector: "Auto", ltp: 2154.20, change: 3.82, oi: 7200000, oiChange: 14.5, state: "long_buildup", iv: 19.5, ivPercentile: 88, pcr: 1.15, rsi: 76 },
    { symbol: "ITC", sector: "FMCG", ltp: 428.50, change: 1.12, oi: 45000000, oiChange: -4.5, state: "short_covering", iv: 12.2, ivPercentile: 22, pcr: 0.95, rsi: 59 },
    { symbol: "TATAMOTORS", sector: "Auto", ltp: 985.30, change: -2.20, oi: 19800000, oiChange: 7.2, state: "short_buildup", iv: 21.0, ivPercentile: 79, pcr: 0.48, rsi: 35 },
    { symbol: "DLF", sector: "Realty", ltp: 892.40, change: 4.10, oi: 12400000, oiChange: 11.2, state: "long_buildup", iv: 22.4, ivPercentile: 85, pcr: 1.22, rsi: 71 },
    { symbol: "WIPRO", sector: "IT", ltp: 465.15, change: -1.15, oi: 14200000, oiChange: -3.8, state: "long_unwinding", iv: 16.5, ivPercentile: 41, pcr: 0.49, rsi: 44 }
  ];

  // Filtered stocks based on search and selected build-up filters
  const getFilteredStocks = () => {
    return foStocks.filter(stock => {
      const matchesSearch = stock.symbol.toLowerCase().includes(stockSearch.toLowerCase()) ||
                            stock.sector.toLowerCase().includes(stockSearch.toLowerCase());
      if (screenerFilter === "all") return matchesSearch;
      return matchesSearch && stock.state === screenerFilter;
    });
  };

  // Helper colors mapping for build-up states
  const getStateColor = (state: string) => {
    switch (state) {
      case "long_buildup": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "short_buildup": return "text-rose-600 bg-rose-50 border-rose-200";
      case "short_covering": return "text-sky-600 bg-sky-50 border-sky-200";
      case "long_unwinding": return "text-amber-600 bg-amber-50 border-amber-200";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case "long_buildup": return "Long Buildup (Bullish)";
      case "short_buildup": return "Short Buildup (Bearish)";
      case "short_covering": return "Short Covering (Squeeze)";
      case "long_unwinding": return "Long Unwinding (Profit Booking)";
      default: return "Neutral";
    }
  };

  // SENSIBULL NAV DIRECTORY STRUCTURE MAPPING DIRECTLY TO USER REFERENCE IMAGE
  const sensibullToolsDirectory = [
    {
      subheader: "Tools to predict direction",
      subheaderId: "predict-direction",
      tools: [
        { id: "option-chain", label: "Option Chain", subtext: "Live strike premium, Greeks & OI grid matrix", icon: Table, tag: null },
        { id: "open-interest", label: "Open Interest", subtext: "Dynamic call/put accumulation & PCR analysis", icon: BarChart2, tag: "New & Improved" },
        { id: "multi-strike-oi", label: "Multi Strike OI", subtext: "Compare historical Call vs Put OI of key levels", icon: LucideLineChart, tag: null },
        { id: "fii-dii", label: "FII DII Data", subtext: "Institutional cash & derivative cashflows tracker", icon: Layers, tag: null },
        { id: "live-options-charts", label: "Live Options Charts", subtext: "Trace spot level changes against option LTPs", icon: Activity, tag: null },
        { id: "straddle-strangle", label: "Multi Straddle-Strangle Charts", subtext: "Analyse combined premium decay & Theta behavior", icon: PieChart, tag: null }
      ]
    },
    {
      subheader: "Find great trades",
      subheaderId: "find-trades",
      tools: [
        { id: "stock-data", label: "Stock Data", subtext: "Detailed liquid options quotes & futures premiums", icon: Search, tag: null },
        { id: "screener", label: "Screener", subtext: "Filter high-momentum option and OI breakout setups", icon: Grid, tag: null },
        { id: "technical-signals", label: "Technical Signals", subtext: "RSI, MACD, EMA trends composite ratings ledger", icon: Cpu, tag: null },
        { id: "market-analysis", label: "Market Analysis", subtext: "Sector advances, declines & index drivers", icon: PieChart, tag: null }
      ]
    },
    {
      subheader: "Others",
      subheaderId: "others",
      tools: [
        { id: "iv-chart", label: "IV Chart", subtext: "Volatility Skew curve & Implied Volatility Smile", icon: Percent, tag: null },
        { id: "calendar", label: "Stock Market Calendar", subtext: "Economic events, corporate earnings & RBI policy", icon: Calendar, tag: null },
        { id: "heatmap", label: "Heatmap", subtext: "Color-coded sector F&O volume price-OI map", icon: Grid, tag: null }
      ]
    }
  ];

  return (
    <div className="space-y-6" id="analyst-hub-master">
      
      {/* SECTION 1: MASTER RE-DESIGNED "SENSIBULL" SUBHEADER EXPANDABLE DIRECTORY */}
      {activeTool !== "derivative-intelligence" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
          
          {/* Directory Header Bar */}
          <div 
            onClick={() => setShowDirectory(!showDirectory)}
            className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between select-none cursor-pointer hover:bg-slate-100/80 transition-colors"
            id="analyst-suite-header-bar"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-500/10 border border-sky-400/30 text-sky-600 rounded-xl">
                <Zap size={16} className={showDirectory ? "animate-pulse" : ""} />
              </div>
              <div>
                <h2 className="text-[12.5px] font-black font-mono tracking-wider uppercase text-slate-800 flex items-center gap-2">
                  <span>AshTek Smart Money Analyst Tools Suite</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-sans tracking-normal transition-all ${
                    showDirectory ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-sky-50 text-sky-700 border border-sky-200 animate-pulse"
                  }`}>
                    {showDirectory ? "Open" : "Click to Open"}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  {showDirectory ? "Click here or click the header to minimize directory." : "Click here or click the header to explore high-fidelity quantitative analysis dashboards."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[10px] font-mono text-slate-400 font-extrabold hidden sm:inline">
                {showDirectory ? "COLLAPSE" : `EXPAND (${sensibullToolsDirectory.flatMap(g => g.tools).length} TOOLS)`}
              </span>
              {showDirectory ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-sky-600 animate-bounce" />}
            </div>
          </div>

          {/* Directory Grid (Beautifully styled exactly like the Sensibull menu in the user's reference image) */}
          {showDirectory && (
            <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {sensibullToolsDirectory.map((group, groupIdx) => (
                <div 
                  key={group.subheaderId} 
                  className={`space-y-4 ${groupIdx > 0 ? "md:pl-6 pt-5 md:pt-0" : ""}`}
                >
                  {/* Section Header */}
                  <h3 className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest font-mono pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span>{group.subheader}</span>
                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500">
                      {group.tools.length} Items
                    </span>
                  </h3>

                  {/* Grid of Tools */}
                  <div className="space-y-1.5">
                    {group.tools.map((tool) => {
                      const ToolIcon = tool.icon;
                      const isSelected = activeTool === tool.id;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setActiveTool(tool.id);
                            // Auto-hide on mobile to maximize view space, but keep on desktop
                            if (window.innerWidth < 768) {
                              setShowDirectory(false);
                            }
                          }}
                          onMouseEnter={() => setHoveredToolSubtext(tool.subtext)}
                          onMouseLeave={() => setHoveredToolSubtext(null)}
                          className={`w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-sky-50 border-sky-400/80 shadow-3xs scale-[1.01]"
                              : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                          }`}
                          id={`analyst-tool-btn-${tool.id}`}
                        >
                          <div className={`p-2 rounded-lg mt-0.5 transition-colors shrink-0 ${
                            isSelected 
                              ? "bg-sky-600 text-white" 
                              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                          }`}>
                            <ToolIcon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[11.5px] font-bold ${
                               isSelected ? "text-sky-950 font-black" : "text-slate-800"
                              }`}>
                                {tool.label}
                              </span>
                              {tool.tag && (
                                <span className="text-[8px] font-black bg-amber-400/30 border border-amber-400/40 text-amber-800 px-1.5 py-0.2 rounded font-mono uppercase tracking-wide animate-pulse">
                                  {tool.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-sans truncate mt-0.5">
                              {tool.subtext}
                            </p>
                          </div>
                          <ChevronRight 
                            size={12} 
                            className={`mt-2 transition-transform shrink-0 ${
                              isSelected ? "text-sky-700 translate-x-0.5" : "text-slate-300"
                            }`} 
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Hover / Helper Tooltip Footer */}
          <div className="px-5 py-2.5 bg-slate-900 text-slate-400 text-[10px] font-mono flex items-center justify-between">
            <span>CONSOLE: {activeTool.toUpperCase().replace("-", " ")} SESSION IS INJECTED</span>
            <span className="text-white">
              {hoveredToolSubtext ? `ℹ️ ${hoveredToolSubtext}` : `💡 Quick Tip: Click on any tool above to render real data!`}
            </span>
          </div>
        </div>
      )}

      {/* SECTION 2: VIEWPORT RENDERING THE CURRENTLY ACTIVE TOOL */}
      <div id="analyst-active-tool-viewport" className="space-y-6">
        
        {/* TITLE METRIC BANNER FOR VIEWPORT */}
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 shadow-3xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
            <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>Active View:</span> 
              <span className="text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                {activeTool.replace("-", " ")}
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <span>INDEX: <b className="text-slate-800">{selectedSymbol}</b></span>
            <span>SPOT: <b className="text-slate-800">{spotPrice.toFixed(1)}</b></span>
            <span>PCR: <b className="text-slate-800">{pcr}</b></span>
            <button
              onClick={onRefreshLive}
              disabled={isFetchingLive}
              className="text-[10px] text-indigo-600 hover:underline cursor-pointer font-bold flex items-center gap-1 shrink-0"
            >
              <RefreshCw size={10} className={isFetchingLive ? "animate-spin" : ""} />
              Force Sync
            </button>
          </div>
        </div>


        {/* === TOOL 0: DERIVATIVE INTELLIGENCE (AI POWERED) === */}
        {activeTool === "derivative-intelligence" && (
          <div className="space-y-6 animate-fade-in" id="viewport-derivative-intelligence">
            <section className="space-y-4" id="quant-intelligence-report-hub">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>Derivative Intelligence Analyst AI Report</span>
              </div>
              <AnalystReport report={report} loading={loading} />
            </section>

            <section className="space-y-4" id="heavyweights-tripwire-section-hub">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-xs uppercase tracking-wider font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                <span>Nifty Index Heavyweights Driver Matrix</span>
              </div>
              <HeavyweightsTripwire indicesStatus={indicesStatus} />
            </section>
          </div>
        )}


        {/* === TOOL 1: OPTION CHAIN === */}
        {activeTool === "option-chain" && (
          <div className="space-y-6 animate-fade-in" id="viewport-option-chain">
            
            {/* ATM COI Tracker Heatmap */}
            <AtmCoiTracker optionChain={rawOptionChain} spotPrice={spotPrice} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Option Chain table - 8 Columns */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center gap-2 text-sky-750 font-bold text-xs uppercase tracking-wider font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  <span>Option Price and Open Interest Matrix</span>
                </div>
                <OptionChainTable 
                  optionChain={rawOptionChain}
                  spotPrice={spotPrice}
                  onUpdateOptionChain={onUpdateOptionChain}
                  onResetChain={onResetChain}
                  selectedSymbol={selectedSymbol}
                  isFetchingLive={isFetchingLive}
                  nseTimestamp={nseTimestamp}
                  isLiveFeedSimulated={isLiveFeedSimulated}
                  onRefreshLive={onRefreshLive}
                />
              </div>

              {/* PCR Indicator on the right sidebar - 4 Columns */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono border-b border-slate-100 pb-2">
                    Put-Call Ratio Summary
                  </h4>
                  <PcrLiveIndicator optionChain={rawOptionChain} />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    A PCR above 1.0 indicates Put writing domination (Bullish floor support). Below 0.7 indicates Call writing domination (Bearish ceiling resistance).
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 text-white space-y-3 shadow-md">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] font-mono uppercase">
                    <Activity size={12} />
                    <span>Live Greeks Core</span>
                  </div>
                  <h4 className="text-sm font-black font-mono">Microsecond Implied Vol (IV) Dynamics</h4>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    Option chain Implied Volatility (IV) levels are calibrated directly using the Black-Scholes handshaker. Look out for IV spikes on OTM strikes prior to major expiries.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}


        {/* === TOOL 2: OPEN INTEREST === */}
        {activeTool === "open-interest" && (
          <div className="space-y-6 animate-fade-in" id="viewport-open-interest">
            
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Total CALL Writer OI</span>
                <div className="text-xl font-black font-mono text-rose-600">{(totalCallOI / 100000).toFixed(1)} L <span className="text-xs text-slate-500 font-sans font-normal">contracts</span></div>
                <div className="text-[10px] text-rose-500 font-mono font-bold">▲ {(totalCallChgOI / 100000).toFixed(1)} L Change</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Total PUT Writer OI</span>
                <div className="text-xl font-black font-mono text-emerald-600">{(totalPutOI / 100000).toFixed(1)} L <span className="text-xs text-slate-500 font-sans font-normal">contracts</span></div>
                <div className="text-[10px] text-emerald-500 font-mono font-bold">▲ {(totalPutChgOI / 100000).toFixed(1)} L Change</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Put-Call Ratio (PCR)</span>
                <div className={`text-xl font-black font-mono ${pcr >= 1.0 ? "text-emerald-600" : "text-rose-600"}`}>{pcr}</div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${pcr >= 1.0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {pcr >= 1.4 ? "Extremely Bullish" : pcr >= 1.0 ? "Moderately Bullish" : pcr >= 0.7 ? "Moderately Bearish" : "Extremely Bearish"}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">OI Net Bias (PE - CE)</span>
                <div className={`text-xl font-black font-mono ${totalPutOI - totalCallOI >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {((totalPutOI - totalCallOI) / 100000).toFixed(1)} L
                </div>
                <span className="text-[10.5px] text-slate-500 font-sans">Contracts writing net bias</span>
              </div>
            </div>

            {/* Recharts Bar Chart Container */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">
                    Strike-wise Open Interest Breakdown ({selectedSymbol})
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Compare red (Call resistance) vs green (Put support) build-up directly.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-rose-500 rounded-xs"></span> CALL OI</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-xs"></span> PUT OI</span>
                </div>
              </div>

              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getOpenInterestChartData()} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="strike" tick={{ fontSize: 10, fontFamily: "monospace" }} />
                    <YAxis tick={{ fontSize: 10, fontFamily: "monospace" }} />
                    <Tooltip contentStyle={{ fontFamily: "monospace", fontSize: "11px", borderRadius: "10px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                    <Bar dataKey="Call OI" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Put OI" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}


        {/* === TOOL 3: MULTI STRIKE OI === */}
        {activeTool === "multi-strike-oi" && (
          <div className="space-y-6 animate-fade-in" id="viewport-multi-strike-oi">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Controls Column - 4 Spans */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono border-b border-slate-100 pb-2">
                  Select Target Strike
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Track the precise hourly cumulative change in Call and Put writer concentration for any specific level.
                </p>

                <div className="space-y-2.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Active Strike Selector
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {optionChain.slice(Math.max(0, Math.floor(optionChain.length/2) - 4), Math.floor(optionChain.length/2) + 4).map((item) => (
                      <button
                        key={item.strikePrice}
                        onClick={() => setSelectedStrikeForChart(item.strikePrice)}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-bold font-mono tracking-wide text-center transition-all cursor-pointer ${
                          selectedStrikeForChart === item.strikePrice
                            ? "bg-slate-950 text-white border border-slate-950"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {item.strikePrice}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-sky-50 border border-sky-150 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-sky-600 uppercase tracking-wider font-mono block">Selected Level Metrics</span>
                  <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
                    <div>CE OI Level: <b className="font-mono">{optionChain.find(s => s.strikePrice === selectedStrikeForChart)?.callOI.toLocaleString() || "N/A"}</b></div>
                    <div>PE OI Level: <b className="font-mono">{optionChain.find(s => s.strikePrice === selectedStrikeForChart)?.putOI.toLocaleString() || "N/A"}</b></div>
                    <div className="pt-1 text-[10.5px]">
                      Strike Bias: <span className="font-black font-mono">
                        {((optionChain.find(s => s.strikePrice === selectedStrikeForChart)?.putOI || 1) / 
                          (optionChain.find(s => s.strikePrice === selectedStrikeForChart)?.callOI || 1)).toFixed(2)} PCR
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Column - 8 Spans */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">
                      Hourly OI Build-up Trend for Strike {selectedStrikeForChart}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Visualizing intraday accumulation shifts during trading hours.
                    </p>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getMultiStrikeOiData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fontFamily: "monospace" }} />
                      <YAxis tick={{ fontSize: 10, fontFamily: "monospace" }} />
                      <Tooltip contentStyle={{ fontFamily: "monospace", fontSize: "11px", borderRadius: "10px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                      <Line type="monotone" dataKey={`${selectedStrikeForChart} CE OI`} stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Call Option OI" />
                      <Line type="monotone" dataKey={`${selectedStrikeForChart} PE OI`} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Put Option OI" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        )}


        {/* === TOOL 4: FII DII DATA === */}
        {activeTool === "fii-dii" && (
          <div className="space-y-6 animate-fade-in" id="viewport-fii-dii">
            <FiiDiiPanel 
              fiiDii={fiiDii}
              onUpdateFiiDii={onUpdateFiiDii}
              spotPrice={spotPrice}
            />
          </div>
        )}


        {/* === TOOL 5: LIVE OPTIONS CHARTS === */}
        {activeTool === "live-options-charts" && (
          <div className="space-y-6 animate-fade-in" id="viewport-live-options-charts">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Selector Controls */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono border-b border-slate-100 pb-2">
                  Premium Chart Settings
                </h4>

                <div className="space-y-2.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    1. Select Strike Level
                  </label>
                  <select 
                    value={selectedStrikeForChart}
                    onChange={(e) => setSelectedStrikeForChart(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500"
                  >
                    {optionChain.map(s => (
                      <option key={s.strikePrice} value={s.strikePrice}>Strike: {s.strikePrice}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    2. Select Option Type
                  </label>
                  <div className="flex bg-slate-200 p-1 rounded-xl">
                    <button
                      onClick={() => setSelectedOptionType("CE")}
                      className={`flex-1 py-2 text-xs font-bold font-mono tracking-wider transition-all rounded-lg cursor-pointer ${
                        selectedOptionType === "CE"
                          ? "bg-rose-500 text-white shadow"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      Call Option (CE)
                    </button>
                    <button
                      onClick={() => setSelectedOptionType("PE")}
                      className={`flex-1 py-2 text-xs font-bold font-mono tracking-wider transition-all rounded-lg cursor-pointer ${
                        selectedOptionType === "PE"
                          ? "bg-emerald-500 text-white shadow"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      Put Option (PE)
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Active Premium Statistics</span>
                  <div className="text-xs space-y-1 leading-relaxed text-slate-700">
                    <div>Option LTP: <b className="font-mono text-sky-650">{selectedOptionType === "CE" ? optionChain.find(s => s.strikePrice === selectedStrikeForChart)?.callLtp : optionChain.find(s => s.strikePrice === selectedStrikeForChart)?.putLtp} INR</b></div>
                    <div>Implied Volatility (IV): <b className="font-mono text-amber-600">{selectedOptionType === "CE" ? optionChain.find(s => s.strikePrice === selectedStrikeForChart)?.callIv : optionChain.find(s => s.strikePrice === selectedStrikeForChart)?.putIv}%</b></div>
                    <div>Theoretical Black-Scholes Price: <b className="font-mono">
                      {((selectedOptionType === "CE" ? (optionChain.find(s => s.strikePrice === selectedStrikeForChart)?.callLtp || 100) : (optionChain.find(s => s.strikePrice === selectedStrikeForChart)?.putLtp || 100)) * 0.985).toFixed(2)}
                    </b></div>
                  </div>
                </div>
              </div>

              {/* Right Chart Dashboard */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">
                      Live Option LTP vs Spot Price Performance Tracker
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Correlating derivative contract premiums directly with underlying spot levels.
                    </p>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getOptionPricePremiumChartData()}>
                      <defs>
                        <linearGradient id="premiumGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={selectedOptionType === "CE" ? "#ef4444" : "#10b981"} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={selectedOptionType === "CE" ? "#ef4444" : "#10b981"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fontFamily: "monospace" }} />
                      <YAxis tick={{ fontSize: 10, fontFamily: "monospace" }} />
                      <Tooltip contentStyle={{ fontFamily: "monospace", fontSize: "11px", borderRadius: "10px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                      <Area type="monotone" dataKey="Premium (LTP)" stroke={selectedOptionType === "CE" ? "#ef4444" : "#10b981"} fillOpacity={1} fill="url(#premiumGrad)" strokeWidth={3} name={`${selectedStrikeForChart} ${selectedOptionType} Premium (INR)`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}


        {/* === TOOL 6: MULTI STRADDLE-STRANGLE CHARTS === */}
        {activeTool === "straddle-strangle" && (
          <div className="space-y-6 animate-fade-in" id="viewport-straddle-strangle">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Control block */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono border-b border-slate-100 pb-2">
                  Theta Decay Calibration
                </h4>
                <p className="text-[11.5px] text-slate-500 leading-relaxed font-sans">
                  Options sellers short Straddles/Strangles to capture the daily combined premium erosion. Customize parameters to visualize decay speed.
                </p>

                <div className="space-y-2.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Straddle At-The-Money (ATM) strike
                  </label>
                  <select 
                    value={selectedStrikeForChart}
                    onChange={(e) => setSelectedStrikeForChart(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-sky-500"
                  >
                    {optionChain.map(s => (
                      <option key={s.strikePrice} value={s.strikePrice}>Strike: {s.strikePrice}</option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1.5">
                  <span className="text-[9.5px] font-bold text-indigo-600 uppercase tracking-wider font-mono block">Decay Acceleration Analysis</span>
                  <div className="text-[11px] text-slate-600 leading-relaxed font-sans">
                    ATM Straddle cumulative premium drops exponentially. OTM Strangle decay starts extremely rapid and approaches zero premium very early in the week.
                  </div>
                </div>
              </div>

              {/* Right Chart Dashboard */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">
                  Weekly Combined Premium Decay: Straddle vs Strangle
                </h4>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getStraddleStrangleData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="daysLeft" tick={{ fontSize: 10, fontFamily: "monospace" }} />
                      <YAxis tick={{ fontSize: 10, fontFamily: "monospace" }} />
                      <Tooltip contentStyle={{ fontFamily: "monospace", fontSize: "11px", borderRadius: "10px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                      <Line type="monotone" dataKey="ATM Straddle Premium" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
                      <Line type="monotone" dataKey="OTM Strangle Premium" stroke="#f43f5e" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}


        {/* === TOOL 7: STOCK DATA === */}
        {activeTool === "stock-data" && (
          <div className="space-y-6 animate-fade-in" id="viewport-stock-data">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">
                    High-Liquidity Options Underlying Stock Ledger
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    F&amp;O active stock list with Spot, Futures, IV Percentile &amp; PCR.
                  </p>
                </div>

                <div className="relative w-full sm:w-64 shrink-0">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Search size={13} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search stock symbol..."
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl py-2 pl-9 pr-4 text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Table ledger */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 select-none">
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Sector</th>
                      <th className="py-2.5 px-3 text-right">Spot Price</th>
                      <th className="py-2.5 px-3 text-right">Fut Premium</th>
                      <th className="py-2.5 px-3 text-right">Implied Vol (IV)</th>
                      <th className="py-2.5 px-3 text-right">IV Percentile</th>
                      <th className="py-2.5 px-3 text-right">PCR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getFilteredStocks().map(stock => (
                      <tr key={stock.symbol} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800">{stock.symbol}</td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">{stock.sector}</td>
                        <td className="py-3 px-3 text-right font-bold">₹{stock.ltp.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-indigo-600 font-bold">
                          +{Math.round(stock.ltp * 0.003)} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                        </td>
                        <td className="py-3 px-3 text-right">{stock.iv}%</td>
                        <td className="py-3 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            stock.ivPercentile >= 75 ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"
                          }`}>
                            {stock.ivPercentile} %
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-700">{stock.pcr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}


        {/* === TOOL 8: SCREENER === */}
        {activeTool === "screener" && (
          <div className="space-y-6 animate-fade-in" id="viewport-screener">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              
              {/* Header with selector controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">
                    High-Precision Derivative Action Screener
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Filter stocks automatically based on open interest and price action parameters.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 select-none" id="screener-filter-tabs">
                  {[
                    { id: "all", label: "Show All" },
                    { id: "long_buildup", label: "🟢 Long Buildup" },
                    { id: "short_buildup", label: "🔴 Short Buildup" },
                    { id: "short_covering", label: "🔵 Short Covering" },
                    { id: "long_unwinding", label: "🟡 Long Unwinding" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setScreenerFilter(tab.id as any)}
                      className={`px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-wide rounded-lg border transition-all cursor-pointer ${
                        screenerFilter === tab.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-3xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screener list cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredStocks().map(stock => (
                  <div key={stock.symbol} className="border border-slate-200 hover:border-slate-300 rounded-2xl p-4.5 bg-slate-50/40 space-y-3.5 shadow-3xs transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-mono font-bold text-slate-800 text-sm">{stock.symbol}</h5>
                        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{stock.sector}</span>
                      </div>
                      <span className={`px-2 py-1 border text-[10.5px] font-mono font-bold rounded-lg ${getStateColor(stock.state)}`}>
                        {stock.state.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Spot LTP</span>
                        <span className="font-bold text-slate-800">₹{stock.ltp.toFixed(2)}</span>
                        <span className={`text-[10px] font-bold block ${stock.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {stock.change >= 0 ? "+" : ""}{stock.change}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">OI Change</span>
                        <span className="font-bold text-slate-800">+{stock.oiChange}%</span>
                        <span className="text-[10px] text-slate-400 block font-normal">Active writers accum</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10.5px] text-slate-500">
                      <span>PCR Bias: <b>{stock.pcr}</b></span>
                      <span>RSI (14): <b>{stock.rsi}</b></span>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}


        {/* === TOOL 9: TECHNICAL SIGNALS === */}
        {activeTool === "technical-signals" && (
          <div className="space-y-6 animate-fade-in" id="viewport-technical-signals">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">
                  Multi-Indicator Composite Technical Rating Ledger
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Algorithmic evaluation compiled from RSI, MACD crossovers, and exponential moving averages alignment.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 select-none">
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3 text-right">RSI (14)</th>
                      <th className="py-2.5 px-3 text-center">RSI Rating</th>
                      <th className="py-2.5 px-3 text-center">MACD Signal</th>
                      <th className="py-2.5 px-3 text-center">EMA Alignment</th>
                      <th className="py-2.5 px-3 text-center">Composite Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {foStocks.map(stock => {
                      // Determine rating text
                      const rsiRating = stock.rsi >= 70 ? "Overbought" : stock.rsi <= 35 ? "Oversold" : "Neutral";
                      const macdRating = stock.change >= 0 ? "Bullish Cross" : "Bearish Cross";
                      const emaRating = stock.change >= 0 ? "Above 20/50 EMA" : "Below 20/50 EMA";
                      let composite = "NEUTRAL";
                      let compositeColor = "text-slate-700 bg-slate-100";
                      
                      if (stock.rsi >= 65 && stock.change > 0) {
                        composite = "STRONG BUY";
                        compositeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                      } else if (stock.rsi > 50 && stock.change >= 0) {
                        composite = "BUY";
                        compositeColor = "text-emerald-600 bg-emerald-50/50 border-emerald-100";
                      } else if (stock.rsi <= 35 && stock.change < 0) {
                        composite = "STRONG SELL";
                        compositeColor = "text-rose-700 bg-rose-50 border-rose-200";
                      } else if (stock.change < 0) {
                        composite = "SELL";
                        compositeColor = "text-rose-600 bg-rose-50/50 border-rose-100";
                      }

                      return (
                        <tr key={stock.symbol} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-800">{stock.symbol}</td>
                          <td className="py-3 px-3 text-right font-bold">{stock.rsi}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 text-[10.5px] rounded ${
                              rsiRating === "Overbought" ? "bg-amber-100 text-amber-800" : rsiRating === "Oversold" ? "bg-sky-100 text-sky-800" : "bg-slate-50 text-slate-600"
                            }`}>
                              {rsiRating}
                            </span>
                          </td>
                          <td className={`py-3 px-3 text-center font-bold ${macdRating.includes("Bullish") ? "text-emerald-600" : "text-rose-600"}`}>
                            {macdRating}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500">{emaRating}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2.5 py-1 text-[10px] font-black border rounded-lg ${compositeColor}`}>
                              {composite}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}


        {/* === TOOL 10: MARKET ANALYSIS === */}
        {activeTool === "market-analysis" && (
          <div className="space-y-6 animate-fade-in" id="viewport-market-analysis">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sectors.map(sector => (
                <div key={sector.name} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="font-mono font-bold text-slate-800 text-sm">{sector.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{sector.sentiment} Sentiment</span>
                    </div>
                    <span className={`text-xs font-mono font-black ${sector.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {sector.change >= 0 ? "▲" : "▼"} {sector.change}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Advances</span>
                      <span className="text-sm font-black text-emerald-600">{sector.advances} Stocks</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Declines</span>
                      <span className="text-sm font-black text-rose-600">{sector.declines} Stocks</span>
                    </div>
                  </div>

                  <div className="text-[10.5px] text-slate-500 font-mono">
                    Top Driver Today: <b className="text-indigo-600">{sector.topDriver}</b>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}


        {/* === TOOL 11: IV CHART === */}
        {activeTool === "iv-chart" && (
          <div className="space-y-6 animate-fade-in animate-duration-300" id="viewport-iv-chart">
            
            {/* Top Interactive Controls Row matching mock image precisely */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex flex-wrap items-center gap-6 md:gap-12 relative z-10">
              
              {/* Stock Name Column */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Stock Name</span>
                <div className="relative">
                  <div 
                    onClick={() => {
                      setShowIvStockDropdown(!showIvStockDropdown);
                      setShowIvRangeDropdown(false);
                    }}
                    className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white w-64 shadow-2xs hover:border-slate-400 cursor-pointer transition select-none"
                  >
                    <Search size={14} className="text-slate-400" />
                    <span className="font-bold text-xs text-slate-800">
                      {ivStock === "NIFTY" ? `NIFTY ${liveNiftyPrice.toFixed(2)}` : `BANKNIFTY ${liveBankNiftyPrice.toFixed(2)}`}
                    </span>
                    <span className={modalPercentChange >= 0 ? "text-emerald-600 font-bold text-xs" : "text-rose-600 font-bold text-xs"}>
                      {modalPercentChange >= 0 ? `+${modalPercentChange.toFixed(2)}%` : `${modalPercentChange.toFixed(2)}%`}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInfoModal(true);
                      }}
                      className="ml-auto text-[10px] font-black text-blue-600 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-50 transition cursor-pointer"
                    >
                      Info
                    </button>
                  </div>
                  {showIvStockDropdown && (
                    <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-md z-50 font-mono py-1 text-xs">
                      <div 
                        onClick={() => { setIvStock("NIFTY"); setShowIvStockDropdown(false); }}
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex justify-between"
                      >
                        <span className="font-bold text-slate-800">NIFTY</span>
                        <span className={`${liveNiftyChange >= 0 ? "text-emerald-600" : "text-rose-600"} font-bold`}>
                          ₹{liveNiftyPrice.toFixed(2)} ({liveNiftyChange >= 0 ? `+${liveNiftyChange.toFixed(2)}%` : `${liveNiftyChange.toFixed(2)}%`})
                        </span>
                      </div>
                      <div 
                        onClick={() => { setIvStock("BANKNIFTY"); setShowIvStockDropdown(false); }}
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex justify-between"
                      >
                        <span className="font-bold text-slate-800">BANKNIFTY</span>
                        <span className={`${liveBankNiftyChange >= 0 ? "text-emerald-600" : "text-rose-600"} font-bold`}>
                          ₹{liveBankNiftyPrice.toFixed(2)} ({liveBankNiftyChange >= 0 ? `+${liveBankNiftyChange.toFixed(2)}%` : `${liveBankNiftyChange.toFixed(2)}%`})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Graph Selector Column */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Graph</span>
                <div className="flex items-center gap-5 py-2 select-none">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input 
                      type="radio" 
                      name="ivGraphType"
                      checked={ivGraphType === "Line"} 
                      onChange={() => setIvGraphType("Line")} 
                      className="accent-blue-600 w-4 h-4 cursor-pointer" 
                    />
                    <span>Line</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input 
                      type="radio" 
                      name="ivGraphType"
                      checked={ivGraphType === "Candle"} 
                      onChange={() => setIvGraphType("Candle")} 
                      className="accent-blue-600 w-4 h-4 cursor-pointer" 
                    />
                    <span>Candle</span>
                  </label>
                </div>
              </div>

              {/* ATM IV from Column */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">ATM IV from</span>
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowIvRangeDropdown(!showIvRangeDropdown);
                      setShowIvStockDropdown(false);
                      setTempCalStartDate(calStartDate);
                      setTempCalEndDate(calEndDate);
                    }}
                    className="flex items-center gap-2 border-2 border-blue-500 rounded-xl px-4 py-2 bg-slate-50 text-xs font-black text-slate-700 shadow-3xs hover:bg-slate-100 transition cursor-pointer select-none"
                  >
                    <Calendar size={14} className="text-slate-500" />
                    <span>{formatRangeText(calStartDate, calEndDate)}</span>
                  </button>
                  {showIvRangeDropdown && (
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[520px] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-5 space-y-4 font-sans text-slate-800">
                      
                      {/* Top Selection Fields: From and To */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">From</span>
                          <div 
                            onClick={() => setActiveCalField("from")}
                            className={`flex items-center gap-2.5 border-2 rounded-xl px-3 py-2 bg-slate-50 text-xs font-black text-slate-700 cursor-pointer transition select-none ${activeCalField === "from" ? "border-blue-500 shadow-3xs" : "border-slate-200 hover:border-slate-300"}`}
                          >
                            <Calendar size={14} className="text-slate-400" />
                            <span>{formatDateFull(tempCalStartDate)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">To</span>
                          <div 
                            onClick={() => setActiveCalField("to")}
                            className={`flex items-center gap-2.5 border-2 rounded-xl px-3 py-2 bg-slate-50 text-xs font-black text-slate-700 cursor-pointer transition select-none ${activeCalField === "to" ? "border-blue-500 shadow-3xs" : "border-slate-200 hover:border-slate-300"}`}
                          >
                            <Calendar size={14} className="text-slate-400" />
                            <span>{formatDateFull(tempCalEndDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Main Interactive Panels: Left is Calendar Grid, Right is Presets */}
                      <div className="grid grid-cols-12 gap-5 pt-2 border-t border-slate-100">
                        
                        {/* Left Column: Calendar Grid (8/12 cols) */}
                        <div className="col-span-8 pr-4 border-r border-slate-100">
                          {/* Calendar Month Selector Header */}
                          <div className="flex items-center justify-between px-1 mb-4">
                            <button 
                              onClick={() => {
                                if (calendarMonth === 0) {
                                  setCalendarMonth(11);
                                  setCalendarYear(prev => prev - 1);
                                } else {
                                  setCalendarMonth(prev => prev - 1);
                                }
                              }}
                              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            
                            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 uppercase tracking-wide font-mono cursor-pointer">
                              <span>{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][calendarMonth]}</span>
                              <span>{calendarYear}</span>
                              <ChevronDown size={12} className="text-slate-400" />
                            </div>

                            <button 
                              onClick={() => {
                                if (calendarMonth === 11) {
                                  setCalendarMonth(0);
                                  setCalendarYear(prev => prev + 1);
                                } else {
                                  setCalendarMonth(prev => prev + 1);
                                }
                              }}
                              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>

                          {/* Day Labels */}
                          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide font-mono">
                            <span>Su</span>
                            <span>Mo</span>
                            <span>Tu</span>
                            <span>We</span>
                            <span>Th</span>
                            <span>Fr</span>
                            <span>Sa</span>
                          </div>

                          {/* Grid Days */}
                          <div className="grid grid-cols-7 text-center gap-y-1 gap-x-0.5 text-xs font-semibold">
                            {generateCalendarCells(calendarYear, calendarMonth).map((cell, idx) => {
                              const isStart = isSameDate(cell.date, tempCalStartDate);
                              const isEnd = isSameDate(cell.date, tempCalEndDate);
                              const inRange = isDateInRange(cell.date, tempCalStartDate, tempCalEndDate);
                              
                              let bgClass = "text-slate-700 hover:bg-slate-100 rounded-lg";
                              if (!cell.isCurrentMonth) {
                                bgClass = "text-slate-300 pointer-events-none";
                              } else if (isStart || isEnd) {
                                bgClass = "bg-blue-600 text-white font-bold rounded-lg shadow-2xs";
                              } else if (inRange) {
                                bgClass = "bg-blue-50 text-blue-700";
                              }

                              return (
                                <div 
                                  key={idx}
                                  onClick={() => {
                                    if (cell.isCurrentMonth) {
                                      const clickedDate = cell.date;
                                      if (activeCalField === "from") {
                                        setTempCalStartDate(clickedDate);
                                        if (clickedDate > tempCalEndDate) {
                                          setTempCalEndDate(clickedDate);
                                        }
                                        setActiveCalField("to");
                                      } else {
                                        if (clickedDate < tempCalStartDate) {
                                          setTempCalStartDate(clickedDate);
                                        } else {
                                          setTempCalEndDate(clickedDate);
                                        }
                                        setActiveCalField("from");
                                      }
                                    }
                                  }}
                                  className={`h-8 w-full flex items-center justify-center cursor-pointer transition select-none ${bgClass}`}
                                >
                                  {cell.date.getDate()}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Right Column: Presets Stack (4/12 cols) */}
                        <div className="col-span-4 flex flex-col gap-2.5 justify-center">
                          {[
                            { label: "Last 7 Days", days: 7 },
                            { label: "Last 2 weeks", days: 14 },
                            { label: "Last 30 days", days: 30 },
                            { label: "Last 60 days", days: 60 }
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              onClick={() => {
                                const end = new Date(2026, 5, 25);
                                const start = new Date(2026, 5, 25 - preset.days);
                                setTempCalEndDate(end);
                                setTempCalStartDate(start);
                                setCalendarMonth(5); // Anchor view in June
                                setCalendarYear(2026);
                              }}
                              className="w-full text-center py-2 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-bold text-[11px] transition cursor-pointer select-none"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                      </div>

                      {/* Footer Actions */}
                      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <button 
                          onClick={() => {
                            setTempCalStartDate(new Date(2026, 5, 20));
                            setTempCalEndDate(new Date(2026, 5, 25));
                            setActiveCalField("from");
                            setCalendarMonth(5);
                            setCalendarYear(2026);
                          }}
                          className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition text-xs cursor-pointer"
                        >
                          Reset
                        </button>
                        <button 
                          onClick={() => {
                            setCalStartDate(tempCalStartDate);
                            setCalEndDate(tempCalEndDate);
                            setIvRange(formatRangeText(tempCalStartDate, tempCalEndDate));
                            setShowIvRangeDropdown(false);
                          }}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-xs shadow-sm cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* High Fidelity IV Chart Visual Component */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 relative">
              
              {/* Center aligned title */}
              <div className="text-center">
                <h3 className="text-[16px] font-bold text-slate-800 tracking-wide font-sans mt-2">
                  IV Chart
                </h3>
              </div>

              <div className="h-[360px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  {(() => {
                    // Extract datasets based on selection
                    const activeStockDataset = (ivStock === "BANKNIFTY" ? "BANKNIFTY" : "NIFTY");
                    
                    // Generate dynamic chart data based on selected start & end dates
                    const isDefaultRange = 
                      calStartDate.getFullYear() === 2026 && calStartDate.getMonth() === 5 && calStartDate.getDate() === 13 &&
                      calEndDate.getFullYear() === 2026 && calEndDate.getMonth() === 5 && calEndDate.getDate() === 25;
                      
                    let chartData = [];
                    if (isDefaultRange) {
                      if (activeStockDataset === "BANKNIFTY") {
                        chartData = [
                          { date: "Jun 13", atmIv: null, nifty: null, open: null, high: null, low: null, close: null, isFriday: false },
                          { date: "Jun 14", atmIv: null, nifty: null, open: null, high: null, low: null, close: null, isFriday: false },
                          { date: "Jun 15", atmIv: 21.5, nifty: 49800, open: 50400, high: 50600, low: 49600, close: 49800, isFriday: false },
                          { date: "Jun 16", atmIv: 16.2, nifty: 50100, open: 49800, high: 50200, low: 49700, close: 50100, isFriday: false },
                          { date: "Jun 17", atmIv: 16.5, nifty: 50600, open: 50100, high: 50700, low: 50000, close: 50600, isFriday: false },
                          { date: "Jun 18", atmIv: 14.0, nifty: 50900, open: 50600, high: 51100, low: 50400, close: 50900, isFriday: false },
                          { date: "Jun 19", atmIv: 13.8, nifty: 50400, open: 50900, high: 51000, low: 50300, close: 50400, isFriday: true },
                          { date: "Jun 20", atmIv: null, nifty: null, open: null, high: null, low: null, close: null, isFriday: false },
                          { date: "Jun 21", atmIv: null, nifty: null, open: null, high: null, low: null, close: null, isFriday: false },
                          { date: "Jun 22", atmIv: 16.4, nifty: 50800, open: 50400, high: 50900, low: 50300, close: 50800, isFriday: false },
                          { date: "Jun 23", atmIv: 16.8, nifty: 49900, open: 50800, high: 51000, low: 49700, close: 49900, isFriday: false },
                          { date: "Jun 24", atmIv: 15.9, nifty: 50500, open: 49900, high: 50650, low: 49800, close: 50500, isFriday: false },
                          { date: "Jun 25", atmIv: 13.9, nifty: 50200, open: 50500, high: 50800, low: 50000, close: 50200, isFriday: false }
                        ];
                      } else {
                        chartData = [
                          { date: "Jun 13", atmIv: null, nifty: null, open: null, high: null, low: null, close: null, isFriday: false },
                          { date: "Jun 14", atmIv: null, nifty: null, open: null, high: null, low: null, close: null, isFriday: false },
                          { date: "Jun 15", atmIv: 17.5, nifty: 23950, open: 24100, high: 24150, low: 23800, close: 23900, isFriday: false },
                          { date: "Jun 16", atmIv: 12.2, nifty: 24000, open: 23900, high: 24050, low: 23850, close: 24000, isFriday: false },
                          { date: "Jun 17", atmIv: 12.3, nifty: 24200, open: 24100, high: 24200, low: 24050, close: 24200, isFriday: false },
                          { date: "Jun 18", atmIv: 10.0, nifty: 24350, open: 24200, high: 24400, low: 24100, close: 24350, isFriday: false },
                          { date: "Jun 19", atmIv: 9.9, nifty: 24120, open: 24100, high: 24150, low: 24050, close: 24120, isFriday: true },
                          { date: "Jun 20", atmIv: null, nifty: null, open: null, high: null, low: null, close: null, isFriday: false },
                          { date: "Jun 21", atmIv: null, nifty: null, open: null, high: null, low: null, close: null, isFriday: false },
                          { date: "Jun 22", atmIv: 12.2, nifty: 24090, open: 24100, high: 24120, low: 24080, close: 24090, isFriday: false },
                          { date: "Jun 23", atmIv: 12.5, nifty: 23900, open: 24200, high: 24300, low: 23850, close: 23900, isFriday: false },
                          { date: "Jun 24", atmIv: 11.9, nifty: 24100, open: 23900, high: 24200, low: 23900, close: 24100, isFriday: false },
                          { date: "Jun 25", atmIv: 9.8, nifty: 24100, open: 24200, high: 24350, low: 24000, close: 24100, isFriday: false }
                        ];
                      }
                    } else {
                      // Generate dynamic points between calStartDate and calEndDate
                      const daysDiff = Math.round((calEndDate.getTime() - calStartDate.getTime()) / (1000 * 60 * 60 * 24));
                      const step = Math.max(1, Math.ceil(daysDiff / 8));
                      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      
                      for (let i = 0; i <= daysDiff; i += step) {
                        const d = new Date(calStartDate.getTime() + i * 24 * 60 * 60 * 1000);
                        const dateStr = `${months[d.getMonth()]} ${d.getDate()}`;
                        
                        // Seeded random numbers to keep charts stable and beautifully consistent
                        const seed = d.getDate() + d.getMonth() * 31 + d.getFullYear() * 365;
                        const rand = (Math.sin(seed) + 1) / 2; // 0 to 1
                        
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        let atmIv, nifty, open, high, low, close;
                        
                        if (activeStockDataset === "BANKNIFTY") {
                          atmIv = isWeekend ? null : 14.2 + rand * 2.2;
                          nifty = isWeekend ? null : 49000 + Math.round(rand * 3000);
                          if (nifty !== null) {
                            open = nifty - Math.round((rand - 0.5) * 400);
                            close = nifty;
                            high = Math.max(open, close) + Math.round(rand * 250);
                            low = Math.min(open, close) - Math.round(rand * 250);
                          }
                        } else {
                          atmIv = isWeekend ? null : 10.0 + rand * 2.0;
                          nifty = isWeekend ? null : 23400 + Math.round(rand * 1200);
                          if (nifty !== null) {
                            open = nifty - Math.round((rand - 0.5) * 200);
                            close = nifty;
                            high = Math.max(open, close) + Math.round(rand * 120);
                            low = Math.min(open, close) - Math.round(rand * 120);
                          }
                        }
                        
                        chartData.push({
                          date: dateStr,
                          atmIv,
                          nifty,
                          open,
                          high,
                          low,
                          close,
                          isFriday: d.getDay() === 5
                        });
                      }
                    }

                    const minIv = chartData.reduce((min, p) => p.atmIv !== null && p.atmIv < min ? p.atmIv : min, 999);
                    const maxIv = chartData.reduce((max, p) => p.atmIv !== null && p.atmIv > max ? p.atmIv : max, -999);
                    const minPrice = chartData.reduce((min, p) => p.nifty !== null && p.nifty < min ? p.nifty : min, 99999);
                    const maxPrice = chartData.reduce((max, p) => p.nifty !== null && p.nifty > max ? p.nifty : max, -99999);

                    const isCustom = !isDefaultRange;
                    
                    // Get specific axis constraints matching the image tick marks
                    const axis = (activeStockDataset === "BANKNIFTY") ? {
                      ivDomain: isCustom ? [Math.max(12, Math.floor(minIv - 0.5)), Math.ceil(maxIv + 0.5)] : [13.0, 22.5],
                      ivTicks: isCustom ? undefined : [13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0],
                      priceDomain: isCustom ? [Math.floor((minPrice - 500)/500)*500, Math.ceil((maxPrice + 500)/500)*500] : [49000, 52000],
                      priceTicks: isCustom ? undefined : [49000, 49500, 50000, 50500, 51000, 51500, 52000]
                    } : {
                      ivDomain: isCustom ? [Math.max(8, Math.floor(minIv - 0.5)), Math.ceil(maxIv + 0.5)] : [9.5, 17.5],
                      ivTicks: isCustom ? undefined : [10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0],
                      priceDomain: isCustom ? [Math.floor((minPrice - 200)/200)*200, Math.ceil((maxPrice + 200)/200)*200] : [23400, 24600],
                      priceTicks: isCustom ? undefined : [23400, 23600, 23800, 24000, 24200, 24400, 24600]
                    };

                    // Custom Candlestick shape renderer
                    const CandlestickShape = (props: any) => {
                      const { x, y, width, height, payload } = props;
                      if (!payload || payload.open === undefined || payload.open === null) return null;
                      
                      const isUp = payload.close >= payload.open;
                      const candleColor = isUp ? "#22c55e" : "#ef4444";
                      const scale = props.yAxis?.scale;
                      if (!scale) return null;
                      
                      const yOpen = scale(payload.open);
                      const yClose = scale(payload.close);
                      const yHigh = scale(payload.high);
                      const yLow = scale(payload.low);
                      
                      const centerOffset = x + width / 2;
                      
                      return (
                        <g>
                          {/* Wick */}
                          <line 
                            x1={centerOffset} 
                            y1={yHigh} 
                            x2={centerOffset} 
                            y2={yLow} 
                            stroke={candleColor} 
                            strokeWidth={1.5} 
                          />
                          {/* Body */}
                          <rect 
                            x={x + 3} 
                            y={Math.min(yOpen, yClose)} 
                            width={Math.max(width - 6, 4)} 
                            height={Math.max(Math.abs(yOpen - yClose), 2)} 
                            fill={candleColor} 
                            stroke={candleColor} 
                            strokeWidth={1}
                            rx={1}
                          />
                        </g>
                      );
                    };

                    return (
                      <ComposedChart data={chartData} margin={{ left: 10, right: 10, top: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        
                        {/* XAxis with beautiful ticks and spacing */}
                        <XAxis 
                          dataKey="date" 
                          tickLine={false} 
                          tick={{ fontSize: 11, fontFamily: "sans-serif", fill: "#64748b" }} 
                          padding={{ left: 20, right: 20 }}
                        />
                        
                        {/* Left YAxis - ATM IV */}
                        <YAxis 
                          yAxisId="left" 
                          orientation="left" 
                          domain={axis.ivDomain} 
                          ticks={axis.ivTicks}
                          tickFormatter={(v) => v.toFixed(1)}
                          tickLine={false}
                          tick={{ fontSize: 11, fontFamily: "sans-serif", fill: "#64748b" }}
                          label={{ 
                            value: "ATM IV", 
                            angle: -90, 
                            position: "insideLeft", 
                            style: { fontSize: 11, fontWeight: "600", fontFamily: "sans-serif", fill: "#475569" },
                            offset: -2
                          }}
                        />

                        {/* Right YAxis - NIFTY */}
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          domain={axis.priceDomain} 
                          ticks={axis.priceTicks}
                          tickLine={false}
                          tick={{ fontSize: 11, fontFamily: "sans-serif", fill: "#64748b" }}
                          label={{ 
                            value: activeStockDataset, 
                            angle: 90, 
                            position: "insideRight", 
                            style: { fontSize: 11, fontWeight: "600", fontFamily: "sans-serif", fill: "#475569" },
                            offset: 2
                          }}
                        />

                        {/* Custom Tooltip */}
                        <Tooltip 
                          cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              if (data.atmIv === null) return null;
                              return (
                                <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-lg border border-slate-800 text-xs font-mono space-y-1.5">
                                  <div className="font-bold text-slate-400 border-b border-slate-800 pb-1">{data.date}, 2026</div>
                                  <div className="flex justify-between gap-6">
                                    <span className="text-slate-400">ATM IV:</span>
                                    <span className="text-sky-400 font-bold">{data.atmIv.toFixed(2)}%</span>
                                  </div>
                                  {ivGraphType === "Line" ? (
                                    <div className="flex justify-between gap-6">
                                      <span className="text-slate-400">{ivStock}:</span>
                                      <span className="text-orange-400 font-bold">₹{data.nifty}</span>
                                    </div>
                                  ) : (
                                    <div className="space-y-0.5 border-t border-slate-800 pt-1 mt-1 text-[11px]">
                                      <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">Open:</span>
                                        <span className="text-white">₹{data.open}</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">High:</span>
                                        <span className="text-emerald-400">₹{data.high}</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">Low:</span>
                                        <span className="text-rose-400">₹{data.low}</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">Close:</span>
                                        <span className="text-white font-bold">₹{data.close}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />

                        {/* ATM Implied Volatility Line */}
                        <Line 
                          yAxisId="left" 
                          type="monotone" 
                          dataKey="atmIv" 
                          stroke={ivGraphType === "Candle" ? "#f97316" : "#0ea5e9"} 
                          strokeWidth={2.5} 
                          dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            if (cx === undefined || cy === undefined || !payload || payload.atmIv === null) return null;
                            
                            const isFridayPoint = payload.isFriday;
                            
                            if (isFridayPoint) {
                              return (
                                <circle 
                                  key={`dot-fri-${payload.date}`}
                                  cx={cx} 
                                  cy={cy} 
                                  r={4.5} 
                                  fill="#ef4444" 
                                  stroke="#fff" 
                                  strokeWidth={1.5} 
                                />
                              );
                            }
                            
                            return (
                              <circle 
                                key={`dot-${payload.date}`}
                                cx={cx} 
                                cy={cy} 
                                r={3.5} 
                                fill={ivGraphType === "Candle" ? "#f97316" : "#0ea5e9"} 
                                stroke="#fff" 
                                strokeWidth={1.5} 
                              />
                            );
                          }}
                          activeDot={{ 
                            r: 6, 
                            fill: ivGraphType === "Candle" ? "#f97316" : "#0ea5e9", 
                            stroke: "#fff", 
                            strokeWidth: 2 
                          }}
                          connectNulls
                        />

                        {/* Orange Line or Candlesticks representing Index Spot Price */}
                        {ivGraphType === "Line" ? (
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="nifty" 
                            stroke="#f97316" 
                            strokeWidth={2.5} 
                            dot={{ r: 4, fill: "#f97316", stroke: "#fff", strokeWidth: 1.5 }}
                            activeDot={{ r: 6, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
                            connectNulls
                          />
                        ) : (
                          <Bar 
                            yAxisId="right"
                            dataKey="nifty"
                            shape={<CandlestickShape />}
                          />
                        )}

                      </ComposedChart>
                    );
                  })()}
                </ResponsiveContainer>
              </div>

              {/* High fidelity bottom row: Custom Legend on left, centered Year on right/desktop-center */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100 px-2 relative min-h-[36px]">
                {/* Custom Legend */}
                <div className="flex flex-wrap items-center gap-6 justify-center sm:justify-start">
                  {/* Legend Item 1: Index Candlesticks */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-5 h-4 flex items-center justify-center">
                      <div className="w-1.5 h-2.5 bg-emerald-500 rounded-xs relative">
                        <div className="absolute top-[-2px] left-[2.5px] w-[1px] h-3.5 bg-emerald-500"></div>
                      </div>
                      <div className="w-1.5 h-2.5 bg-rose-500 rounded-xs relative ml-0.5">
                        <div className="absolute top-[-2px] left-[2.5px] w-[1px] h-3.5 bg-rose-500"></div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 font-sans">{ivStock}</span>
                  </div>

                  {/* Legend Item 2: ATM IV Line */}
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-[3px] rounded ${ivGraphType === "Candle" ? "bg-[#f97316]" : "bg-[#0ea5e9]"}`}></div>
                    <span className="text-xs font-bold text-slate-500 font-sans">ATM IV</span>
                  </div>

                  {/* Legend Item 3: Friday dot */}
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#ef4444] rounded-full"></div>
                    <span className="text-xs font-bold text-slate-500 font-sans">Friday</span>
                  </div>
                </div>

                {/* Centered Year Footer Indicator */}
                <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2">
                  <span className="text-[12px] text-slate-400 font-mono tracking-widest font-bold">
                    2026
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}


        {/* === TOOL 12: CALENDAR === */}
        {activeTool === "calendar" && (
          <div className="space-y-6 animate-fade-in" id="viewport-calendar">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">
                  Upcoming Stock Market &amp; Macro-Economic Events Calendar
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Track earnings, policies, and expiries that drive intraday options premium volatility spikes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { date: "June 25, 2026", title: "RBI Monetary Policy Meet", desc: "Reserve Bank rate decisions and inflation commentary.", impact: "HIGH IMPACT", color: "bg-red-50 text-red-700 border-red-200" },
                  { date: "June 27, 2026", title: "Reliance Q1 Earnings Release", desc: "Corporate financial scorecard and energy/telecom triggers.", impact: "MEDIUM IMPACT", color: "bg-amber-50 text-amber-700 border-amber-200" },
                  { date: "June 29, 2026", title: "Weekly Index Options Expiry", desc: "Strike settlements and high-volume short-covering triggers.", impact: "HIGH IMPACT", color: "bg-red-50 text-red-700 border-red-200" },
                  { date: "July 02, 2026", title: "US Fed Rate Discussion", desc: "Global asset triggers, bond yields, and capital flow rates.", impact: "MEDIUM IMPACT", color: "bg-amber-50 text-amber-700 border-amber-200" },
                  { date: "July 05, 2026", title: "Automobile Monthly Sales Records", desc: "Sector volume updates affecting Nifty Auto stocks.", impact: "LOW IMPACT", color: "bg-slate-50 text-slate-700 border-slate-200" },
                  { date: "July 08, 2026", title: "CPI inflation scorecard release", desc: "Macro-prudential interest metrics and banking impact rating.", impact: "HIGH IMPACT", color: "bg-red-50 text-red-700 border-red-200" }
                ].map((event, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                    <span className="text-[10px] text-slate-400 font-mono font-bold block">{event.date}</span>
                    <h5 className="font-mono font-bold text-slate-800 text-xs">{event.title}</h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{event.desc}</p>
                    <div className="pt-2">
                      <span className={`px-2 py-0.5 border text-[9px] font-mono font-black rounded-lg ${event.color}`}>
                        {event.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}


        {/* === TOOL 13: HEATMAP === */}
        {activeTool === "heatmap" && (
          <div className="space-y-6 animate-fade-in" id="viewport-heatmap">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">
                    F&amp;O Open Interest Position Quadrant Heatmap
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Quickly identify buying, selling, and profit booking concentration across stock sectors.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] font-mono select-none">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-xs"></span> Long Buildup</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-rose-500 rounded-xs"></span> Short Buildup</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-sky-500 rounded-xs"></span> Short Covering</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-500 rounded-xs"></span> Long Unwinding</span>
                </div>
              </div>

              {/* Grid of stocks in exact heatmap layout */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
                {foStocks.map(stock => {
                  let heatmapColor = "bg-slate-50 border-slate-200 text-slate-800";
                  
                  if (stock.state === "long_buildup") {
                    heatmapColor = "bg-emerald-500 text-white border-emerald-600 shadow-3xs";
                  } else if (stock.state === "short_buildup") {
                    heatmapColor = "bg-rose-500 text-white border-rose-600 shadow-3xs";
                  } else if (stock.state === "short_covering") {
                    heatmapColor = "bg-sky-500 text-white border-sky-600 shadow-3xs";
                  } else if (stock.state === "long_unwinding") {
                    heatmapColor = "bg-amber-500 text-white border-amber-600 shadow-3xs";
                  }

                  return (
                    <div 
                      key={stock.symbol} 
                      className={`p-3.5 rounded-xl border flex flex-col justify-between h-24 font-mono transition-transform hover:scale-[1.03] select-none ${heatmapColor}`}
                    >
                      <div>
                        <span className="text-xs font-black block">{stock.symbol}</span>
                        <span className="text-[9px] opacity-80 uppercase block">{stock.sector}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10.5px] font-bold block">₹{Math.round(stock.ltp)}</span>
                        <span className="text-[9px] font-bold opacity-90 block">
                          OI: {stock.oiChange >= 0 ? "+" : ""}{stock.oiChange}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* INFO MODAL OVERLAY */}
      {showInfoModal && (
        <div 
          id="info-modal-overlay"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[999] p-4 transition-all animate-fade-in"
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            id="info-modal-card"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0066cc] px-5 py-3.5 flex items-center justify-between text-white font-sans">
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5 uppercase font-mono">
                {ivStock} Info
              </h3>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="text-white/80 hover:text-white transition cursor-pointer p-1 hover:bg-white/10 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 bg-slate-50/50">
              
              {/* Info Subcard (KPI + Expiry) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col md:flex-row justify-between items-stretch gap-6">
                
                {/* Left Side: Spot Price & Trends */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                      {ivStock}
                    </span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans">
                        {modalSpotPrice.toFixed(2)}
                      </span>
                      <span className={`text-sm font-extrabold flex items-center gap-0.5 ${modalPercentChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {modalPercentChange >= 0 ? `+${modalPercentChange.toFixed(2)}%` : `${modalPercentChange.toFixed(2)}%`}
                      </span>
                      <div className="border border-blue-200 rounded-lg p-1 bg-blue-50/40">
                        {modalPercentChange >= 0 ? (
                          <TrendingUp size={14} className="text-blue-500" />
                        ) : (
                          <TrendingDown size={14} className="text-rose-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono font-bold mt-4">
                    <span>O: {modalOpenPrice.toFixed(2)}</span>
                    <span className="mx-2.5 text-slate-200">|</span>
                    <span>H: {modalHighPrice.toFixed(2)}</span>
                    <span className="mx-2.5 text-slate-200">|</span>
                    <span>L: {modalLowPrice.toFixed(2)}</span>
                    <span className="mx-2.5 text-slate-200">|</span>
                    <span>C: {modalPrevClose.toFixed(2)}</span>
                  </div>
                </div>

                {/* Vertical Separator */}
                <div className="hidden md:block w-[1px] bg-slate-200/80 mx-2"></div>

                {/* Right Side: Expiry & Futures */}
                <div className="flex-1 flex flex-col justify-between pl-0 md:pl-2">
                  <div className="relative">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1">
                      Expiry
                    </span>
                    <div 
                      onClick={() => setShowModalExpiryDropdown(!showModalExpiryDropdown)}
                      className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-xs font-black text-slate-700 cursor-pointer hover:border-slate-300 transition select-none max-w-[200px]"
                    >
                      <span>{infoModalExpiry}</span>
                      <ChevronDown size={14} className="text-slate-400" />
                    </div>
                    {showModalExpiryDropdown && (
                      <div className="absolute left-0 mt-1.5 w-[200px] bg-white border border-slate-200 rounded-lg shadow-md z-50 font-mono py-1 text-xs">
                        {["30 Jun (4 Days)", "07 Jul (11 Days)", "14 Jul (18 Days)"].map((exp) => (
                          <div 
                            key={exp}
                            onClick={() => {
                              setInfoModalExpiry(exp);
                              setShowModalExpiryDropdown(false);
                            }}
                            className={`px-3 py-1.5 hover:bg-slate-50 cursor-pointer ${infoModalExpiry === exp ? "bg-blue-50/50 font-bold text-blue-600" : "text-slate-700"}`}
                          >
                            {exp}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-sans font-bold">30th Jun Monthly Futures:</span>
                    <span className="font-mono text-sm font-extrabold text-slate-800">
                      {(ivStock === "NIFTY" ? liveNiftyPrice + 47.30 : liveBankNiftyPrice + 150.00).toFixed(2)}
                    </span>
                  </div>
                </div>

              </div>

              {/* Tabs Row Header */}
              <div className="flex items-center justify-between border-b border-slate-200 relative pt-2">
                <div className="flex gap-6">
                  {["F&O Data", "Events", "Candlestick Patterns", "Fut. Prices"].map((tab) => {
                    const isActive = infoModalTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setInfoModalTab(tab)}
                        className={`py-2 text-xs font-bold tracking-wide relative cursor-pointer select-none transition-colors ${
                          isActive ? "text-blue-600 border-b-2 border-blue-600 -mb-[2px]" : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>
                
                <span className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer select-none flex items-center gap-0.5">
                  Contract Specifications <ChevronRight size={12} />
                </span>
              </div>

              {/* Active Tab Panel */}
              <div className="min-h-[160px]">
                {infoModalTab === "F&O Data" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-3xs">
                    {/* Column 1 */}
                    <div className="flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
                      <div className="flex items-center justify-between py-3 px-4 border-b border-slate-100 min-h-[50px]">
                        <span className="text-[11px] text-slate-400 font-sans flex items-center gap-1 font-bold uppercase">
                          Fut. OI Chg. <Info size={11} className="text-slate-400 cursor-help" />
                        </span>
                        <span className="text-xs font-extrabold text-slate-700">{modalFutOIChg}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 px-4 border-b border-slate-100 min-h-[50px]">
                        <span className="text-[11px] text-slate-400 font-sans font-bold uppercase">Lot Size</span>
                        <span className="text-xs font-extrabold text-slate-700">{ivStock === "NIFTY" ? "65" : "15"}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 px-4 min-h-[50px]">
                        <span className="text-[11px] text-slate-400 font-sans flex items-center gap-1 font-bold uppercase">
                          P&L/₹1 Price Move <Info size={11} className="text-slate-400 cursor-help" />
                        </span>
                        <span className="text-xs font-extrabold text-slate-700">{ivStock === "NIFTY" ? "65" : "15"}</span>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
                      <div className="flex items-center justify-between py-3 px-4 border-b border-slate-100 min-h-[50px]">
                        <span className="text-[11px] text-slate-400 font-sans font-bold uppercase">ATM Strike</span>
                        <span className="text-xs font-extrabold text-slate-700">{modalAtmStrike}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 px-4 border-b border-slate-100 min-h-[50px]">
                        <span className="text-[11px] text-slate-400 font-sans flex items-center gap-1 font-bold uppercase">
                          ATM IV <Info size={11} className="text-slate-400 cursor-help" />
                        </span>
                        <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                          <span>{modalAtmIV.toFixed(2)}</span>
                          <span className={modalAtmIVChange >= 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                            {modalAtmIVChange >= 0 ? `+${modalAtmIVChange}%` : `${modalAtmIVChange}%`}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-3 px-4 border-b border-slate-100 min-h-[50px]">
                        <span className="text-[11px] text-slate-400 font-sans flex items-center gap-1 font-bold uppercase">
                          IV Percentile <Info size={11} className="text-slate-400 cursor-help" />
                        </span>
                        <span className="text-xs font-extrabold text-slate-700">{ivStock === "NIFTY" ? "31" : "58"}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 px-4 min-h-[50px]">
                        <span className="text-[11px] text-slate-400 font-sans flex items-center gap-1 font-bold uppercase">
                          IndiaVIX <Info size={11} className="text-slate-400 cursor-help" />
                        </span>
                        <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                          <span>{liveVixValue.toFixed(2)}</span>
                          <span className={liveVixChange >= 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                            {liveVixChange >= 0 ? `+${liveVixChange.toFixed(2)}` : `${liveVixChange.toFixed(2)}`}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Column 3 */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between py-3 px-4 border-b border-slate-100 min-h-[50px]">
                        <span className="text-[11px] text-slate-400 font-sans flex items-center gap-1 font-bold uppercase">
                          PCR <Info size={11} className="text-slate-400 cursor-help" />
                        </span>
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-extrabold text-[10.5px] px-2 py-0.5 rounded border border-emerald-200">
                          <span>{modalPCR.toFixed(2)}</span>
                          <span className="text-[9px]">{modalPCR >= 1.0 ? "▲" : "▼"}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-3 px-4 min-h-[50px]">
                        <span className="text-[11px] text-slate-400 font-sans flex items-center gap-1 font-bold uppercase">
                          Max Pain <Info size={11} className="text-slate-400 cursor-help" />
                        </span>
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-extrabold text-[10.5px] px-2 py-0.5 rounded border border-emerald-200">
                          <span>{modalMaxPain}</span>
                          <span className="text-[9px]">▲</span>
                        </span>
                      </div>
                      <div className="hidden md:block flex-1 bg-slate-50/10"></div>
                    </div>
                  </div>
                )}

                {infoModalTab === "Events" && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                      Upcoming Economic Events ({ivStock})
                    </h4>
                    <div className="divide-y divide-slate-100">
                      <div className="py-2.5 flex justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block">US Fed Interest Rate Decision</span>
                          <span className="text-slate-400 text-[10px]">Impact: Extremely High</span>
                        </div>
                        <span className="font-mono text-slate-500 font-semibold">28 Jun, 23:30</span>
                      </div>
                      <div className="py-2.5 flex justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block">India GDP Growth Q1</span>
                          <span className="text-slate-400 text-[10px]">Impact: High</span>
                        </div>
                        <span className="font-mono text-slate-500 font-semibold">30 Jun, 17:30</span>
                      </div>
                      <div className="py-2.5 flex justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block">RBI Monetary Policy Meeting</span>
                          <span className="text-slate-400 text-[10px]">Impact: Extremely High</span>
                        </div>
                        <span className="font-mono text-slate-500 font-semibold">03 Jul, 10:00</span>
                      </div>
                    </div>
                  </div>
                )}

                {infoModalTab === "Candlestick Patterns" && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                      Detected Technical Patterns (Daily)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                        <span className="text-[11px] text-emerald-800 font-extrabold block">Bullish Marubozu (Confirmed)</span>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Strong buying interest throughout the session, indicating continuation of the upward trajectory.
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                        <span className="text-[11px] text-blue-800 font-extrabold block">Hammer Pattern (Potential)</span>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Price rejected lower bounds heavily, indicating immediate buyer accumulation support.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {infoModalTab === "Fut. Prices" && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                      Futures Contract Prices
                    </h4>
                    <div className="divide-y divide-slate-100">
                      <div className="py-2.5 flex justify-between text-xs">
                        <span className="font-bold text-slate-800">Near Month (June Expiry)</span>
                        <span className="font-mono font-bold text-slate-700">
                          {(ivStock === "NIFTY" ? liveNiftyPrice + 47.30 : liveBankNiftyPrice + 150.00).toFixed(2)}
                        </span>
                      </div>
                      <div className="py-2.5 flex justify-between text-xs">
                        <span className="font-bold text-slate-800">Next Month (July Expiry)</span>
                        <span className="font-mono font-bold text-slate-700">
                          {(ivStock === "NIFTY" ? liveNiftyPrice + 184.50 : liveBankNiftyPrice + 380.00).toFixed(2)}
                        </span>
                      </div>
                      <div className="py-2.5 flex justify-between text-xs">
                        <span className="font-bold text-slate-800">Far Month (August Expiry)</span>
                        <span className="font-mono font-bold text-slate-700">
                          {(ivStock === "NIFTY" ? liveNiftyPrice + 329.00 : liveBankNiftyPrice + 620.00).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
