/**
 * 罗盘数据 API — 从 ~/.maoai-sync/ 读取真实数据
 * 提供给 compass.html 使用
 */
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import os from "os";

export const compassRouter = Router();

const SYNC_DIR = path.join(os.homedir(), ".maoai-sync");

// 读取 JSON 文件，带错误处理
function readJsonFile(filePath: string): object | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn(`[CompassAPI] Failed to read ${filePath}:`, e);
  }
  return null;
}

// GET /api/compass/data — 获取所有罗盘数据
compassRouter.get("/data", (_req: Request, res: Response) => {
  const stateData = readJsonFile(path.join(SYNC_DIR, "state.json"));
  const fleetData = readJsonFile(path.join(SYNC_DIR, "fleet-state.json"));

  // 如果文件不存在，返回演示数据（不返回错误）
  if (!stateData && !fleetData) {
    res.json({
      error: "sync_data_not_found",
      message: "本地同步数据未找到，请确保 WorkBuddy 已运行",
      demo: true,
    });
    return;
  }

  res.json({
    okr: stateData,
    fleet: fleetData,
    meta: {
      syncDir: SYNC_DIR,
      readAt: new Date().toISOString(),
    },
  });
});

// GET /api/compass/okr — 仅 OKR 数据
compassRouter.get("/okr", (_req: Request, res: Response) => {
  const stateData = readJsonFile(path.join(SYNC_DIR, "state.json"));
  if (!stateData) {
    res.json({
      error: "sync_data_not_found",
      message: "本地同步数据未找到",
    });
    return;
  }
  res.json(stateData);
});

// GET /api/compass/fleet — 仅舰队状态数据
compassRouter.get("/fleet", (_req: Request, res: Response) => {
  const fleetData = readJsonFile(path.join(SYNC_DIR, "fleet-state.json"));
  if (!fleetData) {
    res.json({
      error: "sync_data_not_found",
      message: "舰队状态数据未找到",
    });
    return;
  }
  res.json(fleetData);
});

// GET /api/compass/health — 健康状态数据
compassRouter.get("/health", (_req: Request, res: Response) => {
  // 从 fleet 数据提取健康信息
  const fleetData = readJsonFile(path.join(SYNC_DIR, "fleet-state.json")) as any;
  if (!fleetData || !fleetData.accounts) {
    res.json({
      machines: [],
      alerts: [],
    });
    return;
  }

  const accounts = Object.values(fleetData.accounts || {}) as any[];
  const machines = accounts.map((acc: any) => ({
    name: acc.name || acc.id,
    machine: acc.machine || "Unknown",
    status: acc.status || "unknown",
    activeTasks: acc.activeTaskCount || 0,
    completedToday: acc.completedToday || 0,
    lastHeartbeat: acc.lastHeartbeat,
  }));

  // 检测异常
  const alerts: string[] = [];
  const stuckTasks = accounts.filter((a: any) => a.tasks?.some((t: any) => t.status === "stuck"));
  if (stuckTasks.length > 0) {
    alerts.push(`${stuckTasks.length} 个账号存在阻塞任务`);
  }

  const offlineAccounts = accounts.filter((a: any) => a.status === "offline");
  if (offlineAccounts.length > 0) {
    alerts.push(`${offlineAccounts.length} 个账号已离线`);
  }

  res.json({
    machines,
    alerts,
    lastUpdated: fleetData.lastUpdated,
  });
});

// GET /api/compass/sync — 同步状态
compassRouter.get("/sync", (_req: Request, res: Response) => {
  const stateData = readJsonFile(path.join(SYNC_DIR, "state.json")) as any;
  const fleetData = readJsonFile(path.join(SYNC_DIR, "fleet-state.json")) as any;

  const accounts = Object.values(fleetData?.accounts || {}) as any[];
  const onlineCount = accounts.filter((a: any) => a.status === "online").length;
  const totalAccounts = accounts.length;

  res.json({
    okrLastUpdated: stateData?.lastUpdated || null,
    fleetLastUpdated: fleetData?.lastUpdated || null,
    onlineAccounts: `${onlineCount}/${totalAccounts}`,
    syncStatus: stateData?.lastUpdated ? "connected" : "disconnected",
  });
});
