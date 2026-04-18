/**
 * ═══════════════════════════════════════════════════════
 * 🏥 WorkBuddy Health Monitor — 阻塞检测 + 跨机状态同步
 * ═══════════════════════════════════════════════════════
 *
 * 用途：
 *   1. 检测 WorkBuddy 任务是否阻塞（超时无响应）
 *   2. 定时心跳上报到 n8n / 本地状态文件
 *   3. 多机互感知：电脑 A 能看到电脑 B 的状态
 *
 * 使用方式：
 *   在 WorkBuddy 会话中粘贴执行，或挂载为 setInterval 守护进程
 *
 * 配置：
 *   修改下方 CONFIG 块即可
 */

const CONFIG = {
  // 心跳间隔（毫秒）
  heartbeatInterval: 30_000,      // 每 30 秒一次心跳

  // 阻塞判定阈值（秒）— 超过这个时间没有新输出就算阻塞
  stuckThreshold: 120,            // 2 分钟无响应 = 可能阻塞

  // 危险阈值（秒）— 超过这个时间肯定卡死了
  dangerThreshold: 300,           // 5 分钟 = 确认卡死

  // 本机标识
  machineId: "macbook-pro",       // 自定义：你的机器名
  machineName: "MacBook Pro 主力机",

  // 状态文件路径（多机共享目录）
  statePath: process.env.HOME + "/.maoai-sync/health.json",

  // n8n Webhook（可选，如果 n8n 运行中）
  webhookUrl: "http://localhost:5678/webhook/health-beat",

  // 日志文件
  logPath: process.env.HOME + "/.maoai-sync/health.log",
};

// ═══════════════════════════════════════════════════════
// 📊 状态数据结构
// ═══════════════════════════════════════════════════════

/**
 * health.json 的完整结构：
{
  "version": "2.0.0",
  "lastUpdated": "ISO timestamp",
  "machines": {
    "machine-id-1": {
      "name": "MacBook Pro",
      "status": "healthy" | "stuck" | "danger" | "offline",
      "lastHeartbeat": "ISO timestamp",
      "currentTask": { "id": "...", "title": "...", "progress": 0, "step": "...", "startedAt": "..." },
      "uptimeSeconds": 3600,
      "sessionCount": 5,
      "cpuLoad": null,
      "memoryUsage": null,
      "warnings": [],
      "ip": "192.168.x.x"
    }
  },
  "globalAlerts": [
    { "level": "warning|error", "machine": "...", "message": "...", "timestamp": "..." }
  ]
}
*/

// ═══════════════════════════════════════════════════════
// 🔧 核心 API 函数
// ═══════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * reportHealth() — 上报一次健康状态
 * @param {Object} taskInfo - 当前任务信息（从 workbuddy-bridge 获取）
 */
function reportHealth(taskInfo = {}) {
  const now = new Date().toISOString();
  const state = loadState();

  // 获取或初始化本机状态
  const myId = CONFIG.machineId;
  if (!state.machines) state.machines = {};
  if (!state.globalAlerts) state.globalAlerts = [];

  const prevStatus = state.machines[myId]?.status || 'unknown';
  const prevHeartbeat = state.machines[myId]?.lastHeartbeat;
  let currentStatus = 'healthy';

  // 检测是否阻塞（基于上次心跳时间差）
  if (prevHeartbeat) {
    const idleMs = Date.now() - new Date(prevHeartbeat).getTime();
    const idleSec = Math.floor(idleMs / 1000);
    if (idleSec > CONFIG.dangerThreshold) {
      currentStatus = 'danger';
    } else if (idleSec > CONFIG.stuckThreshold) {
      currentStatus = 'stuck';
    }
  }

  // 更新本机状态
  state.machines[myId] = {
    name: CONFIG.machineName,
    status: currentStatus,
    lastHeartbeat: now,
    currentTask: taskInfo || state.machines[myId]?.currentTask || null,
    uptimeSeconds: process.uptime(),
    sessionCount: (state.machines[myId]?.sessionCount || 0) + 1,
    cpuLoad: os.loadavg()[0].toFixed(2),
    memoryUsage: {
      totalMB: Math.round(os.totalmem() / 1024 / 1024),
      freeMB: Math.round(os.freemem() / 1024 / 1024),
      usedPercent: Math.round((1 - os.freemom() / os.totalmem()) * 100),
    },
    warnings: [],
    ip: getLocalIP(),
  };

  // 状态变化告警
  if (prevStatus !== currentStatus && prevStatus !== 'unknown') {
    const alertLevel = currentStatus === 'danger' ? 'error' : 'warning';
    state.globalAlerts.push({
      level: alertLevel,
      machine: myId,
      message: `状态变化: ${prevStatus} → ${currentStatus}`,
      timestamp: now,
      detail: taskInfo?.title ? `当前任务: ${taskInfo.title}` : '无活跃任务',
    });
    // 只保留最近 50 条告警
    if (state.globalAlerts.length > 50) state.globalAlerts = state.globalAlerts.slice(-50);
  }

  state.lastUpdated = now;
  saveState(state);

  return { status: currentStatus, machines: Object.keys(state.machines).length, alerts: state.globalAlerts.length };
}

