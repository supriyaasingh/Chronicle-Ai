import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { CogneeProvider } from "./src/cognee";
import { UsersStore } from "./src/users_store";
import { AlumniStore } from "./src/alumni_store";
import { MeetingsStore } from "./src/meetings_store";

dotenv.config();

const app = express();
app.use(express.json());

// Initialize server-side Cognee Memory Layer
const cognee = new CogneeProvider();
const usersStore = new UsersStore();
const alumniStore = new AlumniStore();
const meetingsStore = new MeetingsStore();

const PORT = 3000;

// Lazy initialization of GoogleGenAI to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in AI Studio Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper function to retry content generation across multiple models and handles exponential backoff
async function generateWithModelRetry(ai: any, contents: any[], systemInstruction: string): Promise<string> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let delay = 1000;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Chronicle AI] Querying model ${model} (attempt ${attempt + 1})...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        });
        
        if (response && response.text) {
          console.log(`[Chronicle AI] Successfully generated response using model: ${model}`);
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const status = err.status || (err.error && err.error.code);
        console.log(`[Chronicle AI] Model ${model} returned status ${status}. Moving to fallback/retry options...`);
        
        // Don't retry non-transient auth/bad-request errors
        if (status === 400 || status === 401 || status === 403) {
          break;
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5;
      }
    }
  }

  throw lastError || new Error("All fallback models were exhausted.");
}

// Highly detailed, premium offline/fallback generator that preserves UX when API is down
function generateHeuristicResponse(message: string, memories: any): string {
  const query = (message || "").toLowerCase();
  const events = Array.isArray(memories?.events) ? memories.events : [];
  const sponsors = Array.isArray(memories?.sponsors) ? memories.sponsors : [];
  
  let response = `### 👻 CHRONI'S OFFLINE ARCHIVE RECOVERY MODE\n\n*The cloud archives are currently experiencing heavy demand spikes, but as the spirit of organizational memory, I have safely preserved our records locally! Here is what I retrieved:* \n\n`;

  if (query.includes("plan") || query.includes("techfest") || query.includes("hackday") || query.includes("codesprint")) {
    const targetEvent = events.find((e: any) => {
      if (!e || !e.name) return false;
      const nameLower = String(e.name).toLowerCase();
      return query.includes(nameLower) || (nameLower.split(' ')[0] && query.includes(nameLower.split(' ')[0]));
    });
    const matchedEvents = targetEvent ? [targetEvent] : events;
    
    response += `### 📋 STRATEGIC EVENT BLUEPRINT (LOCAL SYNTHESIS)\n\n`;
    response += `Based on our past event data, here is an optimized blueprint strategy for your next initiative:\n\n`;
    
    if (matchedEvents.length > 0) {
      matchedEvents.forEach((e: any) => {
        if (!e) return;
        const name = e.name || "Unnamed Event";
        const year = e.year || "N/A";
        const budget = e.budget ? Number(e.budget) : 0;
        const outcome = e.outcome || "No outcome logged.";
        const lessons = e.lessons || "No lessons logged.";
        response += `#### **Past Reference File: ${name} (${year})**\n`;
        response += `- **Logged Budget:** ₹${budget.toLocaleString()}\n`;
        response += `- **Outcome:** ${outcome}\n`;
        response += `- **Archived Retrospective:** *"${lessons}"*\n\n`;
      });
    } else {
      response += `*No historical event records were found in the current archive directory.*\\n\\n`;
    }

    response += `### 🛠️ Recommended Actionable Timeline\n`;
    response += `- **Phase 1 (Outreach & Financing):** Review past sponsor files. Google Developer Groups has historically contributed high amounts. Start pitching them exactly 3 months early to allow processing.\n`;
    response += `- **Phase 2 (Food & Logistical Flow):** Past organizers noted catering delays. Stagger lunch schedules or double your refreshment tokens budget to streamline food counters.\n`;
    response += `- **Phase 3 (Operational Tech Setup):** To minimize registration bottlenecks, migrate sign-ups online and test electrical/Wi-Fi capacities 48 hours prior.\n`;
    
  } else if (query.includes("sponsor") || query.includes("money") || query.includes("funding") || query.includes("contribut")) {
    response += `### 💼 SPONSORSHIP PORTFOLIO RETRIEVAL\n\n`;
    if (sponsors.length > 0) {
      const totalAmt = sponsors.reduce((acc: number, curr: any) => {
        const amt = curr && curr.amount ? Number(curr.amount) : 0;
        return acc + (isNaN(amt) ? 0 : amt);
      }, 0);
      response += `We have active logs for **${sponsors.length} key sponsors** representing a cumulative contribution of **₹${totalAmt.toLocaleString()}**. Here are our historical partners:\n\n`;
      
      sponsors.forEach((s: any) => {
        if (!s) return;
        const name = s.name || "Unnamed Sponsor";
        const amount = s.amount ? Number(s.amount) : 0;
        const notes = s.notes || "No notes logged.";
        response += `- **${name}** (Funding: **₹${amount.toLocaleString()}**)\n`;
        response += `  *Archived Notes:* ${notes}\n\n`;
      });
      
      response += `### 💡 Future Outreach Tactics\n`;
      response += `1. **Google Developer Groups** contributed premium swag and funding. Maintain active contacts with them.\n`;
      response += `2. For local community partners, offer clear branding slots and silver sponsor banners early.\n`;
    } else {
      response += `No active sponsorship folders found in local memory. You can add brand records using the **Sponsorship Files** tab.`;
    }
    
  } else if (query.includes("lesson") || query.includes("mistake") || query.includes("avoid") || query.includes("retro")) {
    response += `### 💡 HISTORICAL RETROSPECTIVES & WISDOM\n\n`;
    if (events.length > 0) {
      response += `I have safely recovered these critical pieces of advice logged by past club officers to ensure our team avoids repetitive errors:\n\n`;
      events.forEach((e: any) => {
        if (!e) return;
        const name = e.name || "Unnamed Event";
        const year = e.year || "N/A";
        const lessons = e.lessons || "No lessons logged.";
        response += `#### **From ${name} (${year}):**\n`;
        response += `- **Outcome Warning:** Attendees registered in high numbers, but logistics required optimizations.\n`;
        response += `- **Direct Advice:** *"${lessons}"*\n\n`;
      });
      response += `### 🧠 Top Chroni Guidelines:\n`;
      response += `1. **Catering Buffers:** Long queues ruin participant mood. Stagger refreshments.\n`;
      response += `2. **Dependency Checking:** Request attendees pre-install packages via email to save network resources.\n`;
    } else {
      response += `No past event lessons recorded yet. Try creating some memories in the **Event Memories** tab!`;
    }
    
  } else {
    response += `### 👋 GREETINGS FROM CHRONI\n\n`;
    response += `I am safely guarding our club's archives! I can help you summarize past logs, find lessons learned, and prepare checklists.\n\n`;
    response += `Currently, our local archives store:\n`;
    response += `- **${events.length} Past Event Logs**\n`;
    response += `- **${sponsors.length} Sponsorship Partner Files**\n\n`;
    response += `Ask me to **"Plan TechFest 2027"** or ask **"Which sponsors worked best?"** to see my memory synthesis in action!`;
  }
  
  return response;
}

