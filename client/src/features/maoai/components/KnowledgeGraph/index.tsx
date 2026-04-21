/**
<<<<<<< HEAD
 * 知识图谱可视化组件
 * 
 * 基于 D3.js 力导向图的实体关系展示
 */

import React, { useEffect, useRef, useState } from 'react';
=======
 * KnowledgeGraph 组件
 * 交互式知识图谱可视化（基于 D3.js 力导向图）
 *
 * 对标 rowboat 真实源码: apps/rowboat/src/app/knowledge-graph
 *
 * 集成方式:
 * - 在 MaoAI Chat 页面侧边栏显示
 * - 实时从 /api/rowboat/graph 获取图谱数据
 * - 支持节点拖拽、缩放、点击查看详情
 */

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const BACKEND = import.meta.env.VITE_MAOAI_BACKEND_URL || "";
>>>>>>> 9ea237c (feat: Rowboat知识图谱 + 记忆面板 + Token优化 + 毛选语料路由 + maoCorpusRouter)

interface GraphNode {
  id: string;
  name: string;
<<<<<<< HEAD
  type: 'person' | 'project' | 'company' | 'topic' | 'event';
=======
  type: "person" | "organization" | "technology" | "date" | "concept" | "other";
  weight: number;
  properties?: Record<string, any>;
>>>>>>> 9ea237c (feat: Rowboat知识图谱 + 记忆面板 + Token优化 + 毛选语料路由 + maoCorpusRouter)
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

<<<<<<< HEAD
interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

interface KnowledgeGraphProps {
  nodes?: GraphNode[];
  links?: GraphLink[];
  onNodeClick?: (node: GraphNode) => void;
  onSearch?: (query: string) => void;
  height?: number;
}

const NODE_COLORS: Record<string, string> = {
  person: '#3b82f6',   // blue
  project: '#10b981',  // green
  company: '#f59e0b',  // amber
  topic: '#8b5cf6',    // purple
  event: '#ef4444',    // red
  default: '#6b7280',  // gray
};

export function KnowledgeGraph({
  nodes: initialNodes = [],
  links: initialLinks = [],
  onNodeClick,
  onSearch,
  height = 400,
}: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [links, setLinks] = useState<GraphLink[]>(initialLinks);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // 动态导入 D3（避免 SSR 问题）
    import('d3').then((d3) => {
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      const width = svgRef.current.clientWidth;
      const g = svg.append('g');

      // 缩放
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(zoom);

      // 力导向模拟
      const simulation = d3.forceSimulation<GraphNode>(nodes)
        .force('link', d3.forceLink<GraphNode, GraphLink>(links)
          .id(d => d.id)
          .distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(40));

      // 绘制连线
      const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', '#9ca3af')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.6);

      // 绘制节点
      const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('cursor', 'pointer')
        .call(d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
=======
interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  weight: number;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: { userId: string; depth: number; totalEntities: number };
}

const TYPE_COLORS: Record<string, string> = {
  person: "#e74c3c",
  organization: "#3498db",
  technology: "#27ae60",
  date: "#f39c12",
  concept: "#9b59b6",
  other: "#95a5a6",
};

const TYPE_LABELS: Record<string, string> = {
  person: "人物",
  organization: "组织",
  technology: "技术",
  date: "日期",
  concept: "概念",
  other: "其他",
};

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [totalNodes, setTotalNodes] = useState(0);

  // ── 获取图谱数据 ─────────────────────────────────────────
  const fetchGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${BACKEND}/api/rowboat/graph?userId=default&depth=2`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: GraphData = await resp.json();
      setGraphData(data);
      setTotalNodes(data.metadata.totalEntities);
    } catch (err: any) {
      setError("图谱加载失败：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
    const interval = setInterval(fetchGraph, 30000); // 每 30 秒刷新
    return () => clearInterval(interval);
  }, []);

  // ── D3 力导向图渲染 ──────────────────────────────────────
  useEffect(() => {
    if (!graphData || !svgRef.current || !containerRef.current) return;

    const nodes = graphData.nodes.map((n) => ({ ...n }));
    const edges = graphData.edges.map((e) => ({
      ...e,
      source: typeof e.source === "string" ? e.source : e.source.id,
      target: typeof e.target === "string" ? e.target : e.target.id,
    }));

    if (nodes.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 360;
    const height = Math.min(400, container.clientHeight || 400);

    // 清空旧图
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // 缩放
    const g = svg.append("g");
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on("zoom", (event) => g.attr("transform", event.transform))
    );

    // 力导向模拟
    const simulation = d3
      .forceSimulation<GraphNode>(nodes as GraphNode[])
      .force(
        "link",
        d3
          .forceLink<GraphNode, d3.SimulationLinkDatum<GraphNode>>(edges as d3.SimulationLinkDatum<GraphNode>[])
          .id((d) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => (d.weight || 1) * 6 + 12));

    // 绘制连线
    const link = g
      .append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#bdc3c7")
      .attr("stroke-width", (d) => Math.min(d.weight || 1, 3))
      .attr("stroke-opacity", 0.6);

    // 绘制节点
    const node = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes as GraphNode[])
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
>>>>>>> 9ea237c (feat: Rowboat知识图谱 + 记忆面板 + Token优化 + 毛选语料路由 + maoCorpusRouter)
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
<<<<<<< HEAD
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }));

      // 节点圆形
      node.append('circle')
        .attr('r', 20)
        .attr('fill', d => NODE_COLORS[d.type] || NODE_COLORS.default)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      // 节点标签
      node.append('text')
        .text(d => d.name.slice(0, 10))
        .attr('dy', 35)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .attr('fill', '#374151');

      // 节点类型标签
      node.append('text')
        .text(d => d.type)
        .attr('dy', -30)
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('fill', '#6b7280');

      // 点击事件
      node.on('click', (event, d) => {
        setSelectedNode(d);
        onNodeClick?.(d);
      });

      // 更新位置
      simulation.on('tick', () => {
        link
          .attr('x1', d => (d.source as GraphNode).x!)
          .attr('y1', d => (d.source as GraphNode).y!)
          .attr('x2', d => (d.target as GraphNode).x!)
          .attr('y2', d => (d.target as GraphNode).y!);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
      });
    });

    return () => {
      // 清理
    };
  }, [nodes, links, height]);

  const handleSearch = () => {
    onSearch?.(searchQuery);
  };

  const highlightNode = (nodeId: string) => {
    setNodes(prev => prev.map(n => ({
      ...n,
      fx: n.id === nodeId ? n.x : null,
      fy: n.id === nodeId ? n.y : null,
    })));
  };

  return (
    <div className="knowledge-graph bg-white rounded-lg shadow-md p-4">
      {/* 搜索栏 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="搜索实体..."
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          搜索
        </button>
      </div>

      {/* 图谱 */}
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        className="bg-gray-50 rounded-lg"
      />

      {/* 选中节点详情 */}
      {selectedNode && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-lg">{selectedNode.name}</h3>
          <p className="text-sm text-gray-500">类型: {selectedNode.type}</p>
          <button
            onClick={() => setSelectedNode(null)}
            className="mt-2 text-sm text-blue-500 hover:underline"
          >
            关闭
          </button>
        </div>
      )}

      {/* 图例 */}
      <div className="flex flex-wrap gap-4 mt-4 text-sm">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default KnowledgeGraph;
=======
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (_event, d) => setSelectedNode(d));

    // 节点圆圈
    node
      .append("circle")
      .attr("r", (d) => Math.max(8, Math.min(24, (d.weight || 1) * 4 + 8)))
      .attr("fill", (d) => TYPE_COLORS[d.type] || TYPE_COLORS.other)
      .attr("fill-opacity", 0.85)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // 节点标签
    node
      .append("text")
      .text((d) => d.name.length > 10 ? d.name.slice(0, 10) + "…" : d.name)
      .attr("font-size", 10)
      .attr("font-family", "system-ui, sans-serif")
      .attr("fill", "#2c3e50")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => Math.max(8, Math.min(24, (d.weight || 1) * 4 + 8)) + 14);

    // 节点类型图标
    node
      .append("text")
      .text((d) => {
        const icons: Record<string, string> = { person: "👤", organization: "🏢", technology: "⚙️", date: "📅", concept: "💡", other: "🔹" };
        return icons[d.type] || icons.other;
      })
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("font-size", (d) => Math.max(10, Math.min(18, (d.weight || 1) * 4 + 8)));

    // 模拟步进
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [graphData]);

  // ── 渲染 ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🕸️</span>
          <span className="font-semibold text-gray-800 text-sm">知识图谱</span>
          {totalNodes > 0 && (
            <span className="text-xs text-gray-400">({totalNodes} 实体)</span>
          )}
        </div>
        <button
          onClick={fetchGraph}
          disabled={loading}
          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"
        >
          {loading ? "⏳" : "🔄"}
        </button>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: TYPE_COLORS[type] }}
            />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* 图谱容器 */}
      <div ref={containerRef} className="relative w-full" style={{ height: 320 }}>
        {error && (
          <div className="flex items-center justify-center h-full text-xs text-red-500">
            {error}
          </div>
        )}
        {!error && graphData?.nodes.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-xs text-gray-400 gap-2">
            <span className="text-2xl">🕸️</span>
            <span>暂无图谱数据</span>
            <span className="text-gray-300">发送消息后自动构建</span>
          </div>
        )}
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* 节点详情面板 */}
      {selectedNode && (
        <div className="bg-gray-50 rounded p-2 text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">{selectedNode.name}</span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <span
              className="px-1.5 py-0.5 rounded text-white text-xs"
              style={{ backgroundColor: TYPE_COLORS[selectedNode.type] }}
            >
              {TYPE_LABELS[selectedNode.type]}
            </span>
            <span className="text-gray-400">权重 ×{selectedNode.weight}</span>
          </div>
          {selectedNode.properties?.context && (
            <p className="mt-1 text-gray-500 truncate">
              "{selectedNode.properties.context}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
>>>>>>> 9ea237c (feat: Rowboat知识图谱 + 记忆面板 + Token优化 + 毛选语料路由 + maoCorpusRouter)
