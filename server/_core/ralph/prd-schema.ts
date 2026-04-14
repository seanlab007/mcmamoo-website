/**
 * prd-schema.ts
 * Ralph prd.json 扩展 Schema 定义
 * 
 * 扩展原有 prd.json 结构以支持 MaoAI Core 2.0 的：
 *  - Triad Loop 集成（triadConfig）
 *  - Decision Ledger 同步（decisionLedgerRef）
 *  - Stream Broker 事件（eventConfig）
 *  - 多 Agent 协作（agentTeams）
 */

import { z } from "zod";

// ============================================================================
// Base Ralph Schema（原有结构）
// ============================================================================

export const BaseRalphUserStorySchema = z.object({
  id: z.string().regex(/^US-\d{3}$/, "格式: US-001"),
  title: z.string().min(1).max(200),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()).min(1),
  priority: z.number().int().min(1).max(10),
  passes: z.boolean().default(false),
  assignee: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const BaseRalphPrdSchema = z.object({
  project: z.string().min(1),
  branchName: z.string(),
  description: z.string(),
  userStories: z.array(BaseRalphUserStorySchema),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    createdBy: z.string(),
    version: z.string(),
    baseBranch: z.string(),
    targetBranch: z.string(),
  }),
});

// ============================================================================
// Triad Loop 集成扩展（核心新增）
// ============================================================================

export const TriadConfigSchema = z.object({
  coder: z.string().describe("Coder 模型"),
  reviewer: z.string().describe("Reviewer 模型"),
  validatorType: z.enum(["docker", "local", "none"]).describe("验证环境"),
  maxIterations: z.number().int().min(1).max(20).default(5),
  scoreThreshold: z.number().min(0).max(100).default(80),
  language: z.enum(["python", "typescript", "go", "rust", "auto"]).default("auto"),
  useRag: z.boolean().default(true),
  ragTopK: z.number().int().min(1).max(20).default(5),
  atomicMode: z.boolean().default(false),
  atomicMaxLines: z.number().int().default(50),
  qualityGates: z.object({
    typecheck: z.boolean().default(true),
    lint: z.boolean().default(true),
    test: z.boolean().default(true),
    security: z.boolean().default(true),
  }).optional(),
});

export type TriadConfig = z.infer<typeof TriadConfigSchema>;

// ============================================================================
// Decision Ledger 集成
// ============================================================================

export const DecisionLedgerRefSchema = z.object({
  ledgerId: z.string(),
  syncEnabled: z.boolean().default(true),
  syncInterval: z.enum(["realtime", "hourly", "daily"]).default("realtime"),
  mappings: z.array(z.object({
    prdField: z.string(),
    ledgerField: z.string(),
    direction: z.enum(["bidirectional", "prd-to-ledger", "ledger-to-prd"]).default("bidirectional"),
  })).optional(),
});

export type DecisionLedgerRef = z.infer<typeof DecisionLedgerRefSchema>;

// ============================================================================
// Stream Broker 事件配置
// ============================================================================

export const StreamEventConfigSchema = z.object({
  enabled: z.boolean().default(true),
  wsEndpoint: z.string().url().optional(),
  events: z.array(z.enum([
    "story:started", "story:completed", "story:failed",
    "iteration:started", "iteration:completed", "iteration:failed",
    "triad:coder_output", "triad:reviewer_output", "triad:validator_output",
    "prd:updated", "progress:appended", "git:commit",
  ])).default(["story:started", "story:completed", "prd:updated"]),
  frontendRoute: z.string().default("/ralph/dashboard"),
});

export type StreamEventConfig = z.infer<typeof StreamEventConfigSchema>;

// ============================================================================
// Agent Teams 配置
// ============================================================================