// ================== AUTHENTICATION & REGISTRATION ENDPOINTS ==================

// Login endpoint
app.post("/api/auth/login", (req: express.Request, res: express.Response): void => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }
    const result = usersStore.login(email, password);
    if (!result.success) {
      res.status(401).json({ error: result.error || "Authentication failed." });
      return;
    }
    res.json({ success: true, user: result.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Login failed." });
  }
});

// Register applicant endpoint
app.post("/api/auth/register", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { fullName, email, password, college, department, year, phoneNumber, motivation } = req.body;
    if (!fullName || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required." });
      return;
    }
    const result = usersStore.register({
      fullName,
      email,
      passwordHash: password,
      college: college || "",
      department: department || "",
      year: year || "",
      phoneNumber: phoneNumber || "",
      motivation: motivation || ""
    });

    if (!result.success) {
      res.status(400).json({ error: result.error || "Registration failed." });
      return;
    }

    // Save registration event in Cognee memory
    try {
      await cognee.saveMemory("Applicant", fullName, {
        email: email.toLowerCase().trim(),
        college: college || "",
        department: department || "",
        status: "pending",
        motivation: motivation || ""
      });
    } catch (err) {
      console.error("[Cognee] Failed to save applicant registration memory:", err);
    }

    res.json({ success: true, user: result.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Registration failed." });
  }
});

// Password reset placeholder endpoint
app.post("/api/auth/reset-password", (req: express.Request, res: express.Response): void => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }
    res.json({
      success: true,
      message: `Password reset simulation successful. A recovery link has been configured for ${email}.`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Password reset failed." });
  }
});

// President & Secretary Controls: Get Applicants
app.get("/api/president/applicants", (req: express.Request, res: express.Response): void => {
  try {
    const users = usersStore.getUsers();
    // Return all users who are applicants or members to manage
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve applicants." });
  }
});

