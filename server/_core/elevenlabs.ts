/**
 * ElevenLabs API Integration
 *
 * 支持:
 * 1. Text-to-Speech (TTS) — 文字转语音
 * 2. Voice Cloning — 语音克隆（可选）
 * 3. Conversational AI — 对话式 AI 代理
 * 4. Phone Calls — 电话呼叫代理
 *
 * 用途:
 * - MaoAI Sales 客服语音机器人
 * - 自动电话客服
 * - 预约管理
 * - 客户咨询应答
 */

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels?: Record<string, string>;
  preview_url?: string;
  description?: string;
}

export interface TTSOptions {
  text: string;
  voiceId: string;
  modelId?: string;
  stability?: number;    // 0-1, default 0.5
  similarity?: number;   // 0-1, default 0.75
  style?: number;        // 0-1, default 0
  outputFormat?: string; // mp3_44100_128, pcm_16000, etc.
}

export interface ConversationConfig {
  agentId: string;
  /** Dynamic variables passed to the conversation */
  dynamicVariables?: Record<string, string>;
  /** Customer phone number (E.164 format) */
  customerNumber?: string;
  /** Agent phone number (E.164 format) */
  agentNumber?: string;
}

export interface ConversationEvent {
  type: string;
  timestamp: string;
  [key: string]: unknown;
}

// ─── Voices ─────────────────────────────────────────────────────────────────

/**
 * List available voices
 */
export async function listVoices(): Promise<Voice[]> {
  if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY 未配置");

  const resp = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
  });

  if (!resp.ok) throw new Error(`ElevenLabs 获取语音列表失败 (${resp.status})`);
  const data = (await resp.json()) as { voices: Voice[] };
  return data.voices;
}

/**
 * Get voice by ID
 */
export async function getVoice(voiceId: string): Promise<Voice> {
  if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY 未配置");

  const resp = await fetch(`${ELEVENLABS_BASE_URL}/voices/${voiceId}`, {
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
  });

  if (!resp.ok) throw new Error(`ElevenLabs 获取语音失败 (${resp.status})`);
  return (await resp.json()) as Voice;
}

// ─── Text-to-Speech ─────────────────────────────────────────────────────────

/**
 * Generate speech from text, returns audio buffer
 */
export async function textToSpeech(options: TTSOptions): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY 未配置");

  const body: Record<string, unknown> = {
    text: options.text,
    model_id: options.modelId || "eleven_multilingual_v2",
    voice_settings: {
      stability: options.stability ?? 0.5,
      similarity_boost: options.similarity ?? 0.75,
      style: options.style ?? 0,
    },
  };

  const resp = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${options.voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(body),
    }
  );

  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`ElevenLabs TTS 失败 (${resp.status}): ${err}`);
  }

  return Buffer.from(await resp.arrayBuffer());
}

/**
 * Generate speech and return as base64 data URI
 */
export async function textToSpeechBase64(options: TTSOptions): Promise<string> {
  const buffer = await textToSpeech(options);
  return `data:audio/mpeg;base64,${buffer.toString("base64")}`;
}

// ─── Conversational AI Agent ────────────────────────────────────────────────

/**
 * Get available conversational AI agents
 */
export async function listConversationalAgents(): Promise<Array<{
  agent_id: string;
  name: string;
  description?: string;
}>> {
  if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY 未配置");

  const resp = await fetch(
    `${ELEVENLABS_BASE_URL}/convai/agents`,
    {
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
    }
  );

  if (!resp.ok) {
    // If convai endpoint doesn't exist yet, return empty
    if (resp.status === 404) return [];
    throw new Error(`ElevenLabs 获取 AI Agent 列表失败 (${resp.status})`);
  }

  const data = (await resp.json()) as { agents?: Array<{ agent_id: string; name: string; description?: string }> };
  return data.agents || [];
}

/**
 * Create a new conversational AI agent for customer service
 */
export async function createConversationalAgent(config: {
  name: string;
  /** System prompt that defines the agent's personality and behavior */
  prompt: {
    preamble: string;
    language?: string;
  };
  /** First message the agent says */
  firstMessage: string;
  /** Voice ID to use */
  voiceId?: string;
  /** Agent phone number for outbound calls */
  phoneNumber?: string;
  /** Language code (e.g. "zh", "en") */
  language?: string;
  /** Temperature for response generation */
  temperature?: number;
  /** Max tokens for agent response */
  maxTokens?: number;
}): Promise<{ agent_id: string }> {
  if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY 未配置");

  const body: Record<string, unknown> = {
    name: config.name,
    prompt: {
      preamble: config.prompt.preamble,
      ...(config.prompt.language ? { language: config.prompt.language } : {}),
    },
    first_message: config.firstMessage,
    agent: {
      prompt: {
        preamble: config.prompt.preamble,
      },
      first_message: config.firstMessage,
      language: config.language || "zh",
      ...(config.voiceId ? { voice_id: config.voiceId } : {}),
      ...(config.phoneNumber ? { phone_number: { number: config.phoneNumber } } : {}),
      ...(config.temperature !== undefined ? { temperature: config.temperature } : {}),
      ...(config.maxTokens ? { max_tokens: config.maxTokens } : {}),
    },
  };

  const resp = await fetch(
    `${ELEVENLABS_BASE_URL}/convai/agents/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(body),
    }
  );

  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`ElevenLabs 创建 AI Agent 失败 (${resp.status}): ${err}`);
  }

  const data = (await resp.json()) as { agent_id?: string };
  return { agent_id: data.agent_id || "" };
}

/**
 * Initiate an outbound phone call via Conversational AI
 */
export async function initiatePhoneCall(config: {
  agentId: string;
  customerNumber: string;
  agentNumber?: string;
}): Promise<{ conversation_id: string }> {
  if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY 未配置");

  const body: Record<string, unknown> = {
    agent_id: config.agentId,
    phone_number: {
      number: config.customerNumber,
    },
    ...(config.agentNumber ? { agent_phone_number: { number: config.agentNumber } } : {}),
  };

  const resp = await fetch(
    `${ELEVENLABS_BASE_URL}/convai/conversation/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(body),
    }
  );

  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`ElevenLabs 发起电话呼叫失败 (${resp.status}): ${err}`);
  }

  const data = (await resp.json()) as { conversation_id?: string };
  return { conversation_id: data.conversation_id || "" };
}

/**
 * Get conversation history
 */
export async function getConversationHistory(conversationId: string): Promise<ConversationEvent[]> {
  if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY 未配置");

  const resp = await fetch(
    `${ELEVENLABS_BASE_URL}/convai/conversation/${conversationId}`,
    {
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
    }
  );

  if (!resp.ok) {
    throw new Error(`ElevenLabs 获取对话历史失败 (${resp.status})`);
  }

  const data = (await resp.json()) as { events?: ConversationEvent[] };
  return data.events || [];
}

// ─── Utility ────────────────────────────────────────────────────────────────

/**
 * Check if ElevenLabs API is configured
 */
export function isElevenLabsConfigured(): boolean {
  return !!ELEVENLABS_API_KEY;
}
