import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Lazy initialize Gemini API to avoid early crashes if environment keys are missing
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required to run the derivatives analyser. Please configure it in your Secrets / Env variables.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// 1. Defined structured JSON schema for Type safety inside Gemini responses
const derivativesReportSchema = {
  type: Type.OBJECT,
  properties: {
    pcr: {
      type: Type.OBJECT,
      properties: {
        value: { type: Type.NUMBER, description: "Calculate final Option Chain Put-Call Ratio (Put Total OI / Call Total OI)." },
        interpretation: { type: Type.STRING, description: "Overbought, Neutral, Oversold, Moderately Bullish, or Moderately Bearish." },
        details: { type: Type.STRING, description: "Hinglish deep explanation about Put Call Ratio (PCR) market direction." },
      },
      required: ["value", "interpretation", "details"],
    },
    supportResistance: {
      type: Type.OBJECT,
      properties: {
        supportStrikes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              strike: { type: Type.NUMBER },
              oi: { type: Type.NUMBER, description: "Open interest value in contracts or lakhs" },
              details: { type: Type.STRING, description: "Detailed explanation of why this strike acts as support (e.g., heavy Put writer concentration or Put buying)." },
            },
            required: ["strike", "oi", "details"],
          },
          description: "Top 2 strongest Support levels",
        },
        resistanceStrikes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              strike: { type: Type.NUMBER },
              oi: { type: Type.NUMBER, description: "Open interest value in contracts or lakhs" },
              details: { type: Type.STRING, description: "Detailed explanation of why this strike acts as resistance (e.g., heavy Call writer buildup)." },
            },
            required: ["strike", "oi", "details"],
          },
          description: "Top 2 strongest Resistance levels",
        },
        maxPain: { type: Type.NUMBER, description: "Calculated point of maximum pain for options buyers where option sellers/writers lose the least." },
      },
      required: ["supportStrikes", "resistanceStrikes", "maxPain"],
    },
    institutionalAlignment: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "Summary like 'Bullish Alignment', 'Bearish Alignment', or 'Contradictory / Hedging Profile'." },
        analysis: { type: Type.STRING, description: "A detailed professional analysis answering what the FII/DII action means. Specifically address: 'Agar FII cash mein sell kar rahe hain par Put writing heavy hai, toh is contradiction ka kya matlab hai?' Explain in Roman Urdu/Hindi (Hinglish)." },
      },
      required: ["summary", "analysis"],
    },
    trapsAndScenarios: {
      type: Type.OBJECT,
      properties: {
        shortCoveringTrigger: { type: Type.NUMBER, description: "Strike price which acts as a trigger point for a massive Short Covering rally." },
        shortCoveringDetails: { type: Type.STRING, description: "Detailed description of short covering trigger points and why Call writers will run to cover." },
        longUnwindingTrigger: { type: Type.NUMBER, description: "Strike price below which long unwinding pressure initiates." },
        longUnwindingDetails: { type: Type.STRING, description: "Detailed description of long unwinding scenario." },
        trapLevel: { type: Type.STRING, description: "Exact critical point where aggressive sellers or buyers get trapped." },
        trapExplanation: { type: Type.STRING, description: "Hinglish explanation of trap zones, how smart money triggers traps, and safety rules for retail traders." },
      },
      required: ["shortCoveringTrigger", "shortCoveringDetails", "longUnwindingTrigger", "longUnwindingDetails", "trapLevel", "trapExplanation"],
    },
    suggestedStrategies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, description: "Must be one of 'BullCallSpread', 'BearPutSpread', 'IronCondor', 'LongStraddle', 'ShortStrangle', 'Custom'" },
          legs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                strike: { type: Type.NUMBER },
                type: { type: Type.STRING, description: "CE or PE" },
                action: { type: Type.STRING, description: "BUY or SELL" },
                premium: { type: Type.NUMBER, description: "Estimated premium price or actual ltp of strike" },
              },
              required: ["strike", "type", "action", "premium"],
            },
          },
          maxProfit: { type: Type.STRING, description: "E.g. 'Rs. 4,500' or 'Unlimited'" },
          maxLoss: { type: Type.STRING, description: "E.g. 'Rs. 2,100' or 'Unlimited'" },
          riskRewardRatio: { type: Type.STRING, description: "E.g. '1:2.15' or 'N/A'" },
          breakEven: { type: Type.STRING, description: "Expiry breakeven levels" },
          tacticalEntryExit: { type: Type.STRING, description: "Tactical guidelines in Hinglish (adjustments, target premium, stop loss) for running this strategy." },
        },
        required: ["name", "type", "legs", "maxProfit", "maxLoss", "riskRewardRatio", "breakEven", "tacticalEntryExit"],
      },
      description: "Provide exactly two highly optimized options strategy suggestions.",
    },
  },
  required: ["pcr", "supportResistance", "institutionalAlignment", "trapsAndScenarios", "suggestedStrategies"],
};

