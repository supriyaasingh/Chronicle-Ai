import fs from 'fs';
import path from 'path';
import { 
  getDatasets, 
  createDataset, 
  getDatasetGraph, 
  memify, 
  search, 
  SearchType, 
  CogneeConfig 
} from '@lineai/cognee-api';

export interface CogneeNode {
  id: string;
  type: 'Event' | 'Sponsor' | 'Budget' | 'Lesson' | 'Decision' | 'Volunteer' | 'Member' | 'Applicant' | 'Certificate' | 'Alumni' | 'Announcement' | string;
  name: string;
  properties: Record<string, any>;
}

export interface CogneeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: 'SPONSORED_BY' | 'ALLOCATED_BUDGET' | 'REVEALED_LESSON' | 'MADE_DECISION' | 'HAS_VOLUNTEER' | string;
}

export interface CogneeGraph {
  nodes: CogneeNode[];
  edges: CogneeEdge[];
}

const GRAPH_FILE_PATH = path.join(process.cwd(), 'cognee_graph.json');

export class CogneeProvider {
  private config: CogneeConfig;
  private localGraph: CogneeGraph = { nodes: [], edges: [] };
  private datasetId: string | null = null;

  constructor() {
    this.config = {
      baseUrl: process.env.COGNEE_URL || 'https://api.cognee.ai',
      apiKey: process.env.COGNEE_API_KEY || '',
    };
    this.loadLocalGraph();
    if (this.localGraph.nodes.length === 0) {
      this.seedInitialGraph();
    }
  }

  private loadLocalGraph() {
    try {
      if (fs.existsSync(GRAPH_FILE_PATH)) {
        const fileContent = fs.readFileSync(GRAPH_FILE_PATH, 'utf-8');
        this.localGraph = JSON.parse(fileContent);
        console.log(`[Cognee] Loaded local cache with ${this.localGraph.nodes.length} nodes and ${this.localGraph.edges.length} edges.`);
      } else {
        this.localGraph = { nodes: [], edges: [] };
      }
    } catch (error) {
      console.error('[Cognee] Failed to load local graph from disk:', error);
      this.localGraph = { nodes: [], edges: [] };
    }
  }

  private saveLocalGraph() {
    try {
      fs.writeFileSync(GRAPH_FILE_PATH, JSON.stringify(this.localGraph, null, 2), 'utf-8');
    } catch (error) {
      console.error('[Cognee] Failed to persist local graph to disk:', error);
    }
  }

