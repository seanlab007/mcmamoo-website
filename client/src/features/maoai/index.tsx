/**
 * MaoAI Feature — 统一导出入口
 * ─────────────────────────────────────────────────────────────────────────────
 * 外部代码（App.tsx、Navbar 等）只需从这里导入，
 * 内部实现调整时只需修改 features/maoai/ 目录。
 *
 * Usage:
 *   import { MaoAIChat, MaoAILogin, MaoAIPricing, MaoAISales, MaoAICustomerService, MAOAI_ROUTES }
 *     from "@/features/maoai";
 */

// Pages
export { default as MaoAIChat } from "./pages/Chat";
export { default as MaoAILogin } from "./pages/Login";
export { default as MaoAIPricing } from "./pages/Pricing";
export { default as MaoAISales } from "./pages/MaoAISales";
export { default as MaoAIResearchDigest } from "./pages/ResearchDigest";
export { default as MaoAICustomerService } from "./pages/CustomerService";

// Components
export { AgentModeSelector } from "./components/AgentModeSelector";
<<<<<<< HEAD
export { SuggestedFollowUps } from "./components/SuggestedFollowUps";
=======
>>>>>>> feat/maoai-latest

// Constants
export {
  MAOAI_ROUTES,
  MAOAI_BACKEND_URL,
  MAOAI_TOOL_DISPLAY,
  MAOAI_TIER_LABELS,
  MAOAI_LOCAL_OLLAMA,
<<<<<<< HEAD
  SUGGESTION_DIMENSIONS,
=======
>>>>>>> feat/maoai-latest
} from "./constants";

// Types
export type {
  Message,
  MessageContent,
  ToolCallStep,
  ActiveNodeInfo,
  Conversation,
  CloudModel,
  LocalNode,
  ModelOption,
  PendingFile,
  Agent,
  AgentCategory,
  Lead,
  LeadStatus,
  MaoAIRoute,
  MaoAIInputMode,
<<<<<<< HEAD
  SuggestedQuestion,
  SuggestionDimension,
=======
>>>>>>> feat/maoai-latest
} from "./types";
