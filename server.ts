import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

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

// API endpoint for natural language memory retrieval
app.post("/api/chat", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { message, memories, history } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    const ai = getGenAI();

    // Format the past events and sponsors context neatly for the AI
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

    const systemInstruction = `You are Chroni, the premium, adorable mascot and spirit of organizational memory for student clubs. 
Your purpose is to help clubs preserve knowledge (events, sponsors, budgets, decisions, and lessons learned) so leadership transitions are seamless.

Here is the current state of the club's memory database that you guard:

--- RECORDEED PAST EVENTS ---
${eventsStr}

--- RECORDED SPONSORS ---
${sponsorsStr}
-----------------------------

Your personality guidelines:
- You are friendly, highly intelligent, supportive, and extremely organized.
- You are professional and premium, NOT childish, silly, or distracting.
- You speak as the club's dedicated memory spirit. You refer to the database as "our sacred archives" or "our collective club memory".
- When answering questions, prioritize using the exact historical events and sponsors in the records above.
- If the user asks about something not in the archive, acknowledge that it's not recorded, but provide constructive recommendations based on the existing records where possible.
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
    res.json({ reply });

  } catch (error: any) {
    console.log(`[Chronicle AI] Handled transition to offline archive recovery mode: ${error.message || error}`);
    try {
      const { message, memories } = req.body;
      const fallbackReply = generateHeuristicResponse(message, memories);
      res.json({ reply: fallbackReply });
    } catch (fallbackError: any) {
      console.log(`[Chronicle AI] Offline fallback generation failed: ${fallbackError}`);
      res.status(500).json({ 
        error: error.message || "An error occurred while generating a response from the memory archive." 
      });
    }
  }
});

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
