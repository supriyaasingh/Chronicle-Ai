import fs from 'fs';
import path from 'path';
import { Meeting } from './types';

const MEETINGS_FILE_PATH = path.join(process.cwd(), 'meetings_db.json');

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'meet-1',
    title: 'Board Meeting',
    description: 'Quarterly review of administrative structure, officer responsibilities, and financial health.',
    date: '2026-06-26',
    time: '18:00',
    venue: 'Executive Boardroom',
    visibility: 'Administration Only',
    organizer: 'President'
  },
  {
    id: 'meet-2',
    title: 'Sponsor Strategy Meeting',
    description: 'Formulate outreach campaigns for local tech hubs and premium corporate partners.',
    date: '2026-06-28',
    time: '14:00',
    venue: 'Google Meet',
    visibility: 'Administration Only',
    organizer: 'Secretary'
  },
  {
    id: 'meet-3',
    title: 'Volunteer Briefing',
    description: 'Preparation session for the upcoming community beach clean-up drive. Assigning team roles.',
    date: '2026-06-25', // Tomorrow relative to June 24, 2026
    time: '17:00',
    venue: 'Club Lounge',
    visibility: 'Members Only',
    organizer: 'President'
  },
  {
    id: 'meet-4',
    title: 'General Body Meeting',
    description: 'All members and prospects gather to discuss the upcoming annual installation ceremony planning.',
    date: '2026-06-24', // Today relative to June 24, 2026
    time: '11:31', // In 1 hour or close (we can set to current time plus an hour, let's make it dynamic)
    venue: 'Seminar Hall',
    visibility: 'Everyone',
    organizer: 'Secretary'
  }
];

export class MeetingsStore {
  private meetings: Meeting[] = [];

  constructor() {
    this.loadDB();
    if (this.meetings.length === 0) {
      this.meetings = [...INITIAL_MEETINGS];
      // Make the today meeting in 1 hour relative to whatever current time is if possible,
      // or keep a static close one.
      const now = new Date();
      now.setHours(now.getHours() + 1);
      const todayStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      this.meetings = [
        {
          id: 'meet-1',
          title: 'Board Meeting',
          description: 'Quarterly review of administrative structure, officer responsibilities, and financial health.',
          date: tomorrowStr,
          time: '10:00',
          venue: 'Executive Boardroom',
          visibility: 'Administration Only',
          organizer: 'President'
        },
        {
          id: 'meet-2',
          title: 'Sponsor Strategy Meeting',
          description: 'Formulate outreach campaigns for local tech hubs and premium corporate partners.',
          date: '2026-06-28',
          time: '14:00',
          venue: 'Google Meet',
          visibility: 'Administration Only',
          organizer: 'Secretary'
        },
        {
          id: 'meet-3',
          title: 'Volunteer Briefing',
          description: 'Preparation session for the upcoming community beach clean-up drive. Assigning team roles.',
          date: tomorrowStr, // Dynamic tomorrow
          time: '17:00',
          venue: 'Club Lounge',
          visibility: 'Members Only',
          organizer: 'President'
        },
        {
          id: 'meet-4',
          title: 'General Body Meeting',
          description: 'All members and prospects gather to discuss the upcoming annual installation ceremony planning.',
          date: todayStr, // Dynamic today
          time: timeStr,  // Dynamic in 1 hour
          venue: 'Seminar Hall',
          visibility: 'Everyone',
          organizer: 'Secretary'
        }
      ];
      this.saveDB();
    }
  }

  private loadDB() {
    try {
      if (fs.existsSync(MEETINGS_FILE_PATH)) {
        const fileContent = fs.readFileSync(MEETINGS_FILE_PATH, 'utf-8');
        this.meetings = JSON.parse(fileContent);
        console.log(`[MeetingsStore] Loaded ${this.meetings.length} meetings.`);
      }
    } catch (error) {
      console.error('[MeetingsStore] Failed to load meetings DB:', error);
    }
  }

  private saveDB() {
    try {
      fs.writeFileSync(MEETINGS_FILE_PATH, JSON.stringify(this.meetings, null, 2), 'utf-8');
    } catch (error) {
      console.error('[MeetingsStore] Failed to save meetings DB:', error);
    }
  }

  public getMeetings(): Meeting[] {
    return this.meetings;
  }

  public getVisibleMeetings(role: string): Meeting[] {
    if (role === 'president' || role === 'secretary') {
      return this.meetings;
    } else if (role === 'member') {
      return this.meetings.filter(m => m.visibility === 'Members Only' || m.visibility === 'Everyone');
    } else {
      return this.meetings.filter(m => m.visibility === 'Everyone');
    }
  }

  public addMeeting(meetingData: Omit<Meeting, 'id'>): Meeting {
    const newMeeting: Meeting = {
      ...meetingData,
      id: `meet-${Date.now()}`
    };
    this.meetings.push(newMeeting);
    this.saveDB();
    return newMeeting;
  }

  public updateMeeting(id: string, updatedData: Partial<Omit<Meeting, 'id'>>): Meeting | null {
    const index = this.meetings.findIndex(m => m.id === id);
    if (index === -1) return null;

    this.meetings[index] = {
      ...this.meetings[index],
      ...updatedData
    };
    this.saveDB();
    return this.meetings[index];
  }

  public deleteMeeting(id: string): boolean {
    const index = this.meetings.findIndex(m => m.id === id);
    if (index === -1) return false;

    this.meetings.splice(index, 1);
    this.saveDB();
    return true;
  }
}
