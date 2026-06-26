import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let fallbackUntil = 0;

// ---------- 1. CONSTANTS (आपका Permanent System Prompt) ----------
const SYSTEM_PROMPT = `
तुम "AshTek Fire AI (Seller Panic AI Bot)" हो। तुम्हारा काम रीटेल ट्रेडर्स को Operators (Smart Money) के जाल से बचाना है। तुम केवल Hinglish (रोमन हिंदी) में बोलते हो और हर जवाब के अंत में सिर्फ 3 सिग्नल में से एक देते हो: 🟢 BUY CE ACTIVE, 🔴 BUY PE ACTIVE, या 🟡 NO TRADE ZONE।

तुम्हारे विश्लेषण के मुख्य 3 स्तंभ (नियम):
1. 5-Phase Expiry Trap Cycle (एक्सपायरी का खेल):
   - Phase 1 (Morning Bull Trap - 9:15 to 10:30): अगर सुबह तेजी आ रही है लेकिन VIX बढ़ रहा है, तो ये झांसा है। इस समय BUY CE का सिग्नल मत दो।
   - Phase 2 (Smart Money Strike - 10:30 to 12:30): अचानक गिरावट आती है। अगर Nifty 50 अपने पिछले 15-min के Low को तोड़ता है और VIX > 15 है, तो 🔴 BUY PE ACTIVE दो।
   - Phase 3 (Shock & Decay Zone - 12:30 to 2:15): मार्केट को साइडवेज करके प्रीमियम गलाया जाता है। इस समय (जब Nifty सिर्फ 0.2-0.4% की रेंज में हो) 🟡 NO TRADE ZONE दो, भले ही तुम्हें कुछ और सिग्नल दिखे।
   - Phase 4 (Hope Revival - 2:15 to 3:00): झूठा ब्रेकआउट। अगर Nifty VWAP से ऊपर जाए लेकिन Put OI घटने की बजाय बढ़ रहा है, तो ये ट्रैप है, Buy CE मत दो।
   - Phase 5 (Final Rug Pull - 3:00 to 3:30): अगर 3:00 बजे के बाद VIX में 3% से ज्यादा की तेजी आती है, तो 🔴 BUY PE ACTIVE दो। अगर VIX फ्लैट है और OI स्क्वीज हो रहा है, तो 🟢 BUY CE ACTIVE दो।

2. Operator Fake Breakdown / Bear Trap Detection (भालू का जाल):
   - सबसे जरूरी नियम: यदि NIFTY की कीमत (Price) गिर रही है (लाल कैंडल बन रही है) लेकिन आपको डेटा में "Put OI Change" (पुट ओपन इंटरेस्ट) घटने के बजाय बढ़ता (Positive) हुआ दिखे, तो समझ जाओ कि बड़े खिलाड़ी (Operators) नीचे से सपोर्ट खरीद रहे हैं। ये Bear Trap है। ऐसे में NEVER say BUY PE. यहाँ 🟢 BUY CE ACTIVE का मौका होता है।

3. FII और DII की सैर (Institutional Activity):
   - अगर FII आज के कारोबार में 1000 करोड़ से ज्यादा की बिकवाली (Sell) कर रहे हैं, लेकिन DII उतनी ही खरीदारी (Buy) कर रहे हैं, तो मार्केट डिप पर ठीक हो जाएगा। इस स्थिति में ओवरऑल ट्रेंड न्यूट्रल रहेगा।
   - अगर FII और DII दोनों एक साथ बिकवाली कर रहे हैं, तो भारी गिरावट आ सकती है → 🔴 BUY PE ACTIVE.

तुम्हारा Output हमेशा इसी JSON फॉर्मेट में होना चाहिए (बिना किसी extra text के):
{
  "market_phase": "Phase 1 / 2 / 3 / 4 / 5",
  "trap_detected": "Bull Trap / Bear Trap / None",
  "signal": "BUY_CE / BUY_PE / NO_TRADE",
  "reasoning": "यहाँ 2 लाइन में Hinglish में कारण लिखो",
  "suggested_strike": "User Data में दी गई ATM Strike",
  "risk": "High / Medium / Low"
}
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
  const vix = cacheData?.vix || "N/A";
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
    Abhi market ka live data dekho (yeh data server memory cache se directly fetch hua hai, UI flicker se nahi):
    - Nifty Spot: ${spot}
    - India VIX: ${vix}
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

    In sab numbers ko apne rules (5-Phase Trap Cycle, Bear Trap Rule, FII/DII) ke hisaab से analyze karo.
    Mujhe sirf JSON format mein jawab do, koi extra text nahi chahiye.
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

    // 3. Auto-Fetch User Prompt बनाओ
    const userPrompt = buildUserPrompt(liveCache);

    // 4. Gemini API को कॉल करो
    let key = process.env.GEMINI_API_KEY;
    if (key) {
      key = key.replace(/['"]/g, "").trim();
    }
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }

    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    console.log("🤖 Calling Gemini for Trading Signal with multi-model fallback list...");

    const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 [Trading Bot] Attempting generation with model: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }] },
          ],
          config: {
            responseMimeType: "application/json", // सीधा JSON मिलेगा
            temperature: 0.1, // कम टेम्परेचर = सटीक और स्थिर जवाब
          },
        });
        
        if (response && response.text) {
          console.log(`✅ [Trading Bot] Successfully generated content with model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = ((err.message || "") + " " + JSON.stringify(err)).toLowerCase();
        
        // If it's a quota / rate limit / 429 error, don't try other models. They will all fail anyway!
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("resource_exhausted") || errMsg.includes("limit")) {
          console.log(`ℹ️ [Trading Bot] Model ${modelName} hit Gemini API limit or quota. Switching immediately to fallback engine to respect free-tier constraints.`);
          break; // Break the model loop immediately
        } else {
          console.warn(`⚠️ [Trading Bot] Model ${modelName} failed or busy. Error: ${err.message || err}`);
        }
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("All trading bot Gemini models were unavailable or failed.");
    }

    // 5. JSON पार्स करो और वापस भेजो
    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini returned empty response.");
    }

    let cleaned = resultText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    }

    const botDecision = JSON.parse(cleaned);
    
    // ✅ सफलता! इसे आगे भेजो
    console.log(`✅ Signal Generated: ${botDecision.signal} at ${botDecision.suggested_strike}`);
    
    return {
      success: true,
      data: botDecision,
      timestamp: new Date().toISOString(),
    };

  } catch (error: any) {
    const errStr = ((error.message || "") + " " + JSON.stringify(error)).toLowerCase();
    if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("resource_exhausted") || errStr.includes("limit")) {
      // Enter API-breaker mode for 5 minutes
      fallbackUntil = Date.now() + 5 * 60 * 1000;
      console.log(`⚠️ Gemini API rate-limited or quota exhausted. Entering AshTek local quant fallback mode for 5 minutes (until ${new Date(fallbackUntil).toLocaleTimeString()}).`);
    } else {
      console.log("ℹ️ Auto-Trading Bot Fallback Active (API limit fallback mode):", error.message || error);
    }
    
    // Local Quantitative Rule Engine Fallback (AshTek Rules)
    const spot = parseFloat(liveCache?.nifty_spot) || 24018.45;
    const vix = parseFloat(liveCache?.vix) || 13.20;
    const ceOi = parseFloat(liveCache?.ce_oi_change) || 0;
    const peOi = parseFloat(liveCache?.pe_oi_change) || 0;
    const fii = parseFloat(liveCache?.fii_net_activity) || 0;
    const dii = parseFloat(liveCache?.dii_net_activity) || 0;
    const openPrice = parseFloat(liveCache?.market_open) || 23920.00;
    const suggested_strike = Math.round(spot / 50) * 50;

    // Time-based phase determination
    const now = new Date();
    const istTime = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const dateObj = new Date(istTime);
    const hour = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const totalMin = hour * 60 + minutes;

    let market_phase = "Phase 3 (Shock & Decay Zone)";
    if (totalMin >= 555 && totalMin < 630) {
      market_phase = "Phase 1 (Morning Bull Trap)";
    } else if (totalMin >= 630 && totalMin < 750) {
      market_phase = "Phase 2 (Smart Money Strike)";
    } else if (totalMin >= 750 && totalMin < 855) {
      market_phase = "Phase 3 (Shock & Decay Zone)";
    } else if (totalMin >= 855 && totalMin < 900) {
      market_phase = "Phase 4 (Hope Revival)";
    } else if (totalMin >= 900 && totalMin <= 930) {
      market_phase = "Phase 5 (Final Rug Pull)";
    }

    let signal: "BUY_CE" | "BUY_PE" | "NO_TRADE" = "NO_TRADE";
    let trap_detected = "None";
    let reasoning = "Decay zone active. Premium decay se bachein. Smart money volume increase hone ka wait karein.";
    let risk = "Medium";

    // 1. Strict India_VIX Rules (Rule 4)
    if (vix >= 20) {
      signal = "NO_TRADE";
      trap_detected = "None";
      reasoning = "🔴 BLOCK ALL BUY ORDERS. India VIX >= 20 hai, exit existing positions if profit > 20%. Volatility extra high hai.";
      risk = "High";
    } else if (vix < 12) {
      signal = "BUY_CE"; // default premium is cheap, strong buying in options
      trap_detected = "None";
      reasoning = "🟢 STRONG BUY (Both Calls & Puts) because India VIX < 12. Option premiums are incredibly cheap.";
      risk = "Low";
    } else if (vix >= 12 && vix <= 14) {
      // Trend following signal
      if (peOi > ceOi + 0.05) {
        signal = "BUY_CE";
        reasoning = "VIX between 12-14. Positive trend and high Put writing support detected. BUY (Directional - Trend following).";
        risk = "Low";
      } else if (ceOi > peOi + 0.05) {
        signal = "BUY_PE";
        reasoning = "VIX between 12-14. Negative trend and high Call writing resistance detected. BUY (Directional - Trend following).";
        risk = "Low";
      } else {
        signal = "NO_TRADE";
        reasoning = "WAIT (No fresh buying). Range-bound market with VIX between 12-14. Volume breakout ka wait karein.";
        risk = "Low";
      }
    } else {
      // VIX between 15 and 19
      // Rule: Hedged buy ATM Straddle or avoid
      if (spot > openPrice && peOi > ceOi) {
        signal = "BUY_CE";
        reasoning = "HEDGED BUY (Buy ATM Straddle). VIX is elevated (15-19), high potential for a fast breakout move.";
        risk = "Medium";
      } else {
        signal = "NO_TRADE";
        reasoning = "AVOID / SELL EXISTING. High option premium decay risks under current market structure.";
        risk = "High";
      }
    }

    // 2. Bear Trap Detection (Operator Fake Breakdown Rule)
    if (signal === "NO_TRADE" || signal === "BUY_PE") {
      const isPriceFalling = spot < openPrice;
      const isPutOIGrowing = peOi > 0.02; // Put open interest is growing positively
      if (isPriceFalling && isPutOIGrowing) {
        trap_detected = "Bear Trap";
        signal = "BUY_CE";
        reasoning = "Bear Trap Detected! Price is falling par Put OI badh raha hai. Operators niche se supports active kar rahe hain.";
        risk = "Medium";
      }
    }

    // 3. FII/DII Institutional Panic Rule
    if (fii < -1000 && dii < -500 && signal !== "BUY_CE") {
      signal = "BUY_PE";
      reasoning = "FII & DII dono taraf se heavy selling activity chal rahi hai. Momentum side down-side breakout favour karega.";
      risk = "Medium";
    }

    // 4. Time Phase specific overrides
    if (market_phase === "Phase 3 (Shock & Decay Zone)" && signal !== "NO_TRADE") {
      // Force NO_TRADE during lunch sideways period unless VIX < 12
      if (vix >= 12) {
        signal = "NO_TRADE";
        reasoning = "Shock & Decay Zone (12:30 - 2:15). Sideways range 0.2-0.4% mein hai. Premium decay hone se bachein.";
        risk = "Low";
      }
    }

    return {
      success: true,
      data: {
        market_phase,
        trap_detected,
        signal,
        reasoning,
        suggested_strike,
        risk
      },
      fallback: true,
      timestamp: new Date().toISOString(),
    };
  }
};
