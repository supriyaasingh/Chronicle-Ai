import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Briefcase, 
  MessageSquare, 
  ShieldAlert, 
  ShieldCheck,
  HelpCircle,
  Database,
  Sparkles,
  ChevronRight,
  LogOut,
  Settings,
  Clock,
  Users,
  GraduationCap,
  Award,
  Calendar
} from 'lucide-react';

import { EventMemory, SponsorMemory, User, ChroniState } from './types';
import { getStoredMemories, saveStoredMemories } from './data';

// Import Views
import DashboardView from './components/DashboardView';
import EventsView from './components/EventsView';
import SponsorsView from './components/SponsorsView';
import ChatView from './components/ChatView';
import TimelineView from './components/TimelineView';
import HandoverView from './components/HandoverView';
import AuthView from './components/AuthView';
import AdminView from './components/AdminView';
import ChroniMascot from './components/ChroniMascot';
import AlumniNetworkView from './components/AlumniNetworkView';
import CertificatesView from './components/CertificatesView';
import MeetingsView from './components/MeetingsView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'sponsors' | 'timeline' | 'handover' | 'chat' | 'admin' | 'alumni' | 'certificates' | 'meetings'>('dashboard');
  const [demoMode, setDemoMode] = useState<boolean>(() => localStorage.getItem('demo_mode') !== 'false');

  const isChatView = activeTab === 'chat';

  useEffect(() => {
    const checkDemoMode = () => {
      setDemoMode(localStorage.getItem('demo_mode') !== 'false');
    };
    window.addEventListener('storage', checkDemoMode);
    return () => window.removeEventListener('storage', checkDemoMode);
  }, []);
  
  // Memories States
  const [events, setEvents] = useState<EventMemory[]>([]);
  const [sponsors, setSponsors] = useState<SponsorMemory[]>([]);
  const [clubName, setClubName] = useState('Sigma Developer Alliance');

  // Chroni Global State for Sidebar/Interactions
  const [globalChroniState, setGlobalChroniState] = useState<ChroniState>('idle');
  const [globalChroniBubble, setGlobalChroniBubble] = useState<string>('');

  const triggerChroniReaction = (state: ChroniState, message: string) => {
    setGlobalChroniState(state);
    setGlobalChroniBubble(message);
    setTimeout(() => {
      setGlobalChroniState('idle');
    }, 4500);
  };

  // Load user session and memories on mount
  useEffect(() => {
    // 1. Session check
    const storedUser = localStorage.getItem('chronicle_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Stale session discarded:', e);
      }
    }

    // 2. Memory list check
    const data = getStoredMemories();
    setEvents(data.events);
    setSponsors(data.sponsors);
    
    // Initial Sync to Cognee backend MemoryService
    fetch('/api/memory/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: data.events, sponsors: data.sponsors })
    })
    .then(r => r.json())
    .then(res => console.log('[Cognee Sync] Synced on mount successfully.', res))
    .catch(err => console.error('[Cognee Sync] Failed to sync on mount:', err));
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('chronicle_user', JSON.stringify(user));
    setActiveTab('dashboard');
    triggerChroniReaction('success', `Welcome back, ${user.fullName}! Session successfully authorized.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('chronicle_user');
    setActiveTab('dashboard');
  };

  const handleSwitchRole = (newRole: 'president' | 'secretary' | 'member' | 'applicant') => {
    if (!currentUser) return;
    
    let fullName = currentUser.fullName;
    let email = currentUser.email;

    if (newRole === 'president') {
      fullName = 'Aarav Sharma (President)';
      email = 'president@club.com';
    } else if (newRole === 'secretary') {
      fullName = 'Ananya Iyer (Secretary)';
      email = 'secretary@club.com';
    } else if (newRole === 'member') {
      fullName = 'Vikram Malhotra (Member)';
      email = 'member@club.com';
    } else if (newRole === 'applicant') {
      fullName = 'Rohit Verma';
      email = 'applicant@test.com';
    }

    const updatedUser: User = {
      ...currentUser,
      fullName,
      email,
      role: newRole,
      status: newRole === 'applicant' ? 'pending' : 'approved'
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('chronicle_user', JSON.stringify(updatedUser));
    
    // Reset to dashboard to avoid showing permission-locked screens
    setActiveTab('dashboard');
    
    triggerChroniReaction('success', `MVP Role Swapped! Switched viewing permissions to ${newRole.toUpperCase()}.`);
  };

  // Sync added/deleted events to state, localStorage, and Cognee
  const handleAddEvent = (newEvent: Omit<EventMemory, 'id'>) => {
    const eventRecord: EventMemory = {
      ...newEvent,
      id: `e-custom-${Date.now()}`
    };
    const updated = [eventRecord, ...events];
    setEvents(updated);
    saveStoredMemories({ events: updated });
    triggerChroniReaction('success', `New event logged! Adding "${newEvent.name}" memory to our Cognee knowledge graph.`);

    // Sync to Cognee backend MemoryService
    fetch('/api/memory/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: updated, sponsors })
    })
    .catch(err => console.error('[Cognee Sync] Failed to sync added event:', err));
  };

  const handleDeleteEvent = (id: string) => {
    const eventToDelete = events.find(e => e.id === id);
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveStoredMemories({ events: updated });
    triggerChroniReaction('searching', `Erasing memories and links associated with "${eventToDelete?.name || 'event'}"...`);

    // Sync to Cognee backend MemoryService
    fetch('/api/memory/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: updated, sponsors })
    })
    .catch(err => console.error('[Cognee Sync] Failed to sync deleted event:', err));
  };

  // Sync added/deleted sponsors to state, localStorage, and Cognee
  const handleAddSponsor = (newSponsor: Omit<SponsorMemory, 'id'>) => {
    const sponsorRecord: SponsorMemory = {
      ...newSponsor,
      id: `s-custom-${Date.now()}`
    };
    const updated = [sponsorRecord, ...sponsors];
    setSponsors(updated);
    saveStoredMemories({ sponsors: updated });
    triggerChroniReaction('success', `Sponsorship of ₹${newSponsor.amount} logged! Updating active ledger references in Cognee.`);

    // Sync to Cognee backend MemoryService
    fetch('/api/memory/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events, sponsors: updated })
    })
    .catch(err => console.error('[Cognee Sync] Failed to sync added sponsor:', err));
  };

  const handleDeleteSponsor = (id: string) => {
    const sponsorToDelete = sponsors.find(s => s.id === id);
    const updated = sponsors.filter(s => s.id !== id);
    setSponsors(updated);
    saveStoredMemories({ sponsors: updated });
    triggerChroniReaction('searching', `Archiving and disconnecting sponsor reference for ${sponsorToDelete?.name || 'sponsor'}...`);

    // Sync to Cognee backend MemoryService
    fetch('/api/memory/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events, sponsors: updated })
    })
    .catch(err => console.error('[Cognee Sync] Failed to sync deleted sponsor:', err));
  };

  // Render view depending on tab and check role permissions
  const renderActiveView = () => {
    if (!currentUser) {
      return <AuthView onLoginSuccess={handleLoginSuccess} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView events={events} sponsors={sponsors} onNavigate={(tab) => setActiveTab(tab as any)} currentUser={currentUser} />;
      case 'events':
        return <EventsView events={events} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} />;
      case 'sponsors':
        // President only
        if (currentUser.role !== 'president') {
          setActiveTab('dashboard');
          return <DashboardView events={events} sponsors={sponsors} onNavigate={(tab) => setActiveTab(tab as any)} currentUser={currentUser} />;
        }
        return <SponsorsView sponsors={sponsors} onAddSponsor={handleAddSponsor} onDeleteSponsor={handleDeleteSponsor} />;
      case 'timeline':
        return <TimelineView events={events} sponsors={sponsors} />;
      case 'handover':
        // President and Secretary only
        if (currentUser.role !== 'president' && currentUser.role !== 'secretary') {
          setActiveTab('dashboard');
          return <DashboardView events={events} sponsors={sponsors} onNavigate={(tab) => setActiveTab(tab as any)} currentUser={currentUser} />;
        }
        return <HandoverView events={events} sponsors={sponsors} />;
      case 'chat':
        return <ChatView events={events} sponsors={sponsors} />;
      case 'admin':
        // President and Secretary only
        if (currentUser.role !== 'president' && currentUser.role !== 'secretary') {
          setActiveTab('dashboard');
          return <DashboardView events={events} sponsors={sponsors} onNavigate={(tab) => setActiveTab(tab as any)} currentUser={currentUser} />;
        }
        return <AdminView currentUser={currentUser} onChroniReact={triggerChroniReaction} />;
      case 'alumni':
        return <AlumniNetworkView currentUser={currentUser} onChroniReact={triggerChroniReaction} />;
      case 'certificates':
        return <CertificatesView currentUser={currentUser} />;
      case 'meetings':
        return <MeetingsView currentUser={currentUser} onChroniReact={triggerChroniReaction} />;
      default:
        return <DashboardView events={events} sponsors={sponsors} onNavigate={(tab) => setActiveTab(tab as any)} currentUser={currentUser} />;
    }
  };

  // Dynamic Sidebar items based on role
  const getMenuItems = () => {
    if (!currentUser) return [];

    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-purple-400' },
      { id: 'events', label: 'Event Memories', icon: BookOpen, color: 'text-purple-400' },
    ];

    baseItems.push({ id: 'meetings', label: 'Meetings Portal', icon: Calendar, color: 'text-indigo-400' });
    baseItems.push({ id: 'alumni', label: 'Alumni Network', icon: GraduationCap, color: 'text-teal-400' });
    baseItems.push({ id: 'certificates', label: 'Certificates', icon: Award, color: 'text-violet-400' });

    if (currentUser.role === 'president') {
      baseItems.push({ id: 'sponsors', label: 'Sponsorship Files', icon: Briefcase, color: 'text-cyan-400' });
    }

    baseItems.push({ id: 'timeline', label: 'Memory Timeline', icon: Clock, color: 'text-amber-400' });

    if (currentUser.role === 'president' || currentUser.role === 'secretary') {
      baseItems.push({ id: 'handover', label: 'Handover Mode', icon: ShieldCheck, color: 'text-emerald-400' });
    }

    baseItems.push({ id: 'chat', label: 'Ask Chroni (AI)', icon: MessageSquare, color: 'text-indigo-400' });

    if (currentUser.role === 'president' || currentUser.role === 'secretary') {
      baseItems.push({ id: 'admin', label: 'Administration', icon: Users, color: 'text-rose-400' });
    }

    return baseItems;
  };

  // Unauthenticated Layout
  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  // Pending applicant layout
  if (currentUser.role === 'applicant') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        {/* Ambient background blur */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.2px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="w-full max-w-md z-10 space-y-6 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 items-center justify-center animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">Application Pending</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest text-purple-400">
              Candidate: {currentUser.fullName}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl text-left space-y-4 shadow-xl">
            <p className="text-xs text-slate-300 leading-relaxed">
              Thank you for applying to the Rotaract Club. Your profile is currently placed in the verification queue.
            </p>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-1.5 text-xs text-slate-400 font-mono">
              <div>College: {currentUser.college}</div>
              <div>Department: {currentUser.department} ({currentUser.year})</div>
              <div>Phone: {currentUser.phoneNumber}</div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              "Once approved by the Club President or Secretary, you will receive full Member access authorization."
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
          >
            Sign Out / Cancel Access
          </button>
        </div>
      </div>
    );
  }

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans overflow-x-hidden antialiased selection:bg-purple-600/30">
      
      {/* Background Gradients and Stars */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[130px] opacity-45" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.2px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      {/* Main Wrapper Layout */}
      <div className="flex flex-col md:flex-row w-full min-h-screen z-10">

        {/* ================== LEFT SIDEBAR ================== */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between p-5 md:fixed md:h-screen z-40">
          
          <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-1">
            
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group relative cursor-pointer ${
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

          {/* Sidebar Footer with Profile & Logout */}
          <div className="pt-4 border-t border-slate-900 mt-6 md:mt-0 space-y-4 text-left bg-slate-950/80">
            
            {/* Real-time reactive Chroni mascot sidebar panel */}
            <AnimatePresence>
              {!isChatView && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-slate-900/30 border border-slate-850 p-2.5 rounded-xl flex items-center gap-2.5"
                >
                  <div className="w-12 h-12 shrink-0">
                    <ChroniMascot state={globalChroniState} showBubble={false} />
                  </div>
                  <div className="text-[10px] min-w-0 flex-1 leading-snug">
                    <span className="font-extrabold text-purple-400 uppercase tracking-widest block text-[9px]">Chroni Feed</span>
                    <p className="text-slate-400 truncate mt-0.5">
                      {globalChroniBubble || "Awaiting commands..."}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between gap-2.5 px-1.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8.5 h-8.5 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-sm font-bold text-purple-300 shrink-0">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="text-xs min-w-0">
                  <span className="font-bold text-slate-200 block truncate">{currentUser.fullName}</span>
                  <span className="text-[10px] text-slate-500 font-mono capitalize block">{currentUser.role}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log Out of Session"
                className="p-1.5 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="text-[9px] text-slate-600 pl-2">
              Chronicle OS v2.0 • Authorized Space
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

            {/* Quick Status Bar & MVP Role Switcher */}
            <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
              
              {/* Demo Mode Toggle */}
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-slate-400 font-bold font-mono text-[10px] uppercase tracking-wider">Demo Mode:</span>
                <button 
                  type="button"
                  onClick={() => {
                    const nextVal = !demoMode;
                    setDemoMode(nextVal);
                    localStorage.setItem('demo_mode', String(nextVal));
                    window.dispatchEvent(new Event('storage'));
                  }}
                  className={`w-7 h-4 rounded-full p-0.5 transition-all duration-200 cursor-pointer ${demoMode ? 'bg-purple-600' : 'bg-slate-700'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-all duration-200 ${demoMode ? 'translate-x-3' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* MVP Testing Role Selector */}
              {demoMode && (
                <div className="flex items-center gap-1.5 bg-purple-950/40 border border-purple-500/30 px-2.5 py-1 rounded-lg text-xs">
                  <span className="text-purple-400 font-bold uppercase tracking-widest text-[9px] font-mono">MVP Role:</span>
                  <select
                    value={currentUser.role}
                    onChange={(e) => handleSwitchRole(e.target.value as any)}
                    className="bg-slate-950 text-white border-none focus:ring-0 cursor-pointer font-bold font-mono text-[11px] py-0.5 px-1 uppercase outline-none rounded"
                  >
                    <option value="president" className="bg-slate-950 text-slate-100">President</option>
                    <option value="secretary" className="bg-slate-950 text-slate-100">Secretary</option>
                    <option value="member" className="bg-slate-950 text-slate-100">Member</option>
                    <option value="applicant" className="bg-slate-950 text-slate-100">Applicant</option>
                  </select>
                </div>
              )}

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

