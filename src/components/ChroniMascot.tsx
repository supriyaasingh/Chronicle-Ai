import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChroniState } from '../types';

interface ChroniMascotProps {
  state: ChroniState;
  showBubble?: boolean;
  bubbleText?: string;
}

export default function ChroniMascot({ state, showBubble = true, bubbleText }: ChroniMascotProps) {
  
  // Custom default messages depending on Chroni's current state
  const getStatusMessage = () => {
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

  // Sound or soft hover effect
  return (
    <div className="flex flex-col items-center justify-center select-none py-6">
      <div className="relative flex flex-col items-center justify-center h-48 w-48">
        
        {/* Status Speech Bubble */}
        <AnimatePresence>
          {showBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              transition={{ type: "spring", damping: 15 }}
              className="absolute -top-10 z-10 max-w-xs px-4 py-2 rounded-2xl bg-slate-900/95 border border-purple-500/30 text-white shadow-xl shadow-purple-900/20 text-xs font-medium text-center backdrop-blur-sm"
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
              <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 rotate-45 bg-slate-900 border-r border-b border-purple-500/30" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot Body & SVG */}
        <motion.div
          className="relative z-10 w-28 h-28"
          animate={
            state === 'sleep'
              ? { y: [0, 4, 0], rotate: [0, -1, 0] }
              : state === 'searching'
              ? { y: [0, -8, 0], rotate: [-2, 2, -2] }
              : state === 'found' || state === 'success'
              ? { y: [0, -20, 0], scaleY: [1, 0.8, 1.1, 1], scaleX: [1, 1.15, 0.9, 1] }
              : state === 'confused'
              ? { rotate: [0, 10, 10, 0], y: [0, -3, 0] }
              : { y: [0, -6, 0] } // Idle & Thinking
          }
          transition={
            state === 'found' || state === 'success'
              ? { duration: 0.6, ease: "easeInOut", repeat: 1 }
              : state === 'sleep'
              ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              : state === 'searching'
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : { duration: 3, repeat: Infinity, ease: "easeInOut" } // standard idle breathing
          }
        >
          {/* Ambient Glowing Shadow directly behind Chroni */}
          <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl scale-90" />

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
            {/* Standard Rounded Floating Ghost Shape with tail points */}
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
              stroke="#D8B4FE"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Little cute ghost hands / arms */}
            {/* Left Hand */}
            <motion.path
              d="M 17 50 C 12 51, 8 55, 11 58 C 14 60, 18 55, 18 52"
              fill="#FFFFFF"
              stroke="#D8B4FE"
              strokeWidth="2"
              animate={
                state === 'success' || state === 'found'
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
              stroke="#D8B4FE"
              strokeWidth="2"
              animate={
                state === 'success' || state === 'found'
                  ? { rotate: [0, 35, 0], y: [0, -4, 0] }
                  : { rotate: [0, 3, 0] }
              }
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ originX: '82px', originY: '51px' }}
            />

            {/* Cheek Blush (Tiny cheeks) */}
            <ellipse cx="32" cy="54" rx="4.5" ry="2.5" fill="#FF8A9F" fillOpacity={state === 'success' || state === 'found' ? "0.7" : "0.4"} />
            <ellipse cx="68" cy="54" rx="4.5" ry="2.5" fill="#FF8A9F" fillOpacity={state === 'success' || state === 'found' ? "0.7" : "0.4"} />

            {/* EXPRESSIVE EYES */}
            {/* Left Eye */}
            {state === 'thinking' && (
              // Thinking/curved arches
              <path d="M 28 47 Q 34 41 40 47" stroke="#312E81" strokeWidth="4" strokeLinecap="round" />
            )}
            {state === 'sleep' && (
              // Sleeping straight/low arches
              <path d="M 28 47 L 38 47" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            )}
            {state === 'confused' && (
              // Skeptical / uneven eyes
              <g>
                <circle cx="34" cy="45" r="4.5" fill="#312E81" />
                {/* Slanted eyebrow */}
                <path d="M 28 38 L 38 41" stroke="#312E81" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}
            {(state === 'found' || state === 'success') && (
              // Happy sparkling arches
              <path d="M 28 48 Q 34 40 40 48" stroke="#7E22CE" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            )}
            {(state === 'idle' || state === 'searching') && (
              // Standard round expressive eyes with highlight
              <g>
                <circle cx="34" cy="46" r="5" fill="#1E1B4B" />
                <circle cx="32" cy="44" r="1.8" fill="#FFFFFF" />
              </g>
            )}

            {/* Right Eye */}
            {state === 'thinking' && (
              // Thinking arches
              <path d="M 60 47 Q 66 41 72 47" stroke="#312E81" strokeWidth="4" strokeLinecap="round" />
            )}
            {state === 'sleep' && (
              // Sleeping straight/low arches
              <path d="M 62 47 L 72 47" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            )}
            {state === 'confused' && (
              // Skeptical / uneven eyes - raised up
              <g>
                <circle cx="66" cy="42" r="4.5" fill="#312E81" />
                {/* Raised eyebrow */}
                <path d="M 60 34 L 72 32" stroke="#312E81" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}
            {(state === 'found' || state === 'success') && (
              // Happy sparkling arches
              <path d="M 60 48 Q 66 40 72 48" stroke="#7E22CE" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            )}
            {(state === 'idle' || state === 'searching') && (
              // Standard round expressive eyes with highlight
              <g>
                <circle cx="66" cy="46" r="5" fill="#1E1B4B" />
                <circle cx="64" cy="44" r="1.8" fill="#FFFFFF" />
              </g>
            )}

            {/* EXPRESSIVE MOUTH */}
            {state === 'idle' && (
              // Cute tiny smile
              <path d="M 46 54 Q 50 58 54 54" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )}
            {state === 'thinking' && (
              // Tiny thinking circle mouth
              <circle cx="50" cy="56" r="2.5" fill="#312E81" />
            )}
            {state === 'searching' && (
              // Straight scanning line mouth
              <path d="M 46 55 L 54 55" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />
            )}
            {state === 'sleep' && (
              // Sleeping tiny curved whistle mouth
              <path d="M 48 55 Q 50 53 52 55" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )}
            {state === 'confused' && (
              // Cute wavy squiggle mouth
              <path d="M 45 56 Q 47.5 53, 50 56 T 55 56" stroke="#312E81" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            )}
            {(state === 'found' || state === 'success') && (
              // Happy open tongue mouth!
              <g>
                <path d="M 45 53 Q 50 63 55 53 Z" fill="#9333EA" />
                <path d="M 48 57 Q 50 60 52 57" stroke="#FF8A9F" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            )}
          </svg>

          {/* Sparkles (Only visible when searching) */}
          <AnimatePresence>
            {state === 'searching' && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Sparkle 1 */}
                <motion.div
                  className="absolute -top-3 -left-3 text-cyan-400 font-bold text-lg"
                  animate={{ scale: [0, 1.2, 0], rotate: 180, opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                >
                  ✨
                </motion.div>
                {/* Sparkle 2 */}
                <motion.div
                  className="absolute -bottom-1 -right-3 text-purple-400 font-bold text-base"
                  animate={{ scale: [0, 1.1, 0], rotate: -180, opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                >
                  ✨
                </motion.div>
                {/* Sparkle 3 */}
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
            {state === 'sleep' && (
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

          {/* Confetti celebration particles (Only on success/found) */}
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
                  {/* Glowing inner details */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-indigo-500/20 animate-pulse" />
                  {/* Center split of pages */}
                  <div className="w-[1px] h-full bg-purple-400/40" />
                  {/* Miniature magical symbols or lines */}
                  <div className="text-[5px] text-cyan-300 font-mono tracking-tighter opacity-80 select-none leading-none mt-0.5">
                    📖
                  </div>
                </div>
                {/* Glow aura rays */}
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
            state === 'sleep'
              ? { scaleX: [1, 0.9, 1], opacity: [0.6, 0.8, 0.6] }
              : state === 'searching'
              ? { scaleX: [1, 0.8, 1], opacity: [0.4, 0.7, 0.4] }
              : state === 'found' || state === 'success'
              ? { scaleX: [1, 0.6, 1], opacity: [0.5, 0.2, 0.5] }
              : { scaleX: [1, 0.85, 1], opacity: [0.5, 0.7, 0.5] }
          }
          transition={
            state === 'found' || state === 'success'
              ? { duration: 0.6, ease: "easeInOut", repeat: 1 }
              : state === 'sleep'
              ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              : state === 'searching'
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </div>
    </div>
  );
}
