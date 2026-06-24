import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { ChroniState } from '../types';

interface ChroniMascotProps {
  state: ChroniState;
  showBubble?: boolean;
  bubbleText?: string;
}

type Emotion = 'happy' | 'loved' | 'sleepy' | 'annoyed' | 'angry';

export default function ChroniMascot({ state, showBubble = true, bubbleText }: ChroniMascotProps) {
  const [emotion, setEmotion] = useState<Emotion>('happy');
  const [clickTimes, setClickTimes] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(true);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Procedural retro-chiptune sound generator using Web Audio API
  const playSynthSound = (type: 'love' | 'sleep' | 'annoyed' | 'angry' | 'wake') => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      if (type === 'love') {
        // Sweet rising magical chime arpeggio
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.4); // C6

        osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
        osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.5); // E6

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.15);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
      } else if (type === 'wake') {
        // Bright sparkling wake-up chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.35); // A6
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'annoyed') {
        // Blip-bloop mildly annoyed tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(180, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.setValueAtTime(0.12, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'angry') {
        // Low growling detuned buzzer
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';

        osc1.frequency.setValueAtTime(130, now);
        osc1.frequency.linearRampToValueAtTime(80, now + 0.45);

        osc2.frequency.setValueAtTime(134, now); // Detuned for fat chorus effect
        osc2.frequency.linearRampToValueAtTime(84, now + 0.45);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
      } else if (type === 'sleep') {
        // Soft, breathing sine wave hum
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 1.2);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
      }
    } catch (e) {
      console.warn("Audio interaction restricted or not supported in this browser:", e);
    }
  };

  // Safe trigger for temporary emotional states
  const triggerEmotion = (newEmotion: Emotion, durationMs: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setEmotion(newEmotion);
    
    timeoutRef.current = setTimeout(() => {
      setEmotion('happy');
    }, durationMs);
  };

  // Activity manager for tracking sleepy status (2 minutes inactivity)
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    if (state === 'idle' && emotion !== 'sleepy') {
      inactivityTimeoutRef.current = setTimeout(() => {
        setEmotion('sleepy');
        playSynthSound('sleep');
      }, 120000); // 2 minutes = 120,000ms
    }
  }, [state, emotion, isMuted]);

  // Click Handler with speed tracking
  const handleChroniClick = () => {
    resetInactivityTimer();

    if (state === 'idle' && emotion === 'sleepy') {
      // Waking up sequence
      playSynthSound('wake');
      triggerEmotion('loved', 4000);
      return;
    }

    const now = Date.now();
    const activeClicks = clickTimes.filter(t => now - t < 5000);
    const newClicks = [...activeClicks, now];
    setClickTimes(newClicks);

    if (newClicks.length > 20) {
      triggerEmotion('angry', 5000);
      playSynthSound('angry');
    } else if (newClicks.length > 10) {
      triggerEmotion('annoyed', 3000);
      playSynthSound('annoyed');
    } else {
      triggerEmotion('loved', 4000);
      playSynthSound('love');
    }
  };

  // Sync parent activity and cleanup timers
  useEffect(() => {
    if (state !== 'idle') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setEmotion('happy');
    }
    resetInactivityTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };
  }, [state, resetInactivityTimer]);

  // Custom default messages depending on Chroni's state & emotional overlay
  const getStatusMessage = () => {
    if (state !== 'idle' && bubbleText) return bubbleText;

    if (state === 'idle') {
      switch (emotion) {
        case 'loved':
          return "Hehe! Memory protected!";
        case 'sleepy':
          return "Resting in the archives...";
        case 'annoyed':
          return "Careful! I'm organizing memories!";
        case 'angry':
          return "Hey! Stop poking the Memory Spirit!";
        default:
          break;
      }
    }

    if (bubbleText) return bubbleText;

    switch (state) {
      case 'idle':
        return "I'm ready! Ask me anything about our past events or sponsors.";
      case 'thinking':
        return "Opening the glowing archive book... Searching memories...";
      case 'searching':
        return "Scanning club history & past decisions...";
      case 'found':
        return "Ah, memory found in the archives! Generating details...";
      case 'success':
        return "Wonderful! New memory saved in our database!";
      case 'confused':
        return "Hmm... I need more information to find that memory.";
      case 'sleep':
        return "Zzz... tap me to wake me up...";
      default:
        return "Guarding our club's history...";
    }
  };

  // Layout animations mapping for Framer Motion
  const getMascotAnimation = () => {
    if (state !== 'idle') {
      switch (state) {
        case 'sleep':
          return { y: [0, 4, 0], rotate: [0, -1, 0] };
        case 'searching':
          return { y: [0, -8, 0], rotate: [-2, 2, -2] };
        case 'found':
        case 'success':
          return { y: [0, -20, 0], scaleY: [1, 0.8, 1.1, 1], scaleX: [1, 1.15, 0.9, 1] };
        case 'confused':
          return { rotate: [0, 10, 10, 0], y: [0, -3, 0] };
        default:
          return { y: [0, -6, 0] }; // thinking / generic active
      }
    }

    switch (emotion) {
      case 'sleepy':
        return { y: [0, 4, 0], rotate: [0, -1, 0] };
      case 'loved':
        return { y: [0, -16, 0], scaleY: [1, 0.8, 1.15, 1], scaleX: [1, 1.15, 0.85, 1] };
      case 'annoyed':
        return { x: [0, -2, 2, -2, 2, 0], y: [0, -1, 1, -1, 1, 0] };
      case 'angry':
        return { x: [0, -3, 3, -3, 3, -3, 3, 0], y: [0, -2, 2, -2, 2, -2, 2, 0] };
      case 'happy':
      default:
        return { y: [0, -6, 0] }; // idle
    }
  };

  const getMascotTransition = () => {
    if (state !== 'idle') {
      if (state === 'found' || state === 'success') {
        return { duration: 0.6, ease: "easeInOut", repeat: 1 };
      }
      if (state === 'sleep') {
        return { duration: 4.5, repeat: Infinity, ease: "easeInOut" };
      }
      if (state === 'searching') {
        return { duration: 1.2, repeat: Infinity, ease: "easeInOut" };
      }
      return { duration: 3, repeat: Infinity, ease: "easeInOut" };
    }

    switch (emotion) {
      case 'loved':
        return { duration: 0.6, ease: "easeInOut", repeat: 1 };
      case 'sleepy':
        return { duration: 4.5, repeat: Infinity, ease: "easeInOut" };
      case 'annoyed':
        return { duration: 0.4, ease: "easeInOut", repeat: 1 };
      case 'angry':
        return { duration: 0.25, repeat: Infinity, ease: "easeInOut" };
      case 'happy':
      default:
        return { duration: 3, repeat: Infinity, ease: "easeInOut" };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center select-none py-6">
      <div className="relative flex flex-col items-center justify-center h-48 w-48">
        
        {/* Adorable speaker toggle for audio feedback */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const nextMuted = !isMuted;
            setIsMuted(nextMuted);
            // Quick preview chime when unmuted
            if (!nextMuted) {
              setTimeout(() => playSynthSound('wake'), 50);
            }
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-purple-400 transition-all z-30"
          title={isMuted ? "Unmute Chroni's voices" : "Mute Chroni's voices"}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Status Speech Bubble */}
        <AnimatePresence>
          {showBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              transition={{ type: "spring", damping: 15 }}
              className={`absolute -top-10 z-10 max-w-xs px-4 py-2 rounded-2xl bg-slate-900/95 border text-white shadow-xl text-xs font-medium text-center backdrop-blur-sm transition-colors duration-300 ${
                state === 'idle' && emotion === 'angry'
                  ? 'border-red-500/55 shadow-red-950/20'
                  : state === 'idle' && emotion === 'loved'
                  ? 'border-pink-500/40 shadow-pink-950/20'
                  : state === 'idle' && emotion === 'annoyed'
                  ? 'border-amber-500/45 shadow-amber-950/20'
                  : 'border-purple-500/30 shadow-purple-900/20'
              }`}
            >
              <div className="flex items-center gap-1.5 justify-center">
                {state === 'searching' && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}
                {state === 'thinking' && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                )}
                <span>{getStatusMessage()}</span>
              </div>
              {/* Triangle pointer */}
              <div className={`absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 rotate-45 bg-slate-900 border-r border-b transition-colors duration-300 ${
                state === 'idle' && emotion === 'angry'
                  ? 'border-red-500/55'
                  : state === 'idle' && emotion === 'loved'
                  ? 'border-pink-500/40'
                  : state === 'idle' && emotion === 'annoyed'
                  ? 'border-amber-500/45'
                  : 'border-purple-500/30'
              }`} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot Body & SVG */}
        <motion.div
          onClick={handleChroniClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-10 w-28 h-28 cursor-pointer"
          animate={getMascotAnimation()}
          transition={getMascotTransition()}
        >
          {/* Ambient Glowing Shadow directly behind Chroni */}
          <div className={`absolute inset-0 rounded-full blur-xl scale-90 transition-all duration-300 ${
            state === 'idle' && emotion === 'angry'
              ? 'bg-red-500/30'
              : state === 'idle' && emotion === 'loved'
              ? 'bg-pink-500/25'
              : state === 'idle' && emotion === 'annoyed'
              ? 'bg-amber-500/20'
              : state === 'idle' && emotion === 'sleepy'
              ? 'bg-slate-500/5'
              : 'bg-purple-500/10'
          }`} />

          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_4px_12px_rgba(168,85,247,0.2)]"
          >
            {/* DEF - Gradients and Filters */}
            <defs>
              <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="70%" stopColor="#FAFAFF" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
              <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Ghost Spirit Main Body */}
            <path
              d="M 20 45 
                 C 20 22, 80 22, 80 45 
                 C 80 58, 82 72, 75 78 
                 C 70 82, 64 72, 59 75 
                 C 54 78, 52 82, 47 82 
                 C 42 82, 40 78, 35 75 
                 C 30 72, 24 82, 19 78 
                 C 14 73, 20 58, 20 45 Z"
              fill="url(#bodyGradient)"
              stroke={state === 'idle' && emotion === 'angry' ? "#EF4444" : "#D8B4FE"}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Little cute ghost hands / arms */}
            {/* Left Hand */}
            <motion.path
              d="M 17 50 C 12 51, 8 55, 11 58 C 14 60, 18 55, 18 52"
              fill="#FFFFFF"
              stroke={state === 'idle' && emotion === 'angry' ? "#EF4444" : "#D8B4FE"}
              strokeWidth="2"
              animate={
                state === 'success' || state === 'found' || (state === 'idle' && emotion === 'loved')
                  ? { rotate: [0, -35, 0], y: [0, -4, 0] }
                  : { rotate: [0, -3, 0] }
              }
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ originX: '18px', originY: '51px' }}
            />
            {/* Right Hand */}
            <motion.path
              d="M 83 50 C 88 51, 92 55, 89 58 C 86 60, 82 55, 82 52"
              fill="#FFFFFF"
              stroke={state === 'idle' && emotion === 'angry' ? "#EF4444" : "#D8B4FE"}
              strokeWidth="2"
              animate={
                state === 'success' || state === 'found' || (state === 'idle' && emotion === 'loved')
                  ? { rotate: [0, 35, 0], y: [0, -4, 0] }
                  : { rotate: [0, 3, 0] }
              }
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ originX: '82px', originY: '51px' }}
            />

            {/* Cheek Blush (Puff up cheeks when annoyed!) */}
            {state === 'idle' && emotion === 'annoyed' ? (
              <g>
                <ellipse cx="28" cy="54" rx="8.5" ry="5.5" fill="#FF8A9F" fillOpacity="0.85" />
                <ellipse cx="72" cy="54" rx="8.5" ry="5.5" fill="#FF8A9F" fillOpacity="0.85" />
              </g>
            ) : (
              <g>
                <ellipse cx="32" cy="54" rx="4.5" ry="2.5" fill="#FF8A9F" fillOpacity={(state === 'success' || state === 'found' || (state === 'idle' && emotion === 'loved')) ? "0.8" : "0.4"} />
                <ellipse cx="68" cy="54" rx="4.5" ry="2.5" fill="#FF8A9F" fillOpacity={(state === 'success' || state === 'found' || (state === 'idle' && emotion === 'loved')) ? "0.8" : "0.4"} />
              </g>
            )}

            {/* ANGRY EYEBROWS */}
            {state === 'idle' && emotion === 'angry' && (
              <g>
                <path d="M 24 35 L 38 41" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 76 35 L 62 41" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
              </g>
            )}

            {/* EXPRESSIVE EYES */}
            {/* Left Eye */}
            {state === 'thinking' && (
              <path d="M 28 47 Q 34 41 40 47" stroke="#312E81" strokeWidth="4" strokeLinecap="round" />
            )}
            {(state === 'sleep' || (state === 'idle' && emotion === 'sleepy')) && (
              <path d="M 28 47 L 38 47" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            )}
            {state === 'confused' && (
              <g>
                <circle cx="34" cy="45" r="4.5" fill="#312E81" />
                <path d="M 28 38 L 38 41" stroke="#312E81" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}
            {state === 'idle' && emotion === 'annoyed' && (
              <path d="M 28 46 Q 34 49 38 46" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" fill="none" />
            )}
            {state === 'idle' && emotion === 'angry' && (
              <g>
                <circle cx="34" cy="46" r="4.5" fill="#EF4444" />
                <circle cx="33" cy="45" r="1.3" fill="#FFFFFF" />
              </g>
            )}
            {(state === 'found' || state === 'success' || (state === 'idle' && emotion === 'loved')) && (
              <path d="M 28 48 Q 34 40 40 48" stroke="#7E22CE" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            )}
            {state === 'idle' && emotion === 'happy' && (
              <g>
                <circle cx="34" cy="46" r="5" fill="#1E1B4B" />
                <circle cx="32" cy="44" r="1.8" fill="#FFFFFF" />
              </g>
            )}
            {state === 'searching' && (
              <g>
                <circle cx="34" cy="46" r="5" fill="#1E1B4B" />
                <circle cx="32" cy="44" r="1.8" fill="#FFFFFF" />
              </g>
            )}

            {/* Right Eye */}
            {state === 'thinking' && (
              <path d="M 60 47 Q 66 41 72 47" stroke="#312E81" strokeWidth="4" strokeLinecap="round" />
            )}
            {(state === 'sleep' || (state === 'idle' && emotion === 'sleepy')) && (
              <path d="M 62 47 L 72 47" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            )}
            {state === 'confused' && (
              <g>
                <circle cx="66" cy="42" r="4.5" fill="#312E81" />
                <path d="M 60 34 L 72 32" stroke="#312E81" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}
            {state === 'idle' && emotion === 'annoyed' && (
              <path d="M 62 46 Q 66 49 72 46" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" fill="none" />
            )}
            {state === 'idle' && emotion === 'angry' && (
              <g>
                <circle cx="66" cy="46" r="4.5" fill="#EF4444" />
                <circle cx="65" cy="45" r="1.3" fill="#FFFFFF" />
              </g>
            )}
            {(state === 'found' || state === 'success' || (state === 'idle' && emotion === 'loved')) && (
              <path d="M 60 48 Q 66 40 72 48" stroke="#7E22CE" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            )}
            {state === 'idle' && emotion === 'happy' && (
              <g>
                <circle cx="66" cy="46" r="5" fill="#1E1B4B" />
                <circle cx="64" cy="44" r="1.8" fill="#FFFFFF" />
              </g>
            )}
            {state === 'searching' && (
              <g>
                <circle cx="66" cy="46" r="5" fill="#1E1B4B" />
                <circle cx="64" cy="44" r="1.8" fill="#FFFFFF" />
              </g>
            )}

            {/* EXPRESSIVE MOUTH */}
            {state === 'idle' && emotion === 'happy' && (
              <path d="M 46 54 Q 50 58 54 54" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )}
            {state === 'idle' && emotion === 'annoyed' && (
              <path d="M 46 55 L 54 55" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />
            )}
            {state === 'idle' && emotion === 'angry' && (
              <path d="M 45 58 Q 50 54 55 58" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )}
            {state === 'thinking' && (
              <circle cx="50" cy="56" r="2.5" fill="#312E81" />
            )}
            {state === 'searching' && (
              <path d="M 46 55 L 54 55" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />
            )}
            {(state === 'sleep' || (state === 'idle' && emotion === 'sleepy')) && (
              <path d="M 48 55 Q 50 53 52 55" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )}
            {state === 'confused' && (
              <path d="M 45 56 Q 47.5 53, 50 56 T 55 56" stroke="#312E81" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            )}
            {(state === 'found' || state === 'success' || (state === 'idle' && emotion === 'loved')) && (
              <g>
                <path d="M 45 53 Q 50 63 55 53 Z" fill="#9333EA" />
                <path d="M 48 57 Q 50 60 52 57" stroke="#FF8A9F" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            )}
          </svg>

          {/* Sparkles (Searching state) */}
          <AnimatePresence>
            {state === 'searching' && (
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  className="absolute -top-3 -left-3 text-cyan-400 font-bold text-lg"
                  animate={{ scale: [0, 1.2, 0], rotate: 180, opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="absolute -bottom-1 -right-3 text-purple-400 font-bold text-base"
                  animate={{ scale: [0, 1.1, 0], rotate: -180, opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="absolute top-1/2 -right-4 text-pink-400 font-bold text-sm"
                  animate={{ scale: [0, 1.3, 0], rotate: 90, opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                >
                  ✦
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Sleeping Zzz Particles */}
          <AnimatePresence>
            {(state === 'sleep' || (state === 'idle' && emotion === 'sleepy')) && (
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  className="absolute -top-4 right-1 text-purple-400 font-bold text-sm"
                  initial={{ opacity: 0, y: 10, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 0], y: -25, x: 10, scale: [0.5, 1.2, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                >
                  Z
                </motion.div>
                <motion.div
                  className="absolute -top-10 right-5 text-purple-500 font-bold text-xs"
                  initial={{ opacity: 0, y: 10, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 0], y: -35, x: 15, scale: [0.5, 1.1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.5, ease: "easeOut" }}
                >
                  z
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Floating Hearts for Loved state */}
          <AnimatePresence>
            {state === 'idle' && emotion === 'loved' && (
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  className="absolute -top-6 left-2 text-pink-500 text-lg"
                  initial={{ opacity: 0, y: 15, scale: 0.3 }}
                  animate={{ opacity: [0, 1, 0], y: -30, x: -10, scale: [0.3, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ❤️
                </motion.div>
                <motion.div
                  className="absolute -top-10 right-4 text-rose-400 text-sm"
                  initial={{ opacity: 0, y: 15, scale: 0.3 }}
                  animate={{ opacity: [0, 1, 0], y: -40, x: 10, scale: [0.3, 1.1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                >
                  💖
                </motion.div>
                <motion.div
                  className="absolute -top-2 left-1/2 text-pink-400 text-xs"
                  initial={{ opacity: 0, y: 10, scale: 0.2 }}
                  animate={{ opacity: [0, 1, 0], y: -25, x: 5, scale: [0.2, 1.0, 0.6] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: 1.2 }}
                >
                  💝
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Confetti celebration particles (Only on success/found/loved) */}
          <AnimatePresence>
            {(state === 'success' || state === 'found') && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => {
                  const colors = ['bg-yellow-400', 'bg-cyan-400', 'bg-pink-400', 'bg-purple-400', 'bg-green-400', 'bg-indigo-400'];
                  const xDir = (i % 2 === 0 ? 1 : -1) * (15 + (i * 8));
                  return (
                    <motion.div
                      key={i}
                      className={`absolute w-1.5 h-1.5 rounded-full ${colors[i % colors.length]}`}
                      style={{ top: "30%", left: "50%" }}
                      initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
                      animate={{
                        scale: [0, 1.2, 0],
                        opacity: [1, 1, 0],
                        x: xDir,
                        y: -30 - (i * 5)
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  );
                })}
              </div>
            )}
          </AnimatePresence>

          {/* Glowing Archive Book below Chroni (Visible when Thinking or Searching) */}
          <AnimatePresence>
            {(state === 'thinking' || state === 'searching') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 15 }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none"
              >
                <div className="w-10 h-7 bg-indigo-900 border border-purple-400/50 rounded-md relative shadow-lg shadow-purple-500/20 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-indigo-500/20 animate-pulse" />
                  <div className="w-[1px] h-full bg-purple-400/40" />
                  <div className="text-[5px] text-cyan-300 font-mono tracking-tighter opacity-80 select-none leading-none mt-0.5">
                    📖
                  </div>
                </div>
                <motion.div
                  className="w-12 h-1 bg-cyan-400 rounded-full blur-sm"
                  animate={{ scaleX: [0.8, 1.3, 0.8], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 3D Floating Oval Shadow beneath Chroni */}
        <motion.div
          className="absolute bottom-4 z-0 w-16 h-2 bg-slate-900/60 rounded-full blur-[3px]"
          animate={
            state !== 'idle'
              ? (state === 'sleep'
                  ? { scaleX: [1, 0.9, 1], opacity: [0.6, 0.8, 0.6] }
                  : state === 'searching'
                  ? { scaleX: [1, 0.8, 1], opacity: [0.4, 0.7, 0.4] }
                  : state === 'found' || state === 'success'
                  ? { scaleX: [1, 0.6, 1], opacity: [0.5, 0.2, 0.5] }
                  : { scaleX: [1, 0.85, 1], opacity: [0.5, 0.7, 0.5] })
              : (emotion === 'sleepy'
                  ? { scaleX: [1, 0.9, 1], opacity: [0.6, 0.8, 0.6] }
                  : emotion === 'loved'
                  ? { scaleX: [1, 0.6, 1], opacity: [0.5, 0.2, 0.5] }
                  : { scaleX: [1, 0.85, 1], opacity: [0.5, 0.7, 0.5] })
          }
          transition={
            state !== 'idle'
              ? ((state === 'found' || state === 'success')
                  ? { duration: 0.6, ease: "easeInOut", repeat: 1 }
                  : state === 'sleep'
                  ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
                  : state === 'searching'
                  ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 3, repeat: Infinity, ease: "easeInOut" })
              : (emotion === 'loved'
                  ? { duration: 0.6, ease: "easeInOut", repeat: 1 }
                  : emotion === 'sleepy'
                  ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 3, repeat: Infinity, ease: "easeInOut" })
          }
        />
      </div>
    </div>
  );
}

