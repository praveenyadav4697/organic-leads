import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Entity } from "@/modules/search-knowledge/types";

interface Node {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  confidence: number;
  size: number;
}

interface Edge {
  source: string;
  target: string;
  strength: number;
}

interface KnowledgeGraphProps {
  entities: Entity[];
}

function buildNodes(entities: Entity[]): Node[] {
  const typeMap = new Map<string, number>();
  entities.forEach((e) => {
    typeMap.set(e.entityType, (typeMap.get(e.entityType) ?? 0) + 1);
  });
  const maxCount = Math.max(...typeMap.values(), 1);
  const types = Array.from(typeMap.keys());

  let angleStep = (2 * Math.PI) / Math.max(types.length, 1);
  let radius = 200;

  return types.map((type, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const count = typeMap.get(type) ?? 0;
    return {
      id: type,
      label: type,
      type,
      x: 300 + Math.cos(angle) * radius,
      y: 250 + Math.sin(angle) * radius,
      confidence: count / entities.length,
      size: Math.max(12, (count / maxCount) * 32),
    };
  });
}

function buildEdges(nodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const strength = 0.3 + Math.random() * 0.7;
      if (strength > 0.5) {
        edges.push({ source: nodes[i].id, target: nodes[j].id, strength });
      }
    }
  }
  return edges;
}

export function KnowledgeGraph({ entities }: KnowledgeGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [search, setSearch] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const nodes = buildNodes(entities);
  const edges = buildEdges(nodes);

  const filteredNodes = search
    ? nodes.filter((n) => n.label.toLowerCase().includes(search.toLowerCase()))
    : nodes;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}>
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setZoom((z) => Math.max(z - 0.2, 0.3))}>
            <ZoomOut className="size-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden relative" style={{ height: 500 }}>
        <svg width="100%" height="100%" viewBox="0 0 600 500" className="w-full h-full">
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {edges.map((edge, i) => {
              const source = filteredNodes.find((n) => n.id === edge.source);
              const target = filteredNodes.find((n) => n.id === edge.target);
              if (!source || !target) return null;
              return (
                <line
                  key={i}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="hsl(var(--border))"
                  strokeWidth={edge.strength * 2}
                  strokeOpacity={edge.strength * 0.5}
                />
              );
            })}
            {filteredNodes.map((node) => (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                className="cursor-pointer"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size}
                  fill={selectedNode === node.id ? "hsl(var(--primary))" : "hsl(var(--accent))"}
                  fillOpacity={0.2}
                  stroke={selectedNode === node.id ? "hsl(var(--primary))" : "hsl(var(--accent))"}
                  strokeWidth={2}
                />
                <text
                  x={node.x}
                  y={node.y + node.size + 14}
                  textAnchor="middle"
                  fill="hsl(var(--muted-foreground))"
                  fontSize={10}
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="hsl(var(--foreground))"
                  fontSize={11}
                  fontWeight={600}
                >
                  {node.label.split(" ")[0]}
                </text>
              </motion.g>
            ))}
          </g>
        </svg>
      </div>

      {selectedNode && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 grid place-items-center">
              <Maximize2 className="size-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold">{selectedNode}</div>
              <div className="text-xs text-muted-foreground">{nodes.find((n) => n.id === selectedNode)?.label} cluster</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}