// President & Secretary Controls: Approve Applicant (Applicant becomes Member)
app.post("/api/president/approve", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "User ID is required." });
      return;
    }
    const result = usersStore.updateStatus(userId, "approved");
    if (!result.success || !result.user) {
      res.status(400).json({ error: result.error || "Failed to approve applicant." });
      return;
    }

    // Save as Approved Member in Cognee and establish relations
    try {
      const user = result.user;
      const memberNode = await cognee.saveMemory("Member", user.fullName, {
        email: user.email,
        college: user.college || "",
        department: user.department || "",
        year: user.year || "",
        role: "member",
        status: "approved"
      });

      console.log(`[Cognee] Saved approved member memory: ${user.fullName}`);
    } catch (err) {
      console.error("[Cognee] Failed to log Member memory to Cognee on approval:", err);
    }

    res.json({ success: true, user: result.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to approve applicant." });
  }
});

// President & Secretary Controls: Reject Applicant
app.post("/api/president/reject", (req: express.Request, res: express.Response): void => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "User ID is required." });
      return;
    }
    const result = usersStore.updateStatus(userId, "rejected");
    if (!result.success) {
      res.status(400).json({ error: result.error || "Failed to reject applicant." });
      return;
    }
    res.json({ success: true, user: result.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to reject applicant." });
  }
});

// President & Secretary Controls: Update User Role (Promote/Demote)
app.post("/api/president/update-role", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      res.status(400).json({ error: "User ID and Role are required." });
      return;
    }

    const targetUser = usersStore.getUsers().find(u => u.id === userId);
    const fullName = targetUser ? targetUser.fullName : "Club Member";

    const result = usersStore.updateRole(userId, role);
    if (!result.success) {
      res.status(400).json({ error: result.error || "Failed to update role." });
      return;
    }

    // Track all role changes in Cognee memory!
    // Example: "Aarav Sharma promoted to President"
    try {
      const verb = (role === 'president' || role === 'secretary') ? 'promoted' : 'demoted';
      const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
      const actionMessage = `${fullName} ${verb} to ${capitalizedRole}`;

      await cognee.saveMemory("Decision", actionMessage, {
        userId,
        fullName,
        role,
        verb,
        timestamp: new Date().toISOString()
      });
      console.log(`[Cognee] Saved role change memory: ${actionMessage}`);
    } catch (cogneeErr) {
      console.error("[Cognee] Failed to save promotion memory:", cogneeErr);
    }

    res.json({ success: true, user: result.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update role." });
  }
});

// Dynamic Officer and Approved Member Registration for Demo Mode
app.post("/api/auth/register-officer", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { fullName, email, password, college, department, year, phoneNumber, role } = req.body;
    if (!fullName || !email || !password || !role) {
      res.status(400).json({ error: "Name, email, password, and role are required." });
      return;
    }

    const status = "approved"; // Automatically pre-approved for Demo Mode officer registrations

    const result = usersStore.registerWithRole({
      fullName,
      email,
      passwordHash: password,
      college: college || "",
      department: department || "",
      year: year || "",
      phoneNumber: phoneNumber || "",
      motivation: `Pre-approved dynamic role account creation during MVP evaluation.`,
      role,
      status
    });

    if (!result.success) {
      res.status(400).json({ error: result.error || "Registration failed." });
      return;
    }

    // Trace in Cognee memory
    try {
      await cognee.saveMemory(role === "president" || role === "secretary" ? "Officer" : "Member", fullName, {
        email: email.toLowerCase().trim(),
        college: college || "",
        department: department || "",
        role,
        status: "approved",
        demoRegister: true
      });
    } catch (err) {
      console.error("[Cognee] Failed to save officer memory:", err);
    }

    res.json({ success: true, user: result.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Registration failed." });
  }
});

// Alumni Endpoints
app.get("/api/alumni", (req: express.Request, res: express.Response): void => {
  try {
    const list = alumniStore.getAlumniList();
    res.json({ success: true, alumni: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load alumni." });
  }
});

app.post("/api/alumni", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { fullName, company, role, skills, gradYear, linkedin, availableForMentorship, biography } = req.body;
    if (!fullName || !company || !role || !skills || !gradYear || !linkedin) {
      res.status(400).json({ error: "Missing required alumni fields." });
      return;
    }
    const skillsArr = typeof skills === 'string' ? skills.split(',').map((s: string) => s.trim()) : skills;
    const alum = alumniStore.addAlumni({
      fullName,
      company,
      role,
      skills: skillsArr,
      gradYear: Number(gradYear),
      linkedin,
      availableForMentorship: availableForMentorship === true || availableForMentorship === 'Yes' || availableForMentorship === 'true'
    });

    try {
      const alumNode = await cognee.saveMemory("Alumni", fullName, {
        alumniId: alum.id,
        company,
        role,
        skills: skillsArr.join(', '),
        gradYear,
        availableForMentorship: alum.availableForMentorship ? "Yes" : "No",
        linkedin,
        biography: biography || ""
      });

      const companyNodeId = `comp-${company.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const graph = await cognee.getFullGraph();
      if (!graph.nodes.some(n => n.id === companyNodeId)) {
        await cognee.saveMemory("Company", company, { domain: "Industry Partner" });
      }
      cognee.connectNodes(alumNode.id, companyNodeId, "EMPLOYED_AT");

      if (alum.availableForMentorship) {
        const mentorId = `mentor-slot-${alumNode.id}`;
        await cognee.saveMemory("Mentorship", `${fullName} Mentorship Session`, { status: "Available", domain: role });
        cognee.connectNodes(alumNode.id, mentorId, "OFFERS_MENTORSHIP");
      }

      for (const skill of skillsArr) {
        const skillNodeId = `skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        if (!graph.nodes.some(n => n.id === skillNodeId)) {
          await cognee.saveMemory("Skill", skill, { category: "Technical" });
        }
        cognee.connectNodes(alumNode.id, skillNodeId, "SKILLED_IN");
      }
    } catch (cogneeErr) {
      console.error("[Cognee] Failed to save alumni memory nodes:", cogneeErr);
    }

    res.json({ success: true, alumni: alum });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to add alumni." });
  }
});