/**
 * checkOtherMachines() — 检查其他机器的状态，发现离线/阻塞
 * @returns {Object[]} 异常机器列表
 */
function checkOtherMachines() {
  const state = loadState();
  const now = Date.now();
  const issues = [];

  for (const [id, m] of Object.entries(state.machines || {})) {
    if (id === CONFIG.machineId) continue; // 跳过自己

    const lastBeat = new Date(m.lastHeartbeat).getTime();
    const idleSec = Math.floor((now - lastBeat) / 1000);

    if (idleSec > CONFIG.dangerThreshold) {
      issues.push({
        machine: id,
        name: m.name,
        status: 'danger',
        idleMinutes: Math.floor(idleSec / 60),
        lastTask: m.currentTask?.title || '未知',
        message: `${m.name} 已离线 ${Math.floor(idleSec / 60)} 分钟！可能崩溃`,
      });
    } else if (idleSec > CONFIG.stuckThreshold) {
      issues.push({
        machine: id,
        name: m.name,
        status: 'stuck',
        idleMinutes: Math.floor(idleSec / 60),
        lastTask: m.currentTask?.title || '未知',
        message: `${m.name} 无响应超过 ${Math.floor(idleSec / 60)} 分钟，可能阻塞`,
      });
    }
  }

  return issues;
}


// ═══════════════════════════════════════════════════════
// 📂 文件 I/O
// ═══════════════════════════════════════════════════════

function loadState() {
  try {
    const raw = fs.readFileSync(CONFIG.statePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { version: "2.0.0", machines: {}, globalAlerts: [] };
  }
}

function saveState(state) {
  const dir = path.dirname(CONFIG.statePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG.statePath, JSON.stringify(state, null, 2));
}

function getLocalIP() {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) return net.address;
      }
    }
  } catch {}
  return '127.0.0.1';
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(CONFIG.logPath, line);
  } catch {}
  console.log(`[HealthMonitor] ${msg}`);
}

// ═══════════════════════════════════════════════════════
// 🚀 启动守护模式
// ═══════════════════════════════════════════════════════

let monitorInterval = null;

/**
 * startMonitor() — 启动心跳守护
 * @param {Object} initialTask - 初始任务信息
 */
function startMonitor(initialTask = {}) {
  if (monitorInterval) {
    log('⚠️ 监控已在运行，先 stopMonitor() 再重新启动');
    return;
  }

  log(`🏥 Health Monitor 启动 | 机器: ${CONFIG.machineName} (${CONFIG.machineId})`);
  log(`   心跳间隔: ${CONFIG.heartbeatInterval / 1000}s | 阻塞阈值: ${CONFIG.stuckThreshold}s | 危险阈值: ${CONFIG.dangerThreshold}s`);

  // 立即上报一次
  reportHealth(initialTask);

  // 定时心跳
  monitorInterval = setInterval(() => {
    const result = reportHealth();
    
    // 检查其他机器
    const issues = checkOtherMachines();
    if (issues.length > 0) {
      issues.forEach(i => log(`🚨 [${i.status.toUpperCase()}] ${i.message}`));
      
      // 推送到 n8n（如果有）
      try {
        fetch(CONFIG.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'health_alert', issues, timestamp: new Date().toISOString() }),
        }).catch(() => {});
      } catch {}
    }

    // 正常日志每 10 次打一条
    if ((result.sessionCount || 0) % 10 === 0) {
      log(`💓 心跳 #${result.sessionCount} | 状态: ${result.status} | 在线设备: ${result.machines} | 告警: ${result.alerts}`);
    }
  }, CONFIG.heartbeatInterval);

  log(`✅ 监控已启动，PID: ${process.pid}`);
  return monitorInterval;
}

