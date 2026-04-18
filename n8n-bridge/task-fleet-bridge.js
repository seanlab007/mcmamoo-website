/**
 * ═══════════════════════════════════════════════════════════
 * 🚀 Task Fleet Bridge — 多 WorkBuddy 账号任务舰队系统 v1.0
 * ═══════════════════════════════════════════════════════════
 *
 * 核心功能：
 *   1. 采集当前账号的工作区任务状态（从 memory / todo / agent loop）
 *   2. 上报到共享状态文件 fleet-state.json（跨机/跨账号共享）
 *   3. 并发控制：限制每台设备同时运行的 running 任务数
 *   4. 阻塞检测：3 级检测（stuck/danger/zombie）+ 自动告警
 *   5. 进程保护：防止并发过载导致系统卡死
 *
 * 使用方式：
 *   node task-fleet-bridge.js start --account-id acc-001 --name "主力开发" --machine macbook-pro --workspace /Users/daiyan/WorkBuddy/xxx
 *   node task-fleet-bridge.js status          查看舰队状态
 *   node task-fleet-bridge.js check            检查异常
 *   node task-fleet-bridge.js stop             停止
 *
 * 数据流：
 *   WorkBuddy 工作区 → task-fleet-bridge → fleet-state.json → compass.html 渲染
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── 解析命令行参数 ───
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        args[key] = argv[i + 1];
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._command = argv[i];
    }
  }
  return args;
}

// ─── 配置 ───
const DEFAULT_CONFIG = {
  // 共享状态文件（所有账号读写同一个文件）
  statePath: (process.env.HOME || '/tmp') + '/.maoai-sync/fleet-state.json',

  // 心跳间隔（毫秒）
  heartbeatInterval: 10_000,       // 每 10 秒采集一次

  // 阻塞阈值
  stuckThreshold: 180,            // 3 分钟无进度更新 = stuck
  dangerThreshold: 480,           // 8 分钟无更新 = danger
  zombieThreshold: 900,           // 15 分钟无更新 = zombie

  // 并发控制
  maxConcurrentPerMachine: 2,     // 每台设备最多 N 个 running 任务
  globalMaxConcurrent: 5,         // 全局最多 N 个 running 任务

  // 告警保留条数
  maxAlerts: 100,

  // 日志路径
  logPath: (process.env.HOME || '/tmp') + '/.maoai-sync/fleet.log',
};

// ─── 日志工具 ───
function log(level, msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const line = `[${ts}] [${level.toUpperCase()}] ${msg}\n`;
  try { fs.appendFileSync(DEFAULT_CONFIG.logPath, line); } catch {}
  if (level === 'error' || level === 'critical') console.error(line.trim());
  else console.log(line.trim());
}

// ═══════════════════════════════════════════════════════
// 📂 文件 I/O — 状态文件读写
// ═══════════════════════════════════════════════════════

function loadFleetState() {
  try {
    const raw = fs.readFileSync(DEFAULT_CONFIG.statePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      accounts: {},
      machines: {},
      concurrency: {
        maxPerMachine: DEFAULT_CONFIG.maxConcurrentPerMachine,
        globalMax: DEFAULT_CONFIG.globalMaxConcurrent,
        currentGlobal: 0,
      },
      globalAlerts: [],
      stats: {
        totalTasksEver: 0,
        totalCompleted: 0,
        totalStuck: 0,
        avgCompletionTime: 0,
        fleetUptimeHours: 0,
        startTime: new Date().toISOString(),
      },
    };
  }
}

function saveFleetState(state) {
  const dir = path.dirname(DEFAULT_CONFIG.statePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DEFAULT_CONFIG.statePath, JSON.stringify(state, null, 2));
}

// ═══════════════════════════════════════════════════════
// 🔍 任务扫描器 — 从工作区目录采集真实任务状态
// ═══════════════════════════════════════════════════════

/**
 * scanWorkspace() — 扫描 WorkBuddy 工作区，提取真实任务状态
 *
 * 扫描目标（按优先级）：
 * 1. .workbuddy/memory/YYYY-MM-DD.md — 当天的记忆日志（最新操作记录）
 * 2. brain/<conversation-id>/ — 会话脑文件中的任务进度
 * 3. .workbuddy/todos.jsonl — TODO 列表（如果有）
 * 4. workbuddy.json — 工作区配置
 */
