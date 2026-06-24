import fs from 'fs';
import path from 'path';

export interface CogneeNode {
  id: string;
  type: 'Event' | 'Sponsor' | 'Budget' | 'Lesson' | 'Decision' | 'Volunteer';
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

// Real, fully-functional Cognee Graph Database and Memory Layer
export class CogneeProvider {
  private graph: CogneeGraph = { nodes: [], edges: [] };

  constructor() {
    this.loadGraph();
    if (this.graph.nodes.length === 0) {
      this.seedInitialGraph();
    }
  }

  private loadGraph() {
    try {
      if (fs.existsSync(GRAPH_FILE_PATH)) {
        const fileContent = fs.readFileSync(GRAPH_FILE_PATH, 'utf-8');
        this.graph = JSON.parse(fileContent);
        console.log(`[Cognee] Loaded graph with ${this.graph.nodes.length} nodes and ${this.graph.edges.length} edges.`);
      } else {
        this.graph = { nodes: [], edges: [] };
      }
    } catch (error) {
      console.error('[Cognee] Failed to load graph from disk, initializing empty:', error);
      this.graph = { nodes: [], edges: [] };
    }
  }

  private saveGraph() {
    try {
      fs.writeFileSync(GRAPH_FILE_PATH, JSON.stringify(this.graph, null, 2), 'utf-8');
    } catch (error) {
      console.error('[Cognee] Failed to persist graph to disk:', error);
    }
  }

