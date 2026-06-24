import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Info, 
  CheckCircle, 
  AlertCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { User as UserType } from '../types';

interface AuthViewProps {
  onLoginSuccess: (user: UserType) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [registrationOpen, setRegistrationOpen] = useState<boolean>(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('1st Year');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [motivation, setMotivation] = useState('');
  const [demoMode, setDemoMode] = useState<boolean>(() => localStorage.getItem('demo_mode') !== 'false');
  const [regRole, setRegRole] = useState<'applicant' | 'president' | 'secretary' | 'member'>('applicant');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch registration status
  useEffect(() => {
    fetch('/api/president/registration-status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRegistrationOpen(data.registrationOpen);
        }
      })
      .catch(err => console.error('Failed to get registration status:', err));
  }, [mode]);

  const handleQuickLogin = async (demoEmail: string, demoPassword: string) => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }
      setSuccessMessage(`Logged in successfully as ${demoEmail.split('@')[0].toUpperCase()}!`);
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }
      setSuccessMessage('Logged in successfully!');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const isOfficerReg = demoMode && regRole !== 'applicant';
    const endpoint = isOfficerReg ? '/api/auth/register-officer' : '/api/auth/register';
    const payload = isOfficerReg 
      ? { fullName, email, password, college, department, year, phoneNumber, role: regRole }
      : { fullName, email, password, college, department, year, phoneNumber, motivation };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      
      if (isOfficerReg) {
        setSuccessMessage(`Account created and approved instantly as a ${regRole.toUpperCase()}! You can now log in with these credentials.`);
      } else {
        setSuccessMessage('Registration submitted successfully! Your application is now pending President/Secretary approval.');
      }
      
      setMode('login');
      // Clear registration form
      setFullName('');
      setCollege('');
      setDepartment('');
      setPhoneNumber('');
      setMotivation('');
      setRegRole('applicant');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Reset failed.');
      }
      setSuccessMessage(data.message || 'Password reset simulated.');
      setTimeout(() => {
        setMode('login');
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative font-sans overflow-hidden">
      
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.2px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-900/30 items-center justify-center text-white mb-2">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Chronicle <span className="text-purple-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
            Rotaract Club Digital Memory OS
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-purple-950/20 text-left">
          
          {/* Demo Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800 rounded-xl mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs">⚙️</span>
              <span className="text-[10px] font-bold text-slate-300 font-mono uppercase tracking-wider">Demo Mode Enabled</span>
            </div>
            <button 
              type="button"
              onClick={() => {
                const nextVal = !demoMode;
                setDemoMode(nextVal);
                localStorage.setItem('demo_mode', String(nextVal));
                window.dispatchEvent(new Event('storage'));
              }}
              className={`w-9 h-5 rounded-full p-0.5 transition-all duration-200 cursor-pointer ${demoMode ? 'bg-purple-600' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all duration-200 ${demoMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
          
          {/* Status Message feedback banner */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3.5 bg-green-500/10 border border-green-500/30 text-green-300 text-xs rounded-xl flex items-start gap-2.5"
              >
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-400" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Welcome Back</h2>
                <p className="text-xs text-slate-400 mb-4">Enter credentials to synchronize with club memory.</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. president@club.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none transition-all placeholder-slate-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                    <button 
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[10px] font-bold text-purple-400 hover:text-purple-300 tracking-wider uppercase transition-all"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none transition-all placeholder-slate-600 font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-purple-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Initializing Interface...' : 'Authorize Terminal'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-4 border-t border-slate-950">
                <span className="text-xs text-slate-500">New candidate? </span>
                {registrationOpen ? (
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-all underline decoration-purple-500/40 underline-offset-4"
                  >
                    Submit Rotaract Application
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-rose-400 select-none">
                    Registration Closed by President
                  </span>
                )}
              </div>
            </form>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Join Rotaract Club</h2>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-md">
                    Open
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 mb-3">Complete registration to become an official Rotaract candidate.</p>
              </div>

              {!registrationOpen ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
                  <p className="text-xs font-semibold text-rose-300">Registration is Closed</p>
                  <p className="text-[10px] text-slate-400">The Club President has closed the registration desk for this cycle. Please try again later or contact support.</p>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="mt-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-all underline block mx-auto"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  
                  {/* Demo Mode Role Selector */}
                  {demoMode && (
                    <div className="bg-purple-950/20 border border-purple-900/30 p-3 rounded-xl space-y-1.5">
                      <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block font-mono">Register As (Demo Mode):</label>
                      <select
                        value={regRole}
                        onChange={e => setRegRole(e.target.value as any)}
                        className="w-full bg-slate-950 border border-purple-800/40 focus:border-purple-500 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none transition-all font-medium"
                      >
                        <option value="applicant">Applicant (Requires Approval)</option>
                        <option value="president">President (Instant Approved)</option>
                        <option value="secretary">Secretary (Instant Approved)</option>
                        <option value="member">Active Member (Instant Approved)</option>
                      </select>
                      <p className="text-[9px] text-slate-500 italic leading-snug">
                        *Officer and Member accounts created in Demo Mode are auto-approved and granted instant access.
                      </p>
                    </div>
                  )}
                  
                  {/* Full Name */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Rahul Sen"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none transition-all placeholder-slate-600 font-medium"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e.g. rahul@example.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none transition-all placeholder-slate-600 font-medium"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none transition-all placeholder-slate-600 font-medium"
                      />
                    </div>
                  </div>

                  {/* College & Department */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">College</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                        <input 
                          type="text"
                          required
                          value={college}
                          onChange={e => setCollege(e.target.value)}
                          placeholder="e.g. IIT"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2 pl-8.5 pr-3 text-xs text-white focus:outline-none transition-all placeholder-slate-600 font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                        <input 
                          type="text"
                          required
                          value={department}
                          onChange={e => setDepartment(e.target.value)}
                          placeholder="e.g. CSE"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2 pl-8.5 pr-3 text-xs text-white focus:outline-none transition-all placeholder-slate-600 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Year & Phone Number */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Year</label>
                      <select
                        value={year}
                        onChange={e => setYear(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-all font-medium"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Alumni">Alumni</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                        <input 
                          type="text"
                          required
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value)}
                          placeholder="e.g. +91 999"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2 pl-8.5 pr-3 text-xs text-white focus:outline-none transition-all placeholder-slate-600 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Motivation Statement */}
                  {(!demoMode || regRole === 'applicant') && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Motivation Statement</label>
                      <textarea 
                        required={!demoMode || regRole === 'applicant'}
                        value={motivation}
                        onChange={e => setMotivation(e.target.value)}
                        placeholder="Why do you wish to join Rotaract club, and how can you add value?"
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500/50 rounded-xl p-3 text-xs text-white focus:outline-none transition-all placeholder-slate-600 font-medium resize-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-purple-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : (demoMode && regRole !== 'applicant' ? 'Register and Approve Account' : 'Submit Official Application')}
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-xs font-bold text-slate-400 hover:text-white transition-all underline underline-offset-4 decoration-slate-700"
                    >
                      Return to Access Desk
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* MODE: FORGOT / RESET */}
          {mode === 'forgot' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Recover Credentials</h2>
                <p className="text-xs text-slate-400 mb-4">Enter your registered email address to initiate simulation.</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. member@rotaract.org"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none transition-all placeholder-slate-600 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-purple-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Processing Simulation...' : 'Request Password Reset'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-bold text-slate-400 hover:text-white transition-all underline underline-offset-4 decoration-slate-700"
                >
                  Return to Access Desk
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Informative Help Panel / Demo Login Selection */}
        {demoMode && (
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl text-left space-y-3.5" id="demo-login-panel">
            <div className="flex items-center gap-1.5 text-purple-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">MVP Interactive Demo Access</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Skip typing credentials! Select one of the pre-configured official roles below for instant authenticated access:
            </p>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('president@club.com', 'password123')}
                className="flex items-center justify-between p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-300 transition-all cursor-pointer text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">👑</span>
                  <div>
                    <span className="block font-bold">President Console</span>
                    <span className="text-[9px] font-mono font-medium text-slate-400">president@club.com</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-200">Instant</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('secretary@club.com', 'password123')}
                className="flex items-center justify-between p-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-xs font-bold text-cyan-300 transition-all cursor-pointer text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">✍️</span>
                  <div>
                    <span className="block font-bold">Secretary Console</span>
                    <span className="text-[9px] font-mono font-medium text-slate-400">secretary@club.com</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30 text-cyan-200">Instant</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('member@club.com', 'password123')}
                className="flex items-center justify-between p-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-xs font-bold text-purple-300 transition-all cursor-pointer text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🌟</span>
                  <div>
                    <span className="block font-bold">Member Directory</span>
                    <span className="text-[9px] font-mono font-medium text-slate-400">member@club.com</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30 text-purple-200">Instant</span>
              </button>
            </div>
            
            <div className="text-[10px] text-slate-500 text-center leading-relaxed font-mono mt-2">
              *Demo passwords default to <span className="text-slate-400 font-bold">password123</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
