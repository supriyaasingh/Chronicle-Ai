import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Briefcase, 
  MessageSquare, 
  ShieldAlert, 
  HelpCircle,
  Database,
  Sparkles,
  ChevronRight,
  LogOut,
  Settings
} from 'lucide-react';

import { EventMemory, SponsorMemory } from './types';
import { getStoredMemories, saveStoredMemories } from './data';

// Import Views
import DashboardView from './components/DashboardView';
import EventsView from './components/EventsView';
import SponsorsView from './components/SponsorsView';
import ChatView from './components/ChatView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'sponsors' | 'chat'>('dashboard');
  
  // Memories States
  const [events, setEvents] = useState<EventMemory[]>([]);
  const [sponsors, setSponsors] = useState<SponsorMemory[]>([]);
  const [clubName, setClubName] = useState('Sigma Developer Alliance');

  // Load memories on mount
  useEffect(() => {
    const data = getStoredMemories();
    setEvents(data.events);
    setSponsors(data.sponsors);
  }, []);

  // Sync added/deleted events to state and localStorage
  const handleAddEvent = (newEvent: Omit<EventMemory, 'id'>) => {
    const eventRecord: EventMemory = {
      ...newEvent,
      id: `e-custom-${Date.now()}`
    };
    const updated = [eventRecord, ...events];
    setEvents(updated);
    saveStoredMemories({ events: updated });
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveStoredMemories({ events: updated });
  };

  // Sync added/deleted sponsors to state and localStorage
  const handleAddSponsor = (newSponsor: Omit<SponsorMemory, 'id'>) => {
    const sponsorRecord: SponsorMemory = {
      ...newSponsor,
      id: `s-custom-${Date.now()}`
    };
    const updated = [sponsorRecord, ...sponsors];
    setSponsors(updated);
    saveStoredMemories({ sponsors: updated });
  };

  const handleDeleteSponsor = (id: string) => {
    const updated = sponsors.filter(s => s.id !== id);
    setSponsors(updated);
    saveStoredMemories({ sponsors: updated });
  };

  // Render view depending on tab
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView events={events} sponsors={sponsors} onNavigate={setActiveTab} />;
      case 'events':
        return <EventsView events={events} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} />;
      case 'sponsors':
        return <SponsorsView sponsors={sponsors} onAddSponsor={handleAddSponsor} onDeleteSponsor={handleDeleteSponsor} />;
      case 'chat':
        return <ChatView events={events} sponsors={sponsors} />;
      default:
        return <DashboardView events={events} sponsors={sponsors} onNavigate={setActiveTab} />;
    }
  };

  // Sidebar items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-purple-400' },
    { id: 'events', label: 'Event Memories', icon: BookOpen, color: 'text-purple-400' },
    { id: 'sponsors', label: 'Sponsorship Files', icon: Briefcase, color: 'text-cyan-400' },
    { id: 'chat', label: 'Ask Chroni (AI)', icon: MessageSquare, color: 'text-indigo-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans overflow-x-hidden antialiased selection:bg-purple-600/30">
      
      {/* Background Gradients and Stars */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[130px] opacity-45" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.2px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      {/* Main Wrapper Layout */}
      <div className="flex flex-col md:flex-row w-full min-h-screen z-10">

        {/* ================== LEFT SIDEBAR ================== */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between p-5 md:fixed md:h-screen z-40">
          
          <div className="space-y-6">
            
            {/* Header / Logo */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-900">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/20">
                <Database className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-lg text-white leading-none block tracking-tight">
                  Chronicle <span className="text-purple-400">AI</span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">The Memory OS</span>
              </div>
            </div>

            {/* Club Identity Panel */}
            <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-xl text-left space-y-1 hover:border-purple-500/20 transition-all">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Active Directory</span>
              <input 
                type="text" 
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Club Name"
                className="w-full bg-transparent border-none text-xs text-white focus:outline-none focus:ring-0 font-bold placeholder-slate-600"
              />
              <div className="flex items-center gap-1.5 pt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-500 font-mono">Synchronized Local</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1.5 text-left">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block pl-1.5 mb-2.5">Navigation</span>
              
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group relative ${
                      isActive 
                        ? 'bg-purple-600/10 border border-purple-500/35 text-white' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/30 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-300'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>

          </div>

          {/* Sidebar Footer */}
          <div className="pt-6 border-t border-slate-900 mt-6 md:mt-0 space-y-3.5 text-left">
            <div className="flex items-center gap-3.5 px-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-sm">
                ⚙️
              </div>
              <div className="text-xs">
                <span className="font-semibold text-slate-300 block">Club Admin Shell</span>
                <span className="text-[10px] text-slate-500">v1.2.0 (Stable)</span>
              </div>
            </div>
            
            <div className="text-[10px] text-slate-600 pl-2 leading-relaxed">
              Preserved by Chroni 👻<br />
              All rights reserved.
            </div>
          </div>

        </aside>

        {/* ================== MAIN CONTENT BODY ================== */}
        <main className="flex-1 flex flex-col md:pl-64 min-h-screen">
          
          {/* Global Header */}
          <header className="px-6 py-4.5 border-b border-slate-900 bg-slate-950/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 z-30 text-left">
            <div>
              <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest">
                Delta Core Operating Terminal
              </span>
              <h2 className="text-lg font-extrabold text-white mt-0.5">
                {clubName} Memory Bank
              </h2>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              <div className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2 text-xs text-slate-300 font-mono">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>Chroni: Guarding Offline</span>
              </div>
            </div>
          </header>

          {/* Tab Content Display */}
          <section className="flex-1 p-6 z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </section>

        </main>

      </div>
    </div>
  );
}
