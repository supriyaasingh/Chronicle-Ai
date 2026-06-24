import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Linkedin, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Mail, 
  HelpCircle,
  Briefcase,
  Users,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import { Alumni, AlumniContactRequest, User, ChroniState } from '../types';

interface AlumniNetworkViewProps {
  currentUser: User;
  onChroniReact: (state: ChroniState, message: string) => void;
}

export default function AlumniNetworkView({ currentUser, onChroniReact }: AlumniNetworkViewProps) {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [requests, setRequests] = useState<AlumniContactRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMentorOnly, setFilterMentorOnly] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form / Admin states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState<Alumni | null>(null);
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState('');
  const [gradYear, setGradYear] = useState<number | ''>('');
  const [linkedin, setLinkedin] = useState('');
  const [biography, setBiography] = useState('');
  const [availableForMentorship, setAvailableForMentorship] = useState(true);

  // Filter view for administrators to manage requests
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);

  const isOrganizer = currentUser.role === 'president' || currentUser.role === 'secretary';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAlumni, resReqs] = await Promise.all([
        fetch('/api/alumni'),
        fetch('/api/alumni/requests')
      ]);
      const dataAlumni = await resAlumni.json();
      const dataReqs = await resReqs.json();

      if (dataAlumni.success) {
        setAlumni(dataAlumni.alumni || []);
      }
      if (dataReqs.success) {
        setRequests(dataReqs.requests || []);
      }
    } catch (err) {
      console.error('Failed to load alumni network:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingAlumni(null);
    setFullName('');
    setCompany('');
    setRole('');
    setSkills('');
    setGradYear('');
    setLinkedin('');
    setBiography('');
    setAvailableForMentorship(true);
    setShowAddModal(true);
  };

  const handleOpenEdit = (alum: Alumni) => {
    setEditingAlumni(alum);
    setFullName(alum.fullName);
    setCompany(alum.company);
    setRole(alum.role);
    setSkills(alum.skills.join(', '));
    setGradYear(alum.gradYear);
    setLinkedin(alum.linkedin);
    setBiography(alum.biography || '');
    setAvailableForMentorship(alum.availableForMentorship);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !company || !role || !gradYear || !linkedin) {
      alert('All required fields must be filled.');
      return;
    }

    const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      fullName,
      company,
      role,
      skills: skillsArray,
      gradYear: Number(gradYear),
      linkedin,
      biography,
      availableForMentorship
    };

    try {
      if (editingAlumni) {
        // Edit existing
        const res = await fetch(`/api/alumni/${editingAlumni.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          onChroniReact('success', `Alumni profile updated: ${fullName}`);
          fetchData();
          setShowAddModal(false);
        } else {
          alert(data.error || 'Failed to update profile.');
        }
      } else {
        // Create new
        const res = await fetch('/api/alumni', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          onChroniReact('success', `Alumni pioneer added to club memory: ${fullName}`);
          fetchData();
          setShowAddModal(false);
        } else {
          alert(data.error || 'Failed to add alumni.');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error connecting to database.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to remove ${name} from our sacred alumni directory?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/alumni/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        onChroniReact('confused', `Deleted ${name} from our archives.`);
        fetchData();
      } else {
        alert(data.error || 'Failed to remove alumni.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting alumni.');
    }
  };

  const handleRequestContact = async (alumniId: string, alumniName: string) => {
    setActionLoadingId(alumniId);
    onChroniReact('thinking' as any, `Submitting contact authorization request for ${alumniName}...`);
    try {
      const res = await fetch('/api/alumni/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumniId,
          requesterId: currentUser.id,
          requesterName: currentUser.fullName || currentUser.role.toUpperCase(),
          requesterEmail: currentUser.email || 'requester@club.com'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      onChroniReact('success', `Submitted! Contact request for ${alumniName} is now pending approval by the President/Secretary.`);
      await fetchData();
    } catch (err: any) {
      console.error('Request contact error:', err);
      onChroniReact('confused', err.message || 'Failed to request contact.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Approve or Reject requests
  const handleResolveRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/alumni/request/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status })
      });
      const data = await res.json();
      if (data.success) {
        onChroniReact('success', `Contact authorization request resolved as: ${status}`);
        fetchData();
      } else {
        alert(data.error || 'Failed to resolve request.');
      }
    } catch (err: any) {
      alert(err.message || 'Error resolving request.');
    }
  };

  // Get contact status for a specific alumni for the current user
  const getRequestStatusForAlumni = (alumniId: string) => {
    const req = requests.find(r => r.alumniId === alumniId && r.requesterId === currentUser.id);
    return req ? req.status : null;
  };

  // Filter criteria computation
  const companies = ['All', ...Array.from(new Set(alumni.map(a => a.company)))];
  const graduationYears = ['All', ...Array.from(new Set(alumni.map(a => String(a.gradYear))))];

  const filteredAlumni = alumni.filter(alum => {
    const matchesSearch = 
      alum.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alum.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alum.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alum.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMentor = !filterMentorOnly || alum.availableForMentorship;
    const matchesCompany = selectedCompany === 'All' || alum.company === selectedCompany;
    const matchesYear = selectedYear === 'All' || String(alum.gradYear) === selectedYear;

    return matchesSearch && matchesMentor && matchesCompany && matchesYear;
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6 text-left" id="alumni-directory-root">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900/80 to-indigo-950/20 border border-slate-800 p-6 rounded-2xl relative overflow-hidden" id="alumni-header-banner">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400">
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">Rotaract Alumni Network</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Alumni Directory</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Connect with experienced alumni working in leading global tech companies. Seek mentorship, project guidance, and network connections.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isOrganizer && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Alumni
              </button>
            )}

            <div className="bg-slate-950/80 border border-slate-800/80 px-4 py-3 rounded-xl flex items-center gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Network Strength</span>
                <span className="text-xs font-extrabold text-indigo-400 font-mono">
                  {alumni.length} Professionals Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Approvals Workspace */}
      {isOrganizer && requests.length > 0 && (
        <div className="border border-slate-800 rounded-2xl bg-slate-900/10 overflow-hidden">
          <button 
            onClick={() => setShowRequestsPanel(!showRequestsPanel)}
            className="w-full px-5 py-4 flex items-center justify-between text-xs bg-slate-900/30 hover:bg-slate-900/50 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-extrabold text-white uppercase tracking-wider">
                Mentorship & Contact Access Approvals Hub
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold text-[10px]">
                {pendingRequests.length} Pending Actions
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-all ${showRequestsPanel ? 'rotate-180' : ''}`} />
          </button>

          {showRequestsPanel && (
            <div className="p-5 border-t border-slate-800/50 space-y-3.5 bg-slate-950/20">
              {pendingRequests.map((req) => {
                const alumMatch = alumni.find(a => a.id === req.alumniId);
                return (
                  <div 
                    key={req.id} 
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="text-slate-300 font-semibold">
                        <strong className="text-indigo-400">{req.requesterName}</strong> is requesting contact for <strong className="text-white">{alumMatch?.fullName || 'Alumnus'}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Requester Email: {req.requesterEmail} | Status: {req.status}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolveRequest(req.id, 'approved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleResolveRequest(req.id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}

              {pendingRequests.length === 0 && (
                <div className="py-6 text-center text-slate-500 text-xs">
                  All incoming contact and mentorship authorization requests are resolved!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Control Panel: Search & Filters */}
      <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between" id="alumni-controls">
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by company, skill (e.g. React), or role..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none transition-all placeholder-slate-600 font-medium"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Company Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Company:</span>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer hover:border-slate-700 transition-all font-medium"
            >
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Graduation Year Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Grad Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer hover:border-slate-700 transition-all font-medium"
            >
              {graduationYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Mentorship Toggle */}
          <button
            onClick={() => setFilterMentorOnly(!filterMentorOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              filterMentorOnly 
                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Mentors Available
          </button>

        </div>

      </div>

      {/* Alumni Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Synchronizing alumni directory records...</p>
        </div>
      ) : filteredAlumni.length === 0 ? (
        <div className="bg-slate-900/15 border border-slate-900 rounded-2xl p-12 text-center space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <p className="text-xs text-slate-300 font-bold">No alumni match your criteria</p>
            <p className="text-[11px] text-slate-500">Try loosening your search term or filter parameters.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="alumni-directory-grid">
          {filteredAlumni.map((alum) => {
            const contactStatus = getRequestStatusForAlumni(alum.id);
            return (
              <div 
                key={alum.id} 
                className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/20 hover:bg-slate-900/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20" />
                
                <div className="space-y-4">
                  
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-white text-sm">{alum.fullName}</h3>
                        {isOrganizer && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(alum)}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-all"
                              title="Edit Alumni Profile"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(alum.id, alum.fullName)}
                              className="p-1 rounded bg-slate-800 text-rose-400 hover:bg-rose-500/10 transition-all"
                              title="Remove Alumni Profile"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-slate-400 text-xs mt-0.5">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold text-slate-300">{alum.role}</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-bold text-indigo-300">{alum.company}</span>
                      </div>
                    </div>
                  </div>

                  {/* Biography */}
                  {alum.biography && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">
                      "{alum.biography}"
                    </p>
                  )}

                  {/* Skills Badges */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block font-mono">Expertise Areas:</span>
                    <div className="flex flex-wrap gap-1">
                      {alum.skills.map(skill => (
                        <span 
                          key={skill} 
                          className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-850 text-[10px] rounded font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Graduation Metadata */}
                  <div className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-xl border border-slate-900 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                      <span>Class of {alum.gradYear}</span>
                    </div>
                    <span className="text-slate-800">|</span>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${alum.availableForMentorship ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                      <span>{alum.availableForMentorship ? 'Mentoring Slots' : 'No slots'}</span>
                    </div>
                  </div>

                </div>

                {/* Request Access / Action Section */}
                <div className="border-t border-slate-850/50 pt-4 mt-4 flex items-center justify-between gap-3">
                  <a 
                    href={alum.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-950 border border-slate-850 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>

                  <div className="flex-1">
                    {contactStatus === 'pending' ? (
                      <div className="w-full flex items-center justify-center gap-1.5 py-2 bg-amber-500/5 border border-amber-500/20 text-amber-300 rounded-xl text-[10px] font-extrabold uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 animate-spin" /> Pending Approval
                      </div>
                    ) : contactStatus === 'approved' ? (
                      <div className="w-full space-y-1.5">
                        <div className="flex items-center justify-center gap-1 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </div>
                        <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-850 text-[9px] font-mono text-slate-400 text-center break-all">
                          {alum.fullName.toLowerCase().replace(' ', '')}@alumni.club.com
                        </div>
                      </div>
                    ) : contactStatus === 'rejected' ? (
                      <div className="w-full flex items-center justify-center gap-1.5 py-2 bg-rose-500/5 border border-rose-500/20 text-rose-300 rounded-xl text-[10px] font-extrabold uppercase tracking-wider">
                        <XCircle className="w-3.5 h-3.5" /> Declined
                      </div>
                    ) : (
                      <button
                        disabled={actionLoadingId !== null}
                        onClick={() => handleRequestContact(alum.id, alum.fullName)}
                        className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-indigo-500/10"
                      >
                        {actionLoadingId === alum.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Request Contact"
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT ALUMNI MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-10 p-6 space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-400" />
                {editingAlumni ? 'Edit Alumni Profile' : 'Add Alumni Pioneer'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Alumni Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none text-slate-100 placeholder-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none text-slate-100 placeholder-slate-700 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Role / Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none text-slate-100 placeholder-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Key Skills (comma-separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React, Node.js, Cloud Architect"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none text-slate-100 placeholder-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Graduation Year *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2024"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none text-slate-100 placeholder-slate-700 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">LinkedIn URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://linkedin.com/in/username"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none text-slate-100 placeholder-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Short Biography / Blurb</label>
                <textarea
                  rows={2.5}
                  placeholder="e.g. Lead Developer for Hackfest 2024. Interested in mentoring junior engineers..."
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none text-slate-100 placeholder-slate-700 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-850">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">Available for Mentorship</div>
                  <div className="text-[10px] text-slate-500">Allow active students to request career sync slots</div>
                </div>
                <input
                  type="checkbox"
                  checked={availableForMentorship}
                  onChange={(e) => setAvailableForMentorship(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-slate-900 border-slate-800 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-semibold"
                >
                  {editingAlumni ? 'Save Changes' : 'Publish Profile'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
