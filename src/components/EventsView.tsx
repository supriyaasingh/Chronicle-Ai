import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Search, 
  Plus, 
  Trash2, 
  X, 
  Sparkles, 
  BookOpen, 
  DollarSign, 
  CheckCircle,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { EventMemory } from '../types';

interface EventsViewProps {
  events: EventMemory[];
  onAddEvent: (event: Omit<EventMemory, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
}

export default function EventsView({ events, onAddEvent, onDeleteEvent }: EventsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [year, setYear] = useState(2026);
  const [budget, setBudget] = useState('');
  const [outcome, setOutcome] = useState('');
  const [lessons, setLessons] = useState('');
  const [error, setError] = useState('');

  // Year options (past 5 years up to next year)
  const yearsList = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y--) {
      list.push(y);
    }
    return list;
  }, []);

  // Filter events based on search
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter(e => 
      e.name.toLowerCase().includes(query) ||
      e.outcome.toLowerCase().includes(query) ||
      e.lessons.toLowerCase().includes(query) ||
      e.year.toString().includes(query)
    );
  }, [events, searchQuery]);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError("Event name is required.");
      return;
    }
    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) {
      setError("Please provide a valid budget amount.");
      return;
    }
    if (!outcome.trim()) {
      setError("Please describe the event outcome briefly.");
      return;
    }
    if (!lessons.trim()) {
      setError("Please input at least one key lesson learned.");
      return;
    }

    onAddEvent({
      name: name.trim(),
      year: Number(year),
      budget: Number(budget),
      outcome: outcome.trim(),
      lessons: lessons.trim()
    });

    // Reset Form
    setName('');
    setYear(new Date().getFullYear());
    setBudget('');
    setOutcome('');
    setLessons('');
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 text-left pb-12">
      
      {/* 1. HEADER CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-400" />
            Event Memory Archives
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse and log the outcomes, actual spends, and critical notes of past iterations.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 active:scale-95 shadow-lg shadow-purple-950/40"
        >
          <Plus className="w-4 h-4" />
          Log New Event
        </button>
      </div>

      {/* 2. SEARCH FILTER BAR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events by name, year, lessons..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-purple-500/50 focus:outline-none text-slate-200 text-sm placeholder-slate-500 transition-all"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. COLLAPSIBLE FORM (Add Event Dialog Modal) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl shadow-purple-950/10 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-lg">Log a New Club Event</h3>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Event Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. TechFest 2026, Freshers Jam"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-purple-500/50 focus:outline-none text-slate-200 text-sm transition-all"
                    required
                  />
                </div>

                {/* Grid for Year & Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Year Held</label>
                    <select 
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-purple-500/50 focus:outline-none text-slate-200 text-sm transition-all"
                    >
                      {yearsList.map(y => (
                        <option key={y} value={y} className="bg-slate-900">{y}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Total Budget (INR)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                      <input 
                        type="number" 
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="e.g. 50000"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-purple-500/50 focus:outline-none text-slate-200 text-sm transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Outcome */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Event Outcome & Stats</label>
                  <textarea 
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="e.g. 400+ attendees registered, successfully held 3 parallel tracks but registration queues were delayed."
                    rows={2.5}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-purple-500/50 focus:outline-none text-slate-200 text-sm transition-all resize-none"
                    required
                  />
                </div>

                {/* Lessons Learned */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Lessons Learned & Directives</label>
                  <textarea 
                    value={lessons}
                    onChange={(e) => setLessons(e.target.value)}
                    placeholder="e.g. Start sponsorship reachout 2 months earlier. Move registration completely online to avoid bottlenecking."
                    rows={2.5}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-purple-500/50 focus:outline-none text-slate-200 text-sm transition-all resize-none"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">This context is loaded directly into Chroni's retrieval matrix.</p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-slate-400 hover:text-white transition-all text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all text-sm font-semibold shadow-lg shadow-purple-950/20"
                  >
                    Preserve Memory
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. EVENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -15 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
              className="relative group flex flex-col rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-purple-500/20 p-5 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-950/5 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 text-left">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                    <Calendar className="w-3 h-3" /> {event.year}
                  </span>
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                    {event.name}
                  </h3>
                </div>

                {/* Delete trigger */}
                <button
                  onClick={() => onDeleteEvent(event.id)}
                  title="Purge Event Memory"
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Stats badges */}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 font-medium">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Budget: <strong className="text-white">₹{event.budget.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 border-t border-slate-800" />

              {/* Outcome section */}
              <div className="space-y-2 flex-1">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outcome Summary</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {event.outcome}
                    </p>
                  </div>
                </div>

                {/* Lessons Learned section */}
                <div className="flex items-start gap-2 pt-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">Lessons Learned</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50 italic">
                      "{event.lessons}"
                    </p>
                  </div>
                </div>
              </div>

            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-700 animate-bounce" />
          <p className="text-sm">No recorded event memories match your search query.</p>
        </div>
      )}

    </div>
  );
}
