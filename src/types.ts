export interface EventMemory {
  id: string;
  name: string;
  year: number;
  budget: number;
  outcome: string;
  lessons: string;
}

export interface SponsorMemory {
  id: string;
  name: string;
  amount: number;
  notes: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type ChroniState = 
  | 'idle' 
  | 'thinking' 
  | 'searching' 
  | 'found' 
  | 'success' 
  | 'confused' 
  | 'sleep';

export type UserRole = 'president' | 'secretary' | 'member' | 'applicant';
export type ApplicantStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: ApplicantStatus;
  college?: string;
  department?: string;
  year?: string;
  phoneNumber?: string;
  motivation?: string;
  createdAt: string;
}

export interface Alumni {
  id: string;
  fullName: string;
  company: string;
  role: string;
  skills: string[];
  gradYear: number;
  linkedin: string;
  availableForMentorship: boolean;
  biography?: string;
}

export interface AlumniContactRequest {
  id: string;
  alumniId: string;
  alumniName: string;
  alumniCompany: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  visibility: 'Administration Only' | 'Members Only' | 'Everyone';
  organizer: string;
}


