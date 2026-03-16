import { Router, Request, Response } from "express";
import { MODEL_CONFIGS } from "./routers";

const aiStreamRouter = Router();

aiStreamRouter.post("/chat/stream", async (req: Request, res: Response) => {
  const { model = "deepseek-chat", messages, systemPrompt } = req.body;

  const cfg = MODEL_CONFIGS[model];
  if (!cfg) {
    res.status(400).json({ error: `Unknown model: ${model}` });
    return;
  }
  if (!cfg.apiKey) {
    res.status(500).json({ error: `API key not configured for model: ${model}` });
    return;
  }

  const allMessages = [];
  if (systemPrompt) {
    allMessages.push({ role: "system", content: systemPrompt });
  }
  allMessages.push(...messages);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: allMessages,
        stream: true,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.write(`data: ${JSON.stringify({ error: `API Error ${response.status}: ${errText}` })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: "No response body" })}\n\n`);
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") {
          if (trimmed === "data: [DONE]") {
            res.write("data: [DONE]\n\n");
          }
          continue;
        }
        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta !== undefined && delta !== null) {
              res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("[AI Stream] Error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message || "Stream error" })}\n\n`);
    res.end();
  }
});

// Health check for AI services
aiStreamRouter.get("/status", async (_req: Request, res: Response) => {
  const status: Record<string, any> = {};
  for (const [id, cfg] of Object.entries(MODEL_CONFIGS)) {
    status[id] = {
      name: cfg.name,
      configured: !!cfg.apiKey,
      badge: cfg.badge,
    };
  }
  res.json({ status: "ok", models: status, timestamp: new Date().toISOString() });
});

export default aiStreamRouter;
