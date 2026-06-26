import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, MessageSquare, Send, X, RefreshCw, Sparkles, ChevronDown, 
  ChevronUp, Zap, HelpCircle, ArrowRight, TrendingUp, AlertTriangle 
} from "lucide-react";
import { OptionChainRow, FiiDiiData } from "../types";

interface SellerPanicChatBotProps {
  optionChain: OptionChainRow[];
  indicesStatus: any;
  fiiDiiData?: FiiDiiData;
  spotPrice: number;
}

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

export default function SellerPanicChatBot({ 
  optionChain, 
  indicesStatus, 
  fiiDiiData, 
  spotPrice 
}: SellerPanicChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-greet",
      role: "model",
      text: "Arre bhai! Main hoon aapka **AshTek Option Shikar Dev** 🐯! Main live market metrics, dynamic option writing changes aur FII/DII patterns ko scan karke tactical option buying guide karta hoon.\n\nOption seller ek shatir player hota hai. Jab tak market rest mode pe hai, hum trade nahi karenge. Par jaise hi parameters cover hone lagen, hum momentum pakadenge! Aap kya check karna chahte hain?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessageAlert, setHasNewMessageAlert] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to chat bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Alert highlight for unopened messages
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setHasNewMessageAlert(true);
    }
  }, [messages.length]);

  // 1. Gather all live parameters to inject into context
  const niftyVal = indicesStatus?.nifty?.value || 24018.45;
  const niftyChg = indicesStatus?.nifty?.change || 0.15;
  const vixValue = parseFloat(indicesStatus?.indiavix?.value || "13.20");
  const vixChange = parseFloat(indicesStatus?.indiavix?.change || "2.15");
  const fiiCashNet = fiiDiiData?.fiiCashNet || -1452.80;
  const diiCashNet = fiiDiiData?.diiCashNet || 1845.50;

  // Max barriers and covering elements
  let maxCeStrike = 24100;
  let maxCE_OI = -1;
  let maxPeStrike = 23900;
  let maxPE_OI = -1;

  optionChain.forEach((row) => {
    if (row.callOI > maxCE_OI) {
      maxCE_OI = row.callOI;
      maxCeStrike = row.strike;
    }
    if (row.putOI > maxPE_OI) {
      maxPE_OI = row.putOI;
      maxPeStrike = row.strike;
    }
  });

  const ceCoveringStrikes = optionChain
    .filter((row) => row.callOIchg < 0)
    .map((row) => ({ strike: row.strike, change: row.callOIchg }));

  const peCoveringStrikes = optionChain
    .filter((row) => row.putOIchg < 0)
    .map((row) => ({ strike: row.strike, change: row.putOIchg }));

  const isBreakoutActive = niftyVal > 24055.00; // Previous Day High check benchmark

  // Premade fast questions
  const suggestionQueries = [
    "Operator Fake Breakdown / Bear trap check karo",
    "Expiry Day Smart Money traps and phases explain karo",
    "Kya abhi CALL Option (CE) buy karna safe hai?",
    "PUT Option (PE) buy karne ka koi setup dikh rha h?",
    "Phase 5: Post-3:00 PM VWAP Pinning check karo",
    "FII or DII key sentiment data study karke batao"
  ];

  const handleSendMessage = async (customMessageText?: string) => {
    const textToSend = customMessageText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: Message = {
      id: userMsgId,
      role: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    if (!customMessageText) setInputMessage("");
    setIsLoading(true);

    // Format history for backend
    const apiHistory = messages.map(m => ({
      role: m.role,
      content: m.text
    }));

    // Assemble real-time context
    const apiContext = {
      spotPrice,
      indexValue: niftyVal,
      indexChange: niftyChg,
      indexName: "Nifty 50",
      vixValue,
      vixChange,
      fiiCashNet,
      diiCashNet,
      maxCeStrike,
      maxPeStrike,
      ceCoveringStrikes,
      peCoveringStrikes,
      isBreakoutActive
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          history: apiHistory,
          context: apiContext
        })
      });

      if (!response.ok) {
        throw new Error("Chat response status error");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response received from server. Expected JSON data.");
      }

      const data = await response.json();
      const aiReply: Message = {
        id: `ai-${Date.now()}`,
        role: "model",
        text: data.response || "Mafi chahta hu, kuch problem aa gyi. Phirse try kijiye!",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      console.error("[ChatBot error]", err);
      // Fallback message locally if something fails
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: "model",
          text: "⚠️ **Opps! Connection range boundary issue!**\n\nMain aapko local quantitative calculations se batata hoon: \n\n" + 
                (ceCoveringStrikes.length > 0 && isBreakoutActive
                  ? "🔥 **Buy CE alert is solid right now!** Call writers panic cover kar rahe hain strike " + ceCoveringStrikes[0].strike + " par aur day high break hone wala h."
                  : peCoveringStrikes.length > 0 && vixChange >= 4.0
                    ? "🚨 **Buy PE Setup active!** India VIX strong rise ho rha h."
                    : "🟡 **Sideways range bounded state.** Abhi shaant rehna hi sabse safe trade hai! Premia decay me option buyers mat phasein."),
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanHistory = () => {
    if (window.confirm("Aap chat history clear karna chahte hain?")) {
      setMessages([
        {
          id: "initial-greet-ref",
          role: "model",
          text: "Chaliye, fresh slate! Chalo live market metrics ko phirse study karte hain. Abhi kaunsa level discuss karna chahte hain?",
          timestamp: new Date()
        }
      ]);
    }
  };

  // Basic formatter to bold markdown headers & list bullets nicely
  const renderMessageText = (text: string) => {
    return text.split("\n").map((line, i) => {
      // Highlight bold targets e.g. **text**
      let formattedLine = line;
      
      // Parse markdown bold `**stuff**` references
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        const textBefore = line.substring(lastIndex, match.index);
        parts.push(textBefore);
        parts.push(<strong key={match.index} className="text-amber-300 font-extrabold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      parts.push(line.substring(lastIndex));

      // Check if it is a list bullet
      const isBullet = line.trim().startsWith("-") || line.trim().startsWith("*");
      
      return (
        <p key={i} className={`text-xs leading-relaxed ${isBullet ? "pl-3 text-slate-200 mt-1" : "mt-1.5 font-sans text-slate-300"}`}>
          {parts.length > 1 ? parts : formattedLine}
        </p>
      );
    });
  };

  const renderMessageContent = (msg: Message) => {
    const isAI = msg.role === "model";
    if (!isAI) {
      return <div className="whitespace-pre-line font-sans text-xs text-slate-200">{msg.text}</div>;
    }

    // Check if text is JSON
    let isJson = false;
    let parsed: any = null;
    const trimmed = msg.text.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        parsed = JSON.parse(trimmed);
        isJson = true;
      } catch (e) {
        isJson = false;
      }
    }

    if (!isJson || !parsed) {
      return (
        <div className="whitespace-pre-line font-sans">
          {renderMessageText(msg.text)}
        </div>
      );
    }

    // Beautiful UI card for JSON response
    const signal = parsed.signal || "NO_TRADE";
    const marketPhase = parsed.market_phase || "Unknown Phase";
    const trapDetected = parsed.trap_detected || "None";
    const reasoning = parsed.reasoning || "";
    const suggestedStrike = parsed.suggested_strike || "N/A";
    const risk = parsed.risk || "Medium";

    let signalBadgeColor = "bg-slate-800 text-slate-400 border-slate-700";
    let signalText = "NO TRADE ZONE";

    if (signal === "BUY_CE" || signal.includes("BUY_CE") || signal.includes("CE")) {
      signalBadgeColor = "bg-emerald-950/50 text-emerald-400 border-emerald-900/55";
      signalText = "🟢 BUY CE ACTIVE";
    } else if (signal === "BUY_PE" || signal.includes("BUY_PE") || signal.includes("PE")) {
      signalBadgeColor = "bg-rose-950/50 text-rose-400 border-rose-900/55";
      signalText = "🔴 BUY PE ACTIVE";
    } else {
      signalBadgeColor = "bg-amber-950/50 text-amber-400 border-amber-900/55";
      signalText = "🟡 NO TRADE ZONE";
    }

    return (
      <div className="space-y-3 font-sans py-1">
        {/* Signal Banner */}
        <div className={`p-2.5 rounded-lg border flex items-center justify-between ${signalBadgeColor}`}>
          <div className="font-mono font-black tracking-wider text-xs flex items-center gap-1.5 uppercase">
            {signalText}
          </div>
          <div className="text-[10px] uppercase font-mono font-bold tracking-tight bg-slate-900/60 px-2 py-0.5 rounded border border-white/5 shrink-0">
            Risk: {risk}
          </div>
        </div>

        {/* Grid: Phase & Trap */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
            <span className="text-slate-400 block mb-0.5">MARKET PHASE</span>
            <span className="text-slate-200 font-bold block">{marketPhase}</span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
            <span className="text-slate-400 block mb-0.5">TRAP STATUS</span>
            <span className={`font-bold block truncate ${trapDetected !== "None" && trapDetected !== "" ? "text-rose-400 animate-pulse" : "text-slate-300"}`}>
              {trapDetected}
            </span>
          </div>
        </div>

        {/* Reasoning (Hinglish) */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1.5">
          <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wide block">SHIKAR DEV BLUEPRINT ANALYSIS:</span>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">{reasoning}</p>
        </div>

        {/* Suggested Strike */}
        {suggestedStrike && suggestedStrike !== "N/A" && (
          <div className="bg-slate-900/40 p-2 rounded border border-slate-800/40 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">RECOMMENDED STRIKE:</span>
            <span className="text-amber-300 font-extrabold text-xs">₹{suggestedStrike}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* FLOATING ACTION LAUNCHER BUTTON */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end" id="ai-shikar-chat-bot-fab-container">
        
        {/* Unread message notification banner */}
        {!isOpen && hasNewMessageAlert && (
          <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white font-mono text-[9px] sm:text-[10px] font-bold px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full shadow-lg mb-2 mr-1 flex items-center gap-1 animate-bounce">
            <Sparkles size={11} className="animate-spin" /> Live Options Alarm Click me!
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setHasNewMessageAlert(false);
          }}
          className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 border-2 ${
            isOpen 
              ? "bg-slate-800 border-slate-700 hover:bg-slate-700" 
              : "bg-rose-600 border-rose-500 hover:bg-rose-500 animate-pulse"
          }`}
          title="Open Options Shikar Bot Chat"
          id="ai-shikar-chat-bot-trigger"
        >
          {isOpen ? (
            <X size={22} className="text-slate-300" />
          ) : (
            <div className="relative">
              <Bot size={24} className="text-white sm:hidden" />
              <Bot size={28} className="text-white hidden sm:block" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* FULL CHAT BOT CHASSIS LAYOUT PANEL */}
      {isOpen && (
        <div 
          className="fixed bottom-20 sm:bottom-24 right-4 left-4 sm:left-auto sm:right-6 w-auto sm:w-[350px] h-[410px] sm:h-[520px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in font-sans"
          id="ai-shikar-chat-bot-panel"
        >
          {/* Header section with live indicator indicator */}
          <div className="bg-slate-950 p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="p-1 sm:p-1.5 bg-rose-500/10 rounded-lg border border-rose-900/30">
                <Bot className="text-rose-400" size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[11px] sm:text-xs font-black tracking-wide font-mono text-white">Shikar Dev Option-AI</h4>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono">Live dynamic tracker &amp; buyer setups</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={cleanHistory}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded transition"
                title="Clear Chat History"
              >
                <RefreshCw size={12} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded transition"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Real-time mini HUD indicator for quick sanity check */}
          <div className="bg-slate-950/80 px-3 py-1.5 sm:px-4 sm:py-2 border-b border-slate-800 text-[9px] sm:text-[10px] font-mono flex flex-wrap gap-x-2 gap-y-0.5 justify-between text-slate-400">
            <span> स्पॉट: <strong className="text-white">₹{niftyVal.toLocaleString()}</strong></span>
            <span> VIX: <strong className={vixChange >= 0 ? "text-rose-400" : "text-emerald-400"}>{vixValue.toFixed(1)}%</strong></span>
            <span> Panic CE: <strong className="text-emerald-400">{ceCoveringStrikes.length}</strong></span>
            <span> PE: <strong className="text-rose-400">{peCoveringStrikes.length}</strong></span>
          </div>

          {/* Scrollable message content section */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3 bg-slate-900/40">
            {messages.map((msg) => {
              const isAI = msg.role === "model";
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isAI ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[88%] sm:max-w-[85%] rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs shadow ${
                    isAI 
                      ? "bg-slate-950 border border-slate-800 text-slate-200" 
                      : "bg-rose-950/30 text-rose-100 border border-rose-900/40"
                  }`}>
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/40 pb-1 mb-1 font-mono text-[8px] sm:text-[9px] text-slate-400">
                      <span className="font-bold flex items-center gap-1 uppercase">
                        {isAI ? "🐯 Shikar Dev AI" : "👤 Option Shikar"}
                      </span>
                      <span>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      {renderMessageContent(msg)}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 flex items-center gap-2">
                  <span className="animate-spin h-3 w-3 border-2 border-rose-500 border-t-transparent rounded-full" />
                  <span className="font-mono text-[9px] sm:text-[10px]">Shikar Dev calculation kar raha hai...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick interactive search suggestion tags */}
          <div className="p-2.5 sm:p-3 bg-slate-950 border-t border-slate-800 space-y-1.5 sm:space-y-2" id="fast-tactical-prompts-container">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-mono font-black text-amber-400 tracking-wider flex items-center gap-1 uppercase">
                <Sparkles size={10} className="text-amber-400 animate-pulse" /> Fast Tactical Prompts (Quick Click ⚡):
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono font-semibold">Instant Options Study</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 max-h-[85px] sm:max-h-[110px] overflow-y-auto pr-1 pb-1" id="suggestion-queries-list">
              {suggestionQueries.map((query, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSendMessage(query)}
                  disabled={isLoading}
                  className="text-[9px] sm:text-[10px] py-1 px-2 sm:py-1.5 sm:px-3 bg-slate-900/90 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500 text-slate-200 hover:text-rose-200 rounded-md sm:rounded-lg text-left transition-all duration-200 shadow-md font-sans cursor-pointer disabled:opacity-40 flex items-start gap-1.5 hover:shadow-rose-950/20 group max-w-full"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 group-hover:bg-rose-400 shrink-0 mt-1.5"></span>
                  <span className="whitespace-normal break-words leading-tight">{query}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input field actions footer */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 sm:p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-1.5 sm:gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything in Hinglish... (e.g., Strike 24000 status?)"
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-1.5 sm:p-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-transparent text-white border border-rose-500 rounded-lg transition transform active:scale-95 flex items-center justify-center aspect-square"
            >
              <Send size={13} />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
