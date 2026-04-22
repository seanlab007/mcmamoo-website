/**
 * 知识图谱可视化组件
 * 
 * 基于 D3.js 力导向图的实体关系展示
 */

import React, { useEffect, useRef, useState } from 'react';

interface GraphNode {
  id: string;
  name: string;
  type: 'person' | 'project' | 'company' | 'topic' | 'event';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

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
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
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