app.put("/api/alumni/:id", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { fullName, company, role, skills, gradYear, linkedin, availableForMentorship, biography } = req.body;
    const skillsArr = typeof skills === 'string' ? skills.split(',').map((s: string) => s.trim()) : skills;
    
    const updated = alumniStore.updateAlumni(id, {
      fullName,
      company,
      role,
      skills: skillsArr,
      gradYear: Number(gradYear),
      linkedin,
      availableForMentorship: availableForMentorship === true || availableForMentorship === 'Yes' || availableForMentorship === 'true'
    });

    if (updated) {
      try {
        const fullGraph = await cognee.getFullGraph();
        const node = fullGraph.nodes.find(n => n.type === 'Alumni' && n.properties.alumniId === id);
        if (node) {
          cognee.updateMemory(node.id, {
            name: fullName,
            properties: {
              alumniId: id,
              company,
              role,
              skills: skillsArr.join(', '),
              gradYear,
              availableForMentorship: updated.availableForMentorship ? "Yes" : "No",
              linkedin,
              biography: biography || ""
            }
          });
        }
      } catch (cogneeErr) {
        console.error("[Cognee] Failed to update alumni memory node:", cogneeErr);
      }
    }

    res.json({ success: true, alumni: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update alumni." });
  }
});

app.delete("/api/alumni/:id", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = alumniStore.deleteAlumni(id);
    if (deleted) {
      try {
        const fullGraph = await cognee.getFullGraph();
        const node = fullGraph.nodes.find(n => n.type === 'Alumni' && n.properties.alumniId === id);
        if (node) {
          cognee.deleteMemory(node.id);
        }
      } catch (cogneeErr) {
        console.error("[Cognee] Failed to delete alumni memory node:", cogneeErr);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete alumni." });
  }
});

// Meetings Endpoints
app.get("/api/meetings", (req: express.Request, res: express.Response): void => {
  try {
    const role = req.query.role as string || "Everyone";
    const list = meetingsStore.getVisibleMeetings(role);
    res.json({ success: true, meetings: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load meetings." });
  }
});

app.post("/api/meetings", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { title, description, date, time, venue, visibility, organizer } = req.body;
    if (!title || !date || !time || !venue || !visibility) {
      res.status(400).json({ error: "Missing required meeting fields." });
      return;
    }
    const meeting = meetingsStore.addMeeting({
      title,
      description: description || "",
      date,
      time,
      venue,
      visibility,
      organizer: organizer || "President"
    });

    try {
      const participants = visibility === 'Administration Only' ? 'President, Secretary' : visibility === 'Members Only' ? 'Members, President, Secretary' : 'Everyone';
      await cognee.saveMemory("Meeting", title, {
        meetingId: meeting.id,
        description: description || "",
        date,
        time,
        venue,
        visibility,
        participants,
        organizer: organizer || "President"
      });
    } catch (cogneeErr) {
      console.error("[Cognee] Failed to save meeting memory node:", cogneeErr);
    }

    res.json({ success: true, meeting, message: "New meeting added to club memory!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to add meeting." });
  }
});

app.put("/api/meetings/:id", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, date, time, venue, visibility, organizer } = req.body;
    const updated = meetingsStore.updateMeeting(id, {
      title,
      description,
      date,
      time,
      venue,
      visibility,
      organizer
    });

    if (updated) {
      try {
        const fullGraph = await cognee.getFullGraph();
        const node = fullGraph.nodes.find(n => n.type === 'Meeting' && n.properties.meetingId === id);
        if (node) {
          const participants = visibility === 'Administration Only' ? 'President, Secretary' : visibility === 'Members Only' ? 'Members, President, Secretary' : 'Everyone';
          cognee.updateMemory(node.id, {
            name: title,
            properties: {
              meetingId: id,
              description,
              date,
              time,
              venue,
              visibility,
              participants,
              organizer
            }
          });
        }
      } catch (cogneeErr) {
        console.error("[Cognee] Failed to update meeting memory node:", cogneeErr);
      }
    }

    res.json({ success: true, meeting: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update meeting." });
  }
});

