import { GoogleGenAI } from "@google/genai";
import { analyzeMarketWithGemini } from "./geminiAnalyzer.js";
import dotenv from "dotenv";

dotenv.config();

let fallbackUntil = 0;

// ---------- 1. CONSTANTS (आपका Permanent System Prompt) ----------
const SYSTEM_PROMPT = `
You are a seasoned market psychologist and algorithmic trader. Your goal is to analyze live market data and detect high-probability trading opportunities based on technicals, volatility, and crowd psychology (fear/greed).

Rules you must strictly follow:
1. Analyze the provided Nifty, Bank Nifty, India VIX, and top stock prices.
2. Check if the market is in extreme greed (overbought, VIX below 12) or extreme fear (oversold, VIX above 25).
3. Validate if the volume confirms the price movement.
4. If the data is ambiguous or highly volatile, output HOLD.
5. ALWAYS output your response in STRICT JSON format. Do not add any extra text or markdown formatting outside the JSON.

Output schema:
{
  "signal": "BUY" or "SELL" or "HOLD",
  "confidence": "High" or "Medium" or "Low",
  "psychology": "Bullish" or "Bearish" or "Neutral",
  "reason": "Short 1-line explanation for the signal"
}

Only trigger a BUY or SELL if confidence is at least "Medium". If confidence is "Low", always output HOLD.
`;

// ---------- 2. यूटिलिटी फंक्शंस ----------

// 2A. क्या मार्केट खुला है? (IST टाइम चेक करें)
const isMarketOpen = (): boolean => {
  const now = new Date();
  // IST में टाइम कन्वर्ट करें
  const istTime = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const dateObj = new Date(istTime);
  const currentHour = dateObj.getHours();
  const currentMinutes = dateObj.getMinutes();
  const currentDay = dateObj.getDay(); // 0=Sunday, 6=Saturday

  // Weekend बंद
  if (currentDay === 0 || currentDay === 6) return false;

  // मार्केट टाइम: 9:15 AM से 3:30 PM
  const marketOpenHour = 9,
    marketOpenMin = 15;
  const marketCloseHour = 15,
    marketCloseMin = 30;

  const currentTotalMinutes = currentHour * 60 + currentMinutes;
  const openTotalMinutes = marketOpenHour * 60 + marketOpenMin;
  const closeTotalMinutes = marketCloseHour * 60 + marketCloseMin;

  return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;
};

// 2B. Expiry के दिन निकालें (अगला गुरुवार)
const getExpiryDaysLeft = (): string => {
  const today = new Date();
  const day = today.getDay(); // 4 = Thursday
  let daysUntilThursday = 4 - day;
  if (daysUntilThursday < 0) daysUntilThursday += 7;
  if (daysUntilThursday === 0) return "0 days (Today is Expiry)";
  return `${daysUntilThursday} days left`;
};

// 2C. User Prompt Auto-Fetch बनाएं (Cache से)
const buildUserPrompt = (cacheData: any): string => {
  const currentTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });

  // अगर कैश में डेटा नहीं है तो डिफॉल्ट वैल्यू
  const spot = cacheData?.nifty_spot || "N/A";
  const banknifty = cacheData?.banknifty_spot || "N/A";
  const vix = cacheData?.vix || "N/A";
  const reliance = cacheData?.reliance_price || "N/A";
  const hdfcbank = cacheData?.hdfcbank_price || "N/A";
  const infy = cacheData?.infy_price || "N/A";
  const tcs = cacheData?.tcs_price || "N/A";

  const ceOi = cacheData?.ce_oi_change || "0";
  const peOi = cacheData?.pe_oi_change || "0";
  const atmStrike = cacheData?.atm_strike || "N/A";
  const cePremium = cacheData?.ce_premium || "N/A";
  const pePremium = cacheData?.pe_premium || "N/A";
  const fii = cacheData?.fii_net_activity || "0";
  const dii = cacheData?.dii_net_activity || "0";
  const openPrice = cacheData?.market_open || "N/A";
  const expiry = getExpiryDaysLeft();

  return `
    Abhi market ka live data dekho (yeh data server memory cache se directly fetch hua hai):
    - Nifty Spot: ${spot}
    - Bank Nifty Spot: ${banknifty}
    - India VIX: ${vix}
    - Reliance Price: ${reliance}
    - HDFC Bank Price: ${hdfcbank}
    - Infosys Price: ${infy}
    - TCS Price: ${tcs}
    
    - Call OI Change (CE): ${ceOi}%
    - Put OI Change (PE): ${peOi}%
    - ATM Strike: ${atmStrike}
    - CE Premium: ${cePremium}
    - PE Premium: ${pePremium}
    - FII Net Activity: ${fii} Crores
    - DII Net Activity: ${dii} Crores
    - Today's Open: ${openPrice}
    - Abhi ka Time (IST): ${currentTime}
    - Expiry: ${expiry}

    In sab numbers ko analyze karo, greed and fear levels assess karo, aur volume context validate karo.
    Mujhe sirf JSON format mein jawab do, koi extra text ya markdown formatting nahi chahiye.
  `;
};

