/**
 * 猫眼内容平台节点导出
 * 
 * 导出所有 AI 节点供主服务使用
 */

export { default as videoEditorRouter } from "./videoEditor";
export { default as digitalHumanRouter } from "./digitalHuman";

// 节点元数据
export const NODE_METADATA = {
  videoEditor: {
    name: "AI视频剪辑",
    description: "基于 ShortGPT 的自动化视频剪辑，支持脚本生成、多语言配音、自动字幕",
    requiredPlan: "content",
    nodeId: "video-center",
    capabilities: [
      "script_generation",
      "text_to_speech",
      "asset_search",
      "video_composition",
      "subtitle_generation",
    ],
  },
  digitalHuman: {
    name: "数字人生成",
    description: "基于 LivePortrait/Duix/Streamer-Sales 的数字人视频生成",
    requiredPlan: "strategic",
    nodeId: "ai-studio",
    capabilities: [
      "portrait_animation",
      "lip_sync",
      "expression_control",
      "ecommerce_streamer",
      "realtime_interaction",
    ],
  },
};

// API 端点列表
export const API_ENDPOINTS = {
  videoEditor: {
    createTask: "POST /api/maoyan/video",
    getTask: "GET /api/maoyan/video/:taskId",
    getProgress: "GET /api/maoyan/video/:taskId/progress",
  },
  digitalHuman: {
    createTask: "POST /api/maoyan/avatar",
    getTask: "GET /api/maoyan/avatar/:taskId",
    generateScript: "POST /api/maoyan/avatar/streamer/script",
    createSession: "POST /api/maoyan/avatar/session",
    sendMessage: "POST /api/maoyan/avatar/session/:sessionId/message",
  },
};
