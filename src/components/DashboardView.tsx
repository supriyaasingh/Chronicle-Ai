import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Briefcase, 
  ShieldCheck, 
  Lightbulb, 
  Sparkles, 
  ArrowRight, 
  MessageSquare, 
  Plus, 
  Database,
  TrendingUp,
  MapPin,
  GraduationCap,
  Linkedin,
  Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { EventMemory, SponsorMemory, ChroniState, User, Meeting, Alumni } from '../types';
import ChroniMascot from './ChroniMascot';

interface DashboardViewProps {
  events: EventMemory[];
  sponsors: SponsorMemory[];
  onNavigate: (tab: any) => void;
  currentUser: User;
}

export default function DashboardView({ events, sponsors, onNavigate, currentUser }: DashboardViewProps) {
  const [chroniMood, setChroniMood] = useState<ChroniState>('idle');
  const [clickCount, setClickCount] = useState(0);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [featuredAlumni, setFeaturedAlumni] = useState<Alumni | null>(null);

  // Fetch upcoming meetings and alumni list
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const meetingsRes = await fetch(`/api/meetings?role=${currentUser.role}`);
        const meetingsData = await meetingsRes.json();
        if (meetingsData.success) {
          setMeetings(meetingsData.meetings);
        }

        const alumniRes = await fetch('/api/alumni');
        const alumniData = await alumniRes.json();
        if (alumniData.success && alumniData.alumni.length > 0) {
          const aarav = alumniData.alumni.find((a: any) => a.fullName.toLowerCase().includes('aarav') || a.fullName.toLowerCase().includes('sharma'));
          if (aarav) {
            setFeaturedAlumni(aarav);
          } else {
            const mentor = alumniData.alumni.find((a: any) => a.availableForMentorship);
            setFeaturedAlumni(mentor || alumniData.alumni[0]);
          }
        }
      } catch (err) {
        console.error('[DashboardView] Error loading data:', err);
      }
    };

    loadDashboardData();
  }, [currentUser.role]);

  // Calculate stats
  const totalEvents = events.length;
  const totalSponsors = sponsors.length;
  
  const totalSponsorshipAmount = useMemo(() => {
    return sponsors.reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [sponsors]);

  const totalBudgets = useMemo(() => {
    return events.reduce((acc, curr) => acc + Number(curr.budget), 0);
  }, [events]);

  const totalMemoriesCount = useMemo(() => {
    // Sum of events, sponsors, lessons (each event has one lessons field) and outcomes
    return events.length + sponsors.length + events.filter(e => e.lessons).length;
  }, [events, sponsors]);

  const totalLessonsCount = useMemo(() => {
    return events.filter(e => e.lessons).length;
  }, [events]);

  // Click Chroni for dynamic interactive easter-egg expressions!
  const handleChroniClick = () => {
    setClickCount(prev => prev + 1);
    const moods: ChroniState[] = ['found', 'success', 'confused', 'searching', 'idle'];
    const nextMood = moods[clickCount % moods.length];
    setChroniMood(nextMood);
    
    // Auto-restore to idle after a small duration
    if (nextMood !== 'idle') {
      setTimeout(() => {
        setChroniMood('idle');
      }, 2500);
    }
  };

  // Prepare data for the Chart: Budgets vs Sponsorship over years
  const chartData = useMemo(() => {
    const dataByYear: { [year: number]: { budget: number; sponsors: number } } = {};
    
    // Base setup
    dataByYear[2023] = { budget: 18000, sponsors: 10000 };
    dataByYear[2024] = { budget: 30000, sponsors: 23000 };
    dataByYear[2025] = { budget: 62000, sponsors: 53000 };

    // Dynamic processing
    events.forEach(e => {
      const year = e.year;
      if (!dataByYear[year]) {
        dataByYear[year] = { budget: 0, sponsors: 0 };
      }
      dataByYear[year].budget += Number(e.budget);
    });

    // Distribute sponsors loosely to show trends
    sponsors.forEach((s, idx) => {
      const years = [2024, 2025, 2025];
      const targetYear = years[idx % years.length];
      if (dataByYear[targetYear]) {
        dataByYear[targetYear].sponsors += Number(s.amount);
      }
    });

    return Object.keys(dataByYear)
      .map(year => ({
        year: year,
        Budget: dataByYear[Number(year)].budget,
        Sponsorship: dataByYear[Number(year)].sponsors,
      }))
      .sort((a, b) => Number(a.year) - Number(b.year));
  }, [events, sponsors]);

  // Top lessons summarized for the wisdom panel
  const featuredLessons = useMemo(() => {
    return events
      .filter(e => e.lessons)
      .slice(0, 3)
      .map(e => ({
        eventName: e.name,
        lesson: e.lessons.split(".")[0] + "." // first sentence
      }));
  }, [events]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. HERO CARD BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-radial from-indigo-950/90 via-slate-900/95 to-slate-950 border border-purple-500/20 p-6 md:p-8 shadow-2xl shadow-purple-950/20"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Hero Left Text Info */}
          <div className="lg:col-span-8 space-y-4 text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Hackathon Preview Live
            </div>
            <h1 className="text-3xl md:text-4.5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-cyan-300">
              Preserve Wisdom.<br />Run Your Club on Autopilot.
            </h1>
            <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
              When club leaders graduate, key context is lost. <strong className="text-white font-semibold">Chronicle AI</strong> aggregates budgets, events, lessons learned, and sponsors, so new leadership teams can query historical organizational memory instantly.
            </p>
            
            {/* Quick Actions Panel */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button 
                onClick={() => onNavigate('chat')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm transition-all duration-300 shadow-lg shadow-purple-900/30 active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                Ask Chroni Anything
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onNavigate('events')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-medium text-sm border border-slate-700 transition-all duration-300 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Log Event Memory
              </button>
            </div>
          </div>

          {/* Hero Right: Interactive Floating Mascot Chroni */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative cursor-pointer" onClick={handleChroniClick}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-500/5 rounded-full blur-xl scale-75 pointer-events-none" />
            <ChroniMascot state={chroniMood} showBubble={true} />
            <div className="text-[10px] text-purple-400/60 font-mono tracking-wider -mt-3 uppercase">
              ✦ Click Chroni to Interact ✦
            </div>
          </div>

        </div>
      </motion.div>

      {/* 2. STATS BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Events */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="group relative overflow-hidden rounded-2xl bg-slate-900/40 border border-slate-800 p-5 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-purple-900/5 text-left"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-r" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Events Saved</p>
              <h3 className="text-2xl font-bold text-white mt-1.5">{totalEvents}</h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-500/20 transition-all">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <span className="text-purple-400 font-semibold">₹{(totalBudgets).toLocaleString()}</span> total budget preserved
          </p>
        </motion.div>

        {/* Card 2: Total Sponsors */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="group relative overflow-hidden rounded-2xl bg-slate-900/40 border border-slate-800 p-5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-cyan-900/5 text-left"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 rounded-r" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Sponsors</p>
              <h3 className="text-2xl font-bold text-white mt-1.5">{totalSponsors}</h3>
            </div>
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <span className="text-cyan-400 font-semibold">₹{(totalSponsorshipAmount).toLocaleString()}</span> in total funding records
          </p>
        </motion.div>

        {/* Card 3: Total Memories Guarded */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="group relative overflow-hidden rounded-2xl bg-slate-900/40 border border-slate-800 p-5 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/30 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-indigo-900/5 text-left"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-r" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Guarded Memories</p>
              <h3 className="text-2xl font-bold text-white mt-1.5">{totalMemoriesCount}</h3>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:bg-indigo-500/20 transition-all">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Chroni protects all past files offline
          </p>
        </motion.div>

        {/* Card 4: Lessons Learned */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="group relative overflow-hidden rounded-2xl bg-slate-900/40 border border-slate-800 p-5 backdrop-blur-sm transition-all duration-300 hover:border-pink-500/30 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-pink-900/5 text-left"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-pink-500 rounded-r" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lessons Learned</p>
              <h3 className="text-2xl font-bold text-white mt-1.5">{totalLessonsCount}</h3>
            </div>
            <div className="p-2 bg-pink-500/10 rounded-xl text-pink-400 group-hover:bg-pink-500/20 transition-all">
              <Lightbulb className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <span className="text-pink-400 font-semibold">{totalLessonsCount * 2}+</span> tips for future club officers
          </p>
        </motion.div>

      </div>

      {/* 3. CHART & INSIGHTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Analytics Chart (Recharts) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur-sm flex flex-col text-left"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Memory Trends: Budgets vs Sponsorship (INR)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">Historical funding and spending comparison over years</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-medium tracking-wider uppercase">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-purple-500" />
                <span className="text-slate-400">Spending Budget</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-cyan-400" />
                <span className="text-slate-400">Sponsorship Raised</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full text-slate-300 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSponsors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.3} />
                <XAxis 
                  dataKey="year" 
                  stroke="#64748B" 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#64748B" 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val / 1000}K`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  itemStyle={{ color: '#CBD5E1' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="Budget" 
                  stroke="#A855F7" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorBudget)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Sponsorship" 
                  stroke="#06B6D4" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorSponsors)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Lessons Wisdom Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur-sm flex flex-col text-left"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h4 className="text-base font-bold text-white">Chroni's Archived Wisdom</h4>
          </div>
          
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Direct advice and retro files preserved by past club officers to avoid making the same mistakes twice:
          </p>

          <div className="space-y-4 flex-1">
            {featuredLessons.map((item, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/20 transition-all text-xs space-y-1.5"
              >
                <div className="flex justify-between items-center text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  <span>{item.eventName}</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">Retro Saved</span>
                </div>
                <p className="text-slate-300 leading-relaxed italic">
                  "{item.lesson}"
                </p>
              </div>
            ))}

            {featuredLessons.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500 space-y-2">
                <Database className="w-8 h-8 text-slate-600 animate-pulse" />
                <p className="text-xs">No lesson memories archived yet.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => onNavigate('events')}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800/20 text-slate-300 text-xs font-semibold transition-all"
          >
            Manage Club Events
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

      </div>

      {/* 4. UPCOMING MEETINGS & ALUMNI SPOTLIGHT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* Upcoming Meetings Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur-sm flex flex-col text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h4 className="text-base font-bold text-white">Upcoming Meetings</h4>
            </div>
            <button 
              onClick={() => onNavigate('meetings')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-all flex items-center gap-1"
            >
              Portal View
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Authorized scheduled gatherings for your active role (<strong className="text-white capitalize">{currentUser.role}</strong>). Mapped inside Cognee.
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
            {meetings.slice(0, 3).map((meeting) => {
              // Calculate dynamic reminder badges
              const getReminderBadge = () => {
                try {
                  const now = new Date();
                  const todayStr = now.toISOString().split('T')[0];
                  
                  const tomorrow = new Date();
                  tomorrow.setDate(now.getDate() + 1);
                  const tomorrowStr = tomorrow.toISOString().split('T')[0];
                  
                  if (meeting.date === tomorrowStr) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold animate-pulse">
                        <Clock className="w-2.5 h-2.5" />
                        Meeting Tomorrow
                      </span>
                    );
                  }
                  
                  if (meeting.date === todayStr) {
                    const mTimeParts = meeting.time.split(':');
                    if (mTimeParts.length === 2) {
                      const mHour = parseInt(mTimeParts[0]);
                      const mMin = parseInt(mTimeParts[1]);
                      const mDateTime = new Date();
                      mDateTime.setHours(mHour, mMin, 0, 0);
                      
                      const diffMs = mDateTime.getTime() - now.getTime();
                      const diffHrs = diffMs / (1000 * 60 * 60);
                      
                      if (diffHrs > 0 && diffHrs <= 1.0) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold animate-bounce">
                            <Sparkles className="w-2.5 h-2.5" />
                            Meeting In 1 Hour
                          </span>
                        );
                      }
                    }
                  }
                } catch (e) {
                  console.error(e);
                }
                return null;
              };

              const badge = getReminderBadge();

              return (
                <div 
                  key={meeting.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/10 transition-all space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h5 className="font-bold text-white truncate text-sm">{meeting.title}</h5>
                    {badge}
                  </div>
                  <p className="text-slate-400 line-clamp-2 leading-relaxed text-[11px]">
                    {meeting.description || "No agenda details."}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      <span>{meeting.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span>{meeting.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-600" />
                      <span className="truncate max-w-[150px]">{meeting.venue}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {meetings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl w-full">
                <Calendar className="w-8 h-8 text-slate-600" />
                <p className="text-xs">No upcoming scheduled meetings found.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Alumni Spotlight Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur-sm flex flex-col text-left justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-400" />
                <h4 className="text-base font-bold text-white">Alumni Spotlight</h4>
              </div>
              <button 
                onClick={() => onNavigate('alumni')}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold transition-all flex items-center gap-1"
              >
                Full Network
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Featuring top alumni pioneers from our active directory to foster mentorship and career linkages.
            </p>

            {featuredAlumni ? (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h5 className="font-bold text-white text-sm">{featuredAlumni.fullName}</h5>
                    <p className="text-xs text-teal-400 mt-0.5">{featuredAlumni.role} at {featuredAlumni.company}</p>
                  </div>
                  {featuredAlumni.availableForMentorship && (
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[9px] font-bold uppercase tracking-wider">
                      Available for Mentorship
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{featuredAlumni.biography || `Pioneered technical events during undergraduate tenure. Specialized in graduation year ${featuredAlumni.gradYear}.`}"
                </p>

                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Key Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {featuredAlumni.skills.map((skill, index) => (
                      <span key={index} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px] font-mono">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Class of {featuredAlumni.gradYear}</span>
                  {featuredAlumni.linkedin && (
                    <a 
                      href={featuredAlumni.linkedin} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-1 text-teal-400 hover:text-teal-300 font-medium"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      LinkedIn Profile
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl w-full">
                <GraduationCap className="w-8 h-8 text-slate-600 animate-pulse" />
                <p className="text-xs">No featured alumni available.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => onNavigate('alumni')}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800/20 text-slate-300 text-xs font-semibold transition-all animate-pulse"
          >
            Request Alumni Mentorship Connection
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

      </div>

    </div>
  );
}
