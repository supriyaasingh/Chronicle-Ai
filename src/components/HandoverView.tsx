import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Printer, 
  ArrowRight, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  Calendar, 
  Lightbulb, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Loader2,
  Lock,
  ChevronRight,
  Database
} from 'lucide-react';
import { EventMemory, SponsorMemory, ChroniState } from '../types';
import ChroniMascot from './ChroniMascot';

interface HandoverViewProps {
  events: EventMemory[];
  sponsors: SponsorMemory[];
}

interface ParsedReportSection {
  title: string;
  icon: React.ReactNode;
  content: string[];
}

export default function HandoverView({ events, sponsors }: HandoverViewProps) {
  const [generating, setGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [reportText, setReportText] = useState<string>('');

  const handoverSteps = [
    "Contacting Cognee memory indexer...",
    "Querying connected events & spending ledgers...",
    "Retrieving sponsorship agreements & notes...",
    "Traversing retrospective logs & lessons...",
    "Structuring recommended officer actions...",
    "Compiling final handover document..."
  ];

  // Map section headers to beautiful icons
  const getSectionIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('summary')) return <TrendingUp className="w-5 h-5 text-purple-400" />;
    if (t.includes('sponsor')) return <Award className="w-5 h-5 text-cyan-400" />;
    if (t.includes('event')) return <Calendar className="w-5 h-5 text-purple-400" />;
    if (t.includes('mistake') || t.includes('avoid')) return <AlertCircle className="w-5 h-5 text-amber-400" />;
    if (t.includes('action') || t.includes('recommend')) return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    if (t.includes('decision')) return <ShieldCheck className="w-5 h-5 text-indigo-400" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  const getSectionBorderColor = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('summary')) return 'border-l-purple-500';
    if (t.includes('sponsor')) return 'border-l-cyan-500';
    if (t.includes('event')) return 'border-l-purple-500';
    if (t.includes('mistake') || t.includes('avoid')) return 'border-l-amber-500';
    if (t.includes('action') || t.includes('recommend')) return 'border-l-emerald-500';
    if (t.includes('decision')) return 'border-l-indigo-500';
    return 'border-l-slate-500';
  };

  // Convert markdown report string into clean structured blocks for rendering
  const parsedSections = useMemo((): ParsedReportSection[] => {
    if (!reportText) return [];

    const sections: ParsedReportSection[] = [];
    const rawBlocks = reportText.split(/##\s+/);

    rawBlocks.forEach(block => {
      const trimmed = block.trim();
      if (!trimmed) return;

      const lines = trimmed.split('\n');
      const title = lines[0].replace(/^[#\s]+/, '').trim();
      const content = lines.slice(1).map(l => l.trim()).filter(Boolean);

      sections.push({
        title,
        icon: getSectionIcon(title),
        content
      });
    });

    return sections;
  }, [reportText]);

  // Start Generation Flow
  const handleGenerateHandover = async () => {
    setGenerating(true);
    setCompleted(false);
    setStepIndex(0);
    setReportText('');

    // Animate through steps
    const stepInterval = setInterval(() => {
      setStepIndex(prev => {
        if (prev < handoverSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 900);

    try {
      const response = await fetch('/api/handover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      // Keep running step animation if still running, then complete
      clearInterval(stepInterval);
      setStepIndex(handoverSteps.length - 1);
      
      setTimeout(() => {
        if (data && data.report) {
          setReportText(data.report);
        } else {
          setReportText("## Error\nCould not compile the handover report. Please try again.");
        }
        setGenerating(false);
        setCompleted(true);
      }, 500);

    } catch (err) {
      console.error('[HandoverView] Error compiling handover report:', err);
      clearInterval(stepInterval);
      setGenerating(false);
      setCompleted(true);
      setReportText("## Handover Generation Failed\nWe encountered a server error. Please retry or verify backend connectivity.");
    }
  };

  // Helper to convert simple markdown to printable HTML structure
  const convertMarkdownToHTML = (text: string): string => {
    let html = text;

    // Convert markdown headings to nice clean html
    html = html.replace(/##\s+(.*)/g, '<h2>$1</h2>');
    html = html.replace(/###\s+(.*)/g, '<h3>$1</h3>');
    
    // Convert bullet lists
    // Simple line by line conversion
    const lines = html.split('\n');
    let insideList = false;
    const formattedLines = lines.map(line => {
      const bulletMatch = line.match(/^[-*]\s+(.*)/);
      if (bulletMatch) {
        let content = bulletMatch[1];
        // replace inline bolding inside bullets
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        if (!insideList) {
          insideList = true;
          return '<ul><li>' + content + '</li>';
        }
        return '<li>' + content + '</li>';
      } else {
        if (insideList) {
          insideList = false;
          return '</ul><p>' + line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') + '</p>';
        }
        return '<p>' + line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') + '</p>';
      }
    });

    return formattedLines.join('\n');
  };

  // Trigger browser print of PDF styled popup
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export the report as a PDF!");
      return;
    }

    const formattedHTMLReport = convertMarkdownToHTML(reportText);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Chronicle AI - Club Leadership Handover Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #0f172a;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              background-color: #fff;
            }
            .header {
              border-bottom: 2px solid #6366f1;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .title-area h1 {
              margin: 0;
              font-size: 26px;
              font-weight: 800;
              letter-spacing: -0.025em;
              color: #1e1b4b;
            }
            .title-area p {
              margin: 4px 0 0 0;
              font-size: 13px;
              color: #475569;
              font-weight: 600;
            }
            .metadata {
              text-align: right;
              font-family: 'JetBrains Mono', monospace;
              font-size: 10px;
              color: #64748b;
              line-height: 1.4;
            }
            h2 {
              font-size: 18px;
              font-weight: 700;
              color: #4f46e5;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin-top: 30px;
              margin-bottom: 12px;
              page-break-after: avoid;
            }
            p {
              font-size: 13.5px;
              color: #334155;
              margin-bottom: 12px;
            }
            ul, ol {
              padding-left: 20px;
              margin-bottom: 12px;
            }
            li {
              font-size: 13.5px;
              color: #334155;
              margin-bottom: 6px;
            }
            strong {
              color: #0f172a;
              font-weight: 600;
            }
            .badge {
              display: inline-block;
              background-color: #ecfdf5;
              border: 1px solid #10b981;
              color: #047857;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              margin-bottom: 20px;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
            }
            @media print {
              body {
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-area">
              <h1>Club Leadership Handover Report</h1>
              <p>Chronicle AI • Sacred Memory Archive</p>
            </div>
            <div class="metadata">
              Generated: ${new Date().toLocaleDateString()}<br>
              Database: Cognee Graph Layer<br>
              Status: Active Handover Approved
            </div>
          </div>
          
          <div class="badge">Organizational Memory Preserved</div>
          
          <div class="content">
            ${formattedHTMLReport}
          </div>
          
          <div class="footer">
            Official Club Handover Document. Compiled by Chronicle AI. All rights reserved.
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-12 text-left">
      
      {/* Hero Banner Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-1 max-w-2xl z-10">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 animate-pulse" />
            <span>Committee Handover Module</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Leadership Handover Mode
          </h1>
          <p className="text-sm text-slate-400">
            Export club history instantly. We traverse the Cognee Graph Database to formulate a structured report of budgets, sponsors, outcomes, decisions, and retro lessons for incoming leaders.
          </p>
        </div>

        {!generating && !completed && (
          <button
            onClick={handleGenerateHandover}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 self-start md:self-center transition-all duration-300 shadow-lg shadow-emerald-950/20 active:scale-95 border border-emerald-500/20"
          >
            <FileText className="w-4 h-4" />
            Generate Handover Report
          </button>
        )}
      </div>

      {/* Main interactive workflow layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left main area: Report renderer or state placeholder */}
        <div className="lg:col-span-8">
          
          {/* Initial placeholder state */}
          {!generating && !completed && (
            <div className="bg-slate-900/10 border border-slate-800/80 rounded-3xl p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-white">Locked Handover Vault</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The handover report combines events, lessons learned, decisions made, and active sponsors. Clicking generate will run a synthesis query on the Cognee Memory provider.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-4 text-left">
                <div className="p-3 rounded-xl border border-slate-900/60 bg-slate-900/10 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Query 1</span>
                  <span className="text-xs text-slate-300 font-semibold">Major Events</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-900/60 bg-slate-900/10 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Query 2</span>
                  <span className="text-xs text-slate-300 font-semibold">Sponsor Budgets</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-900/60 bg-slate-900/10 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Query 3</span>
                  <span className="text-xs text-slate-300 font-semibold">Decisions Made</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-900/60 bg-slate-900/10 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Query 4</span>
                  <span className="text-xs text-slate-300 font-semibold">Lessons Saved</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-900/60 bg-slate-900/10 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Query 5</span>
                  <span className="text-xs text-slate-300 font-semibold">Financial Rankings</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-900/60 bg-slate-900/10 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Format</span>
                  <span className="text-xs text-slate-300 font-semibold">Printable PDF</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900">
                <button
                  onClick={handleGenerateHandover}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm inline-flex items-center gap-2 transition-all duration-300 shadow-xl shadow-emerald-950/20 active:scale-95 border border-emerald-500/20"
                >
                  <FileText className="w-4 h-4 animate-pulse" />
                  Generate Handover Report
                </button>
              </div>
            </div>
          )}

          {/* Active Generation Workflow Indicator */}
          {generating && (
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-8 space-y-6">
              
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-400 rounded-full animate-spin flex items-center justify-center shadow-inner" />
                  <div className="absolute inset-0 flex items-center justify-center text-emerald-400 font-semibold text-xs">
                    {(stepIndex + 1) * 16}%
                  </div>
                </div>

                <div className="space-y-1 text-center">
                  <h3 className="font-bold text-white text-base">Preparing leadership handover...</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Currently: {handoverSteps[stepIndex]}
                  </p>
                </div>
              </div>

              {/* Steps Progress Checklist */}
              <div className="max-w-md mx-auto space-y-2.5 pt-4 border-t border-slate-900">
                {handoverSteps.map((step, idx) => {
                  const isFinished = idx < stepIndex;
                  const isActive = idx === stepIndex;

                  return (
                    <div 
                      key={idx}
                      className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                        isActive ? 'bg-emerald-950/20 border border-emerald-900/30' : 'opacity-60'
                      }`}
                    >
                      {isFinished ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-800" />
                      )}
                      <span className={`text-xs ${isActive ? 'text-white font-semibold' : 'text-slate-400'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Finished Report Render view */}
          {completed && (
            <div className="space-y-6">
              
              {/* Preserved Banner Badge */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-950/30 border border-emerald-800/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Organizational Memory Preserved</h4>
                    <p className="text-[11px] text-slate-400">Chronicle AI compiled our complete history using Cognee and fallbacks.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleExportPDF}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Export as PDF
                  </button>
                  <button
                    onClick={handleGenerateHandover}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold text-[11px] transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </motion.div>

              {/* Document Paper Stack rendering */}
              <div className="space-y-6">
                {parsedSections.map((sect, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`border border-slate-800 bg-slate-900/20 rounded-2xl p-6 border-l-4 ${getSectionBorderColor(sect.title)}`}
                  >
                    <div className="flex items-center gap-2.5 border-b border-slate-900/60 pb-3 mb-4">
                      <div className="p-1.5 bg-slate-950/60 rounded-lg border border-slate-800">
                        {sect.icon}
                      </div>
                      <h3 className="font-extrabold text-base text-white tracking-tight">
                        {sect.title}
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      {sect.content.map((line, lIdx) => {
                        const isBullet = line.startsWith('-') || line.startsWith('*');
                        const cleanLine = line.replace(/^[-*\s]+/, '');
                        
                        // Bold parsing
                        const parts = cleanLine.split(/\*\*(.*?)\*\*/g);

                        const contentNode = parts.map((part, pIdx) => {
                          if (pIdx % 2 === 1) {
                            return <strong key={pIdx} className="text-white font-extrabold">{part}</strong>;
                          }
                          return part;
                        });

                        if (isBullet) {
                          return (
                            <div key={lIdx} className="flex gap-2.5 items-start pl-2">
                              <ChevronRight className="w-3.5 h-3.5 mt-1 text-slate-500 flex-shrink-0" />
                              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                                {contentNode}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <p key={lIdx} className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                            {contentNode}
                          </p>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Right Sidebar: Chroni Mascot Companion */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
          
          {/* Mascot Bubble panel */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
            
            <div className="w-48 h-40 flex items-center justify-center relative overflow-hidden mt-1">
              <ChroniMascot 
                state={generating ? 'searching' : completed ? 'success' : 'idle'} 
                showBubble={false} 
              />
            </div>

            {/* Bubble dialog */}
            <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-xs text-slate-300 relative mt-4 max-w-sm text-left leading-relaxed font-medium shadow-xl">
              <div className="absolute top-[-6px] left-[50%] translate-x-[-50%] w-3 h-3 bg-slate-950 border-t border-l border-slate-800/80 rotate-45" />
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 inline-block mr-1.5 align-text-top animate-pulse" />
              {generating ? (
                <span>Generating your handover documentation now. I'm opening the sacred archive book and traversing our Cognee graph paths!</span>
              ) : completed ? (
                <span>All past committee records compiled! The timeline ledger is officially sealed. Press "Export as PDF" to save it for your next successors!</span>
              ) : (
                <span>Ready to transition? Tap "Generate Handover Report" to retrieve years of compounded wisdom instantly. Avoid repeating past mistakes!</span>
              )}
            </div>

            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-5">
              CHRONI • ARCHIVE SPIRIT
            </span>
          </div>

          {/* Database Insight Box */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-emerald-400" />
              <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">Cognee Memory Node Integration</h4>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed text-left">
              Chroni gathers all organizational memory across five distinct node schemas (Events, Budgets, Sponsors, Decisions, and Lessons) and links them as connected edges to ensure absolute handoff continuity.
            </p>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 text-left space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Compounded Wisdom</span>
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Total Recorded Events:</span>
                <span className="font-bold text-white">{events.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Total Active Sponsors:</span>
                <span className="font-bold text-white">{sponsors.length}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
