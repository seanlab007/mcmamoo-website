/**
 * MCP Server Router - Model Context Protocol 服务路由
 */
import { Router } from "express";

const mcpServerRouter = Router();

mcpServerRouter.get("/status", (req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

export { mcpServerRouter };
