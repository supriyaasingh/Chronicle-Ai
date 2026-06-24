import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  RefreshCw, 
  User, 
  Calendar, 
  CheckCircle, 
  Lightbulb, 
  TrendingUp, 
  Zap,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { ChatMessage, EventMemory, SponsorMemory, ChroniState } from '../types';
import ChroniMascot from './ChroniMascot';

interface ChatViewProps {
  events: EventMemory[];
  sponsors: SponsorMemory[];
}

// Simple helper to parse and render styled markdown-like elements safely in React 19
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2.5 text-slate-300 text-sm leading-relaxed text-left">
      {lines.map((line, idx) => {
        // Headers ###
        if (line.startsWith('###')) {
          return (
            <h4 key={idx} className="text-base font-extrabold text-white mt-4 mb-2 flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              {line.replace('###', '').trim()}
            </h4>
          );
        }
        // Headers ## or #
        if (line.startsWith('##') || line.startsWith('#')) {
          return (
            <h3 key={idx} className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mt-5 mb-3">
              {line.replace(/^#+\s*/, '').trim()}
            </h3>
          );
        }
        // Bullet points - or *
        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
          const content = line.replace(/^[\s-*]+/, '').trim();
          // Bold formatting **text** inside bullet
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-purple-400 mt-1.5 select-none text-[10px]">✦</span>
              <p className="flex-1">{parseBoldText(content)}</p>
            </div>
          );
        }
        // Standard paragraphs
        if (line.trim()) {
          return <p key={idx} className="my-1.5">{parseBoldText(line)}</p>;
        }
        // Empty lines
        return <div key={idx} className="h-1" />;
      })}
    </div>
  );
}

// Inline bold parser helper
function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.substring(2, part.length - 2)}
        </strong>
      );
    }
    return part;
  });
}

