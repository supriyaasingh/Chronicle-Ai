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