/**
 * stopMonitor() — 停止监控
 */
function stopMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    // 最后上报一次 offline
    const state = loadState();
    if (state.machines?.[CONFIG.machineId]) {
      state.machines[CONFIG.machineId].status = 'offline';
      state.machines[CONFIG.machineId].lastHeartbeat = new Date().toISOString();
      saveState(state);
    }
    log('🛑 Health Monitor 已停止');
    return true;
  }
  return false;
}

/**
 * updateCurrentTask() — 更新当前任务信息
 * @param {Object} task - { id, title, progress, step, status }
 */
function updateCurrentTask(task) {
  const result = reportHealth(task);
  log(`📝 任务更新: ${task.title || 'N/A'} | ${task.progress || '?'}% | ${task.step || ''}`);
  return result;
}

/**
 * getStatus() — 获取所有机器的当前状态（只读）
 */
function getStatus() {
  const state = loadState();
  const now = Date.now();
  
  const summary = [];
  for (const [id, m] of Object.entries(state.machines || {})) {
    const lastBeat = new Date(m.lastHeartbeat).getTime();
    summary.push({
      id, name: m.name, status: m.status,
      lastHeartbeatAgo: formatAgo(lastBeat, now),
      currentTask: m.currentTask,
      uptime: m.uptimeSeconds ? `${Math.floor(m.uptimeSeconds / 60)}min` : '--',
      ip: m.ip,
    });
  }
  
  return {
    version: state.version,
    lastUpdated: state.lastUpdated,
    machines: summary.sort((a, b) => a.id === CONFIG.machineId ? -1 : 1), // 自己排最前
    alerts: (state.globalAlerts || []).slice(-10), // 最近 10 条告警
    selfId: CONFIG.machineId,
    selfName: CONFIG.machineName,
  };
}

function formatAgo(ts, now) {
  const sec = Math.floor((now - ts) / 1000);
  if (sec < 60) return `${sec}秒前`;
  if (sec < 3600) return `${Math.floor(sec / 60)}分钟前`;
  return `${Math.floor(sec / 3600)}小时前`;
}

// ═══════════════════════════════════════════════════════
// 📤 导出
// ═══════════════════════════════════════════════════════

module.exports = {
  CONFIG,
  reportHealth,
  checkOtherMachines,
  startMonitor,
  stopMonitor,
  updateCurrentTask,
  getStatus,
  loadState,
  saveState,
};

// 如果直接运行（node xxx.js），启动演示模式
if (require.main === module) {
  console.log(`
╔════════════════════════════════════════════╗
║  🏥 WorkBuddy Health Monitor v2.0         ║
║  阻塞检测 · 跨机同步 · 心跳告警            ║
╠════════════════════════════════════════════╣
║  可用命令:                                  ║
║  node health.js start     启动监控          ║
║  node health.js status    查看所有设备状态    ║
║  node health.js stop      停止监控           ║
║  node health.js check     检查其他机器异常    ║
╚════════════════════════════════════════════╝
`);

  const cmd = process.argv[2];

  if (cmd === 'start') {
    startMonitor({ id: 'manual', title: '手动监控模式', progress: 100, step: 'Health Monitor 运行中', status: 'running' });
  } else if (cmd === 'status') {
    console.log(JSON.stringify(getStatus(), null, 2));
  } else if (cmd === 'stop') {
    stopMonitor();
  } else if (cmd === 'check') {
    console.log(JSON.stringify(checkOtherMachines(), null, 2));
  } else {
    console.log('请指定命令: start | status | stop | check');
  }
}