// Robust helper function with retries and exponential backoff, with fallback models if gemini-3.5-flash is overloaded
async function generateContentWithFallback(
  client: GoogleGenAI,
  systemInstruction: string,
  dataContext: string
): Promise<any> {
  // We prioritize gemini-3.5-flash, but have rich high-capacity fallbacks: gemini-flash-latest and gemini-3.1-flash-lite
  const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let retries = 2; // 2 retries per model to quickly swap over model list if busy
    let delayMs = 1000;

    while (retries > 0) {
      try {
        console.log(`[Quanta Derivatives SDK] Attempting generation with model: ${modelName} (${retries} retries remaining)`);
        const response = await client.models.generateContent({
          model: modelName,
          contents: [
            { text: systemInstruction },
            { text: dataContext }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: derivativesReportSchema,
            temperature: 0.15,
          }
        });

        const bodyText = response.text;
        if (!bodyText) {
          throw new Error(`Empty response received from the analytics engine using ${modelName}.`);
        }

        const parsedReport = JSON.parse(bodyText.trim());
        console.log(`[Quanta Derivatives SDK] Successfully compiled report using model: ${modelName}`);
        return parsedReport;
      } catch (error: any) {
        lastError = error;
        console.warn(`[Quanta Derivatives SDK] Model ${modelName} failed or busy:`, error.message || error);

        const errMsg = String(error.message || "").toLowerCase() + " " + JSON.stringify(error).toLowerCase();
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.includes("unavailable") ||
          errMsg.includes("overloaded") ||
          errMsg.includes("demand") ||
          errMsg.includes("rate") ||
          errMsg.includes("busy") ||
          errMsg.includes("temporary");

        if (isTransient && retries > 1) {
          retries--;
          console.warn(`[Quanta Derivatives SDK] Transient condition detected. Retrying in ${delayMs}ms with exponential backoff...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs *= 2;
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("All attempts to generate derivatives report failed.");
}

// In-Memory direct quantitative analyzer fallback engine
function getFallbackReport(spotPrice: number, optionChain: any[], fiiDii: any): any {
  console.log("[Quanta Derivatives SDK] Running Direct Quant Analytical Fallback Engine");

  const safeChain = Array.isArray(optionChain) ? optionChain : [];
  let totalCallOI = 0;
  let totalPutOI = 0;

  safeChain.forEach(row => {
    totalCallOI += Number(row.callOI || 0);
    totalPutOI += Number(row.putOI || 0);
  });

  const pcrValue = totalCallOI > 0 ? parseFloat((totalPutOI / totalCallOI).toFixed(2)) : 1.0;
  let pcrInterpretation = "Neutral";
  let pcrDetails = "";

  if (pcrValue < 0.70) {
    pcrInterpretation = "Oversold Bias";
    pcrDetails = `Put-Call Ratio (PCR = ${pcrValue}) oversold zone mein chal raha hai. Calls side par dynamic short covering trigger hone ki solid probability banti hai.`;
  } else if (pcrValue < 0.90) {
    pcrInterpretation = "Moderately Bearish";
    pcrDetails = `Put-Call Ratio (PCR = ${pcrValue}) moderately bearish range mein hai. Calls writing build up levels strong resistance construct kar rahe hain.`;
  } else if (pcrValue < 1.15) {
    pcrInterpretation = "Neutral";
    pcrDetails = `Put-Call Ratio (PCR = ${pcrValue}) neutral range mein trading kar raha hai. Support levels and resistance levels balanced build hold kar rahe hain.`;
  } else if (pcrValue < 1.35) {
    pcrInterpretation = "Moderately Bullish";
    pcrDetails = `PCR ratio (PCR = ${pcrValue}) mildly bullish trajectory touch kar raha hai. Put writing concentration spot ke close shifting lines suggest karti hai.`;
  } else {
    pcrInterpretation = "Overbought Bias";
    pcrDetails = `Ratio values high bounds (${pcrValue}) trigger kar rahi hain. Aggressive writing target limits caution suggest karti hai overbought zones mein.`;
  }

  // Support and Resistance Calculations
  const sortedPuts = [...safeChain].sort((a, b) => Number(b.putOI || 0) - Number(a.putOI || 0));
  const sortedCalls = [...safeChain].sort((a, b) => Number(b.callOI || 0) - Number(a.callOI || 0));

  const support1 = sortedPuts[0] || { strike: Math.round(spotPrice / 100) * 100 - 100, putOI: 45000 };
  const support2 = sortedPuts[1] || { strike: Math.round(spotPrice / 100) * 100 - 200, putOI: 35000 };
  const resistance1 = sortedCalls[0] || { strike: Math.round(spotPrice / 100) * 100 + 100, callOI: 45000 };
  const resistance2 = sortedCalls[1] || { strike: Math.round(spotPrice / 100) * 100 + 200, callOI: 35000 };

  const supportStrikes = [
    { strike: Math.min(support1.strike, support2.strike), oi: Math.max(support1.putOI, support2.putOI), details: "Highest concentrated Put writing base constructs strong structural floor options writer level." },
    { strike: Math.max(support1.strike, support2.strike), oi: Math.min(support1.putOI, support2.putOI), details: "Secondary support accumulation acts as immediate protective cushions." }
  ];

  const resistanceStrikes = [
    { strike: Math.min(resistance1.strike, resistance2.strike), oi: Math.max(resistance1.callOI, resistance2.callOI), details: "Heavy Call writers concentration sets massive immediate ceiling capping index upside moves." },
    { strike: Math.max(resistance1.strike, resistance2.strike), oi: Math.min(resistance1.callOI, resistance2.callOI), details: "Strong secondary resistance blocks prevent direct speculative sweeps." }
  ];

  // Scientifically find Max Pain point
  let minLoss = Infinity;
  let calculatedMaxPain = spotPrice;
  if (safeChain.length > 0) {
    for (const targetRow of safeChain) {
      const targetStrike = targetRow.strike;
      let lossContribution = 0;
      for (const row of safeChain) {
        if (row.strike < targetStrike) {
          lossContribution += (targetStrike - row.strike) * Number(row.callOI || 0);
        }
        if (row.strike > targetStrike) {
          lossContribution += (row.strike - targetStrike) * Number(row.putOI || 0);
        }
      }
      if (lossContribution < minLoss) {
        minLoss = lossContribution;
        calculatedMaxPain = targetStrike;
      }
    }
  } else {
    calculatedMaxPain = Math.round(spotPrice / 100) * 100;
  }

  // FII and DII alignment flows
  const fiiCash = Number(fiiDii?.fiiCashNet || 0);
  const diiCash = Number(fiiDii?.diiCashNet || 0);

  let alignmentSummary = "Contradictory / Hedging Profile";
  let alignmentAnalysis = "";

  if (fiiCash > 0 && diiCash > 0) {
    alignmentSummary = "Bullish Alignment (Buyers Active)";
    alignmentAnalysis = "FII and DII Cash segment mein Net Buyers hain. Derivatives metrics positive leverage play confirm karti hai. Is profile ke bounds dynamic options writing defense hold clear rules outline karte hain.";
  } else if (fiiCash < 0 && diiCash > 0) {
    alignmentSummary = "Contradictory / Hedging Profile";
    alignmentAnalysis = "Agar FII cash mein sell kar rahe hain par Put writing heavy hai, toh is contradiction ka matlab digital dynamic hedging hai. Smart money apne equity portfolios ko hedge karne cash shares rebalance karta hai, jabki index derivatives margin levels maintain protection writing deploy karte hain.";
  } else {
    alignmentSummary = "Range-bound / Consolidating";
    alignmentAnalysis = "Dono institutional segments low volume consolidate zone suggest karte hain. Boundaries parameters options writing setups decay parameters highly stable outcome execute karenge.";
  }

  const triggerSC = resistanceStrikes[0].strike;
  const triggerLU = supportStrikes[1].strike;

  // Strategies builder
  let suggested = [];
  const biasStr = pcrValue > 1.15 || (fiiCash > 0 && diiCash > 0) ? "BULL" : (pcrValue < 0.85 ? "BEAR" : "NEUTRAL");

  if (biasStr === "BULL") {
    const buyStrike = Math.floor(spotPrice / 100) * 100;
    const sellStrike = buyStrike + 100;
    suggested = [
      {
        name: "Bull Call Spread (Defensive)",
        type: "BullCallSpread",
        legs: [
          { strike: buyStrike, type: "CE", action: "BUY", premium: 140 },
          { strike: sellStrike, type: "CE", action: "SELL", premium: 70 }
        ],
        maxProfit: "₹3,500 (per lot)",
        maxLoss: "₹3,000 (per lot)",
        riskRewardRatio: "1:1.15",
        breakEven: `₹${buyStrike + 70}`,
        tacticalEntryExit: "Entry Net Debit ~70 points max par maintain karein. Underlying spot break support acts as direct SL trigger parameter."
      },
      {
        name: "Bull Put Spread (Credit Play)",
        type: "BullPutSpread",
        legs: [
          { strike: buyStrike, type: "PE", action: "SELL", premium: 120 },
          { strike: buyStrike - 100, type: "PE", action: "BUY", premium: 55 }
        ],
        maxProfit: "₹3,250 (per lot)",
        maxLoss: "₹4,250 (per lot)",
        riskRewardRatio: "1:0.76",
        breakEven: `₹${buyStrike - 65}`,
        tacticalEntryExit: "Premium credit decay limits standard boundaries. Exit strategy activates if index breaks below long protective put strike."
      }
    ];
  } else if (biasStr === "BEAR") {
    const buyStrike = Math.ceil(spotPrice / 100) * 100;
    const sellStrike = buyStrike - 100;
    suggested = [
      {
        name: "Bear Put Spread (Defensive Downside)",
        type: "BearPutSpread",
        legs: [
          { strike: buyStrike, type: "PE", action: "BUY", premium: 140 },
          { strike: sellStrike, type: "PE", action: "SELL", premium: 70 }
        ],
        maxProfit: "₹3,500 (per lot)",
        maxLoss: "₹3,000 (per lot)",
        riskRewardRatio: "1:1.15",
        breakEven: `₹${buyStrike - 70}`,
        tacticalEntryExit: "Downside delta shifts are highly immunised. Exit indices on target levels close to support strike."
      },
      {
        name: "Bear Call Spread (Credit Decays)",
        type: "BearCallSpread",
        legs: [
          { strike: buyStrike, type: "CE", action: "SELL", premium: 110 },
          { strike: buyStrike + 100, type: "CE", action: "BUY", premium: 50 }
        ],
        maxProfit: "₹3,000 (per lot)",
        maxLoss: "₹4,500 (per lot)",
        riskRewardRatio: "1:0.67",
        breakEven: `₹${buyStrike + 60}`,
        tacticalEntryExit: "High probability credit setup targeting call theta decay. Absolute exit if spot breaches short strike limits."
      }
    ];
  } else {
    const pBase = Math.floor(spotPrice / 100) * 100;
    const cBase = Math.ceil(spotPrice / 100) * 100;
    suggested = [
      {
        name: "Iron Condor (High Probability decay)",
        type: "IronCondor",
        legs: [
          { strike: pBase - 200, type: "PE", action: "BUY", premium: 25 },
          { strike: pBase - 100, type: "PE", action: "SELL", premium: 65 },
          { strike: cBase + 100, type: "CE", action: "SELL", premium: 65 },
          { strike: cBase + 200, type: "CE", action: "BUY", premium: 25 }
        ],
        maxProfit: "₹4,000 (per lot)",
        maxLoss: "₹6,000 (per lot)",
        riskRewardRatio: "1:0.67",
        breakEven: `Between ₹${pBase - 180} and ₹${cBase + 180}`,
        tacticalEntryExit: "Range bound play capturing dual theta decay. Take profits once total credit margins matches 50% target."
      },
      {
        name: "Short Strangle (Active Range Play)",
        type: "ShortStrangle",
        legs: [
          { strike: pBase - 100, type: "PE", action: "SELL", premium: 65 },
          { strike: cBase + 100, type: "CE", action: "SELL", premium: 65 }
        ],
        maxProfit: "₹6,500 (per lot)",
        maxLoss: "Unlimited (Undefined risk)",
        riskRewardRatio: "N/A",
        breakEven: `Between ₹${pBase - 230} and ₹${cBase + 230}`,
        tacticalEntryExit: "Strictly for experienced options traders. Convert into iron condor options if spot spikes outside initial wings zones."
      }
    ];
  }

  return {
    pcr: {
      value: pcrValue,
      interpretation: pcrInterpretation + " (Direct Quant Engine)",
      details: pcrDetails + " [Fallback Analysis is active due to Gemini API temporary overloading]."
    },
    supportResistance: {
      supportStrikes: supportStrikes,
      resistanceStrikes: resistanceStrikes,
      maxPain: calculatedMaxPain
    },
    institutionalAlignment: {
      summary: alignmentSummary,
      analysis: alignmentAnalysis
    },
    trapsAndScenarios: {
      shortCoveringTrigger: triggerSC,
      shortCoveringDetails: `Resistance boundary near ₹${triggerSC} Call writer zone. Spot breaking this trigger initiates short coverings and short-squeeze upward speed.`,
      longUnwindingTrigger: triggerLU,
      longUnwindingDetails: `Support limits near ₹${triggerLU}. Index slide breaks Put writers confidence trigger panic long unwinding cascade.`,
      trapLevel: `₹${triggerSC} - ₹${triggerLU} Range`,
      trapExplanation: "Smart Money traps construct around structural open interest blocks. Aggressive retail writes levels serve as trap targets for institutional volume sweeps on indices breakouts."
    },
    suggestedStrategies: suggested
  };
}

// NSE Live Option Chain Fetcher - Cookie session cache (refreshed every 8 minutes)
let nseCookieCache: string = "";
let nseCookieExpiry: number = 0;

const NSE_HEADERS_BASE = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
};

async function getNSECookies(): Promise<string> {
  const now = Date.now();
  if (nseCookieCache && now < nseCookieExpiry) {
    console.log("[NSE] Using cached session cookies.");
    return nseCookieCache;
  }

  console.log("[NSE] Refreshing session cookies from NSE homepage...");

  // Step 1: Hit NSE Homepage to get initial session cookies
  const homeRes = await fetch("https://www.nseindia.com", {
    headers: {
      ...NSE_HEADERS_BASE,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Upgrade-Insecure-Requests": "1",
    },
  });

  const homeCookiesRaw = homeRes.headers.getSetCookie ? homeRes.headers.getSetCookie() : [];
  const homeCookies = homeCookiesRaw.map((c: string) => c.split(";")[0]);

  // Step 2: Visit the option-chain page to get secondary cookies
  await new Promise((r) => setTimeout(r, 600)); // Small delay to appear human
  const ocRes = await fetch("https://www.nseindia.com/option-chain", {
    headers: {
      ...NSE_HEADERS_BASE,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Referer": "https://www.nseindia.com",
      "Cookie": homeCookies.join("; "),
      "Upgrade-Insecure-Requests": "1",
    },
  });
  const ocCookiesRaw = ocRes.headers.getSetCookie ? ocRes.headers.getSetCookie() : [];
  const ocCookies = ocCookiesRaw.map((c: string) => c.split(";")[0]);

  // Merge all cookies, deduplicating by key name
  const cookieMap = new Map<string, string>();
  [...homeCookies, ...ocCookies].forEach((cookie) => {
    const [key] = cookie.split("=");
    if (key) cookieMap.set(key.trim(), cookie.trim());
  });
  const mergedCookies = Array.from(cookieMap.values()).join("; ");

  nseCookieCache = mergedCookies;
  nseCookieExpiry = now + 8 * 60 * 1000; // Valid for 8 minutes
  console.log(`[NSE] Session cookies refreshed. Got ${cookieMap.size} cookies.`);
  return nseCookieCache;
}

// NSE Live Data Fetch Endpoint — proxies NSE API to bypass CORS
app.get("/api/fetch-nse", async (req, res) => {
  const symbol = ((req.query.symbol as string) || "NIFTY").toUpperCase().trim();
  const validSymbols = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"];

  if (!validSymbols.includes(symbol)) {
    return res.status(400).json({ error: `Invalid symbol '${symbol}'. Valid options: NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY.` });
  }

  try {
    let cookies = await getNSECookies();

    const apiUrl = `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`;
    console.log(`[NSE] Fetching live option chain for ${symbol}...`);

    let apiRes = await fetch(apiUrl, {
      headers: {
        ...NSE_HEADERS_BASE,
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.nseindia.com/option-chain",
        "Cookie": cookies,
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    // If blocked/expired, force refresh cookies and retry once
    if (!apiRes.ok || apiRes.status === 401 || apiRes.status === 403) {
      console.warn(`[NSE] Got ${apiRes.status}, forcing cookie refresh and retrying...`);
      nseCookieCache = ""; // Invalidate cache
      cookies = await getNSECookies();
      await new Promise((r) => setTimeout(r, 1000));
      apiRes = await fetch(apiUrl, {
        headers: {
          ...NSE_HEADERS_BASE,
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://www.nseindia.com/option-chain",
          "Cookie": cookies,
          "X-Requested-With": "XMLHttpRequest",
        },
      });
    }

    if (!apiRes.ok) {
      throw new Error(`NSE API returned HTTP ${apiRes.status}. NSE may be closed or blocking requests. Try again in a few minutes.`);
    }

    const nseData: any = await apiRes.json();

    if (!nseData?.records?.data) {
      throw new Error("Unexpected NSE API response format. NSE API structure may have changed.");
    }

    const spotPrice: number = nseData.filtered?.underlyingValue || nseData.records?.underlyingValue || 0;
    const allExpiries: string[] = nseData.records?.expiryDates || [];
    const nearestExpiry: string = allExpiries[0] || "";

    // Filter by nearest expiry and transform to our app's data schema
    const rows = nseData.records.data
      .filter((item: any) => !nearestExpiry || item.expiryDate === nearestExpiry)
      .map((item: any) => ({
        strike: item.strikePrice,
        callOI: Math.round(item.CE?.openInterest || 0),
        callOIchg: Math.round(item.CE?.changeinOpenInterest || 0),
        callLtp: item.CE?.lastPrice || 0,
        putLtp: item.PE?.lastPrice || 0,
        putOIchg: Math.round(item.PE?.changeinOpenInterest || 0),
        putOI: Math.round(item.PE?.openInterest || 0),
      }))
      .filter((row: any) => row.callOI > 0 || row.putOI > 0)
      .sort((a: any, b: any) => a.strike - b.strike);

    console.log(`[NSE] ✅ Successfully fetched ${rows.length} strikes for ${symbol}. Spot: ₹${spotPrice}. Expiry: ${nearestExpiry}`);
    res.json({ rows, spotPrice, symbol, expiry: nearestExpiry, allExpiries, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error("[NSE] ❌ Error fetching live data:", err.message || err);
    res.status(500).json({ error: err.message || "Failed to fetch live NSE option chain data." });
  }
});

// API Endpoint for Derivatives Analysis with Gemini AI
app.post("/api/analyze", async (req, res) => {

  const { optionChain, fiiDii, spotPrice, pastedRawText } = req.body;
  try {
    const client = getGeminiClient();

    // Prepare a descriptive prompt passing all variables
    let dataContext = `
    --- SPOT PRICE ---
    Current Spot Underlying Price: ${spotPrice || "Not Specified (Assume ~22,500)"}

    --- INSTI DATA (FII / DII) ---
    - FII Cash Net Flow: ${fiiDii?.fiiCashNet} Crores (INR)
    - DII Cash Net Flow: ${fiiDii?.diiCashNet} Crores (INR)
    - FII Index Futures Net: ${fiiDii?.fiiIndexFuturesNet} contracts
    - FII Index Options Net: ${fiiDii?.fiiIndexOptionsNet} contracts
    - Trading Date: ${fiiDii?.date || "Today"}

    --- OPTION CHAIN DATA VALUE ---
    ${optionChain ? JSON.stringify(optionChain, null, 2) : "User hasn't supplied pre-parsed option chain."}
    `;

    if (pastedRawText) {
      dataContext += `
      --- USER PASTED RAW SENSIBULL DATA ---
      The user pasted raw text, which we might need to parse. Extract any relevant values (OI, LTP, Strikes, FII/DII data) and combine with above context:
      "${pastedRawText}"
      `;
    }

    const systemInstruction = `
      You are an expert Professional Derivatives Trader, Option Strategist, and Quantitative Analyst (Quant).
      You deeply understand Options Greeks (Delta, Theta, Vega, Gamma), PCR (Put-Call Ratio), Open Interest (OI) buildup, Max Pain, institutional hedging flows, and market trap mechanics.
      Your job is to analyze the provided Indian stock market index option chain details (e.g. Nifty / Bank Nifty) and institutional data, and output a highly professional trading report in JSON conforming EXACTLY to the provided schema.

      CRITICAL ANALYTICAL MANDATES:
      1. Calculate and interpret the Put-Call Ratio (PCR). State if the market is Overbought (>1.4), Oversold (<0.7), or in a neutral zone, and describe the momentum.
      2. Identify the top 2 strong Supports (strikes with highest Put OI buildup) and top 2 strong Resistances (strikes with highest Call OI buildup) and detail why. Calculate estimated Max Pain point.
      3. Explain Institutional Activity alignment. Resolve the contradiction: 'Agar FII cash mein sell kar rahe hain par Put writing heavy hai, toh is contradiction ka kya matlab hai?'
         - Explain that cash selling is often structural/portfolio hedging or equity rebalancing, while massive index Put writing is tactical market-making defense or options premium harvesting by smart money who do not expect the market to crash below those put writer bases. Or options can be written as a synthetic hedging tool. Explain this in high-quality Hinglish (Hindi + English blend) that sounds natural to an Indian trader.
      4. List specific market traps: Short Covering trigger level (typically peak Call writer strike or slightly above it) and Long Unwinding trigger level (typically peak Put writer strike or slightly below it). Describe how aggressive retail writing or buying can get trapped.
      5. Formulate exactly two professional options strategy setups (such as a Bull Call Spread, Bear Put Spread, Iron Condor, or Short Strangle/Iron Fly) with exact strikes, BUY/SELL legs, estimated Max Profit, Max Loss, Break-Even, and target entries.
      
      Output LANGUAGE STYLE:
      Write the 'details', 'analysis', 'trapExplanation', and 'tacticalEntryExit' fields in professional Hinglish (Hindi written in clean English script) so that it is easily understandable and highly relevant to professional retail traders in India. Keep specific terms like 'Short Covering', 'Theta Decay', 'Delta Hedging', 'Support', 'Resistance', 'Max Pain', etc., in correct professional English uppercase titles.
    `;

    const parsedReport = await generateContentWithFallback(client, systemInstruction, dataContext);
    res.json(parsedReport);
  } catch (error: any) {
    console.error("Gemini API Overloaded or Unavailable. Falling back to direct quant execution engine:", error);
    try {
      const fallbackReport = getFallbackReport(spotPrice || 22500, optionChain, fiiDii);
      res.json(fallbackReport);
    } catch (fallbackError: any) {
      console.error("Fallback Quant Engine also threw error: ", fallbackError);
      res.status(500).json({
        error: "All analytical services (including direct quantitative fallback engines) encountered a system level issue."
      });
    }
  }
});

// API Endpoint to parse NSE or Sensibull option chain screenshot using multimodal Gemini AI
app.post("/api/parse-image", async (req, res) => {
  const { base64Data, mimeType } = req.body;
  if (!base64Data || !mimeType) {
    return res.status(400).json({ error: "Missing base64Data or mimeType" });
  }

  try {
    const client = getGeminiClient();

    // The base64Data must be clean base64 string without data URLs prefix
    let cleanBase64 = base64Data;
    if (base64Data.includes("base64,")) {
      cleanBase64 = base64Data.split("base64,")[1];
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Analyze this image which is a screenshot or export table of an index Option Chain (usually Nifty or Bank Nifty from NSE India or Sensibull).
             Extract the option chain data table values. 
             Identify Strike prices, and the corresponding columns on both CALLS and PUTS sides:
             - strike (always specified as a number, e.g., 23500)
             - callOI (Call Open Interest, parsed as a valid clean number, 0 if empty or hyphen)
             - callOIchg (Call Change in Open Interest)
             - callLtp (Last Traded Price for Calls)
             - putLtp (Last Traded Price for Puts)
             - putOIchg (Put Change in Open Interest)
             - putOI (Put Open Interest)
             Ensure to remove all commas from prices or volumes.
             Also estimate or find the Index Spot Price (usually shown near the top as Nifty current spot price, e.g., '23531.00') and populate it in spotPrice. If not clearly visible, estimate it based on ATM strike or set to 0.

             Look carefully at each row. Be extremely accurate with the numbers. Do not invert calls and puts columns.
             Conform strictly to the Response JSON Schema.`
    };

    // We try gemini-3.5-flash as the primary multimodal model, with fallback models
    const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let lastError: any = null;
    let parsedData: any = null;

    for (const modelName of modelsToTry) {
      let retries = 2;
      let delayMs = 1000;

      while (retries > 0) {
        try {
          console.log(`[Quanta Image Parsing] Sending screenshot to Gemini (${modelName}) for multimodal extraction (${retries} retries remaining)...`);
          const response = await client.models.generateContent({
            model: modelName,
            contents: { parts: [imagePart, textPart] },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  rows: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        strike: { type: Type.NUMBER },
                        callOI: { type: Type.NUMBER },
                        callOIchg: { type: Type.NUMBER },
                        callLtp: { type: Type.NUMBER },
                        putLtp: { type: Type.NUMBER },
                        putOIchg: { type: Type.NUMBER },
                        putOI: { type: Type.NUMBER }
                      },
                      required: ["strike", "callOI", "callOIchg", "callLtp", "putLtp", "putOIchg", "putOI"],
                    }
                  },
                  spotPrice: { type: Type.NUMBER }
                },
                required: ["rows", "spotPrice"],
              },
              temperature: 0.1,
            }
          });

          const bodyText = response.text;
          if (!bodyText) {
            throw new Error(`No response body returned from Gemini Multimodal API using ${modelName}.`);
          }

          parsedData = JSON.parse(bodyText.trim());
          console.log(`[Quanta Image Parsing] Successfully parsed screenshot option chain using ${modelName}. Found ${parsedData?.rows?.length} strikes. Spot Price estimated: ₹${parsedData?.spotPrice}`);
          break; // Succeeded! Break the retry loop
        } catch (error: any) {
          lastError = error;
          console.warn(`[Quanta Image Parsing] Model ${modelName} failed or busy:`, error.message || error);

          const errMsg = String(error.message || "").toLowerCase() + " " + JSON.stringify(error).toLowerCase();
          const isTransient =
            errMsg.includes("503") ||
            errMsg.includes("429") ||
            errMsg.includes("unavailable") ||
            errMsg.includes("overloaded") ||
            errMsg.includes("demand") ||
            errMsg.includes("rate") ||
            errMsg.includes("busy") ||
            errMsg.includes("temporary");

          if (isTransient && retries > 1) {
            retries--;
            console.warn(`[Quanta Image Parsing] Transient condition detected. Retrying in ${delayMs}ms with exponential backoff...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            delayMs *= 2;
          } else {
            break; // Try next model
          }
        }
      }

      if (parsedData) {
        break; // Succeeded, break the model loop
      }
    }

    if (!parsedData) {
      throw lastError || new Error("All multimodal models failed to parse screenshot.");
    }

    res.json(parsedData);
  } catch (err: any) {
    console.error("[Quanta Image Parsing] Critical Error during screenshot analysis:", err);
    res.status(500).json({ error: err.message || "Something went wrong while extraction of Option Chain numbers from your screenshot." });
  }
});

// Setup Vite Dev server for smooth local workflows, and static server for production builds
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite developmental server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up production static file serving...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for undefined routes (SPA behavior)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Quanta Derivatives SDK] Server running on http://localhost:${PORT}`);
  });
}

startServer();
