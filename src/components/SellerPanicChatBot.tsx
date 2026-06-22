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
    "Kya abhi CALL Option (CE) buy karna safe hai?",
    "PUT Option (PE) buy karne ka koi setup dikh rha h?",
    "Live Sellers panic index and levels check karo",
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
        <p key={i} className={`text-xs leading-relaxed ${isBullet ? "pl-3 text-slate-200 mt-1" : "mt-1.5 font-sans text-slate-150"}`}>
          {parts.length > 1 ? parts : formattedLine}
        </p>
      );
    });
  };

  return (
    <>
      {/* FLOATING ACTION LAUNCHER BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" id="ai-shikar-chat-bot-fab-container">
        
        {/* Unread message notification banner */}
        {!isOpen && hasNewMessageAlert && (
          <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white font-mono text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg mb-2 mr-1 flex items-center gap-1 animate-bounce">
            <Sparkles size={11} className="animate-spin" /> Live Options Alarm Click me!
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setHasNewMessageAlert(false);
          }}
          className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 border-2 ${
            isOpen 
              ? "bg-slate-800 border-slate-700 hover:bg-slate-750" 
              : "bg-rose-600 border-rose-500 hover:bg-rose-500 animate-pulse"
          }`}
          title="Open Options Shikar Bot Chat"
          id="ai-shikar-chat-bot-trigger"
        >
          {isOpen ? (
            <X size={26} className="text-slate-300" />
          ) : (
            <div className="relative">
              <Bot size={28} className="text-white" />
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
          className="fixed bottom-24 right-6 w-[385px] h-[550px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in font-sans"
          id="ai-shikar-chat-bot-panel"
        >
          {/* Header section with live indicator indicator */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-rose-550/10 rounded-lg border border-rose-900/30">
                <Bot className="text-rose-400" size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black tracking-wide font-mono text-white">Shikar Dev Option-AI</h4>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Live dynamic tracker &amp; buyer setups</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={cleanHistory}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded transition"
                title="Clear Chat History"
              >
                <RefreshCw size={13} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded transition"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Real-time mini HUD indicator for quick sanity check */}
          <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-850 text-[10px] font-mono flex justify-between text-slate-400">
            <span> स्पॉट: <strong className="text-white">₹{niftyVal.toLocaleString()}</strong></span>
            <span> VIX: <strong className={vixChange >= 0 ? "text-rose-450" : "text-emerald-400"}>{vixValue.toFixed(1)}%</strong></span>
            <span> Panic CE: <strong className="text-emerald-400">{ceCoveringStrikes.length}</strong></span>
            <span> PE: <strong className="text-rose-400">{peCoveringStrikes.length}</strong></span>
          </div>

          {/* Scrollable message content section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/40">
            {messages.map((msg) => {
              const isAI = msg.role === "model";
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isAI ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs shadow ${
                    isAI 
                      ? "bg-slate-955 border border-slate-800 text-slate-200" 
                      : "bg-rose-950/30 text-rose-100 border border-rose-900/40"
                  }`}>
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/40 pb-1 mb-1 font-mono text-[9px] text-slate-400">
                      <span className="font-bold flex items-center gap-1 uppercase">
                        {isAI ? "🐯 Shikar Dev AI" : "👤 Option Shikar"}
                      </span>
                      <span>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="whitespace-pre-line font-sans">
                      {isAI ? renderMessageText(msg.text) : msg.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-955 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-rose-500 border-t-transparent rounded-full" />
                  <span className="font-mono text-[10px]">Shikar Dev calculation kar raha hai...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick interactive search suggestion tags */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2" id="fast-tactical-prompts-container">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black text-amber-400 tracking-wider flex items-center gap-1.5 uppercase">
                <Sparkles size={11} className="text-amber-400 animate-pulse" /> Fast Tactical Prompts (Quick Click ⚡):
              </span>
              <span className="text-[9px] text-slate-500 font-mono font-semibold">Instant Options Study</span>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto pr-1 pb-1" id="suggestion-queries-list">
              {suggestionQueries.map((query, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSendMessage(query)}
                  disabled={isLoading}
                  className="text-[11px] py-1.5 px-3 bg-slate-900/90 hover:bg-rose-950/40 border border-slate-750 hover:border-rose-500 text-slate-200 hover:text-rose-200 rounded-lg text-left transition-all duration-200 shadow-md font-sans cursor-pointer disabled:opacity-40 flex items-center gap-1.5 hover:shadow-rose-950/20 group max-w-full"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 group-hover:bg-rose-400 shrink-0"></span>
                  <span className="truncate">{query}</span>
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
            className="p-3 bg-slate-950 border-t border-slate-850 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything in Hinglish... (e.g., Strike 24000 target status?)"
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-650 disabled:border-transparent text-white border border-rose-500 rounded-lg transition transform active:scale-95 flex items-center justify-center aspect-square"
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