// ---------- 3. मुख्य बॉट इंजन (जो Gemini को कॉल करेगा) ----------
export const runAutoTradingBot = async (liveCache: any) => {
  try {
    // Check if we are in API-breaker mode to avoid repetitive failures and server delays
    if (Date.now() < fallbackUntil) {
      throw new Error(`Gemini API is currently rate-limited or quota is exhausted. Automatically routing requests to the high-fidelity local AshTek Quant Engine for safety.`);
    }

    // 1. चेक करो: क्या मार्केट खुला है?
    if (!isMarketOpen()) {
      console.log("⏰ Market is closed. Skipping AI call.");
      return {
        success: true,
        data: {
          market_phase: "None",
          trap_detected: "None",
          signal: "NO_TRADE",
          reasoning: "अभी मार्केट बंद है या वीकेंड है। कृपया सोमवार से शुक्रवार सुबह 9:15 बजे से दोपहर 3:30 बजे के बीच ट्राई करें।",
          suggested_strike: liveCache?.atm_strike || 24000,
          risk: "Low"
        },
        market_status: "Closed",
      };
    }

    // 2. क्या कैश में डेटा मौजूद है?
    if (!liveCache || !liveCache.nifty_spot) {
      console.error("❌ Cache is empty. Cannot run bot.");
      return {
        success: false,
        signal: "NO_TRADE",
        reasoning: "सर्वर कैश में लाइव डेटा नहीं मिला। कृपया डेटा फेचिंग API (NSE/Yahoo) को चेक करें।",
        market_status: "No Data",
      };
    }

    // 3. User ka input tayyar karo
    const marketData = {
      nifty: liveCache.nifty_spot,
      vix: liveCache.vix,
      bankNifty: liveCache.banknifty_spot,
      topStocks: [
        { symbol: "RELIANCE", price: liveCache.reliance_price },
        { symbol: "HDFC", price: liveCache.hdfcbank_price },
        { symbol: "INFY", price: liveCache.infy_price },
        { symbol: "TCS", price: liveCache.tcs_price }
      ],
      volumeTrend: "Normal"
    };

    // 4. Call our custom user function from services/geminiAnalyzer.ts
    console.log("🤖 Calling user-defined analyzeMarketWithGemini function...");
    const botDecision = await analyzeMarketWithGemini(marketData);

    if (!botDecision) {
      throw new Error("analyzeMarketWithGemini returned null. Falling back to local quant analysis.");
    }
    
    // Add backward compatibility mapping for the UI
    const finalSignal = botDecision.signal || "HOLD"; // "BUY", "SELL", "HOLD"
    const mappedSignal = finalSignal === "BUY" ? "BUY_CE" : (finalSignal === "SELL" ? "BUY_PE" : "NO_TRADE");
    
    const augmentedDecision = {
      ...botDecision,
      // User requested exact keys
      signal: finalSignal,
      confidence: botDecision.confidence || "Medium",
      psychology: botDecision.psychology || "Neutral",
      reason: botDecision.reason || "Technicals aligned.",
      
      // Compatibility keys
      suggested_strike: botDecision.suggested_strike || Math.round((parseFloat(liveCache?.nifty_spot) || 24018.45) / 50) * 50,
      market_phase: botDecision.market_phase || `Psychology: ${botDecision.psychology || 'Neutral'}`,
      trap_detected: botDecision.trap_detected || (finalSignal === "HOLD" ? "Awaiting Confirmation" : "None"),
      risk: botDecision.risk || (botDecision.confidence === "High" ? "Low" : (botDecision.confidence === "Low" ? "High" : "Medium")),
      reasoning: botDecision.reasoning || botDecision.reason || "Quantitative trend assessment.",
      mappedSignal: mappedSignal // helper to easily read in UI if needed
    };

    console.log(`✅ Signal Generated: ${augmentedDecision.signal} (${augmentedDecision.mappedSignal})`);
    
    return {
      success: true,
      data: augmentedDecision,
      timestamp: new Date().toISOString(),
    };

  } catch (error: any) {
    const errStr = ((error.message || "") + " " + JSON.stringify(error)).toLowerCase();
    if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("resource_exhausted") || errStr.includes("limit")) {
      fallbackUntil = Date.now() + 5 * 60 * 1000;
      console.log(`⚠️ Gemini API rate-limited or quota exhausted. Entering AshTek local quant fallback mode for 5 minutes.`);
    } else {
      console.log("ℹ️ Auto-Trading Bot Fallback Active (API limit fallback mode):", error.message || error);
    }
    
    // Local Quantitative Rule Engine Fallback (AshTek Rules)
    const spot = parseFloat(liveCache?.nifty_spot) || 24018.45;
    const vix = parseFloat(liveCache?.vix) || 13.20;
    const ceOi = parseFloat(liveCache?.ce_oi_change) || 0;
    const peOi = parseFloat(liveCache?.pe_oi_change) || 0;
    const openPrice = parseFloat(liveCache?.market_open) || 23920.00;
    const suggested_strike = Math.round(spot / 50) * 50;

    let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
    let confidence: "High" | "Medium" | "Low" = "Low";
    let psychology: "Bullish" | "Bearish" | "Neutral" = "Neutral";
    let reason = "Data is range-bound and volatile. Awaiting volume confirmation.";

    // Volatility checks based on User's explicit VIX rules
    if (vix < 12) {
      signal = "BUY";
      confidence = "High";
      psychology = "Bullish";
      reason = "Extreme greed detected (VIX < 12). Option premiums are cheap.";
    } else if (vix >= 20) {
      signal = "HOLD";
      confidence = "Low";
      psychology = "Neutral";
      reason = "🔴 India VIX >= 20. BLOCK ALL BUY ORDERS. High volatility danger.";
    } else if (vix >= 12 && vix <= 14) {
      psychology = peOi > ceOi ? "Bullish" : "Bearish";
      confidence = "Medium";
      signal = peOi > ceOi ? "BUY" : "SELL";
      reason = `Trend following active. ${psychology} build up in options activity.`;
    } else {
      signal = "HOLD";
      confidence = "Low";
      psychology = "Neutral";
      reason = "Volatile sideways structure. Waiting for clear market bias.";
    }

    // Only trigger BUY or SELL if confidence is at least "Medium"
    if (confidence === "Low") {
      signal = "HOLD";
    }

    const mappedSignal = signal === "BUY" ? "BUY_CE" : (signal === "SELL" ? "BUY_PE" : "NO_TRADE");

    return {
      success: true,
      data: {
        signal,
        confidence,
        psychology,
        reason,
        // Compatibility keys
        suggested_strike,
        market_phase: `VIX ${vix}`,
        trap_detected: "None",
        risk: confidence === "High" ? "Low" : "Medium",
        reasoning: reason,
        mappedSignal
      },
      fallback: true,
      timestamp: new Date().toISOString(),
    };
  }
};