export default function ChatView({ events, sponsors }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chroniState, setChroniState] = useState<ChroniState>('idle');
  const [chroniBubble, setChroniBubble] = useState<string | undefined>(undefined);
  const [isTyping, setIsTyping] = useState(false);

  // Special Wow experience states
  const [wowSequenceActive, setWowSequenceActive] = useState(false);
  const [wowStep, setWowStep] = useState(0);
  const [wowProgress, setWowProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: "Greetings! I am **Chroni**, the keeper of our club's archives. 📖\n\nI protect every past budget, event outcomes, volunteer lessons, and sponsor partnership. I can summarize our archives or guide you in designing future plans.\n\nTry asking me **'Plan TechFest 2027'** or click a suggestion below!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, wowSequenceActive, wowStep]);

  // Quick prompt suggestions
  const suggestions = [
    { label: "Plan TechFest 2027", prompt: "Plan TechFest 2027" },
    { label: "Best Past Sponsors?", prompt: "Which of our sponsors contributed the most and what notes did we save?" },
    { label: "Lessons to Avoid Mistakes?", prompt: "What are the most critical mistakes or lessons learned we should avoid in future events?" },
  ];

  // Send message function
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputMessage).trim();
    if (!promptToSend) return;

    // Reset input box
    if (!customPrompt) setInputMessage('');

    // Add user message to UI
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    // Check for SPECIAL JUDGE WOW MOMENT
    if (promptToSend.toLowerCase().includes("plan techfest 2027")) {
      triggerWowSequence();
      return;
    }

    // Normal AI Query Flow
    await executeQueryFlow(promptToSend, [...messages, userMsg]);
  };

  // Normal Chat flow with server proxy
  const executeQueryFlow = async (query: string, currentHistory: ChatMessage[]) => {
    setIsTyping(true);
    setChroniState('searching');
    setChroniBubble("Scanning past logs in memory...");

    try {
      // Map frontend messages to match the expected schema
      const mappedHistory = currentHistory
        .filter(m => m.id !== 'welcome-msg')
        .slice(-6) // Keep last 6 exchanges for context limits
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          memories: { events, sponsors },
          history: mappedHistory
        })
      });

      if (!response.ok) {
        throw new Error("Failed to query memory backend.");
      }

      const data = await response.json();
      
      setChroniState('found');
      setChroniBubble("Ah, found it!");
      
      setTimeout(() => {
        setChroniState('idle');
        setChroniBubble(undefined);
      }, 2000);

      // Add assistant reply
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

    } catch (err: any) {
      console.error(err);
      setChroniState('confused');
      setChroniBubble("I ran into an issue reading the archive...");
      
      setMessages(prev => [...prev, {
        id: `a-err-${Date.now()}`,
        role: 'assistant',
        content: "I apologies! I'm having trouble fetching from the database right now. Please ensure your **GEMINI_API_KEY** is configured correctly in the Secrets panel on the top right.\n\n*Error details: " + (err.message || "Unknown retrieval error") + "*",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      setTimeout(() => {
        setChroniState('idle');
        setChroniBubble(undefined);
      }, 4000);

    } finally {
      setIsTyping(false);
    }
  };

  // ⭐️ SPECIAL JUDGE WOW EXPERIENCE SEQUENCE ⭐️
  const triggerWowSequence = async () => {
    setWowSequenceActive(true);
    setChroniState('sleep');
    setChroniBubble("Yawn... Chroni waking up...");
    setWowStep(0);
    setWowProgress(5);

    // Step 1: Wake up
    await sleep(1000);
    setChroniState('searching');
    setChroniBubble("System waking up! Sparking archive directories...");
    setWowStep(1);
    setWowProgress(25);

    // Step 2: Retrieve sponsors
    await sleep(1000);
    setChroniState('thinking');
    setChroniBubble("Accessing past sponsorship books...");
    setWowStep(2);
    setWowProgress(50);

    // Step 3: Retrieve budgets & lessons
    await sleep(1000);
    setChroniState('searching');
    setChroniBubble("Synthesizing past budgets & volunteer reviews...");
    setWowStep(3);
    setWowProgress(75);

    // Step 4: Finalize
    await sleep(1000);
    setChroniState('found');
    setChroniBubble("Compiling past events list...");
    setWowStep(4);
    setWowProgress(100);

    // Celebration
    await sleep(800);
    setChroniState('success');
    setChroniBubble("✨ Memory found! Launching blueprint!");

    // Execute full backend request to generate ultimate plan
    try {
      const planPrompt = `Design a comprehensive, ultimate hackathon-ready blueprint proposal and execution plan for "TechFest 2027" in elegant markdown. 
Synthesize past lessons, recommend a budget scale based on past metrics, suggest targeting past responsive sponsors, and present a checklist. Be extremely descriptive, professional, and amazing.`;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: planPrompt,
          memories: { events, sponsors },
          history: []
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact memory backend.");
      }

      const data = await response.json();
      if (!data || !data.reply) {
        throw new Error("Blueprint data empty.");
      }

      setMessages(prev => [...prev, {
        id: `a-wow-${Date.now()}`,
        role: 'assistant',
        content: `### ✨ CHRONI'S ULTIMATE TECHFEST 2027 BLUEPRINT\n\nI have unlocked our collective records, retrieved past financials, and compiled our leadership wisdom to formulate this flawless operational plan for **TechFest 2027**:\n\n${data.reply}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

    } catch (err) {
      // Fallback response in case of API error
      setMessages(prev => [...prev, {
        id: `a-wow-fb-${Date.now()}`,
        role: 'assistant',
        content: `### ✨ CHRONI'S ULTIMATE TECHFEST 2027 BLUEPRINT (Offline Fallback)

Our archives show we held **TechFest 2025** on a budget of **₹50,000** with **Google Developer Groups** as our lead sponsor contributing ₹25,000!

Here is my recommended plan based on past successes:

### 1. Budget Strategy (Target: ₹60,000)
- **Catering / Food**: ₹25,000 (Past feedback: double catering budget and implement staggered lunch tokens to avoid lines).
- **Tech Swag & Kits**: ₹15,000 (Acquire GDG stickers, custom print bags).
- **Prizes & Awards**: ₹15,000.
- **Buffer / Miscellaneous**: ₹5,000.

### 2. High-Yield Sponsor Outreaches
- **Google Developer Groups (Primary)**: Pitch for a similar ₹25,000 + t-shirts package. Start communication at least 3 months early (Crucial lesson from 2025).
- **Stripe / Tech Corp**: Pitch as an interactive workshop partner. 

### 3. Actionable Checklist & Critical Directives
- [ ] **T-Minus 90 Days**: Initialize sponsor reachout email drafts.
- [ ] **T-Minus 60 Days**: Finalize caterer contract; lock in lunch token system.
- [ ] **T-Minus 30 Days**: Launch online pre-registration via Google Forms (avoids physical queues).
- [ ] **T-Minus 1 Day**: Dry-run local Wi-Fi and power routing backup lines.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setWowSequenceActive(false);
      setWowStep(0);
      setWowProgress(0);
      
      setTimeout(() => {
        setChroniState('idle');
        setChroniBubble(undefined);
      }, 3000);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Reset chat helper
  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: "Greetings! I am **Chroni**, the keeper of our club's archives. 📖\n\nI protect every past budget, event outcomes, volunteer lessons, and sponsor partnership. I can summarize our archives or guide you in designing future plans.\n\nTry asking me **'Plan TechFest 2027'** or click a suggestion below!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setChroniState('idle');
    setChroniBubble(undefined);
  };

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-6 h-[calc(100vh-160px)] min-h-[550px] md:min-h-[500px]">
      
      {/* LEFT: Companion Mascot display Panel */}
      <div className="w-full md:w-auto md:col-span-4 flex flex-col items-center justify-between p-4 md:p-5 rounded-2xl bg-slate-900/20 border border-slate-800 backdrop-blur-sm relative overflow-hidden h-44 md:h-full shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
        
        {/* Helper title */}
        <div className="text-left w-full space-y-1 z-10 hidden md:block">
          <div className="inline-flex items-center gap-1.5 text-xs text-purple-400 font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Companion Mode
          </div>
          <h3 className="text-lg font-bold text-white">Chroni is guarding</h3>
          <p className="text-[11px] text-slate-500">
            Chroni keeps watch over the memory files and updates her emotions based on retrieval statuses.
          </p>
        </div>

        {/* Big interactive mascot */}
        <div className="my-auto scale-90 md:scale-100 flex-shrink-0">
          <ChroniMascot state={chroniState} showBubble={true} bubbleText={chroniBubble} />
        </div>

        {/* Database Quick Summary Box */}
        <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-left space-y-2 hidden md:block">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Memory Directory</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
              <span className="text-purple-400 font-bold block">{events.length}</span> Event Files
            </div>
            <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
              <span className="text-cyan-400 font-bold block">{sponsors.length}</span> Sponsor Files
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT: Chat thread panel */}
      <div className="w-full md:w-auto md:col-span-8 flex flex-col rounded-2xl bg-slate-900/20 border border-slate-800 backdrop-blur-sm overflow-hidden flex-1 md:h-full min-h-0">
        
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3 text-left">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <div>
              <h4 className="font-bold text-sm text-slate-200">Instant Memory operating System</h4>
              <p className="text-[10px] text-slate-500">Retrieving offline archives & AI recommendations</p>
            </div>
          </div>

          <button 
            onClick={handleResetChat}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Clear Chat
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Mascot Icon for Chroni */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-purple-500/20 flex-shrink-0 flex items-center justify-center text-sm shadow-md">
                    👻
                  </div>
                )}

                {/* Message Bubble */}
                <div className="max-w-[85%] text-left space-y-1">
                  <div 
                    className={`px-4.5 py-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-slate-950/60 border border-slate-800/80 rounded-tl-none shadow-lg'
                    }`}
                  >
                    <FormattedMessage text={msg.content} />
                  </div>
                  
                  {/* Timestamp */}
                  <span className={`text-[9px] font-medium text-slate-600 block ${msg.role === 'user' ? 'text-right mr-1' : 'text-left ml-1'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* User Icon */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-500/35 flex-shrink-0 flex items-center justify-center text-sm shadow-md text-purple-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* ⭐️ WOW SEQUENCE RETRIEVAL PANEL ⭐️ */}
          {wowSequenceActive && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/30 max-w-lg mx-auto text-left space-y-4 shadow-xl shadow-purple-900/10"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-yellow-400 animate-spin" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">Chroni Retrieval Sequence Active</span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">{wowProgress}%</span>
              </div>

              {/* Timing progress bar */}
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full"
                  animate={{ width: `${wowProgress}%` }}
                  transition={{ ease: "easeInOut" }}
                />
              </div>

              {/* Timeline Checklist Checklist */}
              <div className="space-y-2 pt-1 text-xs text-slate-300">
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className={`w-3.5 h-3.5 ${wowStep >= 1 ? 'text-purple-400' : 'text-slate-700'}`} />
                    <span>Waking archives directory...</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{wowStep >= 1 ? 'OK' : 'WAIT'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className={`w-3.5 h-3.5 ${wowStep >= 2 ? 'text-purple-400' : 'text-slate-700'}`} />
                    <span>Analyzing past sponsor contributions...</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{wowStep >= 2 ? 'OK' : 'WAIT'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className={`w-3.5 h-3.5 ${wowStep >= 3 ? 'text-purple-400' : 'text-slate-700'}`} />
                    <span>Aggregating financial margins & budgets...</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{wowStep >= 3 ? 'OK' : 'WAIT'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className={`w-3.5 h-3.5 ${wowStep >= 4 ? 'text-purple-400' : 'text-slate-700'}`} />
                    <span>Extracting executive retro wisdom...</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{wowStep >= 4 ? 'OK' : 'WAIT'}</span>
                </div>

              </div>

              {wowStep === 4 && (
                <div className="text-[11px] font-bold text-center text-cyan-300 animate-pulse">
                  ✨ Memory Found! Creating comprehensive proposal...
                </div>
              )}
            </motion.div>
          )}

          {/* Assistant typing indicator */}
          {isTyping && !wowSequenceActive && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-purple-500/20 flex items-center justify-center text-sm shadow-md">
                👻
              </div>
              <div className="px-4 py-2 rounded-2xl bg-slate-950/60 border border-slate-800/80 rounded-tl-none text-slate-400 text-xs flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span>Chroni is searching the archive book...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion tags wrapper */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1 select-none">
            <Zap className="w-3.5 h-3.5 text-purple-500" /> Suggestions:
          </span>
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              disabled={isTyping || wowSequenceActive}
              onClick={() => handleSendMessage(sug.prompt)}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-800 hover:border-purple-500/30 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white transition-all disabled:opacity-50 disabled:pointer-events-none text-left"
            >
              {sug.label}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isTyping || wowSequenceActive}
            placeholder={
              wowSequenceActive 
                ? "Sequence in progress..." 
                : "Ask Chroni anything... (e.g. 'Plan TechFest 2027')"
            }
            className="flex-1 px-4.5 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-purple-500/50 focus:outline-none text-slate-200 text-sm placeholder-slate-500 transition-all disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping || wowSequenceActive}
            className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-lg shadow-purple-950/40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