app.delete("/api/meetings/:id", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = meetingsStore.deleteMeeting(id);
    if (deleted) {
      try {
        const fullGraph = await cognee.getFullGraph();
        const node = fullGraph.nodes.find(n => n.type === 'Meeting' && n.properties.meetingId === id);
        if (node) {
          cognee.deleteMemory(node.id);
        }
      } catch (cogneeErr) {
        console.error("[Cognee] Failed to delete meeting memory node:", cogneeErr);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete meeting." });
  }
});

app.get("/api/alumni/requests", (req: express.Request, res: express.Response): void => {
  try {
    const requests = alumniStore.getContactRequests();
    res.json({ success: true, requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load contact requests." });
  }
});

app.post("/api/alumni/request", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { alumniId, requesterId, requesterName, requesterEmail } = req.body;
    if (!alumniId || !requesterId || !requesterName || !requesterEmail) {
      res.status(400).json({ error: "All request fields are required." });
      return;
    }

    const result = alumniStore.createContactRequest(alumniId, requesterId, requesterName, requesterEmail);
    if (!result.success) {
      res.status(400).json({ error: result.error || "Failed to submit request." });
      return;
    }

    // Save relationship/decision in Cognee
    try {
      await cognee.saveMemory("Decision", `${requesterName} requested contact with Alumni`, {
        requester: requesterName,
        alumniId,
        status: "pending",
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("[Cognee] Failed to save contact request memory:", e);
    }

    res.json({ success: true, request: result.request });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to request contact." });
  }
});

app.post("/api/alumni/request/status", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { requestId, status } = req.body;
    if (!requestId || !status) {
      res.status(400).json({ error: "Request ID and Status are required." });
      return;
    }

    const result = alumniStore.updateRequestStatus(requestId, status);
    if (!result.success) {
      res.status(400).json({ error: result.error || "Failed to resolve request." });
      return;
    }

    // Trace decision in Cognee
    try {
      await cognee.saveMemory("Decision", `Alumni contact request resolved as ${status}`, {
        requestId,
        status,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("[Cognee] Failed to save contact resolution memory:", e);
    }

    res.json({ success: true, request: result.request });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update request." });
  }
});


// Get registration Open/Closed status
app.get("/api/president/registration-status", (req: express.Request, res: express.Response): void => {
  try {
    const isOpen = usersStore.getRegistrationStatus();
    res.json({ success: true, registrationOpen: isOpen });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get registration status." });
  }
});

// Set registration Open/Closed status
app.post("/api/president/registration-status", (req: express.Request, res: express.Response): void => {
  try {
    const { registrationOpen } = req.body;
    if (registrationOpen === undefined) {
      res.status(400).json({ error: "registrationOpen field (boolean) is required." });
      return;
    }
    usersStore.setRegistrationStatus(registrationOpen);
    res.json({ success: true, registrationOpen });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update registration status." });
  }
});

// API endpoints for MemoryService and Cognee Graph Display
app.get("/api/memory/graph", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const graph = await cognee.getFullGraph();
    res.json(graph);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve Cognee graph." });
  }
});

app.post("/api/memory/sync", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { events, sponsors } = req.body;
    
    if (events && Array.isArray(events)) {
      for (const e of events) {
        // Query Cognee to check if this event node already exists
        const matches = await cognee.searchMemory(e.name);
        const exists = matches.some(n => n.type === "Event" && n.name.toLowerCase() === e.name.toLowerCase());
        
        if (!exists) {
          console.log(`[MemoryService] Syncing new Event memory to Cognee: ${e.name}`);
          await cognee.saveMemory("Event", e.name, {
            year: Number(e.year),
            budget: Number(e.budget),
            outcome: e.outcome,
            lessons: e.lessons
          });
        }
      }
    }

    if (sponsors && Array.isArray(sponsors)) {
      for (const s of sponsors) {
        const matches = await cognee.searchMemory(s.name);
        const exists = matches.some(n => n.type === "Sponsor" && n.name.toLowerCase() === s.name.toLowerCase());
        
        if (!exists) {
          console.log(`[MemoryService] Syncing new Sponsor memory to Cognee: ${s.name}`);
          await cognee.saveMemory("Sponsor", s.name, {
            amount: Number(s.amount),
            notes: s.notes
          });
        }
      }
    }

    res.json({ success: true, graph: await cognee.getFullGraph() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to sync memories to Cognee." });
  }
});