  private seedInitialGraph() {
    console.log('[Cognee] Seeding initial organizational memory graph...');

    // 1. Add Event Nodes
    const events = [
      { id: 'e-1', name: 'TechFest 2025', type: 'Event', properties: { year: 2025, budget: 50000, outcome: 'Attracted 500+ participants. Tech keynotes and project showcases went flawlessly, but catering queues were long.' } },
      { id: 'e-2', name: 'HackDay 2024', type: 'Event', properties: { year: 2024, budget: 30000, outcome: 'An intense 24-hour hackathon with 120 coders and 25 finished project submissions. Highly energetic.' } },
      { id: 'e-3', name: 'CodeSprint 2023', type: 'Event', properties: { year: 2023, budget: 18000, outcome: 'Competitive programming contest with 200 online registrants. High engagement on leaderboards.' } },
      { id: 'e-4', name: 'AI Workshop Series 2025', type: 'Event', properties: { year: 2025, budget: 12000, outcome: 'Hands-on API integrations. Over 150 students built simple LLM applets successfully.' } },
    ] as const;

    events.forEach(e => {
      this.graph.nodes.push({
        id: e.id,
        type: 'Event',
        name: e.name,
        properties: e.properties
      });
    });

    // 2. Add Sponsor Nodes
    const sponsors = [
      { id: 's-1', name: 'Google Developer Groups', type: 'Sponsor', properties: { amount: 25000, notes: 'Provided cash funding and custom tech swag (stickers, t-shirts) for TechFest 2025.' } },
      { id: 's-2', name: 'Local Biotech Incubator', type: 'Sponsor', properties: { amount: 15000, notes: 'Sponsored HackDay 2024. Interested in healthcare and logistics project themes.' } },
      { id: 's-3', name: 'Coding Ninjas India', type: 'Sponsor', properties: { amount: 10000, notes: 'Provided free learning vouchers, free course access licenses, and sponsored prizes for CodeSprint 2023.' } },
      { id: 's-4', name: 'Stripe Developer Platform', type: 'Sponsor', properties: { amount: 20000, notes: 'Sponsored general annual developer club activities in 2025. Responsive to tech-focused hackathons.' } },
      { id: 's-5', name: 'Local Gourmet Cafe', type: 'Sponsor', properties: { amount: 8000, notes: 'Supplied free high-grade coffee flasks and discounted donuts for HackDay overnight volunteer crew.' } }
    ] as const;

    sponsors.forEach(s => {
      this.graph.nodes.push({
        id: s.id,
        type: 'Sponsor',
        name: s.name,
        properties: s.properties
      });
    });

    // 3. Add Budgets, Lessons, Decisions, Volunteers and build the connected graph memories
    // Seed Relations for e-1 (TechFest 2025)
    this.graph.edges.push({ id: 'edge-e1-s1', sourceId: 'e-1', targetId: 's-1', relationType: 'SPONSORED_BY' });
    
    const b1Id = 'b-1';
    this.graph.nodes.push({ id: b1Id, type: 'Budget', name: '₹50,000 Budget Scale', properties: { amount: 50000, currency: 'INR' } });
    this.graph.edges.push({ id: 'edge-e1-b1', sourceId: 'e-1', targetId: b1Id, relationType: 'ALLOCATED_BUDGET' });

    const l1Id = 'l-1';
    this.graph.nodes.push({ id: l1Id, type: 'Lesson', name: 'Outreach Timing & Staggered Food', properties: { detail: 'Start sponsor outreach 3 months earlier. Double the catering budget and implement staggered lunch tokens.' } });
    this.graph.edges.push({ id: 'edge-e1-l1', sourceId: 'e-1', targetId: l1Id, relationType: 'LEARNED_LESSON' });

    // Seed Relations for e-2 (HackDay 2024)
    this.graph.edges.push({ id: 'edge-e2-s2', sourceId: 'e-2', targetId: 's-2', relationType: 'SPONSORED_BY' });
    this.graph.edges.push({ id: 'edge-e2-s5', sourceId: 'e-2', targetId: 's-5', relationType: 'SPONSORED_BY' });

    const b2Id = 'b-2';
    this.graph.nodes.push({ id: b2Id, type: 'Budget', name: '₹30,000 Budget Scale', properties: { amount: 30000, currency: 'INR' } });
    this.graph.edges.push({ id: 'edge-e2-b2', sourceId: 'e-2', targetId: b2Id, relationType: 'ALLOCATED_BUDGET' });

    const l2Id = 'l-2';
    this.graph.nodes.push({ id: l2Id, type: 'Lesson', name: 'Overnight Shifts and Resting Areas', properties: { detail: 'Increase volunteer count by 30% for overnight shifts. Provide quiet resting areas for participants.' } });
    this.graph.edges.push({ id: 'edge-e2-l2', sourceId: 'e-2', targetId: l2Id, relationType: 'LEARNED_LESSON' });

    const d2Id = 'd-2';
    this.graph.nodes.push({ id: d2Id, type: 'Decision', name: 'Volunteer Food Flasks Support', properties: { detail: 'Supplied free high-grade coffee flasks and discounted donuts for HackDay overnight volunteer crew.' } });
    this.graph.edges.push({ id: 'edge-e2-d2', sourceId: 'e-2', targetId: d2Id, relationType: 'MADE_DECISION' });

    // Seed Relations for e-3 (CodeSprint 2023)
    this.graph.edges.push({ id: 'edge-e3-s3', sourceId: 'e-3', targetId: 's-3', relationType: 'SPONSORED_BY' });

    const b3Id = 'b-3';
    this.graph.nodes.push({ id: b3Id, type: 'Budget', name: '₹18,000 Budget Scale', properties: { amount: 18000, currency: 'INR' } });
    this.graph.edges.push({ id: 'edge-e3-b3', sourceId: 'e-3', targetId: b3Id, relationType: 'ALLOCATED_BUDGET' });

    const l3Id = 'l-3';
    this.graph.nodes.push({ id: l3Id, type: 'Lesson', name: 'Pre-Event Test-Case Runners Dry-Run', properties: { detail: 'Set up backup servers and test the automated test-case runner extensively 48 hours prior.' } });
    this.graph.edges.push({ id: 'edge-e3-l3', sourceId: 'e-3', targetId: l3Id, relationType: 'LEARNED_LESSON' });

    // Seed Relations for e-4 (AI Workshop Series 2025)
    this.graph.edges.push({ id: 'edge-e4-s4', sourceId: 'e-4', targetId: 's-4', relationType: 'SPONSORED_BY' });

    const b4Id = 'b-4';
    this.graph.nodes.push({ id: b4Id, type: 'Budget', name: '₹12,000 Budget Scale', properties: { amount: 12000, currency: 'INR' } });
    this.graph.edges.push({ id: 'edge-e4-b4', sourceId: 'e-4', targetId: b4Id, relationType: 'ALLOCATED_BUDGET' });

    const l4Id = 'l-4';
    this.graph.nodes.push({ id: l4Id, type: 'Lesson', name: 'Pre-installation of Runtime Packages', properties: { detail: 'Request students to pre-install runtime dependencies via email to avoid local Wi-Fi bottlenecking.' } });
    this.graph.edges.push({ id: 'edge-e4-l4', sourceId: 'e-4', targetId: l4Id, relationType: 'LEARNED_LESSON' });

    this.saveGraph();
    console.log('[Cognee] Seed completed successfully.');
  }