export const AgentTeamSchema = z.object({
  teamId: z.string(),
  teamName: z.string(),
  members: z.array(z.object({
    agentId: z.string(),
    role: z.enum(["coder", "reviewer", "validator", "coordinator", "specialist"]),
    model: z.string(),
    maxTurns: z.number().int().default(10),
    tools: z.array(z.string()).optional(),
  })),
  protocol: z.enum(["sequential", "parallel", "hierarchical"]).default("sequential"),
  dependencies: z.record(z.array(z.string())).optional(),
});

export type AgentTeam = z.infer<typeof AgentTeamSchema>;

// ============================================================================
// 扩展后的 Ralph User Story
// ============================================================================

export const RalphUserStorySchema = BaseRalphUserStorySchema.extend({
  iterations: z.array(z.object({
    iterationNumber: z.number().int(),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
    status: z.enum(["pending", "running", "passed", "failed", "escalated"]),
    triadResult: z.object({
      success: z.boolean(),
      status: z.enum(["approved", "rejected", "error"]),
      finalCode: z.string().optional(),
      finalScore: z.number().optional(),
      totalRounds: z.number().optional(),
      totalTime: z.number().optional(),
    }).optional(),
    learnings: z.array(z.string()).optional(),
    issues: z.array(z.string()).optional(),
    score: z.number().optional(),
  })).optional(),
  progress: z.string().optional(),
  triadConfig: TriadConfigSchema.optional(),
  decisionLedgerRef: DecisionLedgerRefSchema.optional(),
  streamEvents: StreamEventConfigSchema.optional(),
  agentTeam: AgentTeamSchema.optional(),
  codebaseContext: z.object({
    basePath: z.string().optional(),
    includeFiles: z.array(z.string()).optional(),
    excludeFiles: z.array(z.string()).optional(),
    ragEnabled: z.boolean().default(true),
  }).optional(),
  constraints: z.object({
    maxTimeMinutes: z.number().int().optional(),
    maxCostUSD: z.number().optional(),
    allowedTools: z.array(z.string()).optional(),
    blockedTools: z.array(z.string()).optional(),
  }).optional(),
  dependsOn: z.array(z.string()).optional(),
  blockedBy: z.array(z.string()).optional(),
});

export type RalphUserStory = z.infer<typeof RalphUserStorySchema>;

// ============================================================================
// 扩展后的 PRD Schema
// ============================================================================

export const RalphPrdSchema = z.object({
  project: z.string(),
  branchName: z.string(),
  description: z.string(),
  userStories: z.array(RalphUserStorySchema),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    createdBy: z.string(),
    version: z.string(),
    baseBranch: z.string(),
    targetBranch: z.string(),
  }),
  globalTriadConfig: TriadConfigSchema.optional(),
  decisionLedger: DecisionLedgerRefSchema.optional(),
  streamBroker: StreamEventConfigSchema.optional(),
  agentTeams: z.array(AgentTeamSchema).optional(),
  codebaseConfig: z.object({
    basePath: z.string(),
    includePatterns: z.array(z.string()).optional(),
    excludePatterns: z.array(z.string()).optional(),
    ragCorpusPath: z.string().optional(),
  }).optional(),
  executionStrategy: z.object({
    mode: z.enum(["strict", "relaxed", "fast"]).default("strict"),
    parallelStories: z.number().int().min(1).max(5).default(1),
    failFast: z.boolean().default(true),
    maxTotalIterations: z.number().int().optional(),
  }).optional(),
});

export type RalphPrd = z.infer<typeof RalphPrdSchema>;

// ============================================================================
// 验证工具
// ============================================================================

export function validatePrd(data: unknown) {
  return RalphPrdSchema.safeParse(data);
}

export function validateStory(data: unknown) {
  return RalphUserStorySchema.safeParse(data);
}

export default {
  RalphPrdSchema,
  RalphUserStorySchema,
  TriadConfigSchema,
  DecisionLedgerRefSchema,
  StreamEventConfigSchema,
  AgentTeamSchema,
  validatePrd,
  validateStory,
};
