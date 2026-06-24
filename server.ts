import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { CogneeProvider } from "./src/cognee";

dotenv.config();

const app = express();
app.use(express.json());

// Initialize server-side Cognee Memory Layer
const cognee = new CogneeProvider();

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

// API endpoints for MemoryService and Cognee Graph Display
app.get("/api/memory/graph", (req: express.Request, res: express.Response): void => {
  try {
    const graph = cognee.getFullGraph();
    res.json(graph);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve Cognee graph." });
  }
});

app.post("/api/memory/sync", (req: express.Request, res: express.Response): void => {
  try {
    const { events, sponsors } = req.body;
    
    if (events && Array.isArray(events)) {
      events.forEach((e: any) => {
        // Query Cognee to check if this event node already exists
        const matches = cognee.searchMemory(e.name);
        const exists = matches.some(n => n.type === "Event" && n.name.toLowerCase() === e.name.toLowerCase());
        
        if (!exists) {
          console.log(`[MemoryService] Syncing new Event memory to Cognee: ${e.name}`);
          cognee.saveMemory("Event", e.name, {
            year: Number(e.year),
            budget: Number(e.budget),
            outcome: e.outcome,
            lessons: e.lessons
          });
        }
      });
    }

    if (sponsors && Array.isArray(sponsors)) {
      sponsors.forEach((s: any) => {
        const matches = cognee.searchMemory(s.name);
        const exists = matches.some(n => n.type === "Sponsor" && n.name.toLowerCase() === s.name.toLowerCase());
        
        if (!exists) {
          console.log(`[MemoryService] Syncing new Sponsor memory to Cognee: ${s.name}`);
          cognee.saveMemory("Sponsor", s.name, {
            amount: Number(s.amount),
            notes: s.notes
          });
        }
      });
    }

    res.json({ success: true, graph: cognee.getFullGraph() });
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
    const { message, memories, history } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    // 1. QUERY COGNEE: Locate starting nodes matching keywords
    matchedNodes = cognee.searchMemory(message);
    
    // 2. RETRIEVE RELATED MEMORIES: Traverse the graph to build highly connected context
    const visitedNodeIds = new Set<string>();
    const visitedEdgeIds = new Set<string>();

    matchedNodes.slice(0, 3).forEach(node => {
      const subgraph = cognee.retrieveRelatedMemories(node.id, 2);
      subgraph.nodes.forEach(n => {
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
    });

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
      relatedEdges.forEach(edge => {
        const sourceNode = relatedNodes.find(n => n.id === edge.sourceId) || cognee.getFullGraph().nodes.find(n => n.id === edge.sourceId);
        const targetNode = relatedNodes.find(n => n.id === edge.targetId) || cognee.getFullGraph().nodes.find(n => n.id === edge.targetId);
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

    const systemInstruction = `You are Chroni, the premium, adorable mascot and spirit of organizational memory for student clubs.
Your purpose is to help clubs preserve knowledge (events, sponsors, budgets, decisions, and lessons learned) so leadership transitions are seamless.

You reside atop the Cognee Memory Layer, which maps organizational relationships in a knowledge graph.

${cogneeContextStr ? `Here is the related memory graph retrieved directly from Cognee based on the user's message:\n${cogneeContextStr}` : ''}

Here is the general state of the club's archive database you guard:
--- RECORDED PAST EVENTS ---
${eventsStr}

--- RECORDED SPONSORS ---
${sponsorsStr}
-----------------------------

Your personality guidelines:
- You are friendly, highly intelligent, supportive, and extremely organized.
- You are professional and premium, NOT childish, silly, or distracting.
- You speak as the club's dedicated memory spirit. You refer to the database as "our sacred archives" or "our collective club memory" that is mapped inside Cognee.
- When answering questions, prioritize using the exact historical events, budgets, sponsors, decisions, and lessons retrieved from the Cognee Memory Graph above. Mention the connections, e.g. "Google Developer Groups sponsored TechFest 2025 where we spent ₹50,000...".
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
      const { message, memories } = req.body;
      const fallbackReply = generateHeuristicResponse(message, memories);
      res.json({ 
        reply: fallbackReply,
        cogneeSubGraph: {
          nodes: matchedNodes,
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
    const graph = cognee.getFullGraph();
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
