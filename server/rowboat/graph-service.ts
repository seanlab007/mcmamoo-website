/**
 * Rowboat Graph Service
 * 知识图谱服务 - 基于 Supabase 实现
 *
 * 对标 rowboat 真实源码: apps/rowboat/src/application/services/knowledge-graph
 *
 * 与真实 rowboat 的核心差异:
 * - rowboat: NetworkX (Python) + 复杂图算法
 * - 我们: Supabase + TypeScript（D3 可视化专用格式）
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Entity } from "./rowboat-router";

export interface GraphNode {
  id: string;
  name: string;
  type: Entity["type"];
  properties: Record<string, any>;
  weight: number; // 出现频次，影响节点大小
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "relates_to" | "part_of" | "depends_on" | "created_by";
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    userId: string;
    depth: number;
    totalEntities: number;
  };
}

export class RowboatGraphService {
  private supabase: SupabaseClient;
  private tableName = "rowboat_graph";

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ── 更新图谱（实体 → 节点 + 关系边）────────────────────────────────────────
  async updateGraph(entities: Entity[], userId: string): Promise<{ added: number; updated: number }> {
    let added = 0, updated = 0;

    for (const entity of entities) {
      const existing = await this.getNodeByName(entity.name, userId);

      if (existing) {
        await this.updateNodeWeight(existing.id, entity.confidence);
        updated++;
      } else {
        await this.insertNode(entity, userId);
        added++;
      }
    }

    // 生成实体间的关系边（每对实体建立关联）
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        await this.upsertEdge(entities[i], entities[j], userId);
      }
    }

    return { added, updated };
  }

  // ── 获取图谱数据（供 D3 可视化）──────────────────────────────────────────────
  async getGraph(userId: string, depth = 2): Promise<GraphData> {
    try {
      const { data: nodes, error: nodeErr } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .order("weight", { ascending: false })
        .limit(200);

      const { data: edges, error: edgeErr } = await this.supabase
        .from(`${this.tableName}_edges`)
        .select("*")
        .eq("user_id", userId)
        .limit(300);

      if (nodeErr || edgeErr) {
        console.debug("[Rowboat/Graph] table query:", nodeErr?.message || edgeErr?.message);
      }

      const graphNodes: GraphNode[] = (nodes || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.entity_type,
        properties: row.properties || {},
        weight: row.weight || 1,
      }));

      const graphEdges: GraphEdge[] = (edges || []).map((row: any) => ({
        id: row.id,
        source: row.source_id,
        target: row.target_id,
        type: row.edge_type,
        weight: row.weight || 1,
      }));

      return {
        nodes: graphNodes,
        edges: graphEdges,
        metadata: { userId, depth, totalEntities: graphNodes.length },
      };
    } catch (err) {
      console.debug("[Rowboat/Graph] getGraph fallback:", (err as Error).message);
      return { nodes: [], edges: [], metadata: { userId, depth, totalEntities: 0 } };
    }
  }

  private async insertNode(entity: Entity, userId: string) {
    await this.supabase.from(this.tableName).insert({
      id: entity.id,
      user_id: userId,
      name: entity.name,
      entity_type: entity.type,
      properties: { context: entity.context, confidence: entity.confidence },
      weight: 1,
    }).catch(() => {});
  }

  private async updateNodeWeight(nodeId: string, delta = 0.1) {
    await this.supabase
      .from(this.tableName)
      .update({ weight: this.supabase.rpc("increment_node_weight", { node_id: nodeId, delta }) })
      .eq("id", nodeId)
      .then(() => {})
      .catch(() => {});
  }

  private async getNodeByName(name: string, userId: string): Promise<{ id: string } | null> {
    try {
      const { data } = await this.supabase
        .from(this.tableName)
        .select("id")
        .eq("user_id", userId)
        .eq("name", name)
        .maybeSingle();
      return data;
    } catch {
      return null;
    }
  }

  private async upsertEdge(entityA: Entity, entityB: Entity, userId: string) {
    const edgeId = `edge_${[entityA.id, entityB.id].sort().join("_")}`;
    await this.supabase.from(`${this.tableName}_edges`).upsert({
      id: edgeId,
      user_id: userId,
      source_id: entityA.id,
      target_id: entityB.id,
      edge_type: "relates_to",
      weight: 1,
    }, { onConflict: "id" }).catch(() => {});
  }
}