  private seedInitialGraph() {
    console.log('[Cognee] Seeding initial local memory cache...');
    
    // Seed standard events
    const events = [
      { id: 'e-1', name: 'TechFest 2025', type: 'Event', properties: { year: 2025, budget: 50000, outcome: 'Attracted 500+ participants. Tech keynotes and project showcases went flawlessly, but catering queues were long.' } },
      { id: 'e-2', name: 'HackDay 2024', type: 'Event', properties: { year: 2024, budget: 30000, outcome: 'An intense 24-hour hackathon with 120 coders and 25 finished project submissions. Highly energetic.' } },
      { id: 'e-3', name: 'CodeSprint 2023', type: 'Event', properties: { year: 2023, budget: 18000, outcome: 'Competitive programming contest with 200 online registrants. High engagement on leaderboards.' } },
      { id: 'e-4', name: 'AI Workshop Series 2025', type: 'Event', properties: { year: 2025, budget: 12000, outcome: 'Hands-on API integrations. Over 150 students built simple LLM applets successfully.' } },
    ] as const;

    events.forEach(e => {
      this.localGraph.nodes.push({
        id: e.id,
        type: 'Event',
        name: e.name,
        properties: e.properties
      });
    });

    // Seed standard sponsors
    const sponsors = [
      { id: 's-1', name: 'Google Developer Groups', type: 'Sponsor', properties: { amount: 25000, notes: 'Provided cash funding and custom tech swag (stickers, t-shirts) for TechFest 2025.' } },
      { id: 's-2', name: 'Local Biotech Incubator', type: 'Sponsor', properties: { amount: 15000, notes: 'Sponsored HackDay 2024. Interested in healthcare and logistics project themes.' } },
      { id: 's-3', name: 'Coding Ninjas India', type: 'Sponsor', properties: { amount: 10000, notes: 'Provided free learning vouchers, free course access licenses, and sponsored prizes for CodeSprint 2023.' } },
      { id: 's-4', name: 'Stripe Developer Platform', type: 'Sponsor', properties: { amount: 20000, notes: 'Sponsored general annual developer club activities in 2025. Responsive to tech-focused hackathons.' } },
      { id: 's-5', name: 'Local Gourmet Cafe', type: 'Sponsor', properties: { amount: 8000, notes: 'Supplied free high-grade coffee flasks and discounted donuts for HackDay overnight volunteer crew.' } }
    ] as const;

    sponsors.forEach(s => {
      this.localGraph.nodes.push({
        id: s.id,
        type: 'Sponsor',
        name: s.name,
        properties: s.properties
      });
    });

    // Seed relationships
    this.localGraph.edges.push({ id: 'edge-e1-s1', sourceId: 'e-1', targetId: 's-1', relationType: 'SPONSORED_BY' });
    
    const b1Id = 'b-1';
    this.localGraph.nodes.push({ id: b1Id, type: 'Budget', name: '₹50,000 Budget Scale', properties: { amount: 50000, currency: 'INR' } });
    this.localGraph.edges.push({ id: 'edge-e1-b1', sourceId: 'e-1', targetId: b1Id, relationType: 'ALLOCATED_BUDGET' });

    const l1Id = 'l-1';
    this.localGraph.nodes.push({ id: l1Id, type: 'Lesson', name: 'Outreach Timing & Staggered Food', properties: { detail: 'Start sponsor outreach 3 months earlier. Double the catering budget and implement staggered lunch tokens.' } });
    this.localGraph.edges.push({ id: 'edge-e1-l1', sourceId: 'e-1', targetId: l1Id, relationType: 'LEARNED_LESSON' });

    this.localGraph.edges.push({ id: 'edge-e2-s2', sourceId: 'e-2', targetId: 's-2', relationType: 'SPONSORED_BY' });
    this.localGraph.edges.push({ id: 'edge-e2-s5', sourceId: 'e-2', targetId: 's-5', relationType: 'SPONSORED_BY' });

    const b2Id = 'b-2';
    this.localGraph.nodes.push({ id: b2Id, type: 'Budget', name: '₹30,000 Budget Scale', properties: { amount: 30000, currency: 'INR' } });
    this.localGraph.edges.push({ id: 'edge-e2-b2', sourceId: 'e-2', targetId: b2Id, relationType: 'ALLOCATED_BUDGET' });

    const l2Id = 'l-2';
    this.localGraph.nodes.push({ id: l2Id, type: 'Lesson', name: 'Overnight Shifts and Resting Areas', properties: { detail: 'Increase volunteer count by 30% for overnight shifts. Provide quiet resting areas for participants.' } });
    this.localGraph.edges.push({ id: 'edge-e2-l2', sourceId: 'e-2', targetId: l2Id, relationType: 'LEARNED_LESSON' });

    const d2Id = 'd-2';
    this.localGraph.nodes.push({ id: d2Id, type: 'Decision', name: 'Volunteer Food Flasks Support', properties: { detail: 'Supplied free high-grade coffee flasks and discounted donuts for HackDay overnight volunteer crew.' } });
    this.localGraph.edges.push({ id: 'edge-e2-d2', sourceId: 'e-2', targetId: d2Id, relationType: 'MADE_DECISION' });

    this.localGraph.edges.push({ id: 'edge-e3-s3', sourceId: 'e-3', targetId: 's-3', relationType: 'SPONSORED_BY' });

    const b3Id = 'b-3';
    this.localGraph.nodes.push({ id: b3Id, type: 'Budget', name: '₹18,000 Budget Scale', properties: { amount: 18000, currency: 'INR' } });
    this.localGraph.edges.push({ id: 'edge-e3-b3', sourceId: 'e-3', targetId: b3Id, relationType: 'ALLOCATED_BUDGET' });

    const l3Id = 'l-3';
    this.localGraph.nodes.push({ id: l3Id, type: 'Lesson', name: 'Pre-Event Test-Case Runners Dry-Run', properties: { detail: 'Set up backup servers and test the automated test-case runner extensively 48 hours prior.' } });
    this.localGraph.edges.push({ id: 'edge-e3-l3', sourceId: 'e-3', targetId: l3Id, relationType: 'LEARNED_LESSON' });

    this.localGraph.edges.push({ id: 'edge-e4-s4', sourceId: 'e-4', targetId: 's-4', relationType: 'SPONSORED_BY' });

    const b4Id = 'b-4';
    this.localGraph.nodes.push({ id: b4Id, type: 'Budget', name: '₹12,000 Budget Scale', properties: { amount: 12000, currency: 'INR' } });
    this.localGraph.edges.push({ id: 'edge-e4-b4', sourceId: 'e-4', targetId: b4Id, relationType: 'ALLOCATED_BUDGET' });

    const l4Id = 'l-4';
    this.localGraph.nodes.push({ id: l4Id, type: 'Lesson', name: 'Pre-installation of Runtime Packages', properties: { detail: 'Request students to pre-install runtime dependencies via email to avoid local Wi-Fi bottlenecking.' } });
    this.localGraph.edges.push({ id: 'edge-e4-l4', sourceId: 'e-4', targetId: l4Id, relationType: 'LEARNED_LESSON' });

    // Seed Alumni and Graph linkages
    console.log('[Cognee] Seeding Alumni network into knowledge graph...');
    const alumniList = [
      { id: 'alum-1', name: 'Aarav Sharma', company: 'Google', role: 'Software Engineer', skills: 'React, TypeScript, System Design, Cloud', gradYear: 2023, availableForMentorship: true },
      { id: 'alum-2', name: 'Priya Mehta', company: 'Microsoft', role: 'Data Analyst', skills: 'Power BI, SQL, Excel, Data Visualization', gradYear: 2022, availableForMentorship: true },
      { id: 'alum-3', name: 'Rahul Verma', company: 'Amazon', role: 'SDE I', skills: 'Java, Spring Boot, AWS, Microservices', gradYear: 2024, availableForMentorship: false },
      { id: 'alum-4', name: 'Neha Patel', company: 'Deloitte', role: 'Cyber Security Analyst', skills: 'SOC Operations, SIEM, Threat Hunting, Incident Response', gradYear: 2023, availableForMentorship: true },
      { id: 'alum-5', name: 'Karan Singh', company: 'TCS', role: 'AI Engineer', skills: 'Python, Machine Learning, LLMs, Prompt Engineering', gradYear: 2024, availableForMentorship: true },
      { id: 'alum-6', name: 'Ananya Joshi', company: 'Infosys', role: 'Cloud Engineer', skills: 'Azure, DevOps, Docker, Kubernetes', gradYear: 2022, availableForMentorship: true }
    ];

    alumniList.forEach(a => {
      // Add Alumnus node
      this.localGraph.nodes.push({
        id: a.id,
        type: 'Alumni',
        name: a.name,
        properties: {
          company: a.company,
          role: a.role,
          skills: a.skills,
          gradYear: a.gradYear,
          availableForMentorship: a.availableForMentorship ? 'Yes' : 'No',
          linkedin: `https://linkedin.com/in/${a.name.toLowerCase().replace(' ', '-')}-demo`
        }
      });

      // Add Company node if it doesn't exist
      const companyNodeId = `comp-${a.company.toLowerCase()}`;
      if (!this.localGraph.nodes.some(n => n.id === companyNodeId)) {
        this.localGraph.nodes.push({
          id: companyNodeId,
          type: 'Company',
          name: a.company,
          properties: { domain: 'Industry Partner' }
        });
      }

      // Link Alumnus -> Company
      this.localGraph.edges.push({
        id: `edge-${a.id}-${companyNodeId}`,
        sourceId: a.id,
        targetId: companyNodeId,
        relationType: 'EMPLOYED_AT'
      });

      // Link Mentorship capability
      if (a.availableForMentorship) {
        const mentorId = `mentor-slot-${a.id}`;
        this.localGraph.nodes.push({
          id: mentorId,
          type: 'Mentorship',
          name: `${a.name} Mentorship Session`,
          properties: { status: 'Available', domain: a.role }
        });
        this.localGraph.edges.push({
          id: `edge-${a.id}-${mentorId}`,
          sourceId: a.id,
          targetId: mentorId,
          relationType: 'OFFERS_MENTORSHIP'
        });
      }

      // Link Skills
      const skillsArr = a.skills.split(',').map(s => s.trim());
      skillsArr.forEach(skill => {
        const skillNodeId = `skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        if (!this.localGraph.nodes.some(n => n.id === skillNodeId)) {
          this.localGraph.nodes.push({
            id: skillNodeId,
            type: 'Skill',
            name: skill,
            properties: { category: 'Technical' }
          });
        }
        this.localGraph.edges.push({
          id: `edge-${a.id}-${skillNodeId}`,
          sourceId: a.id,
          targetId: skillNodeId,
          relationType: 'SKILLED_IN'
        });
      });
    });

    // Special Linkage: Aarav Sharma is a TechFest 2025 Speaker
    this.localGraph.edges.push({
      id: 'edge-alum1-e1',
      sourceId: 'alum-1',
      targetId: 'e-1',
      relationType: 'SPEAKS_AT'
    });

    // Seed Initial Meetings
    console.log('[Cognee] Seeding initial meetings into knowledge graph...');
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const seededMeetings = [
      {
        id: 'meet-1',
        name: 'Board Meeting',
        type: 'Meeting',
        properties: {
          meetingId: 'meet-1',
          description: 'Quarterly review of administrative structure, officer responsibilities, and financial health.',
          date: tomorrowStr,
          time: '10:00',
          venue: 'Executive Boardroom',
          visibility: 'Administration Only',
          participants: 'President, Secretary',
          organizer: 'President'
        }
      },
      {
        id: 'meet-2',
        name: 'Sponsor Strategy Meeting',
        type: 'Meeting',
        properties: {
          meetingId: 'meet-2',
          description: 'Formulate outreach campaigns for local tech hubs and premium corporate partners.',
          date: '2026-06-28',
          time: '14:00',
          venue: 'Google Meet',
          visibility: 'Administration Only',
          participants: 'President, Secretary',
          organizer: 'Secretary'
        }
      },
      {
        id: 'meet-3',
        name: 'Volunteer Briefing',
        type: 'Meeting',
        properties: {
          meetingId: 'meet-3',
          description: 'Preparation session for the upcoming community beach clean-up drive. Assigning team roles.',
          date: tomorrowStr,
          time: '17:00',
          venue: 'Club Lounge',
          visibility: 'Members Only',
          participants: 'Members, President, Secretary',
          organizer: 'President'
        }
      },
      {
        id: 'meet-4',
        name: 'General Body Meeting',
        type: 'Meeting',
        properties: {
          meetingId: 'meet-4',
          description: 'All members gather to discuss upcoming annual installation ceremony planning.',
          date: todayStr,
          time: timeStr,
          venue: 'Seminar Hall',
          visibility: 'Everyone',
          participants: 'Everyone',
          organizer: 'Secretary'
        }
      }
    ];

    seededMeetings.forEach(m => {
      this.localGraph.nodes.push(m);
    });

    this.saveLocalGraph();
    console.log('[Cognee] Seeding completed with Alumni directory graph and meetings.');
  }

  private async getOrCreateDatasetId(): Promise<string> {
    if (this.datasetId) return this.datasetId;
    if (!this.config.apiKey) return 'local-dataset';
    try {
      const datasets = await getDatasets(this.config);
      const existing = datasets.find(d => d.name === 'chronicle_archives');
      if (existing) {
        this.datasetId = existing.id;
        return this.datasetId;
      }
      const created = await createDataset(this.config, { name: 'chronicle_archives' });
      this.datasetId = created.id;
      return this.datasetId;
    } catch (err) {
      console.warn('[Cognee] Failed to fetch/create dataset on remote, using local id fallback:', err);
      return 'local-dataset';
    }
  }

  // 1. saveMemory method
  public async saveMemory(type: CogneeNode['type'], name: string, properties: Record<string, any>): Promise<CogneeNode> {
    const id = `${type.toLowerCase()}-${Date.now()}`;
    const newNode: CogneeNode = { id, type, name, properties };
    
    this.localGraph.nodes.push(newNode);

    // Dynamic relational logic for our local graph cache
    if (type === 'Event') {
      const budgetAmount = properties.budget;
      if (budgetAmount) {
        const budgetNodeId = `budget-${Date.now()}`;
        const budgetNode: CogneeNode = {
          id: budgetNodeId,
          type: 'Budget',
          name: `₹${Number(budgetAmount).toLocaleString()} Budget Scale`,
          properties: { amount: budgetAmount }
        };
        this.localGraph.nodes.push(budgetNode);
        this.localGraph.edges.push({
          id: `edge-${id}-${budgetNodeId}`,
          sourceId: id,
          targetId: budgetNodeId,
          relationType: 'ALLOCATED_BUDGET'
        });
      }

      const lessonsDetail = properties.lessons;
      if (lessonsDetail) {
        const lessonNodeId = `lesson-${Date.now()}`;
        const lessonNode: CogneeNode = {
          id: lessonNodeId,
          type: 'Lesson',
          name: `${name} Retrospective Insight`,
          properties: { detail: lessonsDetail }
        };
        this.localGraph.nodes.push(lessonNode);
        this.localGraph.edges.push({
          id: `edge-${id}-${lessonNodeId}`,
          sourceId: id,
          targetId: lessonNodeId,
          relationType: 'LEARNED_LESSON'
        });
      }

      // Connect to sponsors
      const textToSearch = `${properties.outcome || ''} ${properties.lessons || ''} ${name}`.toLowerCase();
      this.localGraph.nodes.filter(n => n.type === 'Sponsor').forEach(sponsorNode => {
        if (textToSearch.includes(sponsorNode.name.toLowerCase())) {
          this.localGraph.edges.push({
            id: `edge-${id}-${sponsorNode.id}`,
            sourceId: id,
            targetId: sponsorNode.id,
            relationType: 'SPONSORED_BY'
          });
        }
      });
    }

    this.saveLocalGraph();

    // Call Cognee SDK
    if (this.config.apiKey) {
      try {
        const payload = `Event/Memory log:\nType: ${type}\nName: ${name}\nProperties: ${JSON.stringify(properties)}`;
        await memify(this.config, {
          data: payload,
          dataset_name: 'chronicle_archives'
        });
        console.log(`[Cognee] Successfully stored memory "${name}" on the remote graph.`);
      } catch (error) {
        console.error('[Cognee] Failed to store memory on remote Cognee:', error);
      }
    }

    return newNode;
  }

  // 2. connectNodes method
  public connectNodes(sourceId: string, targetId: string, relationType: string): CogneeEdge {
    const edgeId = `edge-${sourceId}-${targetId}-${Date.now()}`;
    const newEdge: CogneeEdge = { id: edgeId, sourceId, targetId, relationType };
    this.localGraph.edges.push(newEdge);
    this.saveLocalGraph();
    return newEdge;
  }

  // 3. searchMemory method (Uses Cognee retrieval or local fallback)
  public async searchMemory(query: string): Promise<CogneeNode[]> {
    if (this.config.apiKey) {
      try {
        const results = await search(this.config, {
          query,
          searchType: SearchType.GRAPH_COMPLETION,
          datasetName: 'chronicle_archives'
        });

        const nodes: CogneeNode[] = [];
        const seenIds = new Set<string>();

        for (const res of results) {
          if (res.graphs) {
            for (const graph of Object.values(res.graphs)) {
              if (graph && graph.nodes) {
                for (const node of graph.nodes) {
                  if (!seenIds.has(node.id)) {
                    seenIds.add(node.id);
                    nodes.push({
                      id: node.id,
                      type: (node.type || node.label || 'Event') as any,
                      name: String(node.properties.name || node.properties.title || node.label),
                      properties: node.properties
                    });
                  }
                }
              }
            }
          }
        }

        if (nodes.length > 0) {
          console.log(`[Cognee] Retrieved ${nodes.length} nodes from remote search.`);
          return nodes;
        }
      } catch (error) {
        console.warn('[Cognee] Remote search retrieval failed, using local scoring fallback:', error);
      }
    }

    // Fallback to local scoring
    return this.localSearchMemory(query);
  }

  private localSearchMemory(query: string): CogneeNode[] {
    const term = query.toLowerCase().trim();
    if (!term) return [];

    const exactMatches = this.localGraph.nodes.filter(node => {
      if (node.name.toLowerCase().includes(term)) return true;
      if (node.type.toLowerCase().includes(term)) return true;
      return Object.values(node.properties).some(val => 
        String(val).toLowerCase().includes(term)
      );
    });

    if (exactMatches.length > 0) return exactMatches;

    const stopWords = new Set([
      'what', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'if', 'for', 'with', 
      'at', 'by', 'from', 'on', 'to', 'in', 'of', 'about', 'which', 'who', 'whom', 
      'this', 'that', 'these', 'those', 'how', 'why', 'where', 'when', 'can', 'could', 
      'would', 'should', 'will', 'shall', 'our', 'us', 'we', 'they', 'them', 'their', 
      'your', 'my', 'me', 'i', 'you', 'he', 'she', 'it', 'his', 'her', 'its', 'was', 
      'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'some', 'any', 'no', 
      'not', 'all', 'more', 'most', 'many', 'much', 'please', 'tell', 'show', 'list', 'did', 'we', 'save'
    ]);

    const keywords = term
      .split(/[^a-z0-9]+/i)
      .map(w => w.trim())
      .filter(w => w.length > 2 && !stopWords.has(w));

    if (keywords.length === 0) {
      const allWords = term.split(/[^a-z0-9]+/i).map(w => w.trim()).filter(w => w.length > 1);
      keywords.push(...allWords);
    }

    if (keywords.length === 0) return [];

    const scoredNodes = this.localGraph.nodes.map(node => {
      let score = 0;
      const nodeNameLower = node.name.toLowerCase();
      const nodeTypeLower = node.type.toLowerCase();

      keywords.forEach(keyword => {
        if (nodeNameLower.includes(keyword)) score += 10;
        if (nodeTypeLower.includes(keyword)) score += 5;
        Object.entries(node.properties).forEach(([key, val]) => {
          if (String(val).toLowerCase().includes(keyword)) {
            score += 2;
          }
        });
      });

      return { node, score };
    });

    return scoredNodes
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.node);
  }

  // 4. retrieveRelatedMemories (Traverses full graph)
  public async retrieveRelatedMemories(nodeId: string, depth: number = 2): Promise<{ nodes: CogneeNode[]; edges: CogneeEdge[] }> {
    const graph = await this.getFullGraph();
    const visitedNodes = new Set<string>();
    const visitedEdges = new Set<string>();
    const resultNodes: CogneeNode[] = [];
    const resultEdges: CogneeEdge[] = [];

    const queue: { id: string; currentDepth: number }[] = [{ id: nodeId, currentDepth: 0 }];
    const startNode = graph.nodes.find(n => n.id === nodeId);
    if (startNode) {
      visitedNodes.add(nodeId);
      resultNodes.push(startNode);
    }

    while (queue.length > 0) {
      const { id, currentDepth } = queue.shift()!;
      if (currentDepth >= depth) continue;

      const connectedEdges = graph.edges.filter(
        edge => (edge.sourceId === id || edge.targetId === id) && !visitedEdges.has(edge.id)
      );

      connectedEdges.forEach(edge => {
        visitedEdges.add(edge.id);
        resultEdges.push(edge);

        const nextNodeId = edge.sourceId === id ? edge.targetId : edge.sourceId;
        if (!visitedNodes.has(nextNodeId)) {
          visitedNodes.add(nextNodeId);
          const nextNode = graph.nodes.find(n => n.id === nextNodeId);
          if (nextNode) {
            resultNodes.push(nextNode);
            queue.push({ id: nextNodeId, currentDepth: currentDepth + 1 });
          }
        }
      });
    }

    return { nodes: resultNodes, edges: resultEdges };
  }

  // 5. getFullGraph method (Combines Cognee graph or local cache fallback)
  public async getFullGraph(): Promise<CogneeGraph> {
    if (this.config.apiKey) {
      try {
        const dId = await this.getOrCreateDatasetId();
        const remoteGraph = await getDatasetGraph(this.config, dId);
        if (remoteGraph && remoteGraph.nodes && remoteGraph.nodes.length > 0) {
          const nodes: CogneeNode[] = remoteGraph.nodes.map(n => ({
            id: n.id,
            type: (n.type || n.label || 'Event') as any,
            name: String(n.properties.name || n.properties.title || n.label),
            properties: n.properties
          }));
          const edges: CogneeEdge[] = remoteGraph.edges.map(e => ({
            id: `${e.source}-${e.target}`,
            sourceId: e.source,
            targetId: e.target,
            relationType: e.label
          }));
          return { nodes, edges };
        }
      } catch (error) {
        console.warn('[Cognee] Failed to fetch remote graph, using local cache:', error);
      }
    }
    return this.localGraph;
  }

  // 6. updateMemory method
  public updateMemory(id: string, updatedData: Partial<Omit<CogneeNode, 'id' | 'type'>>): boolean {
    const node = this.localGraph.nodes.find(n => n.id === id);
    if (!node) return false;

    if (updatedData.name !== undefined) {
      node.name = updatedData.name;
    }
    if (updatedData.properties !== undefined) {
      node.properties = { ...node.properties, ...updatedData.properties };
    }

    this.saveLocalGraph();
    return true;
  }

  // 7. deleteMemory method
  public deleteMemory(id: string): boolean {
    const index = this.localGraph.nodes.findIndex(n => n.id === id);
    if (index === -1) return false;

    this.localGraph.nodes.splice(index, 1);
    this.localGraph.edges = this.localGraph.edges.filter(
      edge => edge.sourceId !== id && edge.targetId !== id
    );

    this.saveLocalGraph();
    return true;
  }
}
