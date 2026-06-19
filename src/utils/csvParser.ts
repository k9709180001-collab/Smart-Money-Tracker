import { OptionChainRow } from "../types";

/**
 * Parses NSE / Sensibull plain text option chain CSV exports, converts 
 * entries to structured types, and estimates the index spot price based on
 * ATM premium crossover.
 */
export function parseSensibullCSV(text: string): { rows: OptionChainRow[]; spotPrice: number } | null {
  if (!text || !text.trim()) return null;

  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return null;

  // Split line respecting double quotes containing commas
  function splitCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  function parseNumber(val: string): number {
    if (!val) return 0;
    let cleaned = val.replace(/^["']|["']$/g, '').trim();
    if (cleaned === "-" || cleaned === "" || cleaned === "—" || cleaned === ".-") return 0;
    cleaned = cleaned.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  const rows: OptionChainRow[] = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Skip table headers and section breaks
    if (
      trimmed.includes("CALLS") || 
      trimmed.includes("STRIKE") || 
      trimmed.includes("BID QTY") || 
      trimmed.toLowerCase().startsWith("oi,chng") ||
      trimmed.toLowerCase().startsWith("calls,")
    ) {
      continue;
    }

    const parts = splitCSVLine(trimmed);
    if (parts.length < 15) continue;

    // Index 11 is the STRIKE Price column (e.g. "23,900.00")
    const strike = parseNumber(parts[11]);
    if (strike <= 0) continue;

    // Calls side indexes:
    // Index 1: Call OI, Index 2: Call Chng in OI, Index 5: Call LTP
    const callOI = parseNumber(parts[1]);
    const callOIchg = parseNumber(parts[2]);
    const callLtp = parseNumber(parts[5]);

    // Puts side indexes:
    // Index 17: Put LTP, Index 20: Put Chng in OI, Index 21: Put OI (Lots)
    const putLtp = parseNumber(parts[17]);
    const putOIchg = parseNumber(parts[20]);
    const putOI = parseNumber(parts[21]);

    rows.push({
      strike,
      callOI,
      callOIchg,
      callLtp,
      putLtp,
      putOIchg,
      putOI
    });
  }

  if (rows.length === 0) return null;

  // Sort by strike price ascending
  rows.sort((a, b) => a.strike - b.strike);

  // Intelligent heuristic to estimate Option Pain / Spot Index
  // Find strike price where Call LTP and Put LTP are closest
  let bestStrike = rows[0].strike;
  let minDiff = Infinity;

  for (const row of rows) {
    if (row.callLtp > 0 && row.putLtp > 0) {
      const diff = Math.abs(row.callLtp - row.putLtp);
      if (diff < minDiff) {
        minDiff = diff;
        bestStrike = row.strike;
      }
    }
  }

  // Set Spot Price using Put-Call parity approximation: Spot ~ ATM Strike + CallLTP - PutLTP
  let estSpot = bestStrike;
  const matchAtm = rows.find(r => r.strike === bestStrike);
  if (matchAtm && matchAtm.callLtp > 0 && matchAtm.putLtp > 0) {
    const diffPremium = matchAtm.callLtp - matchAtm.putLtp;
    if (Math.abs(diffPremium) < 200) {
      estSpot = parseFloat((bestStrike + diffPremium).toFixed(2));
    }
  }

  return { rows, spotPrice: estSpot };
}
