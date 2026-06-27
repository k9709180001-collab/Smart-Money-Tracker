import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Environment variable se API key lo (`.env` file mein rakhein)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 1. AI Analysis Function (Bot B)
export async function analyzeMarketWithGemini(marketData: any) {
  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY missing in .env file");
    return null;
  }

  // Aapka System Instruction (Bot ki personality aur rules)
  const systemInstruction = `
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

  // User ka input (jo Bot A fetch karega)
  const userPrompt = JSON.stringify(marketData, null, 2);

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json" // ✅ Isse AI JSON hi return karega
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // AI ka response extract karo
    const rawText = response.data.candidates[0].content.parts[0].text;
    
    // JSON parse karo
    const analysisResult = JSON.parse(rawText);
    
    console.log("✅ Gemini Analysis Result:", analysisResult);
    return analysisResult;

  } catch (error: any) {
    console.error("❌ Gemini API Error:", error.response?.data || error.message);
    return null; // Error hone par null return karein (taaki app crash na ho)
  }
}
