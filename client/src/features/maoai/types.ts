/**
 * MaoAI Feature Types
 * ─────────────────────────────────────────────────────────────────────────────
 * 所有 MaoAI 专属类型定义集中在此，避免在各页面重复声明。
 */

// ─── Chat Message ─────────────────────────────────────────────────────────────

export type MessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export type ToolCallStep = {
  id: string;
  name: string;
  args?: Record<string, unknown>;
  status: "calling" | "done" | "error";
  outputPreview?: string;
};

export type ActiveNodeInfo = {
  id: number | null;
  name: string;
  model: string;
  isLocal: boolean;
  badge?: string;
};

export type Message = {
  role: "user" | "assistant";
  content: MessageContent;
  nodeInfo?: ActiveNodeInfo;
  displayText?: string;
  imageUrls?: string[];
  generatedImageUrl?: string;
  isImageGeneration?: boolean;
  toolCalls?: ToolCallStep[];
};

export type Conversation = {
  id: number;
  title: string;
  model: string;
  updatedAt: string;
};

// ─── Models / Nodes ───────────────────────────────────────────────────────────

export type CloudModel = {
  id: string;
  name: string;
  badge: string;
  description: string;
  supportsVision?: boolean;
  available?: boolean;
  isLocal: false;
  isStrategicMode?: boolean;
};

// ─── TriadLoop Types ─────────────────────────────────────────────────────────

export type TriadAgentType = "strategist" | "coders" | "reviewer" | "validator";

export type TriadPhase = 
  | "idle"
  | "strategist_analyzing"
  | "coders_generating"
  | "reviewer_reviewing"
  | "validator_testing"
  | "converging"
  | "completed"
  | "error";

export type TriadMessageType = "thinking" | "action" | "result" | "feedback" | "converge" | "error";

export type TriadMessage = {
  agent: TriadAgentType;
  type: TriadMessageType;
  content: string;
  timestamp: string;
  round: number;
  metadata?: Record<string, unknown>;
};

export type TriadLoopState = {
  isConnected: boolean;
  isRunning: boolean;
  currentPhase: TriadPhase;
  currentAgent: TriadAgentType | null;
  currentRound: number;
  totalRounds: number;
  messages: TriadMessage[];
  score: number | null;
  finalCode?: string;
  error?: string;
};

export type LocalNode = {
  id: string;
  nodeId: number;
  name: string;
  badge: string;
  description: string;
  modelId: string;
  isLocal: true;
  isOnline: boolean;
};

export type ModelOption = CloudModel | LocalNode;

// ─── File Upload ──────────────────────────────────────────────────────────────

export type PendingFile = {
  name: string;
  fileType: string;
  text: string;
  size: number;
  truncated?: boolean;
  charCount?: number;
};

// ─── Agents ───────────────────────────────────────────────────────────────────

export type Agent = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  exampleQuestions?: string[];
};

export type AgentCategory = {
  category: string;
  info: {
    label: string;
    emoji: string;
    color: string;
  };
  agents: Agent[];
};

// ─── Routes / Input Modes (re-exported from constants) ───────────────────────
// These types live in constants.ts but are also exported from types.ts
// so that `index.tsx` can re-export them from a single `./types` source.
export type { MaoAIRoute, MaoAIInputMode } from "./constants";

// ─── Sales CRM ────────────────────────────────────────────────────────────────

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type ValueRating = "A" | "B" | "C" | "D";
export type PaymentRisk = "low" | "medium" | "high";
export type DecisionCycle = "1_week" | "2_weeks" | "1_month" | "1_quarter" | "long" | "unknown";
export type LTCStage = "ML" | "MO" | "ATC" | "delivery" | "collection";
export type CommStyle = "data_driven" | "relationship" | "security" | "mixed";
export type IntelType = "customer_public" | "competitor" | "industry" | "other";

export type Lead = {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  status: LeadStatus;
  score: number;
  aiInsights: string[];
  suggestedActions: string[];
  // Huawei-style fields
  valueRating: ValueRating;
  competitorName: string;
  competitorAdvantage: string;
  ourAdvantage: string;
  paymentRisk: PaymentRisk;
  decisionCycle: DecisionCycle;
  needPrepayment: boolean;
  estimatedValue: number | null;
  industry: string;
  powerMapVersion: number;
  ltcStage: LTCStage;
  lastContact: string | null;
  nextFollowUp: string | null;
};

// ─── Decision Maker (Power Map + Pain Chain) ─────────────────────────────────

export type DecisionRole = "initiator" | "influencer" | "decider" | "approver" | "buyer";

export type DecisionMaker = {
  id: string;
  leadId: string;
  name: string;
  title: string;
  department: string;
  roles: DecisionRole[];
  // Pain Chain
  businessPain: string;
  personalGoal: string;
  fearPoint: string;
  // Influence Strategy
  communicationStyle: CommStyle;
  icebreaker: string;
  relationshipStrength: number;
  // Iron Triangle Verification
  arVerified: boolean;
  srVerified: boolean;
  frVerified: boolean;
  // Action
  nextAction: string;
  nextActionDate: string | null;
  notes: string;
};

// ─── Competitor Comparison ────────────────────────────────────────────────────

export type CompetitorComparison = {
  id: string;
  leadId: string;
  competitorName: string;
  competitorSolution: string;
  competitorPriceRange: string;
  competitorDeliveryCycle: string;
  competitorStrengths: string;
  competitorWeaknesses: string;
  ourDifferentiator: string;
  comparisonDate: string;
};

// ─── Iron Triangle Review ─────────────────────────────────────────────────────

export type IronTriangleReview = {
  id: string;
  leadId: string;
  reviewDate: string;
  arCoverage: string;
  arNextStep: string;
  srPainMatch: string;
  srProposalStatus: string;
  frDeliveryRisk: string;
  frPaymentPlan: string;
  overallActionPlan: string;
  winProbability: number | null;
};

// ─── Intel Record (两看) ─────────────────────────────────────────────────────

export type IntelRecord = {
  id: string;
  leadId: string;
  intelType: IntelType;
  source: string;
  title: string;
  content: string;
  impact: string;
  recordedAt: string;
};

// ─── LTC Weekly Task ─────────────────────────────────────────────────────────

export type LTCPhase = "ML_clean" | "ML_value_email" | "MO_deep_update" | "MO_strategy" | "ATC_review" | "delivery_monitor" | "collection";

export type LTCWeeklyTask = {
  id: string;
  leadId: string;
  weekStart: string;
  phase: LTCPhase;
  taskDescription: string;
  completed: boolean;
  completedAt: string | null;
  notes: string;
};
