import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Briefcase, 
  Lightbulb, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Database, 
  Sparkles,
  Award,
  ChevronRight,
  Brain,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { EventMemory, SponsorMemory, ChroniState } from '../types';
import ChroniMascot from './ChroniMascot';

interface CogneeNode {
  id: string;
  type: 'Event' | 'Sponsor' | 'Budget' | 'Lesson' | 'Decision' | 'Volunteer';
  name: string;
  properties: Record<string, any>;
}

interface CogneeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: string;
}

interface TimelineItem {
  id: string;
  type: 'Event' | 'Sponsor' | 'Lesson' | 'Decision';
  title: string;
  subtitle: string;
  description: string;
  year: number;
  extraInfo?: string;
  nodeId?: string;
}

interface TimelineViewProps {
  events: EventMemory[];
  sponsors: SponsorMemory[];
}

export default function TimelineView({ events, sponsors }: TimelineViewProps) {
  const [graphNodes, setGraphNodes] = useState<CogneeNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<CogneeEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  
  // Chroni interactive states
  const [chroniState, setChroniState] = useState<ChroniState>('idle');
  const [chroniBubble, setChroniBubble] = useState<string | undefined>(
    "Welcome to our Sacred Club Timeline! Let me guide you through our organizational memory accumulate over the years."
  );
  
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const timelineRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch the full Cognee graph representation
  useEffect(() => {
    let active = true;
    fetch('/api/memory/graph')
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data && Array.isArray(data.nodes)) {
          setGraphNodes(data.nodes);
          setGraphEdges(data.edges || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[TimelineView] Failed to load Cognee graph:', err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [events, sponsors]);

  // Construct items for timeline from graph data, with fallback to local state if empty
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    if (graphNodes.length > 0) {
      // 1. Process Event Nodes
      const eventNodes = graphNodes.filter(n => n.type === 'Event');
      eventNodes.forEach(node => {
        const year = Number(node.properties.year) || 2025;
        items.push({
          id: node.id,
          type: 'Event',
          title: node.name,
          subtitle: 'Event Created',
          description: node.properties.outcome || 'An organizational event was successfully coordinated.',
          year,
          extraInfo: node.properties.budget ? `Budget: ₹${Number(node.properties.budget).toLocaleString()}` : undefined,
          nodeId: node.id
        });
      });

      // 2. Process Sponsor Nodes
      const sponsorNodes = graphNodes.filter(n => n.type === 'Sponsor');
      sponsorNodes.forEach(node => {
        // Trace back edge to an event to inherit the year
        const connectedEdge = graphEdges.find(
          edge => edge.targetId === node.id && edge.relationType === 'SPONSORED_BY'
        );
        let year = 2025;
        if (connectedEdge) {
          const matchingEvent = eventNodes.find(ev => ev.id === connectedEdge.sourceId);
          if (matchingEvent) {
            year = Number(matchingEvent.properties.year) || 2025;
          }
        } else {
          // Guess year from text or default
          const yearMatch = node.properties.notes?.match(/\b(202\d)\b/);
          if (yearMatch) {
            year = Number(yearMatch[1]);
          }
        }

        items.push({
          id: node.id,
          type: 'Sponsor',
          title: node.name,
          subtitle: 'Sponsor Added',
          description: node.properties.notes || 'Financial/material supporter for club initiatives.',
          year,
          extraInfo: node.properties.amount ? `Contribution: ₹${Number(node.properties.amount).toLocaleString()}` : undefined,
          nodeId: node.id
        });
      });

      // 3. Process Lesson Nodes
      const lessonNodes = graphNodes.filter(n => n.type === 'Lesson');
      lessonNodes.forEach(node => {
        const connectedEdge = graphEdges.find(
          edge => edge.targetId === node.id && edge.relationType === 'LEARNED_LESSON'
        );
        let year = 2025;
        if (connectedEdge) {
          const matchingEvent = eventNodes.find(ev => ev.id === connectedEdge.sourceId);
          if (matchingEvent) {
            year = Number(matchingEvent.properties.year) || 2025;
          }
        }

        items.push({
          id: node.id,
          type: 'Lesson',
          title: node.name,
          subtitle: 'Lesson Learned',
          description: node.properties.detail || 'Critical retrospective insight recorded for next generation.',
          year,
          nodeId: node.id
        });
      });

      // 4. Process Decision Nodes
      const decisionNodes = graphNodes.filter(n => n.type === 'Decision');
      decisionNodes.forEach(node => {
        const connectedEdge = graphEdges.find(
          edge => edge.targetId === node.id && edge.relationType === 'MADE_DECISION'
        );
        let year = 2024; // fallback for seeded d-2
        if (connectedEdge) {
          const matchingEvent = eventNodes.find(ev => ev.id === connectedEdge.sourceId);
          if (matchingEvent) {
            year = Number(matchingEvent.properties.year) || 2024;
          }
        }

        items.push({
          id: node.id,
          type: 'Decision',
          title: node.name,
          subtitle: 'Decision Recorded',
          description: node.properties.detail || 'Strategic decision documented for operational clarity.',
          year,
          nodeId: node.id
        });
      });
    }

    // Fallback to local state if no Cognee graph data is parsed
    if (items.length === 0) {
      events.forEach(e => {
        items.push({
          id: `f-ev-${e.id}`,
          type: 'Event',
          title: e.name,
          subtitle: 'Event Created',
          description: e.outcome,
          year: e.year,
          extraInfo: `Budget: ₹${Number(e.budget).toLocaleString()}`
        });

        if (e.lessons) {
          items.push({
            id: `f-les-${e.id}`,
            type: 'Lesson',
            title: `${e.name} Operational Review`,
            subtitle: 'Lesson Learned',
            description: e.lessons,
            year: e.year
          });
        }
      });

      sponsors.forEach((s, idx) => {
        const years = [2024, 2025, 2025];
        const year = years[idx % years.length];
        items.push({
          id: `f-sp-${s.id}`,
          type: 'Sponsor',
          title: s.name,
          subtitle: 'Sponsor Added',
          description: s.notes,
          year,
          extraInfo: `Contribution: ₹${Number(s.amount).toLocaleString()}`
        });
      });
    }

    // Sort items chronologically (descending order by year so latest is at the top, or ascending. Let's do descending so users see recent, or let's group by year and sort items inside!)
    return items.sort((a, b) => b.year - a.year);
  }, [graphNodes, graphEdges, events, sponsors]);

  // Unique list of years for filters
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    timelineItems.forEach(item => years.add(item.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [timelineItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (selectedYear === 'all') return timelineItems;
    return timelineItems.filter(item => item.year === selectedYear);
  }, [timelineItems, selectedYear]);

  // Chroni preconfigured interactive highlights
  const chroniHighlights = [
    {
      title: "Google Developer Swag & Cash",
      nodeId: "s-1",
      bubble: "Google Developer Groups sponsored TechFest 2025 with ₹25,000 and lots of premium stickers! It formed 50% of our TechFest budget.",
      mood: "success" as ChroniState
    },
    {
      title: "Catering Lessons",
      nodeId: "l-1",
      bubble: "TechFest 2025 had huge lines for food! I logged this Lesson: 'Stagger food tokens next time.' Don't let your coders go hungry!",
      mood: "confused" as ChroniState
    },
    {
      title: "Donuts for Overnight Crews",
      nodeId: "d-2",
      bubble: "During HackDay 2024, our team made a vital Decision: buy discount donuts and coffee flasks for the late-night volunteers. It kept morale alive!",
      mood: "found" as ChroniState
    },
    {
      title: "CodeSprint Dry-Run",
      nodeId: "l-3",
      bubble: "Back in 2023, CodeSprint's scoreboard lagged. We learned to dry-run test-case runners 48 hours prior. Organizational memory prevents repeated server crashes!",
      mood: "thinking" as ChroniState
    }
  ];

  // Action: Scroll and highlight
  const triggerHighlight = (nodeId: string, bubbleText: string, mood: ChroniState) => {
    setChroniState(mood);
    setChroniBubble(bubbleText);
    setHighlightedItemId(nodeId);

    // Scroll to item
    const el = timelineRefs.current[nodeId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      setChroniState('idle');
    }, 4000);
  };

  const getIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'Event':
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'Sponsor':
        return <Briefcase className="w-4 h-4 text-cyan-400" />;
      case 'Lesson':
        return <Lightbulb className="w-4 h-4 text-amber-400" />;
      case 'Decision':
        return <CheckCircle className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getCardStyle = (type: TimelineItem['type'], isHighlighted: boolean) => {
    if (isHighlighted) {
      return 'border-purple-500 bg-purple-950/20 shadow-purple-950/20';
    }
    switch (type) {
      case 'Event':
        return 'border-slate-800 hover:border-purple-500/40 bg-slate-900/25';
      case 'Sponsor':
        return 'border-slate-800 hover:border-cyan-500/40 bg-slate-900/25';
      case 'Lesson':
        return 'border-slate-800 hover:border-amber-500/40 bg-slate-900/25';
      case 'Decision':
        return 'border-slate-800 hover:border-indigo-500/40 bg-slate-900/25';
    }
  };

  const getBadgeColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'Event':
        return 'bg-purple-950/60 border-purple-800/60 text-purple-300';
      case 'Sponsor':
        return 'bg-cyan-950/60 border-cyan-800/60 text-cyan-300';
      case 'Lesson':
        return 'bg-amber-950/60 border-amber-800/60 text-amber-300';
      case 'Decision':
        return 'bg-indigo-950/60 border-indigo-800/60 text-indigo-300';
    }
  };

  return (
    <div className="space-y-6 pb-12 text-left">
      
      {/* 1. Header & Quick Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Temporal Archives</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Club Memory Timeline
          </h1>
          <p className="text-sm text-slate-400">
            A chronological ledger of every event created, sponsor signed, decision logged, and retrospective lesson saved. Watch organizational wisdom compound.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap gap-1.5 self-start md:self-center">
          <button
            onClick={() => setSelectedYear('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedYear === 'all'
                ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-900/20'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Years
          </button>
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedYear === year
                  ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-900/20'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Timeline list, Right interactive floating guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Timeline Stack */}
        <div className="lg:col-span-8 space-y-6 relative">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-slate-900/20 rounded-2xl border border-slate-900">
              <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Traversing Temporal Graph...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2 bg-slate-900/20 rounded-2xl border border-slate-900">
              <AlertCircle className="w-8 h-8 text-slate-600" />
              <span className="text-sm text-slate-400 font-semibold">No records found for {selectedYear}</span>
              <span className="text-xs text-slate-500">Add events or sponsors to watch them populate here.</span>
            </div>
          ) : (
            <div className="relative pl-6 md:pl-8 space-y-8 pb-4">
              
              {/* Center Timeline line indicator */}
              <div className="absolute left-[13px] md:left-[17px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-purple-500 via-cyan-500 to-indigo-500/20" />

              {filteredItems.map((item, idx) => {
                const isHighlighted = highlightedItemId === item.id || (item.nodeId && highlightedItemId === item.nodeId);
                return (
                  <motion.div
                    key={item.id}
                    ref={el => {
                      timelineRefs.current[item.id] = el;
                      if (item.nodeId) {
                        timelineRefs.current[item.nodeId] = el;
                      }
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.4), duration: 0.3 }}
                    className={`relative grid grid-cols-1 gap-4 transition-all duration-300 ${
                      isHighlighted ? 'scale-[1.02]' : ''
                    }`}
                  >
                    {/* Floating Timeline Bullet node indicator */}
                    <div className={`absolute -left-[23px] md:-left-[27px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg transition-all z-10 ${
                      isHighlighted 
                        ? 'bg-purple-600 border-white scale-125 text-white' 
                        : item.type === 'Event' ? 'bg-slate-950 border-purple-500 text-purple-400' :
                          item.type === 'Sponsor' ? 'bg-slate-950 border-cyan-500 text-cyan-400' :
                          item.type === 'Lesson' ? 'bg-slate-950 border-amber-500 text-amber-400' :
                          'bg-slate-950 border-indigo-500 text-indigo-400'
                    }`}>
                      {getIcon(item.type)}
                    </div>

                    {/* Timeline Item Card */}
                    <div className={`border p-5 rounded-2xl shadow-xl transition-all ${getCardStyle(item.type, isHighlighted)}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                        
                        <div className="space-y-1">
                          {/* Event Tag */}
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${getBadgeColor(item.type)}`}>
                              {item.subtitle}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold">
                              {item.year} Fiscal Memory
                            </span>
                          </div>

                          <h3 className="font-extrabold text-sm md:text-base text-white tracking-tight mt-1">
                            {item.title}
                          </h3>
                        </div>

                        {/* Extra property details if present */}
                        {item.extraInfo && (
                          <div className="self-start sm:self-center bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold text-emerald-400">
                            {item.extraInfo}
                          </div>
                        )}
                      </div>

                      {/* Description outcome text */}
                      <p className="text-slate-300 text-xs md:text-sm leading-relaxed mt-3 whitespace-pre-line font-medium">
                        {item.description}
                      </p>

                      {/* Connected feedback action */}
                      <div className="mt-4 pt-3.5 border-t border-slate-900 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono font-bold">
                          UUID: {item.id.toUpperCase()}
                        </span>
                        
                        <button
                          onClick={() => {
                            let text = `In ${item.year}, for ${item.title}: ${item.description}`;
                            if (item.extraInfo) text += ` (${item.extraInfo})`;
                            const moods: ChroniState[] = ['found', 'success', 'thinking'];
                            const mood = moods[idx % moods.length];
                            triggerHighlight(item.id, text, mood);
                          }}
                          className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors group"
                        >
                          Ask Chroni to analyze
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>

                  </motion.div>
                );
              })}

            </div>
          )}

        </div>

        {/* Floating Guide Panel: Chroni is here highlighting */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
          
          {/* Main mascot guide bubble widget */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 relative overflow-hidden flex flex-col items-center">
            
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />

            <div className="w-48 h-40 flex items-center justify-center relative overflow-hidden">
              <ChroniMascot state={chroniState} showBubble={false} />
            </div>

            {/* Bubble */}
            <AnimatePresence mode="wait">
              <motion.div
                key={chroniBubble}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-xs text-slate-300 relative mt-4 max-w-sm text-left leading-relaxed font-medium shadow-xl"
              >
                {/* Arrow pointer */}
                <div className="absolute top-[-6px] left-[50%] translate-x-[-50%] w-3 h-3 bg-slate-950 border-t border-l border-slate-800/80 rotate-45" />
                <Sparkles className="w-3.5 h-3.5 text-purple-400 inline-block mr-1.5 align-text-top animate-pulse" />
                {chroniBubble}
              </motion.div>
            </AnimatePresence>

            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-4">
              CHRONI • ARCHIVE GUARDIAN
            </span>
          </div>

          {/* Highlights Checklist */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div>
              <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider block">Memory Highlights</span>
              <h4 className="font-extrabold text-sm text-white mt-1">Crucial Historic Events</h4>
              <p className="text-[11px] text-slate-500 leading-normal mt-1">
                Click a historical event below to have Chroni auto-focus the timeline and unlock its memory.
              </p>
            </div>

            <div className="space-y-2">
              {chroniHighlights.map((hl, idx) => {
                const targetExists = timelineItems.some(
                  item => item.id === hl.nodeId || item.nodeId === hl.nodeId
                );
                
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      // Find real item ID in processed array (e.g. e-1 might be node ID, etc.)
                      const realItem = timelineItems.find(
                        item => item.id === hl.nodeId || item.nodeId === hl.nodeId
                      );
                      const finalId = realItem ? realItem.id : hl.nodeId;
                      triggerHighlight(finalId, hl.bubble, hl.mood);
                    }}
                    className={`w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/40 hover:border-purple-500/30 transition-all flex items-center justify-between group`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-900/40 text-purple-400 flex items-center justify-center">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-xs text-slate-200 block truncate group-hover:text-white transition-colors">
                          {hl.title}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          Focus Highlight
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 flex items-center gap-3">
              <Database className="w-4 h-4 text-cyan-400" />
              <div className="text-[10px] text-slate-400 leading-snug">
                This timeline connects to the <strong className="text-white">Cognee Graph Database</strong>. Added items automatically form linked nodes.
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
