import fs from 'fs';
import path from 'path';
import { User, UserRole, ApplicantStatus } from './types';

export interface DBUser extends User {
  passwordHash: string; // Stored as plain text for simple sandboxed demonstration
}

const DB_FILE_PATH = path.join(process.cwd(), 'users_db.json');

export class UsersStore {
  private users: DBUser[] = [];
  private registrationOpen: boolean = true;

  constructor() {
    this.loadDB();
    if (this.users.length === 0) {
      this.seedInitialUsers();
    }
  }

  private loadDB() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const data = JSON.parse(fileContent);
        this.users = data.users || [];
        this.registrationOpen = data.registrationOpen !== undefined ? data.registrationOpen : true;
        console.log(`[UsersStore] Loaded ${this.users.length} users. Registration Open: ${this.registrationOpen}`);
        
        // Force include the requested MVP test accounts if they aren't in the loaded JSON
        const hasRequestedPres = this.users.some(u => u.email === 'president@club.com');
        if (!hasRequestedPres) {
          console.log('[UsersStore] Injecting newly requested MVP test accounts...');
          this.seedInitialUsers();
        }
      }
    } catch (error) {
      console.error('[UsersStore] Failed to load user DB:', error);
    }
  }

  private saveDB() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify({
        users: this.users,
        registrationOpen: this.registrationOpen
      }, null, 2), 'utf-8');
    } catch (error) {
      console.error('[UsersStore] Failed to save user DB:', error);
    }
  }

  private seedInitialUsers() {
    console.log('[UsersStore] Seeding initial Rotaract club roles with requested MVP test accounts...');
    this.users = [
      {
        id: 'u-pres',
        fullName: 'Aarav Sharma (President)',
        email: 'president@club.com',
        passwordHash: 'password123',
        role: 'president',
        status: 'approved',
        college: 'Imperial Institute of Technology',
        department: 'Computer Science',
        year: '4th Year',
        phoneNumber: '+91 98765 43210',
        motivation: 'To lead the club into a new era of digital-first community memory scaling.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'u-sec',
        fullName: 'Ananya Iyer (Secretary)',
        email: 'secretary@club.com',
        passwordHash: 'password123',
        role: 'secretary',
        status: 'approved',
        college: 'Imperial Institute of Technology',
        department: 'Information Technology',
        year: '3rd Year',
        phoneNumber: '+91 87654 32109',
        motivation: 'To document every lesson, budget, and milestone of our Rotaract journey.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'u-mem',
        fullName: 'Vikram Malhotra (Member)',
        email: 'member@club.com',
        passwordHash: 'password123',
        role: 'member',
        status: 'approved',
        college: 'Imperial Institute of Technology',
        department: 'Electronics',
        year: '2nd Year',
        phoneNumber: '+91 76543 21098',
        motivation: 'To participate in blood donation camps and AI outreach projects.',
        createdAt: new Date().toISOString()
      }
    ];
    this.registrationOpen = true;
    this.saveDB();
  }

  public getRegistrationStatus(): boolean {
    return this.registrationOpen;
  }

  public setRegistrationStatus(open: boolean) {
    this.registrationOpen = open;
    this.saveDB();
  }

  public register(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    college: string;
    department: string;
    year: string;
    phoneNumber: string;
    motivation: string;
  }): { success: boolean; error?: string; user?: User } {
    if (!this.registrationOpen) {
      return { success: false, error: 'Registration is currently closed by the President.' };
    }

    const emailNormalized = data.email.toLowerCase().trim();
    const exists = this.users.find(u => u.email.toLowerCase() === emailNormalized);
    if (exists) {
      return { success: false, error: 'Email already registered.' };
    }

    const newUser: DBUser = {
      id: `u-${Date.now()}`,
      fullName: data.fullName,
      email: emailNormalized,
      passwordHash: data.passwordHash,
      role: 'applicant', // Role defaults to applicant
      status: 'pending',  // Status defaults to pending
      college: data.college,
      department: data.department,
      year: data.year,
      phoneNumber: data.phoneNumber,
      motivation: data.motivation,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveDB();

    // Remove passwordHash before returning
    const { passwordHash, ...userResponse } = newUser;
    return { success: true, user: userResponse };
  }

  public registerWithRole(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    college: string;
    department: string;
    year: string;
    phoneNumber: string;
    motivation: string;
    role: UserRole;
    status: ApplicantStatus;
  }): { success: boolean; error?: string; user?: User } {
    const emailNormalized = data.email.toLowerCase().trim();
    const exists = this.users.find(u => u.email.toLowerCase() === emailNormalized);
    if (exists) {
      return { success: false, error: 'Email already registered.' };
    }

    const newUser: DBUser = {
      id: `u-${Date.now()}`,
      fullName: data.fullName,
      email: emailNormalized,
      passwordHash: data.passwordHash,
      role: data.role,
      status: data.status,
      college: data.college,
      department: data.department,
      year: data.year,
      phoneNumber: data.phoneNumber,
      motivation: data.motivation,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveDB();

    const { passwordHash, ...userResponse } = newUser;
    return { success: true, user: userResponse };
  }


  public login(email: string, passwordHash: string): { success: boolean; error?: string; user?: User } {
    const emailNormalized = email.toLowerCase().trim();
    const user = this.users.find(u => u.email.toLowerCase() === emailNormalized);
    
    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (user.passwordHash !== passwordHash) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (user.role === 'applicant' && user.status === 'rejected') {
      return { success: false, error: 'Your application has been rejected. Please contact the Club President.' };
    }

    const { passwordHash: _, ...userResponse } = user;
    return { success: true, user: userResponse };
  }

  public getUsers(): User[] {
    return this.users.map(({ passwordHash, ...user }) => user);
  }

  public updateStatus(userId: string, status: ApplicantStatus): { success: boolean; error?: string; user?: User } {
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    user.status = status;
    if (status === 'approved') {
      user.role = 'member'; // Approved applicants become members!
    } else if (status === 'rejected') {
      user.role = 'applicant'; // Rejected candidates remain applicants
    }

    this.saveDB();

    const { passwordHash, ...userResponse } = user;
    return { success: true, user: userResponse };
  }

  public updateRole(userId: string, role: UserRole): { success: boolean; error?: string; user?: User } {
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    user.role = role;
    this.saveDB();

    const { passwordHash, ...userResponse } = user;
    return { success: true, user: userResponse };
  }
}
