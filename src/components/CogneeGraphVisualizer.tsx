import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  Sparkles, 
  Layers, 
  Link2,
  Calendar,
  Briefcase,
  DollarSign,
  Lightbulb,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface CogneeNode {
  id: string;
  type: 'Event' | 'Sponsor' | 'Budget' | 'Lesson' | 'Decision' | 'Volunteer';
  name: string;
  properties: Record<string, any>;
}

interface CogneeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: string;
}

interface CogneeGraphVisualizerProps {
  nodes: CogneeNode[];
  edges: CogneeEdge[];
  step: number; // 1: Searching, 2: Connecting, 3: Found
}

export default function CogneeGraphVisualizer({ nodes, edges, step }: CogneeGraphVisualizerProps) {
  // Compute coordinates for radial layout: center node in middle, other nodes spaced radially
  const layout = useMemo(() => {
    if (nodes.length === 0) return { nodesWithCoords: [], edgesWithCoords: [] };

    const width = 380;
    const height = 240;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 90;

    // Separate center node (first Event node, or first node)
    const centerNode = nodes.find(n => n.type === 'Event') || nodes[0];
    const peripheralNodes = nodes.filter(n => n.id !== centerNode.id);

    const coords: Record<string, { x: number; y: number }> = {};
    coords[centerNode.id] = { x: centerX, y: centerY };

    peripheralNodes.forEach((node, idx) => {
      const angle = (idx * 2 * Math.PI) / peripheralNodes.length - Math.PI / 2;
      coords[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    const nodesWithCoords = nodes.map(n => ({
      ...n,
      x: coords[n.id]?.x ?? centerX,
      y: coords[n.id]?.y ?? centerY,
    }));

    const edgesWithCoords = edges
      .map(e => {
        const source = coords[e.sourceId];
        const target = coords[e.targetId];
        if (!source || !target) return null;
        return {
          ...e,
          x1: source.x,
          y1: source.y,
          x2: target.x,
          y2: target.y,
        };
      })
      .filter(Boolean) as Array<CogneeEdge & { x1: number; y1: number; x2: number; y2: number }>;

    return { nodesWithCoords, edgesWithCoords };
  }, [nodes, edges]);

  const { nodesWithCoords, edgesWithCoords } = layout;

  // Render proper icon for node type
  const getNodeIcon = (type: CogneeNode['type']) => {
    switch (type) {
      case 'Event':
        return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
      case 'Sponsor':
        return <Briefcase className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Budget':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Lesson':
        return <Lightbulb className="w-3.5 h-3.5 text-amber-400" />;
      case 'Decision':
        return <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Node background styling
  const getNodeStyles = (type: CogneeNode['type']) => {
    switch (type) {
      case 'Event':
        return 'bg-purple-950/90 border-purple-500/50 shadow-purple-900/10 text-purple-200';
      case 'Sponsor':
        return 'bg-cyan-950/90 border-cyan-500/50 shadow-cyan-900/10 text-cyan-200';
      case 'Budget':
        return 'bg-emerald-950/90 border-emerald-500/50 shadow-emerald-900/10 text-emerald-200';
      case 'Lesson':
        return 'bg-amber-950/90 border-amber-500/50 shadow-amber-900/10 text-amber-200';
      case 'Decision':
        return 'bg-indigo-950/90 border-indigo-500/50 shadow-indigo-900/10 text-indigo-200';
      default:
        return 'bg-slate-900/90 border-slate-700/50 shadow-slate-950 text-slate-200';
    }
  };

  return (
    <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3 shadow-2xl relative overflow-hidden">
      
      {/* Decorative backdrop glow */}
      <div className="absolute -top-10 -left-10 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />

      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 z-10 relative">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">Cognee Memory graph Retrieval</span>
        </div>
        
        {/* Step Badge */}
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-green-500 animate-pulse' : 'bg-purple-500 animate-spin'}`} />
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            {step === 1 && 'Searching nodes...'}
            {step === 2 && 'Traversing relations...'}
            {step === 3 && 'Memory Synchronized'}
          </span>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="grid grid-cols-3 gap-1.5 text-[9px] font-bold tracking-widest text-slate-500 uppercase z-10 relative">
        <div className={`p-1.5 rounded-lg border text-center transition-all ${
          step >= 1 ? 'border-purple-500/20 bg-purple-500/5 text-purple-400' : 'border-slate-900 bg-slate-950/40'
        }`}>
          1. Index Seek
        </div>
        <div className={`p-1.5 rounded-lg border text-center transition-all ${
          step >= 2 ? 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400' : 'border-slate-900 bg-slate-950/40'
        }`}>
          2. Relation Link
        </div>
        <div className={`p-1.5 rounded-lg border text-center transition-all ${
          step >= 3 ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-slate-900 bg-slate-950/40'
        }`}>
          3. Subgraph Build
        </div>
      </div>

      {/* Main SVG Render Area */}
      <div className="h-[240px] w-full bg-slate-950 border border-slate-900/60 rounded-xl relative overflow-hidden flex items-center justify-center">
        {step < 3 ? (
          <div className="flex flex-col items-center justify-center space-y-2 z-20">
            <div className="relative flex h-10 w-10">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-10 w-10 bg-purple-600/20 border border-purple-500 flex items-center justify-center text-white font-mono text-xs font-bold">
                C
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              {step === 1 ? 'Searching memory nodes...' : 'Retrieving adjacent nodes & edges...'}
            </span>
          </div>
        ) : (
          <svg className="w-full h-full z-10 absolute inset-0 select-none">
            {/* Draw Relation Edges */}
            {edgesWithCoords.map((edge) => {
              const midX = (edge.x1 + edge.x2) / 2;
              const midY = (edge.y1 + edge.y2) / 2;
              return (
                <g key={edge.id}>
                  {/* Glowing connector line */}
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    className="stroke-purple-500/45 stroke-[1.5]"
                    strokeDasharray="4 3"
                  />
                  {/* Hover or background guide line */}
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    className="stroke-purple-400/20 stroke-[4]"
                  />
                  {/* Inline relationship predicate label */}
                  <rect
                    x={midX - 32}
                    y={midY - 7}
                    width="64"
                    height="14"
                    rx="4"
                    className="fill-slate-950 stroke-slate-800/80 stroke-[0.5]"
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    className="fill-slate-400 font-mono text-[7px] font-semibold tracking-wider uppercase"
                  >
                    {edge.relationType}
                  </text>
                </g>
              );
            })}

            {/* Draw Nodes */}
            {nodesWithCoords.map((node) => {
              const isCenter = node.type === 'Event';
              return (
                <g key={node.id}>
                  {/* Outer breathing glow */}
                  {isCenter && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="19"
                      className="fill-purple-500/10 stroke-purple-400/20 stroke-[1.5] animate-ping"
                    />
                  )}
                  {/* Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isCenter ? "14" : "11"}
                    className={`stroke-[1.5] fill-slate-900 ${
                      node.type === 'Event' ? 'stroke-purple-500 shadow-purple-900/30' :
                      node.type === 'Sponsor' ? 'stroke-cyan-500 shadow-cyan-900/30' :
                      node.type === 'Budget' ? 'stroke-emerald-500 shadow-emerald-900/30' :
                      node.type === 'Lesson' ? 'stroke-amber-500 shadow-amber-900/30' :
                      'stroke-indigo-500 shadow-indigo-900/30'
                    }`}
                  />
                  {/* SVG foreign object to place HTML icons inside nodes */}
                  <foreignObject
                    x={node.x - 7}
                    y={node.y - 7}
                    width="14"
                    height="14"
                    className="pointer-events-none"
                  >
                    <div className="flex items-center justify-center">
                      {getNodeIcon(node.type)}
                    </div>
                  </foreignObject>

                  {/* Node Label Card */}
                  <foreignObject
                    x={node.x - 45}
                    y={node.y + (isCenter ? 15 : 12)}
                    width="90"
                    height="32"
                    className="overflow-visible pointer-events-none"
                  >
                    <div className="flex flex-col items-center justify-start text-center">
                      <span className={`px-1.5 py-0.5 rounded border text-[7px] font-bold leading-none tracking-tight shadow-md backdrop-blur-sm max-w-[85px] truncate block ${getNodeStyles(node.type)}`}>
                        {node.name}
                      </span>
                      <span className="text-[5px] font-mono text-slate-500 uppercase mt-0.5 tracking-widest font-extrabold leading-none block">
                        {node.type}
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Stats Summary */}
      {step === 3 && nodes.length > 0 && (
        <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1">
          <span>Connected Entities: <strong className="text-white">{nodes.length}</strong></span>
          <span>Relationships: <strong className="text-white">{edges.length}</strong></span>
        </div>
      )}
    </div>
  );
}