function scanWorkspace(workspacePath) {
  const tasks = [];
  let activeTaskCount = 0;
  let completedToday = 0;
  const today = new Date().toISOString().slice(0, 10);

  try {
    // 1. 扫描每日日志获取最近任务
    const memoryDir = path.join(workspacePath, '.workbuddy', 'memory');
    if (fs.existsSync(memoryDir)) {
      const files = fs.readdirSync(memoryDir)
        .filter(f => f.endsWith('.md') && f.startsWith(today))
        .sort()
        .reverse();

      for (const f of files) {
        const content = fs.readFileSync(path.join(memoryDir, f), 'utf-8');
        // 解析日志中的任务条目
        const lines = content.split('\n').filter(l => l.startsWith('- ') || l.match(/^\s*[-*]\s+/));
        for (const line of lines) {
          const task = parseLogLineToTask(line, today);
          if (task) tasks.push(task);
        }
      }
    }

    // 2. 扫描历史日志（最近7天）补充上下文
    const historyDir = path.join(workspacePath, '.workbuddy', 'memory');
    if (fs.existsSync(historyDir)) {
      const historyFiles = fs.readdirSync(historyDir)
        .filter(f => f.endsWith('.md') && !f.startsWith(today))
        .sort()
        .reverse()
        .slice(0, 7);

      for (const f of historyFiles) {
        // 只取已完成和阻塞的任务，避免重复
        const content = fs.readFileSync(path.join(historyDir, f), 'utf-8');
        const completedMatches = content.matchAll(/\[([xX])\]\s*(.+)/g);
        for (const m of completedMatches) {
          const title = m[2].trim();
          if (!tasks.find(t => t.title.includes(title.slice(0, 30)))) {
            tasks.push({
              id: `log-${f}-${title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`,
              title: title,
              status: 'completed',
              progress: 100,
              step: `完成于 ${f}`,
              updatedAt: `${f.replace('.md', '')}T23:59:00Z`,
              source: 'memory-log',
            });
            completedToday++;
          }
        }

        // 阻塞标记
        const stuckMatches = content.matchAll(/(?:阻塞|卡死|stuck|blocked)[:\s]*(.+)/gi);
        for (const m of stuckMatches) {
          const title = m[1].trim().slice(0, 80);
          if (title && !tasks.find(t => t.title === title)) {
            tasks.push({
              id: `stuck-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: title,
              status: 'stuck',
              progress: tasks.find(t => t.title.includes(title.slice(0, 30)))?.progress || 50,
              step: '⛔ 已知阻塞，需要人工介入',
              updatedAt: new Date().toISOString(),
              source: 'memory-log',
            });
          }
        }
      }
    }

    // 3. 扫描 brain 目录（会话级任务）
    const brainDir = path.join(workspacePath, '.workbuddy', 'brain');
    if (fs.existsSync(brainDir)) {
      const convDirs = fs.readdirSync(brainDir).filter(d =>
        fs.statSync(path.join(brainDir, d)).isDirectory()
      );
      for (const convId of convDirs) {
        try {
          const convDir = path.join(brainDir, convId);
          const planFile = path.join(convDir, 'plan.md');
          if (fs.existsSync(planFile)) {
            const planContent = fs.readFileSync(planFile, 'utf-8');
            // 从计划文件提取任务项
            const taskItems = planContent.matchAll(/^[\s]*[-*]\s*\[([ x])\]\s*(.+)/gm);
            for (const m of taskItems) {
              const isDone = m[1] === 'x';
              const title = m[2].trim();
              if (title && !tasks.find(t => t.title === title)) {
                tasks.push({
                  id: `brain-${convId.slice(0, 8)}-${title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`,
                  title: title,
                  status: isDone ? 'completed' : 'running',
                  progress: isDone ? 100 : Math.min(80, tasks.filter(t => t.status === 'running').length * 15 + 20),
                  step: isDone ? '已完成' : `会话 ${convId.slice(0, 8)} 中`,
                  updatedAt: new Date(fs.statSync(planFile).mtime).toISOString(),
                  source: 'brain-plan',
                });
                if (!isDone) activeTaskCount++;
                else completedToday++;
              }
            }
          }
        } catch (e) {
          log('warn', `扫描 brain/${convId} 失败: ${e.message}`);
        }
      }
    }

    // 4. 扫描 MEMORY.md（长期任务状态）
    const memoryFile = path.join(memoryDir, 'MEMORY.md');
    if (fs.existsSync(memoryFile)) {
      const memContent = fs.readFileSync(memoryFile, 'utf-8');
      // 提取项目相关条目
      const projectMatches = memContent.matchAll(/^#{1,3}\s+(.+)/gm);
      for (const m of projectMatches) {
        const sectionTitle = m[1].trim();
        if (sectionTitle.length > 5 && sectionTitle.length < 100 &&
            !tasks.find(t => t.title.includes(sectionTitle))) {
          tasks.push({
            id: `memory-${sectionTitle.slice(0, 20).replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '')}`,
            title: sectionTitle,
            status: 'pending',
            progress: 0,
            step: '长期跟踪项目（来自 MEMORY.md）',
            updatedAt: new Date().toISOString(),
            source: 'long-term-memory',
          });
        }
      }
    }

  } catch (e) {
    log('error', `工作区扫描失败: ${workspacePath} | ${e.message}`);
  }

  // 统计活跃任务
  activeTaskCount = tasks.filter(t => t.status === 'running' || t.status === 'stuck').length;

  // 去重 + 排序
  const seen = new Set();
  const uniqueTasks = [];
  for (const t of tasks) {
    const key = t.title.slice(0, 40); // 用标题前40字符去重
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTasks.push(t);
    }
  }

  // 排序: running > stuck > pending > completed
  const order = { running: 0, stuck: 1, pending: 2, completed: 3, cancelled: 4 };
  uniqueTasks.sort((a, b) => (order[a.status] || 99) - (order[b.status] || 99));

  return {
    tasks: uniqueTasks,
    activeTaskCount,
    completedToday,
    totalScanned: uniqueTasks.length,
  };
}

/**
 * parseLogLineToTask() — 将日志行解析为任务对象
 */
function parseLogLineToTask(line, dateStr) {
  line = line.replace(/^[-*]\s*/, '').trim();
  if (line.length < 8) return null;

  // 匹配模式: "- [ ] 待办事项" 或 "- [x] 已完成" 或 "- **加粗** 内容"
  let status = 'pending';
  let progress = 0;
  let title = line;

  const checkboxMatch = line.match(/^\[([ xX])\]\s*(.+)/);
  if (checkboxMatch) {
    status = checkboxMatch[1] === 'x' || checkboxMatch[1] === 'X' ? 'completed' : 'pending';
    progress = status === 'completed' ? 100 : 0;
    title = checkboxMatch[2].trim();
  }

  // 移除 markdown 格式
  title = title.replace(/\*\*/g, '').replace(/`/g, '').replace(/\[.*?\]\(.*?\)/g, '$1').trim();

  if (title.length < 6) return null;

  return {
    id: `task-${dateStr}-${title.slice(0, 20).replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '')}-${Math.random().toString(36).slice(2, 6)}`,
    title: title,
    status: status,
    progress: progress,
    step: status === 'completed' ? '✅ 已完成' : '📋 进行中',
    updatedAt: `${dateStr}T${new Date().toTimeString().slice(0, 8)}Z`,
    source: 'daily-log',
  };
}

/**
 * inferOKRLink() — 根据任务标题推断关联的 OKR 板块
 */
function inferOKRLink(title) {
  const lower = (title || '').toLowerCase();

  if (/maoai|triadloop|破壁者|railway|pro\s*订阅|internal|skill|mcp|browseruse/i.test(lower))
    return { businessId: 'maoai' };
  if (/dmb|dark.?matter|bank|orderbook|trading|agent.?pay|tRPC/i.test(lower))
    return { businessId: 'dmb' };
  if (/mintqx|做市商|stock|股票发行/i.test(lower))
    return { businessId: 'mintqx' };
  if (/usdd|stablecoin|稳定币/i.test(lower))
    return { businessId: 'usdd' };
  if (/daiizen|跨境|电商|shopify|payment|支付/i.test(lower))
    return { businessId: 'daiizen' };
  if (/maoyan\.?vip|命理|八字|塔罗|紫微|积分|网红|seo|小程序|zhengyuan/i.test(lower))
    return { businessId: 'maoyan' };
  if (/内容平台|cinema|视频|分发|n8n|workflow|supabase.?storage/i.test(lower))
    return { businessId: 'content' };

  return null;
}

// ═══════════════════════════════════════════════════════
// ⚙️ 并发控制器
// ═══════════════════════════════════════════════════════

function checkConcurrency(state, myAccountId, myMachineId) {
  const alerts = [];

  // 计算全局并发数
  let globalRunning = 0;
  let machineRunning = 0;

  for (const [accId, acc] of Object.entries(state.accounts || {})) {
    if (acc.status !== 'offline' && acc.status !== 'idle') {
      const running = (acc.tasks || []).filter(t => t.status === 'running').length;
      globalRunning += running;
      if ((acc.machineId || '') === myMachineId) machineRunning += running;
    }
  }

  state.concurrency.currentGlobal = globalRunning;

  // 检查是否超限
  if (globalRunning >= DEFAULT_CONFIG.globalMaxConcurrent) {
    alerts.push({
      level: 'warning',
      accountId: myAccountId,
      message: `全局并发达到上限 (${globalRunning}/${DEFAULT_CONFIG.globalMaxConcurrent})，新任务将排队等待`,
      timestamp: new Date().toISOString(),
      action: '考虑完成或暂停部分运行中任务后再启动新任务',
    });
  }

  if (machineRunning >= DEFAULT_CONFIG.maxConcurrentPerMachine) {
    alerts.push({
      level: 'info',
      accountId: myAccountId,
      message: `本设备并发达到上限 (${machineRunning}/${DEFAULT_CONFIG.maxConcurrentPerMachine})`,
      timestamp: new Date().toISOString(),
      action: `本设备最多支持 ${DEFAULT_CONFIG.maxConcurrentPerMachine} 个并行任务`,
    });
  }

  return { globalRunning, machineRunning, withinLimit: globalRunning < DEFAULT_CONFIG.globalMaxConcurrent };
}

// ═══════════════════════════════════════════════════════
// 🔴 阻塞检测引擎（三级）
// ═══════════════════════════════════════════════════════

function runStuckDetection(tasks, accountId) {
  const alerts = [];
  const now = Date.now();
  let hasDanger = false;
  let hasZombie = false;

  for (const task of tasks) {
    if (task.status !== 'running' && task.status !== 'stuck') continue;

    const updated = new Date(task.updatedAt || task.startedAt || now).getTime();
    const idleSec = Math.floor((now - updated) / 1000);

    let newStatus = task.status;

    if (idleSec > DEFAULT_CONFIG.zombieThreshold) {
      // Level 3: Zombie
      newStatus = 'cancelled';
      task.status = 'cancelled';
      task.step = '💀 僵尸进程 — 超时自动终止';
      hasZombie = true;
      alerts.push({
        level: 'critical',
        accountId,
        message: `🧟 僵尸进程: "${task.title}" 无响应超过 ${Math.floor(idleSec / 60)} 分钟，已自动终止`,
        timestamp: new Date().toISOString(),
        action: '建议手动检查该任务状态，必要时重启',
      });
    } else if (idleSec > DEFAULT_CONFIG.dangerThreshold) {
      // Level 2: Danger
      newStatus = 'danger';
      task.status = 'stuck';
      task.step = `🔴 危险: 已卡住 ${Math.floor(idleSec / 60)} 分钟`;
      hasDanger = true;
      alerts.push({
        level: 'error',
        accountId,
        message: `🔴 危险: "${task.title}" 卡住 ${Math.floor(idleSec / 60)} 分钟`,
        timestamp: new Date().toISOString(),
        action: '检查该任务是否在等待用户输入或网络请求超时',
      });
    } else if (idleSec > DEFAULT_CONFIG.stuckThreshold) {
      // Level 1: Stuck
      if (task.status === 'running') {
        newStatus = 'stuck';
        task.status = 'stuck';
        task.step = `⚠️ 可能阻塞: ${Math.floor(idleSec / 60)} 分钟无更新`;
        alerts.push({
          level: 'warning',
          accountId,
          message: `⚠️ 可能阻塞: "${task.title}" ${Math.floor(idleSec / 60)} 分钟无进度更新`,
          timestamp: new Date().toISOString(),
          action: '继续观察，可能正在等待外部响应',
        });
      }
    }

    if (newStatus !== task.status) task.status = newStatus;
  }

  return { alerts, hasDanger, hasZombie };
}

// ═══════════════════════════════════════════════════════
// 🔄 核心上报函数
// ═══════════════════════════════════════════════════════

let currentConfig = {}; // 运行时配置

function reportToFleet(customTaskOverride) {
  const now = new Date().toISOString();
  const state = loadFleetState();
  const accId = currentConfig.accountId || 'unknown';

  // 1. 扫描工作区获取真实任务
  let scanResult;
  if (customTaskOverride) {
    scanResult = {
      tasks: Array.isArray(customTaskOverride) ? customTaskOverride : [customTaskOverride],
      activeTaskCount: customTaskOverride.length || 1,
      completedToday: 0,
      totalScanned: customTaskOverride.length || 1,
    };
  } else if (currentConfig.workspace && fs.existsSync(currentConfig.workspace)) {
    scanResult = scanWorkspace(currentConfig.workspace);
  } else {
    scanResult = { tasks: [], activeTaskCount: 0, completedToday: 0, totalScanned: 0 };
  }

  // 2. 为每个任务推断 OKR 关联
  for (const task of scanResult.tasks) {
    if (!task.okrLinked) {
      task.okrLinked = inferOKRLink(task.title);
    }
    // 确保 ID 存在
    if (!task.id) task.id = `${accId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  // 3. 阻塞检测
  const detection = runStuckDetection(scanResult.tasks, accId);

  // 4. 确定账号整体状态
  let accountStatus = 'online';
  const stuckTasks = scanResult.tasks.filter(t => t.status === 'stuck');
  const zombieTasks = scanResult.tasks.filter(t => t.status === 'cancelled');

  if (scanResult.activeTaskCount === 0 && scanResult.totalScanned === 0) accountStatus = 'idle';
  else if (zombieTasks.length > 0) accountStatus = 'danger';
  else if (stuckTasks.length > 0) accountStatus = 'stuck';
  else if (scanResult.activeTaskCount > 0) accountStatus = 'online';

  // 5. 更新账号状态
  const prevAccount = state.accounts[accId];

  state.accounts[accId] = {
    id: accId,
    name: currentConfig.name || accId,
    machine: currentConfig.machineName || os.hostname(),
    machineId: currentConfig.machineId || os.hostname(),
    workspace: currentConfig.workspace || '',
    status: accountStatus,
    tasks: scanResult.tasks,
    activeTaskCount: scanResult.activeTaskCount,
    completedToday: scanResult.completedToday,
    lastHeartbeat: now,
    sessionInfo: {
      startTime: prevAccount?.sessionInfo?.startTime || now,
      totalTurns: (prevAccount?.sessionInfo?.totalTurns || 0) + 1,
    },
    scanMeta: {
      totalScanned: scanResult.totalScanned,
      scanTime: now,
    },
  };

  // 6. 更新机器维度聚合
  if (!state.machines) state.machines = {};
  const mid = currentConfig.machineId || os.hostname();
  const machineAccounts = Object.values(state.accounts).filter(a => a.machineId === mid);
  const machineTasks = machineAccounts.flatMap(a => a.tasks || []);

  state.machines[mid] = {
    name: currentConfig.machineName || os.hostname(),
    status: machineAccounts.some(a => a.status === 'danger') ? 'danger'
         : machineAccounts.some(a => a.status === 'stuck') ? 'stuck'
         : machineAccounts.some(a => a.status === 'online') ? 'healthy'
         : machineAccounts.length > 0 ? 'idle' : 'offline',
    accountIds: machineAccounts.map(a => a.id),
    totalTasks: machineTasks.length,
    runningTasks: machineTasks.filter(t => t.status === 'running').length,
    stuckTasks: machineTasks.filter(t => t.status === 'stuck' || t.status === 'cancelled').length,
    ip: getLocalIP(),
  };

  // 7. 合并告警
  if (!state.globalAlerts) state.globalAlerts = [];
  state.globalAlerts.push(...detection.alerts);
  if (state.globalAlerts.length > DEFAULT_CONFIG.maxAlerts) {
    state.globalAlerts = state.globalAlerts.slice(-DEFAULT_CONFIG.maxAlerts);
  }

  // 8. 更新统计
  if (!state.stats) state.stats = {};
  state.stats.totalCompleted = scanResult.completedToday;
  state.stats.totalStuck = stuckTasks.length;

  // 9. 并发检查
  const concurrencyCheck = checkConcurrency(state, accId, mid);
  if (concurrencyCheck.alerts.length > 0) {
    state.globalAlerts.push(...concurrencyCheck.alerts);
  }

  // 10. 保存
  saveFleetState(state);

  return {
    accountId: accId,
    status: accountStatus,
    tasksScanned: scanResult.totalScanned,
    activeTasks: scanResult.activeTaskCount,
    stuckTasks: stuckTasks.length,
    alerts: detection.alerts.length,
    globalRunning: concurrencyCheck.globalRunning,
    withinLimit: concurrencyCheck.withinLimit,
  };
}

// ═══════════════════════════════════════════════════════
// 🚀 启动守护模式
// ═══════════════════════════════════════════════════════

let monitorInterval = null;

function startFleetMonitor(config) {
  currentConfig = config;

  if (monitorInterval) {
    log('warn', 'Fleet Monitor 已在运行，先 stop 再重新启动');
    return false;
  }

  log('info', `🚀 Task Fleet Bridge 启动`);
  log('info', `   账号: ${config.name || config.accountId} (${config.accountId})`);
  log('info', `   设备: ${config.machineName || os.hostname()} (${config.machineId || 'auto'})`);
  log('info', `   工作区: ${config.workspace || '(未指定)'}`);
  log('info', `   心跳间隔: ${DEFAULT_CONFIG.heartbeatInterval / 1000}s`);

  // 立即上报一次
  const firstReport = reportToFleet();
  log('info', `   首次扫描: ${firstReport.tasksScanned} 个任务 | 活跃: ${firstReport.activeTasks} | 阻塞: ${firstReport.stuckTasks}`);

  // 定时心跳
  monitorInterval = setInterval(() => {
    try {
      const report = reportToFleet();

      if (report.alerts > 0) {
        log('warn', `⚠️ 发现 ${report.alerts} 个异常 (活跃:${report.activeTasks} 阻塞:${report.stuckTasks})`);
      }

      // 每 60 次心跳打一条正常日志（每 ~10 分钟）
      const turns = loadFleetState().accounts[currentConfig.accountId]?.sessionInfo?.totalTurns || 0;
      if (turns % 60 === 0) {
        log('info', `💓 心跳 #${turns} | 任务: ${report.tasksScanned} | 活跃: ${report.activeTasks} | 全局并发: ${report.globalRunning}`);
      }
    } catch (e) {
      log('error', `心跳异常: ${e.message}\n${e.stack?.slice(0, 300)}`);
    }
  }, DEFAULT_CONFIG.heartbeatInterval);

  log('info', `✅ Fleet Monitor 运行中 (PID: ${process.pid})`);
  return true;
}

function stopFleetMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;

    // 标记为 offline
    const state = loadFleetState();
    if (state.accounts && state.accounts[currentConfig.accountId]) {
      state.accounts[currentConfig.accountId].status = 'offline';
      state.accounts[currentConfig.accountId].lastHeartbeat = new Date().toISOString();
      saveFleetState(state);
    }

    log('info', '🛑 Fleet Monitor 已停止');
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════
// 📊 状态查询 API
// ═══════════════════════════════════════════════════════

function getFleetStatus() {
  const state = loadFleetState();
  const now = Date.now();

  const accounts = {};
  for (const [id, acc] of Object.entries(state.accounts || {})) {
    const lastBeat = new Date(acc.lastHeartbeat || now).getTime();
    const idleMin = Math.floor((now - lastBeat) / 60000);
    accounts[id] = {
      ...acc,
      idleMinutes: idleMin,
      isLive: idleMin < 2, // 2分钟内有心跳就算在线
    };
  }

  // 计算全局摘要
  const allTasks = Object.values(accounts).flatMap(a => a.tasks || []);
  const summary = {
    totalAccounts: Object.keys(accounts).length,
    onlineAccounts: Object.values(accounts).filter(a => a.isLive && a.status !== 'offline').length,
    totalTasks: allTasks.length,
    runningTasks: allTasks.filter(t => t.status === 'running').length,
    stuckTasks: allTasks.filter(t => t.status === 'stuck').length,
    completedTasks: allTasks.filter(t => t.status === 'completed').length,
    pendingTasks: allTasks.filter(t => t.status === 'pending').length,
    concurrency: state.concurrency,
    recentAlerts: (state.globalAlerts || []).slice(-10),
    uptimeHours: state.stats?.startTime ?
      Math.round((now - new Date(state.stats.startTime).getTime()) / 3600000) : 0,
  };

  return {
    version: state.version,
    lastUpdated: state.lastUpdated,
    accounts,
    machines: state.machines || {},
    summary,
  };
}

function formatAgo(ts, now) {
  const sec = Math.floor((now - ts) / 1000);
  if (sec < 60) return `${sec}秒前`;
  if (sec < 3600) return `${Math.floor(sec / 60)}分钟前`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}小时前`;
  return `${Math.floor(sec / 86400)}天前`;
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

// ═══════════════════════════════════════════════════════
// 🎯 快速注入接口 — 供其他脚本调用
// ═══════════════════════════════════════════════════════

/**
 * quickPush() — 一键推送当前任务状态到舰队（供外部调用）
 *
 * 用法:
 *   const fleet = require('./task-fleet-bridge');
 *   fleet.quickPush({
 *     accountId: 'acc-001',
 *     name: '主力开发',
 *     machineName: 'MacBook Pro',
 *     machineId: 'macbook-pro',
 *     workspace: '/Users/daiyan/WorkBuddy/xxx',
 *     tasks: [
 *       { title: '部署 Railway', status: 'running', progress: 65, step: '修复 merge conflicts' },
 *       { title: '写文档', status: 'completed', progress: 100 },
 *     ]
 *   });
 */
function quickPush(options) {
  currentConfig = {
    accountId: options.accountId || 'manual',
    name: options.name || options.accountId || 'Manual',
    machineName: options.machineName || os.hostname(),
    machineId: options.machineId || os.hostname(),
    workspace: options.workspace || '',
  };

  return reportToFleet(options.tasks || null);
}

module.exports = {
  DEFAULT_CONFIG,
  loadFleetState,
  saveFleetState,
  scanWorkspace,
  reportToFleet,
  startFleetMonitor,
  stopFleetMonitor,
  getFleetStatus,
  quickPush,
  runStuckDetection,
  checkConcurrency,
};

// ═══════════════════════════════════════════════════════
// 🖥️ CLI 入口
// ═══════════════════════════════════════════════════════

if (require.main === module) {
  const args = parseArgs(process.argv);
  const cmd = args._command || '';

  console.log(`
╔══════════════════════════════════════════════════════╗
║  🚀 Task Fleet Bridge v1.0                         ║
║  多账号任务舰队 · 并发控制 · 阻塞检测 · 跨机同步    ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  start    启动监控 (需指定 --account-id)             ║
║  status   查看舰队全貌                               ║
║  check    仅检查异常                                 ║
║  stop     停止监控                                   ║
║  push     单次推送任务数据                           ║
║  demo     演示模式（生成模拟数据）                    ║
╚══════════════════════════════════════════════════════╝
`);

  if (cmd === 'start') {
    if (!args['account-id']) {
      console.error('❌ 缺少参数: --account-id <你的账号ID>');
      console.log('示例: node task-fleet-bridge.js start --account-id acc-001 --name "主力开发" --machine-id mbp --workspace /Users/daiyan/WorkBuddy/xxx');
      process.exit(1);
    }
    startFleetMonitor({
      accountId: args['account-id'],
      name: args['name'] || args['account-id'],
      machineId: args['machine-id'] || args['machine'] || os.hostname(),
      machineName: args['machine-name'] || args['machine'] || os.hostname(),
      workspace: args['workspace'] || '',
    });

    // 保持进程运行
    process.on('SIGINT', () => {
      console.log('\n收到 SIGINT，停止监控...');
      stopFleetMonitor();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      stopFleetMonitor();
      process.exit(0);
    });

  } else if (cmd === 'status') {
    const status = getFleetStatus();
    console.log(JSON.stringify(status, null, 2));

  } else if (cmd === 'check') {
    const status = getFleetStatus();
    const issues = [];
    for (const [id, acc] of Object.entries(status.accounts)) {
      if (acc.isLive && acc.status === 'stuck')
        issues.push({ type: 'stuck', account: id, msg: `${acc.name} 有阻塞任务` });
      if (acc.isLive && acc.status === 'danger')
        issues.push({ type: 'danger', account: id, msg: `${acc.name} 有危险/僵尸任务` });
      if (!acc.isLive && acc.status !== 'offline')
        issues.push({ type: 'offline', account: id, msg: `${acc.name} 离线 ${acc.idleMinutes}分钟` });
    }
    if (issues.length === 0) {
      console.log('✅ 所有账户正常运行');
    } else {
      console.log(`发现 ${issues.length} 个问题:`);
      console.log(JSON.stringify(issues, null, 2));
    }

  } else if (cmd === 'stop') {
    stopFleetMonitor();

  } else if (cmd === 'push') {
    const result = quickPush({
      accountId: args['account-id'] || 'manual-push',
      name: args['name'] || '手动推送',
      machineName: args['machine-name'] || os.hostname(),
      machineId: args['machine-id'] || os.hostname(),
      workspace: args['workspace'] || '',
      tasks: args._taskJson ? JSON.parse(args._taskJson) : undefined,
    });
    console.log('✅ 推送结果:', JSON.stringify(result, null, 2));

  } else if (cmd === 'demo') {
    // 演示模式：模拟 5 个账号的数据
    console.log('🎮 演示模式：生成模拟数据...');
    const state = loadFleetState();
    const now = new Date().toISOString();

    state.accounts = {
      'acc-mbp-main': {
        id: 'acc-mbp-main',
        name: '主力开发',
        machine: 'MacBook Pro',
        machineId: 'mbp-pro',
        workspace: '/Users/daiyan/WorkBuddy/20260417234313',
        status: 'online',
        activeTaskCount: 3,
        completedToday: 5,
        lastHeartbeat: now,
        tasks: [
          { id: 't1', title: '🧭 OKR罗盘改造 — 多账号任务舰队', status: 'running', progress: 70, step: '编写 task-fleet-bridge.js 核心模块', updatedAt: now, okrLinked: { businessId: 'maoai' } },
          { id: 't2', title: 'Railway 部署修复（36 merge conflicts）', status: 'stuck', progress: 85, step: '⛔ 阻塞：等待 Trial → Hobby 升级绑卡', updatedAt: new Date(Date.now() - 300000).toISOString(), okrLinked: { businessId: 'maoai' } },
          { id: 't3', title: 'DMB Phase 1+2 推送到 GitHub', status: 'pending', progress: 0, step: '待启动：14个server文件待推送', updatedAt: now, okrLinked: { businessId: 'dmb' } },
          { id: 't4', title: '微信/支付宝登录接入 maoyan.vip', status: 'pending', progress: 0, step: 'OAuth 方案确认后开始', updatedAt: now, okrLinked: { businessId: 'maoyan' } },
          { id: 't5', title: 'LACELLE Cinema 视频上传方案', status: 'completed', progress: 100, step: '✅ Supabase Storage + CDN 方案已确认', updatedAt: new Date(Date.now() - 86400000).toISOString(), okrLinked: { businessId: 'content' } },
        ],
      },
      'acc-imac-home': {
        id: 'acc-imac-home',
        name: '家庭 iMac',
        machine: 'iMac 2021',
        machineId: 'imac-home',
        workspace: '/Users/daiyan/WorkBuddy/home-session',
        status: 'stuck',
        activeTaskCount: 1,
        completedToday: 2,
        lastHeartbeat: new Date(Date.now() - 240000).toISOString(),
        tasks: [
          { id: 't6', title: 'OpenClaw 本地 AI 引擎调优', status: 'stuck', progress: 45, step: '⚠️ 可能阻塞：GPU 显存不足导致 OOM', updatedAt: new Date(Date.now() - 240000).toISOString(), okrLinked: { businessId: 'maoai' } },
          { id: 't7', title: 'mintQX.com 做市商页面设计', status: 'running', progress: 30, step: '正在设计 K线图表组件', updatedAt: now, okrLinked: { businessId: 'mintqx' } },
        ],
      },
      'acc-mba-travel': {
        id: 'acc-mba-travel',
        name: '出差 MacBook Air',
        machine: 'MacBook Air M2',
        machineId: 'mba-travel',
        workspace: '/Users/daiyan/WorkBuddy/travel-session',
        status: 'idle',
        activeTaskCount: 0,
        completedToday: 3,
        lastHeartbeat: new Date(Date.now() - 3600000).toISOString(),
        tasks: [
          { id: 't8', title: 'daiizen 商品数据库 Schema 设计', status: 'completed', progress: 100, step: '✅ 已完成并推送到 GitHub', updatedAt: new Date(Date.now() - 7200000).toISOString(), okrLinked: { businessId: 'daiizen' } },
          { id: 't9', title: 'USDD Stablecoin 合规页面框架', status: 'completed', progress: 100, step: '✅ 基础页面已上线', updatedAt: new Date(Date.now() - 7200000).toISOString(), okrLinked: { businessId: 'usdd' } },
          { id: 't10', title: 'n8n workflow 自动化调度配置', status: 'pending', progress: 10, step: '待回到主力机后继续', updatedAt: new Date(Date.now() - 3600000).toISOString(), okrLinked: { businessId: 'content' } },
        ],
      },
      'acc-server-node': {
        id: 'acc-server-node',
        name: 'Linux Server',
        machine: 'Ubuntu VPS',
        machineId: 'vps-01',
        workspace: '/root/workbuddy/prod',
        status: 'online',
        activeTaskCount: 2,
        completedToday: 8,
        lastHeartbeat: now,
        tasks: [
          { id: 't11', title: '生产环境 n8n 监控部署', status: 'running', progress: 60, step: '配置 webhook 触发器', updatedAt: now, okrLinked: { businessId: 'maoai' } },
          { id: 't12', title: 'Supabase 数据库备份自动化', status: 'running', progress: 90, step: '设置 pg_dump 定时任务', updatedAt: now, okrLinked: { businessId: 'dmb' } },
          { id: 't13', title: 'Cloudflare CDN 缓存优化', status: 'completed', progress: 100, step: '✅ Page Rules 已配置', updatedAt: new Date(Date.now() - 1800000).toISOString() },
        ],
      },
      'acc-collab-dev': {
        id: 'acc-collab-dev',
        name: '协作开发账号',
        machine: 'Remote Dev',
        machineId: 'remote-dev',
        workspace: '/workspace/collab',
        status: 'danger',
        activeTaskCount: 1,
        completedToday: 0,
        lastHeartbeat: new Date(Date.now() - 600000).toISOString(),
        tasks: [
          { id: 't14', title: 'zhengyuanzhiyin 功能迁移到 maoyan.vip', status: 'cancelled', progress: 35, step: '💀 僵尸进程 — 无响应超过 10 分钟', updatedAt: new Date(Date.now() - 600000).toISOString(), okrLinked: { businessId: 'maoyan' } },
        ],
      },
    };

    state.machines = {
      'mbp-pro': { name: 'MacBook Pro', status: 'online', accountIds: ['acc-mbp-main'], totalTasks: 5, runningTasks: 1, stuckTasks: 1, ip: '192.168.1.100' },
      'imac-home': { name: 'iMac 2021', status: 'stuck', accountIds: ['acc-imac-home'], totalTasks: 2, runningTasks: 1, stuckTasks: 1, ip: '192.168.1.101' },
      'mba-travel': { name: 'MacBook Air M2', status: 'idle', accountIds: ['acc-mba-travel'], totalTasks: 3, runningTasks: 0, stuckTasks: 0, ip: '10.0.0.5' },
      'vps-01': { name: 'Ubuntu VPS', status: 'online', accountIds: ['acc-server-node'], totalTasks: 3, runningTasks: 2, stuckTasks: 0, ip: '203.0.113.50' },
      'remote-dev': { name: 'Remote Dev', status: 'danger', accountIds: ['acc-collab-dev'], totalTasks: 1, runningTasks: 0, stuckTasks: 1, ip: 'N/A' },
    };

    state.concurrency = {
      maxPerMachine: 2,
      globalMax: 5,
      currentGlobal: 5, // 1+1+0+2+0=4 running + 1 stuck
    };

    state.globalAlerts = [
      { level: 'critical', accountId: 'acc-collab-dev', message: '🧟 僵尸进程: zhengyuanzhiyin 迁移任务已终止', timestamp: new Date(Date.now() - 600000).toISOString() },
      { level: 'error', accountId: 'acc-mbp-main', message: '🔴 Railway 部署任务阻塞 5 分钟', timestamp: new Date(Date.now() - 300000).toISOString() },
      { level: 'warning', accountId: 'acc-imac-home', message: '⚠️ OpenClaw 调优任务可能阻塞', timestamp: new Date(Date.now() - 240000).toISOString() },
    ];

    saveFleetState(state);
    console.log('✅ 演示数据已写入 fleet-state.json');
    console.log('   5 个账号 | 3 台 Mac + 1 台 VPS + 1 Remote');
    console.log('   运行 node task-fleet-bridge.js status 查看');

  } else {
    if (cmd) console.log(`❌ 未知命令: ${cmd}`);
    console.log('用法:');
    console.log('  node task-fleet-bridge.js start --account-id <ID> [--name <名称>] [--workspace <路径>]');
    console.log('  node task-fleet-bridge.js status');
    console.log('  node task-fleet-bridge.js check');
    console.log('  node task-fleet-bridge.js stop');
    console.log('  node task-fleet-bridge.js demo     ← 生成演示数据（推荐先用这个测试）');
    console.log('  node task-fleet-bridge.js push --account-id <ID> [--task-json \'[{...}]\']');
  }
}
