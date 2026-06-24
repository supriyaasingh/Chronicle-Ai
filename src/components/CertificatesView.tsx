import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Calendar, 
  FileText, 
  Download, 
  User, 
  CheckCircle2, 
  Lock, 
  Search,
  Sparkles,
  Bookmark
} from 'lucide-react';
import { User as UserType } from '../types';

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

interface CertificatesViewProps {
  currentUser: UserType;
}

const DEFAULT_CERTIFICATES: Certificate[] = [
  {
    id: "cert-1",
    recipientName: "Aarav Sharma",
    recipientEmail: "aarav@club.com",
    title: "Outstanding Speaker Merit",
    event: "TechFest 2025",
    issueDate: "2025-10-15",
    verificationId: "ROT-TF25-SPEAKER-882",
    signedBy: "President",
    role: "Guest Speaker"
  },
  {
    id: "cert-2",
    recipientName: "Neha Patel",
    recipientEmail: "neha@club.com",
    title: "Technical Excellence Fellowship",
    event: "HackDay 2024",
    issueDate: "2024-04-12",
    verificationId: "ROT-HD24-FELLOW-105",
    signedBy: "President & Secretary",
    role: "Hackathon Track Lead"
  }
];

export default function CertificatesView({ currentUser }: CertificatesViewProps) {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadCertificates = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('club_certificates');
      if (stored) {
        setCerts(JSON.parse(stored));
      } else {
        localStorage.setItem('club_certificates', JSON.stringify(DEFAULT_CERTIFICATES));
        setCerts(DEFAULT_CERTIFICATES);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  // Filter certificates: members only see theirs, president/secretary can see all
  const isOfficer = currentUser.role === 'president' || currentUser.role === 'secretary';
  
  const filteredCerts = certs.filter(cert => {
    const isMine = cert.recipientEmail.toLowerCase() === currentUser.email.toLowerCase() || 
                   cert.recipientName.toLowerCase() === currentUser.fullName.toLowerCase();
    
    // Authorization filter
    if (!isOfficer && !isMine) {
      return false;
    }

    // Search filter
    const matchesSearch = 
      cert.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.verificationId.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-left" id="certificates-root">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900/80 to-amber-950/20 border border-slate-800 p-6 rounded-2xl relative overflow-hidden" id="certs-header-banner">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400">
              <Award className="w-5 h-5 animate-bounce" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">Verified Club Credentials</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Certificates Repository</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Access and download secure, cryptographic-linked achievement credentials issued directly by active club officers.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 px-4 py-3 rounded-xl flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Credentials Registry</span>
              <span className="text-xs font-extrabold text-amber-400 font-mono">
                {certs.length} Secure Hashes Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Query Controls */}
      <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between" id="certs-controls">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isOfficer ? "Search recipient name, event, verification ID..." : "Search my certificates..."}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none transition-all placeholder-slate-600 font-medium"
          />
        </div>
        
        <div className="text-[10px] text-slate-500 font-mono text-center md:text-right bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-850">
          🔒 Verification Protocol: SHA256 Cryptographic Hashes Secured By Chronicle Memex
        </div>
      </div>

      {/* split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Certificates List */}
        <div className="lg:col-span-5 space-y-3.5">
          <h2 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">
            {isOfficer ? 'All Issued Credentials' : 'My Credentials File'}
          </h2>

          {filteredCerts.length === 0 ? (
            <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-10 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No active credentials located matching this profile.</p>
              {!isOfficer && (
                <p className="text-[10px] text-slate-600 italic">"Certificates are issued by the President or Secretary after event audits."</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredCerts.map((cert) => {
                const isSelected = selectedCert?.id === cert.id;
                return (
                  <div
                    key={cert.id}
                    onClick={() => setSelectedCert(cert)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2.5 ${
                      isSelected 
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5' 
                        : 'bg-slate-900/30 border-slate-850/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-200 text-xs">{cert.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{cert.event}</p>
                      </div>
                      <Bookmark className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-900/60 pt-2 text-slate-400">
                      <div>Recipient: <span className="text-slate-300 font-bold">{cert.recipientName}</span></div>
                      <div className="text-amber-500/80 font-bold">{cert.verificationId.split('-')[2]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Certificate Rendering Panel */}
        <div className="lg:col-span-7">
          <h2 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono mb-3.5">
            Certificate Preview Panel
          </h2>

          {selectedCert ? (
            <div className="space-y-5">
              {/* Premium Certificate Visual Layout */}
              <div 
                className="bg-slate-900 border-4 border-double border-amber-600/50 p-8 rounded-2xl relative shadow-2xl overflow-hidden aspect-[1.4/1] flex flex-col justify-between text-center select-none"
                id="active-certificate-canvas"
              >
                {/* Decorative borders and seals */}
                <div className="absolute inset-2 border border-amber-600/20 rounded-xl pointer-events-none" />
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-500/40" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-500/40" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-500/40" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-500/40" />
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                
                {/* Certificate Header */}
                <div className="space-y-1 mt-2">
                  <div className="flex justify-center text-amber-400 mx-auto">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif font-bold text-amber-200 text-lg uppercase tracking-widest">Certificate of Achievement</h3>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Rotaract Club Fellowship Registry</span>
                </div>

                {/* Recipient Details */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 block italic">This secure credential certifies that</span>
                  <p className="text-xl font-extrabold text-white font-serif border-b border-amber-500/20 pb-1.5 max-w-sm mx-auto">
                    {selectedCert.recipientName}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                    has successfully fulfilled the required service and roles as <span className="text-amber-300 font-bold">{selectedCert.role}</span> for <span className="text-slate-200 font-bold">{selectedCert.event}</span>, demonstrating commendable dedication, team alignment, and leadership.
                  </p>
                </div>

                {/* Footer Signature and ID */}
                <div className="flex justify-between items-end px-4 border-t border-slate-800/40 pt-4 mt-2">
                  <div className="text-left space-y-1">
                    <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-wider">Verification Code</span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold text-amber-400/90">{selectedCert.verificationId}</span>
                  </div>

                  {/* Golden seal image/graphics simulation */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 bg-amber-500/10 rounded-full border border-dashed border-amber-500/45 animate-spin-slow" />
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-wider">Authorized Officer Signature</span>
                    <span className="text-[10px] font-serif italic text-slate-300 font-bold block">Club {selectedCert.signedBy}</span>
                  </div>
                </div>

              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-850">
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified via Chronicle Cryptography Database
                </div>
                <button
                  onClick={() => {
                    alert(`Demo Note: Secure print command dispatched. Verification ID: ${selectedCert.verificationId}`);
                  }}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/10 border border-slate-900 rounded-2xl h-[340px] flex flex-col items-center justify-center text-center p-8 space-y-2">
              <Award className="w-10 h-10 text-slate-700 animate-pulse" />
              <p className="text-xs text-slate-400 font-bold">No credential selected</p>
              <p className="text-[11px] text-slate-600 max-w-xs">Select a verified achievement file from the list column to render and inspect the cryptographic seal details.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