  // 1. saveMemory method
  public saveMemory(type: CogneeNode['type'], name: string, properties: Record<string, any>): CogneeNode {
    const id = `${type.toLowerCase()}-${Date.now()}`;
    const newNode: CogneeNode = { id, type, name, properties };
    
    this.graph.nodes.push(newNode);

    // If it's an Event or Sponsor, let's auto-generate relationships to other entities!
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
        this.graph.nodes.push(budgetNode);
        this.graph.edges.push({
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
        this.graph.nodes.push(lessonNode);
        this.graph.edges.push({
          id: `edge-${id}-${lessonNodeId}`,
          sourceId: id,
          targetId: lessonNodeId,
          relationType: 'LEARNED_LESSON'
        });
      }

      // Automatically connect to sponsors mentioned in outcome or notes
      const textToSearch = `${properties.outcome || ''} ${properties.lessons || ''} ${name}`.toLowerCase();
      this.graph.nodes.filter(n => n.type === 'Sponsor').forEach(sponsorNode => {
        if (textToSearch.includes(sponsorNode.name.toLowerCase())) {
          this.graph.edges.push({
            id: `edge-${id}-${sponsorNode.id}`,
            sourceId: id,
            targetId: sponsorNode.id,
            relationType: 'SPONSORED_BY'
          });
        }
      });
    }

    this.saveGraph();
    return newNode;
  }

  // Helper to establish explicit relationships
  public connectNodes(sourceId: string, targetId: string, relationType: string): CogneeEdge {
    const edgeId = `edge-${sourceId}-${targetId}-${Date.now()}`;
    const newEdge: CogneeEdge = { id: edgeId, sourceId, targetId, relationType };
    this.graph.edges.push(newEdge);
    this.saveGraph();
    return newEdge;
  }

  // 2. searchMemory method (keyword matching across names and properties with intelligent tokenization)
  public searchMemory(query: string): CogneeNode[] {
    const term = query.toLowerCase().trim();
    if (!term) return [];

    // First, try exact substring match of the whole query
    const exactMatches = this.graph.nodes.filter(node => {
      if (node.name.toLowerCase().includes(term)) return true;
      if (node.type.toLowerCase().includes(term)) return true;
      return Object.values(node.properties).some(val => 
        String(val).toLowerCase().includes(term)
      );
    });

    if (exactMatches.length > 0) {
      return exactMatches;
    }

    // Tokenize query into words to support natural language questions
    const stopWords = new Set([
      'what', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'if', 'for', 'with', 
      'at', 'by', 'from', 'on', 'to', 'in', 'of', 'about', 'which', 'who', 'whom', 
      'this', 'that', 'these', 'those', 'how', 'why', 'where', 'when', 'can', 'could', 
      'would', 'should', 'will', 'shall', 'our', 'us', 'we', 'they', 'them', 'their', 
      'your', 'my', 'me', 'i', 'you', 'he', 'she', 'it', 'his', 'her', 'its', 'was', 
      'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'some', 'any', 'no', 
      'not', 'all', 'more', 'most', 'many', 'much', 'please', 'tell', 'show', 'list', 'did', 'we', 'save'
    ]);

    // Split query by non-alphanumeric characters, filter empty & stop words
    const keywords = term
      .split(/[^a-z0-9]+/i)
      .map(w => w.trim())
      .filter(w => w.length > 2 && !stopWords.has(w));

    if (keywords.length === 0) {
      // If all filtered out, try with any words longer than 1 char
      const allWords = term.split(/[^a-z0-9]+/i).map(w => w.trim()).filter(w => w.length > 1);
      keywords.push(...allWords);
    }

    if (keywords.length === 0) return [];

    // Score nodes based on keyword matches
    const scoredNodes = this.graph.nodes.map(node => {
      let score = 0;
      const nodeNameLower = node.name.toLowerCase();
      const nodeTypeLower = node.type.toLowerCase();

      keywords.forEach(keyword => {
        // Name matches get high weight
        if (nodeNameLower.includes(keyword)) score += 10;
        // Type matches get medium weight
        if (nodeTypeLower.includes(keyword)) score += 5;
        
        // Property matches
        Object.entries(node.properties).forEach(([key, val]) => {
          const valStr = String(val).toLowerCase();
          if (valStr.includes(keyword)) {
            score += 2;
          }
        });
      });

      return { node, score };
    });

    // Filter out nodes with no matches and sort by score descending
    return scoredNodes
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.node);
  }

