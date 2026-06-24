import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  Sparkles, 
  Eye, 
  ChevronRight,
  Database
} from 'lucide-react';
import { User, Meeting } from '../types';

interface MeetingsViewProps {
  currentUser: User;
  onChroniReact?: (state: 'success' | 'found' | 'confused' | 'searching' | 'idle', message: string) => void;
}

export default function MeetingsView({ currentUser, onChroniReact }: MeetingsViewProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [visibility, setVisibility] = useState<'Administration Only' | 'Members Only' | 'Everyone'>('Everyone');

  const isOrganizer = currentUser.role === 'president' || currentUser.role === 'secretary';

  // Fetch visible meetings
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/meetings?role=${currentUser.role}`);
      const data = await res.json();
      if (data.success) {
        setMeetings(data.meetings);
      } else {
        setError(data.error || 'Failed to load meetings.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [currentUser.role]);

  // Open modal for adding
  const handleOpenAdd = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setVenue('');
    setVisibility('Everyone');
    setEditingMeeting(null);
    setShowAddModal(true);
  };

  // Open modal for editing
  const handleOpenEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setTitle(meeting.title);
    setDescription(meeting.description);
    setDate(meeting.date);
    setTime(meeting.time);
    setVenue(meeting.venue);
    setVisibility(meeting.visibility);
    setShowAddModal(true);
  };

  // Submit create or update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !venue || !visibility) {
      alert('All required fields must be filled.');
      return;
    }

    const payload = {
      title,
      description,
      date,
      time,
      venue,
      visibility,
      organizer: currentUser.fullName || currentUser.role.toUpperCase()
    };

    try {
      if (editingMeeting) {
        // Edit existing
        const res = await fetch(`/api/meetings/${editingMeeting.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          fetchMeetings();
          setShowAddModal(false);
          if (onChroniReact) onChroniReact('success', `Saved scheduled meeting parameters inside our sacred archives: "${title}"`);
        } else {
          alert(data.error || 'Failed to update meeting.');
        }
      } else {
        // Create new
        const res = await fetch('/api/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          fetchMeetings();
          setShowAddModal(false);
          if (onChroniReact) onChroniReact('success', `Created new meeting memory: "${title}"`);
          // Notify of Chroni integration
          alert('New meeting added to club memory!');
        } else {
          alert(data.error || 'Failed to create meeting.');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to sync meeting details.');
    }
  };

  // Delete meeting
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting from the collective club memory?')) {
      return;
    }

    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchMeetings();
        if (onChroniReact) onChroniReact('confused', 'Erased meeting agenda and link references from club memory.');
      } else {
        alert(data.error || 'Failed to delete meeting.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting meeting.');
    }
  };

  // Visibility helpers
  const getVisibilityColor = (vis: string) => {
    switch (vis) {
      case 'Administration Only':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Members Only':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-400" />
            Meetings Portal
          </h1>
          <p className="text-sm text-slate-400">
            Role-based visibility levels mapped directly into our collective club memory.
          </p>
        </div>

        {isOrganizer && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold transition-all active:scale-95 shadow-md shadow-purple-950/20"
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500">Retrieving meetings archive...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {meetings.map((meeting) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-slate-900/40 border border-slate-800 p-5 backdrop-blur-sm hover:border-purple-500/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getVisibilityColor(meeting.visibility)}`}>
                    {meeting.visibility}
                  </span>
                  {isOrganizer && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(meeting)}
                        className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition-all"
                        title="Edit Meeting"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(meeting.id)}
                        className="p-1.5 rounded bg-slate-800 text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Delete Meeting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{meeting.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {meeting.description || 'No agenda or details provided.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{meeting.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{meeting.time}</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="truncate">{meeting.venue}</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 mt-0.5 text-[10px] text-slate-500 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>Organizer: {meeting.organizer}</span>
                </div>
              </div>
            </motion.div>
          ))}

          {meetings.length === 0 && (
            <div className="col-span-full py-16 text-center border border-dashed border-slate-800 rounded-2xl space-y-3">
              <div className="inline-flex p-4 rounded-full bg-slate-900/60 text-slate-500">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">No scheduled meetings</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  You are viewing all meetings authorized for the {currentUser.role.toUpperCase()} role. Ask Chroni if you suspect any scheduled conflict.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-10 p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  {editingMeeting ? 'Edit Scheduled Meeting' : 'Schedule New Meeting'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Meeting Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Executive Board Meeting"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500/50 focus:outline-none text-slate-100 placeholder-slate-600 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Agenda / Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide meeting context, goals, and preparation requirements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500/50 focus:outline-none text-slate-100 placeholder-slate-600 text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500/50 focus:outline-none text-slate-100 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Time *</label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500/50 focus:outline-none text-slate-100 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Venue / Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Seminar Hall A, Google Meet"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500/50 focus:outline-none text-slate-100 placeholder-slate-600 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Visibility / Access Level *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Administration Only', 'Members Only', 'Everyone'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setVisibility(level)}
                        className={`py-2 px-2.5 rounded-xl border text-center font-medium transition-all text-[11px] ${
                          visibility === level
                            ? 'bg-purple-600/25 border-purple-500 text-purple-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    {editingMeeting ? 'Save Changes' : 'Publish Meeting'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