// API endpoint for natural language memory retrieval through Cognee and LLM
app.post("/api/chat", async (req: express.Request, res: express.Response): Promise<void> => {
  let matchedNodes: any[] = [];
  let relatedNodes: any[] = [];
  let relatedEdges: any[] = [];

  try {
    const { message, memories, history, role } = req.body;
    const userRole = role || "Everyone";

    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    const isMeetingAllowed = (node: any) => {
      if (node.type !== 'Meeting') return true;
      const visibility = node.properties.visibility;
      if (!visibility) return true;
      if (userRole === 'president' || userRole === 'secretary') return true;
      if (userRole === 'member') return (visibility === 'Members Only' || visibility === 'Everyone');
      return (visibility === 'Everyone');
    };

    // 1. QUERY COGNEE: Locate starting nodes matching keywords
    matchedNodes = (await cognee.searchMemory(message)).filter(isMeetingAllowed);
    
    // 2. RETRIEVE RELATED MEMORIES: Traverse the graph to build highly connected context
    const visitedNodeIds = new Set<string>();
    const visitedEdgeIds = new Set<string>();

    for (const node of matchedNodes.slice(0, 3)) {
      const subgraph = await cognee.retrieveRelatedMemories(node.id, 2);
      subgraph.nodes.filter(isMeetingAllowed).forEach(n => {
        if (!visitedNodeIds.has(n.id)) {
          visitedNodeIds.add(n.id);
          relatedNodes.push(n);
        }
      });
      subgraph.edges.forEach(e => {
        if (!visitedEdgeIds.has(e.id)) {
          visitedEdgeIds.add(e.id);
          relatedEdges.push(e);
        }
      });
    }

    // 3. BUILD MEMORY CONTEXT: Compile graph relationships and details for the LLM
    let cogneeContextStr = "";
    if (relatedNodes.length > 0) {
      cogneeContextStr += "\n\n=== COGNEE ORGANIZATIONAL GRAPH MEMORIES RETRIEVED ===\n";
      
      relatedNodes.forEach(node => {
        cogneeContextStr += `- Node ID: ${node.id} (${node.type}: "${node.name}")\n`;
        Object.entries(node.properties).forEach(([key, value]) => {
          cogneeContextStr += `  * ${key}: ${value}\n`;
        });
      });

      cogneeContextStr += "\n=== CONNECTED RELATIONSHIPS (EDGES) ===\n";
      const fullGraph = await cognee.getFullGraph();
      relatedEdges.forEach(edge => {
        const sourceNode = relatedNodes.find(n => n.id === edge.sourceId) || fullGraph.nodes.find(n => n.id === edge.sourceId);
        const targetNode = relatedNodes.find(n => n.id === edge.targetId) || fullGraph.nodes.find(n => n.id === edge.targetId);
        if (sourceNode && targetNode) {
          cogneeContextStr += `* [${sourceNode.name}] --(${edge.relationType})--> [${targetNode.name}]\n`;
        }
      });
      cogneeContextStr += "========================================================\n\n";
    }

    const ai = getGenAI();

    // Setup events and sponsors strings as backups or general lists
    const eventsStr = memories?.events && memories.events.length > 0
      ? memories.events.map((e: any) => 
          `- Event: ${e.name} (${e.year})\n  Budget: ₹${Number(e.budget).toLocaleString()}\n  Outcome: ${e.outcome}\n  Lessons Learned: ${e.lessons}`
        ).join("\n")
      : "No events recorded yet.";

    const sponsorsStr = memories?.sponsors && memories.sponsors.length > 0
      ? memories.sponsors.map((s: any) => 
          `- Sponsor: ${s.name}\n  Contribution Amount: ₹${Number(s.amount).toLocaleString()}\n  Notes: ${s.notes}`
        ).join("\n")
      : "No sponsors recorded yet.";

    const visibleMeetings = meetingsStore.getVisibleMeetings(userRole);
    const meetingsStr = visibleMeetings.length > 0
      ? visibleMeetings.map((m: any) =>
          `- Meeting: ${m.title}\n  Description: ${m.description}\n  Date: ${m.date}\n  Time: ${m.time}\n  Venue: ${m.venue}\n  Visibility: ${m.visibility}\n  Organizer: ${m.organizer}`
        ).join("\n")
      : "No meetings scheduled.";

    const systemInstruction = `You are Chroni, the premium, adorable mascot and spirit of organizational memory for student clubs.
Your purpose is to help clubs preserve knowledge (events, sponsors, budgets, decisions, meetings, and lessons learned) so leadership transitions are seamless.

You reside atop the Cognee Memory Layer, which maps organizational relationships in a knowledge graph.

${cogneeContextStr ? `Here is the related memory graph retrieved directly from Cognee based on the user's message:\n${cogneeContextStr}` : ''}

Here is the general state of the club's archive database you guard:
--- SCHEDULED CLUB MEETINGS (Respecting user role permissions: ${userRole.toUpperCase()}) ---
${meetingsStr}

--- RECORDED PAST EVENTS ---
${eventsStr}

--- RECORDED SPONSORS ---
${sponsorsStr}
-----------------------------

Your personality guidelines:
- You are friendly, highly intelligent, supportive, and extremely organized.
- You are professional and premium, NOT childish, silly, or distracting.
- You speak as the club's dedicated memory spirit. You refer to the database as "our sacred archives" or "our collective club memory" that is mapped inside Cognee.
- When answering questions, prioritize using the exact historical events, budgets, sponsors, decisions, meetings, and lessons retrieved from the Cognee Memory Graph above. Mention the connections, e.g. "Google Developer Groups sponsored TechFest 2025...".
- If the user asks about meetings (e.g., "When is my next meeting?", "When is the next board meeting?", "Show upcoming member meetings.", "What meetings are scheduled this week?", "Show executive committee meetings"), respond strictly based on the meetings listed under SCHEDULED CLUB MEETINGS or meeting memory nodes above. Make sure to adhere to the role permission boundaries (you can see ${userRole.toUpperCase()} meetings). If a meeting is not in this list, politely say it is not scheduled or you don't have access permissions.
- Use elegant Markdown formatting (bolding, headers, bullet points, clean spacing) to structure your recommendations beautifully. Avoid raw unstructured blocks of text.
- Be concise yet thorough. Give concrete numbers, lists, and actionable steps.`;

    // Map conversation history to Gemini contents structure
    const contents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Append the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const reply = await generateWithModelRetry(ai, contents, systemInstruction);
    res.json({ 
      reply,
      cogneeSubGraph: {
        nodes: relatedNodes,
        edges: relatedEdges
      }
    });

  } catch (error: any) {
    console.log(`[Chronicle AI] Handled transition to offline archive recovery mode: ${error.message || error}`);
    try {
      const { message, memories, role } = req.body;
      const userRole = role || "Everyone";
      
      const isMeetingAllowed = (node: any) => {
        if (node.type !== 'Meeting') return true;
        const visibility = node.properties.visibility;
        if (!visibility) return true;
        if (userRole === 'president' || userRole === 'secretary') return true;
        if (userRole === 'member') return (visibility === 'Members Only' || visibility === 'Everyone');
        return (visibility === 'Everyone');
      };

      const fallbackReply = generateHeuristicResponse(message, memories);
      res.json({ 
        reply: fallbackReply,
        cogneeSubGraph: {
          nodes: matchedNodes.filter(isMeetingAllowed),
          edges: []
        }
      });
    } catch (fallbackError: any) {
      console.log(`[Chronicle AI] Offline fallback generation failed: ${fallbackError}`);
      res.status(500).json({ 
        error: error.message || "An error occurred while generating a response from the memory archive." 
      });
    }
  }
});

// API endpoint to generate Leadership Handover Report from Cognee and LLM
app.post("/api/handover", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const graph = await cognee.getFullGraph();
    const nodes = graph.nodes;

    // Collate items for report
    const eventNodes = nodes.filter(n => n.type === 'Event');
    const sponsorNodes = nodes.filter(n => n.type === 'Sponsor');
    const lessonNodes = nodes.filter(n => n.type === 'Lesson');
    const decisionNodes = nodes.filter(n => n.type === 'Decision');

    let promptContext = `You are Chroni, the premium mascot and spirit of organizational memory for student clubs.
Your purpose is to compile a high-fidelity, polished, and comprehensive Leadership Handover Report for our student club.
You will extract wisdom from our Cognee graph memory layer.

Here are the real memories retrieved directly from Cognee:

--- RECORDED CLUB EVENTS ---
${eventNodes.map(e => `- Event: ${e.name} (${e.properties.year})\n  Budget: ₹${Number(e.properties.budget || 0).toLocaleString()}\n  Outcome: ${e.properties.outcome}`).join("\n")}

--- RECORDED SPONSORS ---
${sponsorNodes.map(s => `- Sponsor: ${s.name}\n  Contribution: ₹${Number(s.properties.amount || 0).toLocaleString()}\n  Notes: ${s.properties.notes}`).join("\n")}

--- RECORDED LESSONS ---
${lessonNodes.map(l => `- Lesson Detail: ${l.properties.detail || l.name}`).join("\n")}

--- RECORDED HISTORICAL DECISIONS ---
${decisionNodes.map(d => `- Decision: ${d.name}\n  Detail: ${d.properties.detail || ''}`).join("\n")}

Please generate a professional, structured executive report for incoming leaders.
You MUST output exactly these 6 sections with these titles (as ## markdown headers):

## Club Summary
Provide a high-level summary of the club's growth, total events managed, total budget, and cumulative strength.

## Top Sponsors
Rank the sponsors by their contributions and add notes on how to approach them and what swag/assets they require.

## Most Successful Events
List our most successful events (such as TechFest, HackDay, CodeSprint, etc.), detailing budgets, attendance highlights, and overall positive outcomes.

## Biggest Mistakes To Avoid
List critical issues logged from retrospectives, focusing on scheduling bottlenecks, food line staggering, wi-fi testing, or system server capacity under load.

## Recommended Actions For Next Team
Provide a highly specific, tactical timeline/action plan for incoming leaders (e.g. outreach 3 months early, dry-runs 48 hours prior, snack/donut budgets for volunteer overnight morale).

## Historical Decisions
Detail documented tactical decisions made by past committees that saved the day.

Format with crisp headings, list items, bold stats, and an inspirational concluding sentence. No conversational intro/outro text, start directly with the report.`;

    const ai = getGenAI();
    let report = "";
    try {
      report = await generateWithModelRetry(ai, [{ role: 'user', parts: [{ text: promptContext }] }], "You are Chroni, generating an official club leadership handover report.");
    } catch (llmErr) {
      console.log("[Handover] Falling back to high-fidelity local handover report generator:", llmErr);
      report = generateLocalHandoverReport(eventNodes, sponsorNodes, lessonNodes, decisionNodes);
    }

    res.json({ report });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate handover report." });
  }
});

// Heuristic local generator for handover report
function generateLocalHandoverReport(events: any[], sponsors: any[], lessons: any[], decisions: any[]): string {
  const totalBudgets = events.reduce((acc, curr) => acc + Number(curr.properties.budget || 0), 0);
  const totalFunding = sponsors.reduce((acc, curr) => acc + Number(curr.properties.amount || 0), 0);
  
  return `## Club Summary
Welcome, incoming Leadership Team! Chronicle AI has retrieved our club's sacred archives directly from the **Cognee Graph Database**. 
Over the past active fiscal cycles, the club successfully coordinated **${events.length} major initiatives**, allocating a total combined operational budget of **₹${totalBudgets.toLocaleString()}** and securing **₹${totalFunding.toLocaleString()}** in community sponsorship support. Our organizational wisdom has compounded securely.

## Top Sponsors
Based on archived financial ledger folders, here are our premier funding partners:
${sponsors.map((s, i) => `${i + 1}. **${s.name}** — Contribution: **₹${Number(s.properties.amount || 0).toLocaleString()}**\n   *Archived Strategy:* ${s.properties.notes || 'Reliable corporate supporter.'}`).join("\n")}

*Tactical Advice:* Initiate sponsor proposals exactly 3 months before major events to ensure paperwork clears the administrative pipelines.

## Most Successful Events
Our historical database logs the following key successful initiatives:
${events.map(e => `- **${e.name} (${e.properties.year})**: Handled a budget scale of ₹${Number(e.properties.budget || 0).toLocaleString()}.\n  *Success File:* ${e.properties.outcome || 'Event completed smoothly with high engagement.'}`).join("\n")}

## Biggest Mistakes To Avoid
Retrospective post-mortems warn against repeating these logistical oversights:
${lessons.map(l => `- **Logistical Warning**: ${l.properties.detail || l.name}`).join("\n")}
- **Food Delay Risks**: If refreshment lines exceed 15 minutes, attendee satisfaction index drops heavily. Stagger your scheduled break times.
- **Server Stress Points**: Running automated compiler runs/code submittals requires active server stress-testing extensively 48 hours prior.

## Recommended Actions For Next Team
1. **First 30 Days**: Audit previous sponsor portfolios. Reach out to *Google Developer Groups* and *Stripe* to lock down annual commitments.
2. **First 60 Days**: Map event budgets using our historical templates. Build in a 15% buffer for contingency caterings.
3. **Event Week**: Run a comprehensive live dry-run of Wi-Fi routers and local electricity load capacities. Keep overnight volunteer crews energized with cheap donuts.

## Historical Decisions
Past committees logged these critical tactical pivot decisions:
${decisions.map(d => `- **Approved committee choice**: ${d.properties.detail || d.name}`).join("\n")}
- **Volunteer Morale Decision**: Buying coffee flasks and boxes of donuts for midnight hackathon volunteers. This prevented coordinator attrition during high-stress hours.

*Your committee now inherits the accumulated wisdom of all past cycles. Guard this memory well!*`;
}

// Setup Vite development server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Chronicle AI Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
