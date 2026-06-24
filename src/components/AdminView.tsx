import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Check, 
  X, 
  Unlock, 
  Lock, 
  Loader2, 
  Sparkles, 
  Smartphone, 
  GraduationCap, 
  BookOpen, 
  Activity,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Clock,
  Briefcase,
  FileText,
  Award,
  DollarSign,
  Send,
  UserPlus
} from 'lucide-react';
import { User, ChroniState, AlumniContactRequest } from '../types';

interface AdminViewProps {
  currentUser: User;
  onChroniReact: (state: ChroniState, message: string) => void;
}

interface Certificate {
  id: string;
  recipientName: string;
  recipientEmail: string;
  title: string;
  event: string;
  issueDate: string;
  verificationId: string;
  signedBy: string;
  role: string;
}

export default function AdminView({ currentUser, onChroniReact }: AdminViewProps) {
  // Tabs: 'applications' | 'members' | 'officers' | 'registration' | 'sponsors' | 'certificates' | 'alumni_requests'
  const [activeTab, setActiveTab] = useState<'applications' | 'members' | 'officers' | 'registration' | 'sponsors' | 'certificates' | 'alumni_requests'>('applications');
  
  const [candidates, setCandidates] = useState<User[]>([]);
  const [registrationOpen, setRegistrationOpen] = useState<boolean>(true);
  const [alumniRequests, setAlumniRequests] = useState<AlumniContactRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // New Certificate Issuing form states
  const [certRecipientId, setCertRecipientId] = useState('');
  const [certTitle, setCertTitle] = useState('');
  const [certEvent, setCertEvent] = useState('');
  const [certRole, setCertRole] = useState('');
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Selected candidate for details modal
  const [selectedCandidate, setSelectedCandidate] = useState<User | null>(null);

  const isPresident = currentUser.role === 'president';
  const isSecretary = currentUser.role === 'secretary';

  // Fetch candidates, registration status and alumni requests
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resApps, resReg, resAlumniReqs] = await Promise.all([
        fetch('/api/president/applicants'),
        fetch('/api/president/registration-status'),
        fetch('/api/alumni/requests')
      ]);
      const dataApps = await resApps.json();
      const dataReg = await resReg.json();
      const dataAlumniReqs = await resAlumniReqs.json();

      if (dataApps.success) {
        setCandidates(dataApps.users || []);
      }
      if (dataReg.success) {
        setRegistrationOpen(dataReg.registrationOpen);
      }
      if (dataAlumniReqs.success) {
        setAlumniRequests(dataAlumniReqs.requests || []);
      }

      // Load Certificates from local storage
      const storedCerts = localStorage.getItem('club_certificates');
      if (storedCerts) {
        setCertificates(JSON.parse(storedCerts));
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleRegistration = async () => {
    if (!isPresident) return;
    try {
      const nextState = !registrationOpen;
      const res = await fetch('/api/president/registration-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationOpen: nextState })
      });
      const data = await res.json();
      if (data.success) {
        setRegistrationOpen(data.registrationOpen);
        const actionStr = data.registrationOpen ? 'Open' : 'Closed';
        onChroniReact('success', `Registration is now ${actionStr}! System status refreshed.`);
      }
    } catch (err) {
      console.error('Failed to toggle registration status:', err);
    }
  };

  const handleApprove = async (userId: string, fullName: string) => {
    setActionLoadingId(userId);
    onChroniReact('searching', `Verifying candidate ${fullName}...`);
    try {
      const res = await fetch('/api/president/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        if (selectedCandidate?.id === userId) {
          setSelectedCandidate(null);
        }
        onChroniReact('success', `Member Approved! Saved ${fullName} to club member registry.`);
      }
    } catch (err) {
      console.error('Failed to approve candidate:', err);
      onChroniReact('confused', 'Failed to update candidate status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (userId: string, fullName: string) => {
    setActionLoadingId(userId);
    onChroniReact('searching', `Archiving candidate record for ${fullName}...`);
    try {
      const res = await fetch('/api/president/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        if (selectedCandidate?.id === userId) {
          setSelectedCandidate(null);
        }
        onChroniReact('idle', `Successfully rejected application from ${fullName}. Moved to inactive logs.`);
      }
    } catch (err) {
      console.error('Failed to reject candidate:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Officer Role Promotion: DEMOTE secretary -> member, PROMOTE member -> secretary, PROMOTE member -> president
  const handlePromoteRole = async (userId: string, currentName: string, nextRole: 'member' | 'secretary' | 'president') => {
    setActionLoadingId(userId);
    onChroniReact('searching', `Reconfiguring credentials for ${currentName} to ${nextRole}...`);
    try {
      const res = await fetch('/api/president/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: nextRole })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        onChroniReact('success', `Credentials reconfigured! ${currentName} is now registered as club ${nextRole.toUpperCase()}. Chroni is celebrating this announcement!`);
      }
    } catch (err) {
      console.error('Failed to promote user role:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Alumni Request Approval Workflow
  const handleAlumniRequestStatus = async (requestId: string, requesterName: string, status: 'approved' | 'rejected') => {
    setActionLoadingId(requestId);
    onChroniReact('thinking', `Processing contact authorization for ${requesterName}...`);
    try {
      const res = await fetch('/api/alumni/request/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        onChroniReact('success', `Request resolved! Access to alumnus contact is now ${status.toUpperCase()} for ${requesterName}.`);
      }
    } catch (e) {
      console.error(e);
      onChroniReact('confused', 'Failed to update contact request status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Certificate Issuing Workflow
  const handleIssueCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certRecipientId || !certTitle || !certEvent || !certRole) {
      alert('All fields are required to issue a certificate.');
      return;
    }

    const recipient = approvedMembers.find(m => m.id === certRecipientId);
    if (!recipient) return;

    const newCert: Certificate = {
      id: `cert-${Date.now()}`,
      recipientName: recipient.fullName,
      recipientEmail: recipient.email,
      title: certTitle,
      event: certEvent,
      issueDate: new Date().toISOString().split('T')[0],
      verificationId: `ROT-${certEvent.toUpperCase().replace(/\s+/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      signedBy: isPresident ? 'President' : 'Secretary',
      role: certRole
    };

    const updated = [...certificates, newCert];
    setCertificates(updated);
    localStorage.setItem('club_certificates', JSON.stringify(updated));

    onChroniReact('success', `Certificate issued! Cryptographic code ${newCert.verificationId} linked successfully.`);
    
    // Reset form
    setCertTitle('');
    setCertEvent('');
    setCertRole('');
    setCertRecipientId('');
  };

  const pendingList = candidates.filter(c => c.status === 'pending');
  const approvedMembers = candidates.filter(c => c.role === 'member' || c.role === 'secretary' || c.role === 'president');
  const rejectedList = candidates.filter(c => c.status === 'rejected');
  const adminMembers = approvedMembers.filter(m => m.role === 'president' || m.role === 'secretary');

  return (
    <div className="space-y-6 text-left" id="administration-command-root">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900/80 to-rose-950/20 border border-slate-800 p-6 rounded-2xl relative overflow-hidden" id="admin-header-banner">
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-400">
              <Shield className="w-5 h-5 animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">Administration Command Center</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Administration Portal</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Audit registration pipelines, assign role credentials, approve alumni contact requests, and issue achievement certificates.
            </p>
          </div>

          {/* Quick Statistics Desk */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 min-w-[220px]">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Candidate Pipeline</span>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${pendingList.length > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                <span className={`w-2 h-2 rounded-full ${pendingList.length > 0 ? 'bg-amber-400 animate-ping' : 'bg-green-400'}`} />
                {pendingList.length} Pending Approvals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation Panel */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-850 pb-1" id="admin-subtabs">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all cursor-pointer border ${
            activeTab === 'applications' 
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' 
              : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Applications ({pendingList.length})
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all cursor-pointer border ${
            activeTab === 'members' 
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' 
              : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Members ({approvedMembers.length})
        </button>

        <button
          onClick={() => setActiveTab('officers')}
          className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all cursor-pointer border ${
            activeTab === 'officers' 
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' 
              : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Officer Management
        </button>

        <button
          onClick={() => setActiveTab('alumni_requests')}
          className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all cursor-pointer border ${
            activeTab === 'alumni_requests' 
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' 
              : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Alumni Requests ({alumniRequests.filter(r => r.status === 'pending').length})
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all cursor-pointer border ${
            activeTab === 'certificates' 
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' 
              : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Certificate Management
        </button>

        <button
          onClick={() => setActiveTab('registration')}
          className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all cursor-pointer border ${
            activeTab === 'registration' 
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' 
              : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Registration Controls
        </button>

        <button
          onClick={() => setActiveTab('sponsors')}
          className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all cursor-pointer border ${
            activeTab === 'sponsors' 
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' 
              : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Sponsor Requests
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Synchronizing directories...</p>
        </div>
      ) : (
        <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-5" id="admin-subtab-container">
          
          {/* TAB 1: APPLICATIONS PIPELINE */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">Pending Applicant Dossiers</h3>
                <span className="text-[10px] text-slate-500 font-mono">Candidate folders require manual verification</span>
              </div>

              {pendingList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Check className="w-8 h-8 text-green-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-bold">Verification queue is completely clear!</p>
                  <p className="text-[11px] text-slate-500">All registered candidate directories have been fully processed.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[9px] font-mono">
                        <th className="py-3 px-3">Candidate / Email</th>
                        <th className="py-3 px-3">College / Department</th>
                        <th className="py-3 px-3">Motivation Letter</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {pendingList.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-900/30 transition-all">
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-slate-200">{app.fullName}</div>
                            <div className="text-[10px] text-purple-400 font-mono mt-0.5">{app.email}</div>
                          </td>
                          <td className="py-3.5 px-3 text-slate-300">
                            <div className="font-semibold">{app.department || 'N/A'} ({app.year || 'N/A'})</div>
                            <div className="text-[10px] text-slate-500">{app.college || 'N/A'}</div>
                          </td>
                          <td className="py-3.5 px-3 max-w-[200px] truncate italic text-slate-400">
                            "{app.motivation || 'No letter filed.'}"
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedCandidate(app)}
                                className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 cursor-pointer"
                                title="Open Detailed File"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                disabled={actionLoadingId !== null}
                                onClick={() => handleApprove(app.id, app.fullName)}
                                className="p-1.5 bg-green-500/15 text-green-300 hover:bg-green-500/25 border border-green-500/20 rounded cursor-pointer disabled:opacity-50"
                                title="Approve candidate as Member"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>

                              <button
                                disabled={actionLoadingId !== null}
                                onClick={() => handleReject(app.id, app.fullName)}
                                className="p-1.5 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/20 rounded cursor-pointer disabled:opacity-50"
                                title="Reject candidate request"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEMBERS DIRECTORY */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono font-bold">Approved Club Directory</h3>
                <span className="text-[10px] text-slate-500 font-mono">Members actively linked in Chronicle Registry</span>
              </div>

              {approvedMembers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10">No active club members currently registered.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[9px] font-mono">
                        <th className="py-3 px-3">Name</th>
                        <th className="py-3 px-3">Contact</th>
                        <th className="py-3 px-3">College & Department</th>
                        <th className="py-3 px-3">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {approvedMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-900/20 transition-all">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-200">{member.fullName}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                            <div>{member.email}</div>
                            <div className="text-[10px] text-slate-500">{member.phoneNumber || 'N/A'}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            <div>{member.college || 'N/A'}</div>
                            <div className="text-[10px] text-slate-500">{member.department || 'N/A'} Study</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              member.role === 'president' ? 'bg-amber-500/15 text-amber-300 border-amber-500/20' :
                              member.role === 'secretary' ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20' :
                              'bg-purple-500/15 text-purple-300 border-purple-500/20'
                            }`}>
                              {member.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OFFICER MANAGEMENT (PROMOTE/DEMOTE) */}
          {activeTab === 'officers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> 
                    <span>Officer Promotion Controls</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Reconfigure roles instantly. Promotions are logged in Cognee memory.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedMembers.map((m) => {
                  const isSelf = m.id === currentUser.id;
                  return (
                    <div key={m.id} className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 hover:border-purple-500/15 transition-all space-y-3 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                            {m.fullName}
                            {isSelf && <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded">YOU</span>}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{m.email}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase tracking-wider border shrink-0 ${
                          m.role === 'president' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                          m.role === 'secretary' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' :
                          'bg-purple-500/10 text-purple-400 border-purple-500/25'
                        }`}>
                          {m.role}
                        </span>
                      </div>

                      <div className="border-t border-slate-900/60 pt-3 flex flex-col gap-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Update Credentials:</span>
                        <div className="flex items-center gap-2">
                          {m.role !== 'member' && (
                            <button
                              disabled={actionLoadingId !== null}
                              onClick={() => handlePromoteRole(m.id, m.fullName, 'member')}
                              className="px-2.5 py-1 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 hover:text-purple-200 border border-purple-500/10 rounded cursor-pointer transition-all text-[9px] font-bold uppercase"
                            >
                              Demote to Member
                            </button>
                          )}
                          {m.role !== 'secretary' && (
                            <button
                              disabled={actionLoadingId !== null}
                              onClick={() => handlePromoteRole(m.id, m.fullName, 'secretary')}
                              className="px-2.5 py-1 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 hover:text-cyan-200 border border-cyan-500/10 rounded cursor-pointer transition-all text-[9px] font-bold uppercase"
                            >
                              Promote to Secretary
                            </button>
                          )}
                          {m.role !== 'president' && isPresident && (
                            <button
                              disabled={actionLoadingId !== null}
                              onClick={() => handlePromoteRole(m.id, m.fullName, 'president')}
                              className="px-2.5 py-1 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 hover:text-amber-200 border border-amber-500/10 rounded cursor-pointer transition-all text-[9px] font-bold uppercase"
                            >
                              Promote to President
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ALUMNI CONTACT REQUESTS */}
          {activeTab === 'alumni_requests' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">Alumni Directory Contact Requests</h3>
                <span className="text-[10px] text-slate-500 font-mono">Authorise student networking queries</span>
              </div>

              {alumniRequests.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10">No alumni contact requests have been logged.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[9px] font-mono">
                        <th className="py-3 px-3">Student Requester</th>
                        <th className="py-3 px-3">Alumni Candidate</th>
                        <th className="py-3 px-3">Request Date</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {alumniRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-900/20 transition-all">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-200">{req.requesterName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{req.requesterEmail}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-indigo-300">{req.alumniName}</div>
                            <div className="text-[10px] text-slate-400">{req.alumniCompany} Profile</div>
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">
                            {new Date(req.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              req.status === 'pending' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                              req.status === 'approved' ? 'bg-green-500/10 text-green-300 border-green-500/20' :
                              'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {req.status === 'pending' ? (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  disabled={actionLoadingId !== null}
                                  onClick={() => handleAlumniRequestStatus(req.id, req.requesterName, 'approved')}
                                  className="px-2.5 py-1 bg-green-500/15 text-green-300 hover:bg-green-500/25 border border-green-500/20 rounded cursor-pointer text-[10px]"
                                  title="Approve Contact request"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={actionLoadingId !== null}
                                  onClick={() => handleAlumniRequestStatus(req.id, req.requesterName, 'rejected')}
                                  className="px-2.5 py-1 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/20 rounded cursor-pointer text-[10px]"
                                  title="Decline Contact request"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-mono">Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CERTIFICATE MANAGEMENT */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Issue Cryptographic Certificate</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Certificates immediately sync to client storage</span>
              </div>

              {/* Issue form */}
              <form onSubmit={handleIssueCertificate} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-5 rounded-xl border border-slate-900">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Select Recipient:</label>
                  <select
                    value={certRecipientId}
                    onChange={(e) => setCertRecipientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-lg focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Member --</option>
                    {approvedMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName} ({m.email})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Certificate Title:</label>
                  <input
                    type="text"
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    placeholder="e.g. Technical Excellence Fellowship"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-lg focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Event Memory Target:</label>
                  <input
                    type="text"
                    value={certEvent}
                    onChange={(e) => setCertEvent(e.target.value)}
                    placeholder="e.g. TechFest 2025"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-lg focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Recipient Role / Designation:</label>
                  <input
                    type="text"
                    value={certRole}
                    onChange={(e) => setCertRole(e.target.value)}
                    placeholder="e.g. Hackathon Track Lead"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-lg focus:outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2 pt-2 text-right">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Issue Verified Credentials
                  </button>
                </div>
              </form>

              {/* List of active certificates */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Active Verified Hashes ({certificates.length}):</h4>
                <div className="bg-slate-950/20 border border-slate-900 rounded-xl divide-y divide-slate-850">
                  {certificates.map(c => (
                    <div key={c.id} className="p-3.5 text-xs flex justify-between items-center hover:bg-slate-950/40 transition-all">
                      <div>
                        <div className="font-bold text-slate-200">{c.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Recipient: {c.recipientName} • {c.event}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {c.verificationId}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: REGISTRATION CONTROLS */}
          {activeTab === 'registration' && (
            <div className="space-y-6 max-w-xl">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">Signups Registration Controls</h3>
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs">Dynamic Applicant Desk</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Determine if candidate registration submissions are authorized.</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider border ${
                    registrationOpen ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                  }`}>
                    {registrationOpen ? 'Desk Open' : 'Desk Closed'}
                  </span>
                </div>

                <div className="border-t border-slate-900 pt-4 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-medium">Toggle Desk Status:</span>
                  {isPresident ? (
                    <button
                      onClick={handleToggleRegistration}
                      className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                        registrationOpen 
                          ? 'bg-rose-500/10 border border-rose-500/35 text-rose-300 hover:bg-rose-500/20' 
                          : 'bg-green-500/10 border border-green-500/35 text-green-300 hover:bg-green-500/20'
                      }`}
                    >
                      {registrationOpen ? (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Close Signups Desk
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" /> Open Signups Desk
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-[10px] text-slate-500 italic font-mono uppercase bg-slate-900/40 p-2 rounded border border-slate-800">
                      President exclusive control
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SPONSOR REQUESTS */}
          {activeTab === 'sponsors' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">Sponsor Outreach Pipeline</h3>
                <span className="text-[10px] text-slate-500 font-mono">Active and pending sponsor files</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-xs space-y-3">
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="font-bold">Google Developer Groups</span>
                    <span className="font-mono text-cyan-400 font-extrabold">₹25,000</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Status: Approved • Event: TechFest 2025</p>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-xs space-y-3">
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="font-bold">Stripe Developer Platform</span>
                    <span className="font-mono text-cyan-400 font-extrabold">₹20,000</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Status: Approved • Event: General Club Support</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==================== APPLICATION DETAILS MODAL ==================== */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md" id="candidate-details-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden text-slate-200"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500" />
              
              <button
                onClick={() => setSelectedCandidate(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-950/40 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5 mt-2">
                <div className="flex items-center gap-1.5 text-rose-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">Membership Dossier</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">{selectedCandidate.fullName}</h3>
                <span className="text-xs text-slate-500 block font-mono">{selectedCandidate.email}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 my-5 bg-slate-950/50 p-4 rounded-xl border border-slate-850 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <span className="text-[8px] text-slate-600 uppercase block font-mono">College</span>
                    <span className="font-semibold text-slate-300">{selectedCandidate.college || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-[8px] text-slate-600 uppercase block font-mono">Department</span>
                    <span className="font-semibold text-slate-300">{selectedCandidate.department || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-[8px] text-slate-600 uppercase block font-mono">Year</span>
                    <span className="font-semibold text-slate-300">{selectedCandidate.year || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[8px] text-slate-600 uppercase block font-mono">Phone</span>
                    <span className="font-semibold text-slate-300">{selectedCandidate.phoneNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Motivation Letter:</span>
                <p className="text-xs text-slate-300 bg-slate-950/30 p-4 rounded-xl border border-slate-900 leading-relaxed italic max-h-[120px] overflow-y-auto">
                  "{selectedCandidate.motivation || 'No letter filed.'}"
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-800/60 pt-5 mt-6">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close Dossier
                </button>
                
                <button
                  disabled={actionLoadingId !== null}
                  onClick={() => handleReject(selectedCandidate.id, selectedCandidate.fullName)}
                  className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  Reject Request
                </button>

                <button
                  disabled={actionLoadingId !== null}
                  onClick={() => handleApprove(selectedCandidate.id, selectedCandidate.fullName)}
                  className="px-4 py-2 bg-green-500/15 border border-green-500/30 text-green-300 hover:bg-green-500/25 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  Approve Member
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
