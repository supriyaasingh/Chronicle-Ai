import fs from 'fs';
import path from 'path';
import { Alumni, AlumniContactRequest } from './types';

export const INITIAL_ALUMNI: Alumni[] = [
  {
    id: "a-1",
    fullName: "Aarav Sharma",
    company: "Google",
    role: "Software Engineer",
    skills: ["React", "TypeScript", "System Design", "Cloud"],
    gradYear: 2023,
    linkedin: "https://linkedin.com/in/aarav-sharma-demo",
    availableForMentorship: true
  },
  {
    id: "a-2",
    fullName: "Priya Mehta",
    company: "Microsoft",
    role: "Data Analyst",
    skills: ["Power BI", "SQL", "Excel", "Data Visualization"],
    gradYear: 2022,
    linkedin: "https://linkedin.com/in/priya-mehta-demo",
    availableForMentorship: true
  },
  {
    id: "a-3",
    fullName: "Rahul Verma",
    company: "Amazon",
    role: "SDE I",
    skills: ["Java", "Spring Boot", "AWS", "Microservices"],
    gradYear: 2024,
    linkedin: "https://linkedin.com/in/rahul-verma-demo",
    availableForMentorship: false
  },
  {
    id: "a-4",
    fullName: "Neha Patel",
    company: "Deloitte",
    role: "Cyber Security Analyst",
    skills: ["SOC Operations", "SIEM", "Threat Hunting", "Incident Response"],
    gradYear: 2023,
    linkedin: "https://linkedin.com/in/neha-patel-demo",
    availableForMentorship: true
  },
  {
    id: "a-5",
    fullName: "Karan Singh",
    company: "TCS",
    role: "AI Engineer",
    skills: ["Python", "Machine Learning", "LLMs", "Prompt Engineering"],
    gradYear: 2024,
    linkedin: "https://linkedin.com/in/karan-singh-demo",
    availableForMentorship: true
  },
  {
    id: "a-6",
    fullName: "Ananya Joshi",
    company: "Infosys",
    role: "Cloud Engineer",
    skills: ["Azure", "DevOps", "Docker", "Kubernetes"],
    gradYear: 2022,
    linkedin: "https://linkedin.com/in/ananya-joshi-demo",
    availableForMentorship: true
  }
];

const ALUMNI_REQ_FILE_PATH = path.join(process.cwd(), 'alumni_requests_db.json');

export class AlumniStore {
  private requests: AlumniContactRequest[] = [];
  private alumni: Alumni[] = [];

  constructor() {
    this.loadDB();
  }

  private loadDB() {
    try {
      if (fs.existsSync(ALUMNI_REQ_FILE_PATH)) {
        const fileContent = fs.readFileSync(ALUMNI_REQ_FILE_PATH, 'utf-8');
        const data = JSON.parse(fileContent);
        this.requests = data.requests || [];
        this.alumni = data.alumni || [...INITIAL_ALUMNI];
      } else {
        this.requests = [];
        this.alumni = [...INITIAL_ALUMNI];
        this.saveDB();
      }
    } catch (error) {
      console.error('[AlumniStore] Failed to load alumni requests DB:', error);
      this.requests = [];
      this.alumni = [...INITIAL_ALUMNI];
    }
  }

  private saveDB() {
    try {
      fs.writeFileSync(ALUMNI_REQ_FILE_PATH, JSON.stringify({ 
        alumni: this.alumni,
        requests: this.requests 
      }, null, 2), 'utf-8');
    } catch (error) {
      console.error('[AlumniStore] Failed to save alumni requests DB:', error);
    }
  }

  public getAlumniList(): Alumni[] {
    return this.alumni;
  }

  public addAlumni(alumData: Omit<Alumni, 'id'>): Alumni {
    const newAlum: Alumni = {
      ...alumData,
      id: `alum-${Date.now()}`
    };
    this.alumni.push(newAlum);
    this.saveDB();
    return newAlum;
  }

  public updateAlumni(id: string, updatedData: Partial<Omit<Alumni, 'id'>>): Alumni | null {
    const index = this.alumni.findIndex(a => a.id === id);
    if (index === -1) return null;

    this.alumni[index] = {
      ...this.alumni[index],
      ...updatedData
    };
    this.saveDB();
    return this.alumni[index];
  }

  public deleteAlumni(id: string): boolean {
    const index = this.alumni.findIndex(a => a.id === id);
    if (index === -1) return false;

    this.alumni.splice(index, 1);
    this.saveDB();
    return true;
  }

  public getContactRequests(): AlumniContactRequest[] {
    return this.requests;
  }

  public createContactRequest(
    alumniId: string,
    requesterId: string,
    requesterName: string,
    requesterEmail: string
  ): { success: boolean; error?: string; request?: AlumniContactRequest } {
    const alum = this.alumni.find(a => a.id === alumniId);
    if (!alum) {
      return { success: false, error: "Alumni not found." };
    }

    // Check if duplicate pending or approved exists
    const existing = this.requests.find(
      r => r.alumniId === alumniId && r.requesterId === requesterId && (r.status === 'pending' || r.status === 'approved')
    );

    if (existing) {
      return { success: false, error: `You already have a ${existing.status} request for this Alumnus.` };
    }

    const newRequest: AlumniContactRequest = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      alumniId,
      alumniName: alum.fullName,
      alumniCompany: alum.company,
      requesterId,
      requesterName,
      requesterEmail,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.requests.push(newRequest);
    this.saveDB();

    return { success: true, request: newRequest };
  }

  public updateRequestStatus(
    requestId: string,
    status: 'approved' | 'rejected'
  ): { success: boolean; error?: string; request?: AlumniContactRequest } {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) {
      return { success: false, error: "Contact request not found." };
    }

    req.status = status;
    req.resolvedAt = new Date().toISOString();
    this.saveDB();

    return { success: true, request: req };
  }
}
