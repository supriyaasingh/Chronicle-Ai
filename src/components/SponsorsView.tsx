import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Trash2, 
  X, 
  Sparkles, 
  DollarSign, 
  FileText, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { SponsorMemory } from '../types';

interface SponsorsViewProps {
  sponsors: SponsorMemory[];
  onAddSponsor: (sponsor: Omit<SponsorMemory, 'id'>) => void;
  onDeleteSponsor: (id: string) => void;
}

export default function SponsorsView({ sponsors, onAddSponsor, onDeleteSponsor }: SponsorsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Filter sponsors based on search
  const filteredSponsors = useMemo(() => {
    if (!searchQuery.trim()) return sponsors;
    const query = searchQuery.toLowerCase();
    return sponsors.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.notes.toLowerCase().includes(query) ||
      s.amount.toString().includes(query)
    );
  }, [sponsors, searchQuery]);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError("Sponsor name is required.");
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please provide a valid contribution amount.");
      return;
    }
    if (!notes.trim()) {
      setError("Please add details about this sponsor's package/agreements.");
      return;
    }

    onAddSponsor({
      name: name.trim(),
      amount: Number(amount),
      notes: notes.trim()
    });

    // Reset Form
    setName('');
    setAmount('');
    setNotes('');
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 text-left pb-12">
      
      {/* 1. HEADER CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-cyan-400" />
            Sponsor Memory Archive
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Maintain past sponsorship logs, deal points, contact notes, and funding histories.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all duration-200 active:scale-95 shadow-lg shadow-cyan-950/40"
        >
          <Plus className="w-4 h-4" />
          Add Sponsor Record
        </button>
      </div>

      {/* 2. SEARCH FILTER BAR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sponsors by name, details..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-cyan-500/50 focus:outline-none text-slate-200 text-sm placeholder-slate-500 transition-all"
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

      {/* 3. FORM MODAL DIALOG */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl shadow-cyan-950/10 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-lg">Add Sponsor History</h3>
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
                
                {/* Sponsor Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Sponsor / Partner Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Red Bull India, GitHub"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500/50 focus:outline-none text-slate-200 text-sm transition-all"
                    required
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Contribution Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 20000"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500/50 focus:outline-none text-slate-200 text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Notes & Terms agreed</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Provided ₹20,000 cash grant in exchange for standard silver logo placement on posters and 2-minute pitch slot before hackathon presentations."
                    rows={4}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-cyan-500/50 focus:outline-none text-slate-200 text-sm transition-all resize-none"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Keep details granular to help future recruiters pitch to them again.</p>
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
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white transition-all text-sm font-semibold shadow-lg shadow-cyan-950/20"
                  >
                    Lock Sponsor File
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. SPONSORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredSponsors.map((sponsor, index) => (
            <motion.div
              key={sponsor.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -15 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
              className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-cyan-500/20 p-5 backdrop-blur-sm hover:shadow-xl hover:shadow-cyan-950/5 transition-all duration-300 text-left"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  
                  {/* Delete trigger */}
                  <button
                    onClick={() => onDeleteSponsor(sponsor.id)}
                    title="Purge Sponsor Record"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-1">
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                    {sponsor.name}
                  </h3>
                  <div className="inline-flex items-center gap-1 text-cyan-400 font-extrabold text-lg">
                    <span>₹</span>
                    <span>{sponsor.amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4 pt-3.5 border-t border-slate-800">
                  <div className="flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-500 mt-1 flex-shrink-0" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {sponsor.notes}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tag footer */}
              <div className="mt-4 pt-3 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-cyan-500" /> Active Sponsor
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-850 border border-slate-800">Local Archive</span>
              </div>

            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredSponsors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-3">
          <Briefcase className="w-10 h-10 text-slate-700 animate-pulse" />
          <p className="text-sm">No recorded sponsors match your search query.</p>
        </div>
      )}

    </div>
  );
}
