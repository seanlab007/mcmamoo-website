/**
 * ═══════════════════════════════════════════
 *  workbuddy-bridge.js — WorkBuddy ↔ n8n 桥接器
 *  用途: 在 WorkBuddy 会话中实时推送任务进度到 OKR 罗盘
 *  
 *  使用方式:
 *    1. 复制本文件内容到 WorkBuddy 对话中
 *    2. 或在代码中 import/require 本文件
 *    3. 调用 bridge.reportProgress() 即可
 * 
 *  配置:
 *    N8N_WEBHOOK_URL 需要根据实际部署修改
 * ═══════════════════════════════════════════
 */

const WorkBuddyBridge = (() => {
  // ── 配置（按需修改）──
  const CONFIG = {
    // n8n Webhook 端点（本地开发）
    webhookUrl: process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/task-progress",
    
    // 超时设置 (ms)
    timeout: 5000,
    
    // 是否同时写入本地文件（~/.maoai-sync/）
    writeLocalSync: true,
    syncDir: (process.env.HOME || "/root") + "/.maoai-sync",
  };

  // ── 状态映射表：WorkBuddy todo 状态 → 罗盘状态 ──
  const STATUS_MAP = {
    "in_progress": "running",     // todo 正在执行
    "completed": "completed",     // todo 已完成
    "pending": "pending",         // todo 待开始
    "cancelled": "stuck",         // 取消 = 卡住
    "blocked": "stuck",           // 被阻塞 = 卡住
    "error": "stuck",             // 出错 = 卡住
  };

  /**
   * 推送单个任务进度
   * 
   * @param {Object} task - 任务信息
   * @param {string} task.id - 任务唯一 ID（如 wb_001）
   * @param {string} task.title - 任务标题
   * @param {number} task.progress - 进度百分比 (0-100)
   * @param {string} task.step - 当前步骤描述
   * @param {string} task.status - running | completed | stuck | pending
   * @param {string} [task.session] - 会话标识
   */
  async function reportProgress(task) {
    const payload = {
      action: "task_update",
      timestamp: new Date().toISOString(),
      source: "workbuddy",
      task: {
        id: task.id || `wb_${Date.now()}`,
        title: task.title || "未命名任务",
        progress: Math.min(100, Math.max(0, task.progress || 0)),
        step: task.step || "",
        status: STATUS_MAP[task.status] || task.status || "running",
        session: task.session || "当前会话",
        startedAt: task.startedAt || null,
        updatedAt: new Date().toISOString(),
      }
    };

    console.log(`[Bridge] 📤 推送进度: ${task.title} → ${task.progress}% (${payload.task.status})`);

    // 并行推送：n8n + 本地文件
    const results = await Promise.allSettled([
      sendToN8N(payload),
      CONFIG.writeLocalSync ? writeToLocal(payload) : Promise.resolve()
    ]);

    const [n8nResult, localResult] = results;
    
    if (n8nResult.status === "rejected") {
      console.warn(`[Bridge] ⚠️ n8n 推送失败（可能未部署）: ${n8nResult.reason.message}`);
      console.info("[Bridge] 💡 提示: 数据已写入本地 ~/.maoai-sync/，n8n 部署后会自动同步");
    } else {
      console.log(`[Bridge] ✅ n8n 推送成功`);
    }

    return payload.task;
  }

  /**
   * 批量更新多个任务
   */
  async function batchUpdate(tasks) {
    const updates = tasks.map(t => ({
      id: t.id,
      progress: t.progress,
      step: t.step,
      status: STATUS_MAP[t.status] || t.status,
    }));

    await Promise.allSettled(tasks.map(t => reportProgress(t)));
    return { updated: tasks.length };
  }

  /**
   * 标记任务完成（快捷方法）
   */
  async function completeTask(taskId, title) {
    return reportProgress({
      id: taskId,
      title: title || taskId,
      progress: 100,
      step: "✅ 已完成",
      status: "completed"
    });
  }

  /**
   * 标记任务卡住（快捷方法）
   */
  async function stuckTask(taskId, title, reason) {
    return reportProgress({
      id: taskId,
      title: title || taskId,
      progress: 0,
      step: `⛔ ${reason}`,
      status: "stuck"
    });
  }

  // ── 内部实现 ──

  /** POST 到 n8n Webhook */
  async function sendToN8N(payload) {
    try {
      const res = await fetch(CONFIG.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(CONFIG.timeout),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      throw new Error(`n8n unreachable: ${err.message}`);
    }
  }

  /** 写入本地同步文件 (~/.maoai-sync/) */
  async function writeToLocal(payload) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      
      const stateFile = path.join(CONFIG.syncDir, "state.json");
      const eventsFile = path.join(CONFIG.syncDir, "events.jsonl");

      // 追加事件
      const eventLine = JSON.stringify({
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: payload.timestamp,
        source: "workbuddy",
        type: "task_progress",
        payload: payload.task,
      }) + "\n";
      fs.appendFileSync(eventsFile, eventLine);

      // 更新 state.json 中的 workbuddyTasks 数组
      let state = {};
      try {
        state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      } catch(e) { /* first time */ }

      if (!state.workbuddyTasks) state.workbuddyTasks = [];

      // upsert: 按 ID 更新或追加
      const idx = state.workbuddyTasks.findIndex(t => t.id === payload.task.id);
      if (idx >= 0) {
        Object.assign(state.workbuddyTasks[idx], payload.task);
      } else {
        state.workbuddyTasks.push(payload.task);
      }
      state.lastUpdated = payload.timestamp;

      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
      console.log(`[Bridge] ✅ 本地同步已写入: ${eventsFile}`);

    } catch (err) {
      console.error(`[Bridge] ❌ 本地写入失败: ${err.message}`);
    }
  }

  // ── 公开 API ──
  return {
    reportProgress,
    batchUpdate,
    completeTask,
    stuckTask,
    config: CONFIG,
    _sendToN8N: sendToN8N,
    _writeToLocal: writeToLocal,
  };
})();

// ── 导出（兼容 ESM / CJS）──
if (typeof module !== "undefined" && module.exports) {
  module.exports = WorkBuddyBridge;
}

// ═══════════════════════════════════════════
//  使用示例（直接复制粘贴到终端运行）:
//
//  node -e "
//  const bridge = require('./workbuddy-bridge');
//  bridge.completeTask('wb_005', '修复罗盘跳闪问题').then(console.log);
//  "
//
//  或在浏览器控制台:
//  fetch('http://localhost:5678/webhook/task-progress', {
//    method: 'POST',
//    headers: {'Content-Type': 'application/json'},
//    body: JSON.stringify({action:'task_update', task:{id:'wb_005',title:'测试',progress:50,step:'测试步骤',status:'running'}})
//  }).then(r=>r.json()).then(console.log)
// ═══════════════════════════════════════════