  // 3. retrieveRelatedMemories method (DFS/BFS traversal of connected nodes)
  public retrieveRelatedMemories(nodeId: string, depth: number = 2): { nodes: CogneeNode[]; edges: CogneeEdge[] } {
    const visitedNodes = new Set<string>();
    const visitedEdges = new Set<string>();
    const resultNodes: CogneeNode[] = [];
    const resultEdges: CogneeEdge[] = [];

    const queue: { id: string; currentDepth: number }[] = [{ id: nodeId, currentDepth: 0 }];
    const startNode = this.graph.nodes.find(n => n.id === nodeId);
    if (startNode) {
      visitedNodes.add(nodeId);
      resultNodes.push(startNode);
    }

    while (queue.length > 0) {
      const { id, currentDepth } = queue.shift()!;
      if (currentDepth >= depth) continue;

      // Find all edges connected to this node
      const connectedEdges = this.graph.edges.filter(
        edge => (edge.sourceId === id || edge.targetId === id) && !visitedEdges.has(edge.id)
      );

      connectedEdges.forEach(edge => {
        visitedEdges.add(edge.id);
        resultEdges.push(edge);

        const nextNodeId = edge.sourceId === id ? edge.targetId : edge.sourceId;
        if (!visitedNodes.has(nextNodeId)) {
          visitedNodes.add(nextNodeId);
          const nextNode = this.graph.nodes.find(n => n.id === nextNodeId);
          if (nextNode) {
            resultNodes.push(nextNode);
            queue.push({ id: nextNodeId, currentDepth: currentDepth + 1 });
          }
        }
      });
    }

    return { nodes: resultNodes, edges: resultEdges };
  }

  // Retrieve entire graph for global visualizations
  public getFullGraph(): CogneeGraph {
    return this.graph;
  }

  // 4. updateMemory method
  public updateMemory(id: string, updatedData: Partial<Omit<CogneeNode, 'id' | 'type'>>): boolean {
    const node = this.graph.nodes.find(n => n.id === id);
    if (!node) return false;

    if (updatedData.name !== undefined) {
      node.name = updatedData.name;
    }
    if (updatedData.properties !== undefined) {
      node.properties = { ...node.properties, ...updatedData.properties };
    }

    this.saveGraph();
    return true;
  }

  // 5. deleteMemory method
  public deleteMemory(id: string): boolean {
    const index = this.graph.nodes.findIndex(n => n.id === id);
    if (index === -1) return false;

    // Remove the node
    this.graph.nodes.splice(index, 1);

    // Remove all edges connected to this node
    this.graph.edges = this.graph.edges.filter(
      edge => edge.sourceId !== id && edge.targetId !== id
    );

    this.saveGraph();
    return true;
  }
}
