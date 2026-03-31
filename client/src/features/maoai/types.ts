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

export type Lead = {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  status: LeadStatus;
  score: number;
  aiInsights: string[];
};
