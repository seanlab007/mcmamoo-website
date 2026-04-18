#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════
 * 🔗 sync-checker.js — 跨设备修复同步检测器
 * 
 * 用途: 检测当前机器有哪些本地修复还没同步/应用
 * 
 * CLI 命令:
 *   audit          — 审计本机同步状态（显示哪些修复未应用）
 *   changelog      — 生成/更新 CHANGELOG.md
 *   mark-synced    — 标记指定修复已在本机应用
 *   status         — 查看所有机器的同步矩阵
 *   init           — 初始化 .sync-status.json
 *   diff           — 对比本地文件与 GitHub 版本差异
 *   
 * 使用场景: 任何 AI 进入 WorkBuddy 工作区后首先运行此工具
 * 
 * 作者: 润之 (WorkBuddy AI)
 * 版本: v1.0.0 | 2026-04-18
 * ═══════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// ─── 配置 ───────────────────────────────────────────────
const CONFIG = {
  // 同步状态文件路径 (每台电脑各自维护，不提交 Git)
  syncStatusFile: path.join(os.homedir(), '.maoai-sync', 'sync-status.json'),
  
  // 共享状态目录
  sharedDir: path.join(os.homedir(), '.maoai-sync'),
  
  // 全局同步矩阵 (所有机器的状态汇总)
  syncMatrixFile: path.join(os.homedir(), '.maoai-sync', 'sync-matrix.json'),
  
  // CHANGELOG 路径 (相对于项目根目录)
  changelogPath: 'CHANGELOG.md',
  
  // 默认项目根目录 (自动检测)
  defaultProjectRoot: path.resolve(__dirname, '..'),
};

// ─── 工具函数 ──────────────────────────────────────────

/** 确保目录存在 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** 获取当前机器标识 */
function getMachineIdentity() {
  return {
    hostname: os.hostname() || 'unknown',
    platform: os.platform(),
    arch: os.arch(),
    type: os.type(),
    cpus: os.cpus().length,
    totalMem: Math.round(os.totalmem() / (1024 ** 3)), // GB
    username: os.userInfo().username,
  };
}

/** 推断 machineId */
function inferMachineId() {
  const hostname = os.hostname().toLowerCase();
  if (hostname.includes('mbp') || hostname.includes('macbook-pro') || hostname.includes('daiyan')) return 'mbp-pro';
  if (hostname.includes('imac')) return 'imac-home';
  if (hostname.includes('mba') || hostname.includes('macbook-air')) return 'mba-travel';
  if (hostname.includes('vps') || hostname.includes('ubuntu') || hostname.includes('server')) return 'vps-01';
  if (hostname.includes('remote') || hostname.includes('dev') || hostname.includes('codespace')) return 'remote-dev';
  return `unknown-${hostname.replace(/\./g, '-')}`;
}

/** 获取机器友好名称 */
function getMachineFriendlyName(id) {
  const names = {
    'mbp-pro': 'MacBook Pro 主力机',
    'imac-home': 'iMac 家庭机',
    'mba-travel': 'MacBook Air 出差机',
    'vps-01': 'Ubuntu VPS 生产服务器',
    'remote-dev': 'Remote Dev 协作服务器',
  };
  return names[id] || id;
}

/** 读取或创建 sync status */
function readSyncStatus(createIfMissing = false) {
  ensureDir(CONFIG.sharedDir);
  
  if (fs.existsSync(CONFIG.syncStatusFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.syncStatusFile, 'utf8'));
    } catch (e) {
      console.warn(`⚠️  无法解析 ${CONFIG.syncStatusFile}: ${e.message}`);
    }
  }
  
  if (createIfMissing) {
    const identity = getMachineIdentity();
    const status = {
      version: '1.0.0',
      machineId: inferMachineId(),
      machineName: getMachineFriendlyName(inferMachineId()),
      hostname: identity.hostname,
      platform: `${identity.platform}-${identity.arch}`,
      lastSyncTime: null,
      syncedFixes: [],
      pendingFixes: [],
      firstSeen: new Date().toISOString(),
    };
    fs.writeFileSync(CONFIG.syncStatusFile, JSON.stringify(status, null, 2));
    return status;
  }
  
  return null;
}

/** 写入 sync status */
function writeSyncStatus(status) {
  ensureDir(CONFIG.sharedDir);
  status.lastChecked = new Date().toISOString();
  fs.writeFileSync(CONFIG.syncStatusFile, JSON.stringify(status, null, 2));
}

/** 读取 CHANGELOG.md 并解析出修复条目 */
function parseChangelog(projectRoot) {
  const changelogPath = path.join(projectRoot, CONFIG.changelogPath);
  
  if (!fs.existsSync(changelogPath)) {
    return { exists: false, fixes: [], raw: null };
  }
  
  const content = fs.readFileSync(changelogPath, 'utf8');
  const fixes = [];
  
  // 解析 Markdown 表格中的修复项
  // 匹配 | F-xxx | ... | 格式
  // 排除: 同步矩阵表头(含"同步时间") 和 分隔行(含---)
  const tableRegex = /\|\s*(F-\w+|FEAT-\w+|PERF-\w+|SEC-\w+|CONF-\w+)\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)\|/g;
  let match;
  
  while ((match = tableRegex.exec(content)) !== null) {
    const title = match[2].trim();
    const files = match[3].trim();
    // 跳过同步矩阵表头: 矩阵的title/files列都是fixId(无中文、无特殊字符)
    const isMatrixHeader = !title.match(/[\u4e00-\u9fff]/) && // 无中文字符
      !files.includes('.') && !files.includes('`') && !files.includes('/') &&
      files.length < 15;
    if (isMatrixHeader || title.includes('同步时间') || title.includes('最后同步')) continue;
    fixes.push({
      fixId: match[1].trim(),
      title: match[2].trim(),
      files: match[3].trim(),
      severity: match[4].trim(),
      syncStatus: match[5].trim() || '未知',
    });
  }
  
  // 也尝试从内容中提取版本标题
  let currentVersion = '';
  const versionRegex = /^##\s+\[([^\]]*)\]\s+(\d{4}-\d{2}-\d{2})/gm;
  while ((match = versionRegex.exec(content)) !== null) {
    currentVersion = `${match[2]} [${match[1]}]`;
  }
  
  return { exists: true, fixes, raw: content, currentVersion };
}

/** 执行 git 命令 */
function gitCmd(args, cwd) {
  try {
    return execSync(`git ${args}`, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    }).trim();
  } catch (e) {
    return null;
  }
}

/** 检查是否有 git 更新 */
function checkGitUpdates(projectRoot) {
  const fetchResult = gitCmd('fetch --dry-run 2>&1', projectRoot);
  const localRev = gitCmd('rev-parse HEAD', projectRoot);
  const remoteRev = gitCmd('rev-parse @{u}', projectRoot);
  
  const hasUpdates = localRev && remoteRev && localRev !== remoteRev;
  const branch = gitCmd('rev-parse --abbrev-ref HEAD', projectRoot) || 'main';
  const lastCommitDate = gitCmd('log -1 --format=%ci', projectRoot) || '';
  const lastCommitMsg = gitCmd('log -1 --format=%s', projectRoot) || '';
  
  return {
    branch,
    hasUpdates: !!hasUpdates,
    localRev: localRev ? localRev.substring(0, 8) : '?',
    remoteRev: remoteRev ? remoteRev.substring(0, 8) : '?',
    lastCommit: `${lastCommitDate.split(' ')[0]} ${lastCommitMsg.substring(0, 60)}`,
  };
}

// ─── 命令实现 ──────────────────────────────────────────

/**
 * audit — 审计本机同步状态
 * 
 * 输出:
 * 1. 本机基本信息
 * 2. CHANGELOG 中列出的所有修复 vs 本机已应用的
 * 3. 待同步的修复列表 + 自动生成激活命令
 * 4. Git 状态检查
 */
function cmdAudit(projectRoot) {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  🔗  Sync Checker — 跨设备修复同步审计       ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  
  // 1. 机器信息
  const identity = getMachineIdentity();
  const machineId = inferMachineId();
  console.log(`🖥️  当前机器: ${getMachineFriendlyName(machineId)} (${machineId})`);
  console.log(`   主机名: ${identity.hostname}`);
  console.log(`   系统: ${identity.type} ${identity.platform} / ${identity.arch}`);
  console.log(`   CPU: ${identity.cpus} 核 / 内存: ${identity.totalMem}GB`);
  console.log(`   用户: ${identity.username}`);
  console.log('');
  
  // 2. 读取本机同步状态
  const status = readSyncStatus(true);
  const syncedIds = new Set((status.syncedFixes || []).map(f => f.fixId));
  console.log(`📋 本机已同步: ${(status.syncedFixes || []).length} 个修复 | 首次发现: ${status.firstSeen?.substring(0, 16) || '?'}`);
  console.log(`   最后同步: ${status.lastSyncTime?.substring(0, 16) || '从未'}`);
  console.log('');
  
  // 3. 解析 CHANGELOG
  const changelog = parseChangelog(projectRoot);
  
  if (!changelog.exists) {
    console.log(`⚠️  未找到 ${CONFIG.changelogPath}`);
    console.log('   运行 node sync-checker.js changelog 生成初始变更日志');
    console.log('');
    
    // 尝试从 Git log 生成
    console.log('💡 建议: 先运行以下命令创建 CHANGELOG:');
    console.log('   node sync-checker.js changelog --init');
    console.log('');
    return;
  }
  
  console.log(`📝 变更日志: ${CONFIG.changelogPath} (${changelog.currentVersion || '未知版本'})`);
  console.log(`   发现 ${changelog.fixes.length} 个修复条目`);
  console.log('');
  
  // 4. 对比：找出待同步的修复
  const pendingFixes = changelog.fixes.filter(f => !syncedIds.has(f.fixId));
  const alreadySynced = changelog.fixes.filter(f => syncedIds.has(f.fixId));
  
  // 5. 输出已同步 ✅
  if (alreadySynced.length > 0) {
    console.log('✅ 已同步的修复:');
    alreadySynced.forEach(f => {
      const syncedInfo = (status.syncedFixes || []).find(s => s.fixId === f.fixId);
      console.log(`   ✅ ${f.fixId} │ ${f.title.substring(0, 45)} │ ${syncedInfo?.appliedAt?.substring(0, 16) || '?'}`);
    });
    console.log('');
  }
  
  // 6. 输出待同步 ⬜
  if (pendingFixes.length > 0) {
    console.log('⬜  待同步的修复:');
    console.log(''.padEnd(65, '─'));
    pendingFixes.forEach(f => {
      console.log(`   ⬜  ${f.fixId} │ ${f.severity} │ ${f.title.substring(0, 40)}`);
      console.log(`      影响: ${f.files}`);
    });
    console.log(''.padEnd(65, '─'));
    console.log('');
    
    // 7. 生成激活命令
    console.log('🔧 一键激活命令:');
    console.log(''.padEnd(65, '─'));
    console.log('# Step 1: 拉取最新代码');
    console.log(`cd ${projectRoot} && git pull origin main`);
    console.log('');
    console.log('# Step 2: 验证文件存在');
    const affectedFiles = [...new Set(pendingFixes.flatMap(f => f.files.split(',').map(s => s.trim())))];
    affectedFiles.forEach(file => {
      if (file && file !== '-') {
        console.log(`ls -la ${file}  # 应该存在`);
      }
    });
    console.log('');
    console.log('# Step 3: 标记已同步 (全部完成后再执行)');
    const fixIds = pendingFixes.map(f => f.fixId).join(',');
    console.log(`node ${path.relative(projectRoot, __dirname)}/sync-checker.js mark-synced --fix-ids "${fixIds}" --machine "${machineId}"`);
    console.log(''.padEnd(65, '─'));
    console.log('');
  } else {
    console.log('🎉 所有修复已同步！本机已是最新状态。');
    console.log('');
  }
  
  // 8. Git 状态
  const gitStatus = checkGitUpdates(projectRoot);
  console.log('📦 Git 状态:');
  console.log(`   分支: ${gitStatus.branch} | 本地: ${gitStatus.localRev} | 远程: ${gitStatus.remoteRev}`);
  if (gitStatus.hasUpdates) {
    console.log(`   ⚠️  有新提交可拉取! 最后: ${gitStatus.lastCommit}`);
  } else {
    console.log(`   ✅ 已是最新 | ${gitStatus.lastCommit}`);
  }
  console.log('');
  
  // 9. 汇总统计
  console.log('╔═════════════════════════════════════════╗');
  console.log(`║  总修复: ${changelog.fixes.length} │ 已同步: ${alreadySynced.length} │ 待同步: ${pendingFixes.length}  ║`);
  if (pendingFixes.length > 0) {
    const highPriority = pendingFixes.filter(f => f.severity.includes('高'));
    if (highPriority.length > 0) {
      console.log(`║  ⚠️  ${highPriority.length} 个高优先级修复待同步!            ║`);
    }
  }
  console.log('╚═════════════════════════════════════════╝');
  console.log('');
}

/**
 * changelog — 生成或更新 CHANGELOG.md
 */
function cmdChangelog(projectRoot, args) {
  const isInit = args.includes('--init');
  const changelogPath = path.join(projectRoot, CONFIG.changelogPath);
  
  if (isInit && !fs.existsSync(changelogPath)) {
    // 生成初始模板
    const template = `# CHANGELOG — WorkBuddy 本地修复与改进日志

> 此文件由 AI 在完成本地修复后自动更新。
> **任何 AI 进入此工作区的第一件事：读取此文件，检查是否有未应用的修复。**
> 
> 维护规则:
> - 每次做本地修复/改进后，在顶部新增一个 [待同步] 条目
> - 所有修复必须分配唯一 ID (F-xxx / FEAT-xxx 等)
> - 同步完成后将 [待同步] 改为 [已同步]
> - 同步矩阵实时更新每台机器的状态

---

## 📌 如何使用

### 如果你是 AI（刚进入这个工作区）

\`\`\`bash
# 第一步：运行审计，看看有什么需要同步
node n8n-bridge/sync-checker.js audit

# 第二步：如果有待同步修复，按提示执行激活命令

# 第三步：完成后标记同步
node n8n-bridge/sync-checker.js mark-synced --fix-ids "F-001,F-002" --machine "$(hostname)"
\`\`\`

### 如果你是人类（想看全局状态）

\`\`\`bash
# 查看所有机器的同步状态
node n8n-bridge/sync-checker.js status
\`\`\`

---

## [已同步] 2026-04-18 — Task Fleet Bridge 多账号任务舰队系统

### 🔧 修复清单

| # | 修复项 | 影响文件 | 严重度 | 同步状态 |
|---|--------|----------|--------|----------|
| F-001 | 罗盘渲染时页面跳到顶部（scrollY 锁定） | \`n8n-compass/compass.html\` | 🔴 高 | ✅ 已提交GitHub |
| FEAT-001 | 新增 🚀 任务舰队面板（多账号/多设备任务展示） | \`n8n-compass/compass.html\` + \`task-fleet-bridge.js\` | 🟡 中 | ✅ 已提交GitHub |
| F-002 | 任务采集器并发控制（防卡死：每设备2个/全局5个上限） | \`task-fleet-bridge.js\` | 🔴 高 | ✅ 已提交GitHub |

### 🎯 激活步骤

\`\`\`bash
# 1. 拉取最新代码
cd /你的项目路径 && git pull origin main

# 2. 验证关键文件
ls -la n8n-bridge/task-fleet-bridge.js     # ~40KB
grep "fleet-section" n8n-compass/compass.html  # 应该匹配

# 3. 测试采集器
node n8n-bridge/task-fleet-bridge.js demo

# 4. 标记本机已同步
node n8n-bridge/sync-checker.js mark-synced \\
  --fix-ids "F-001,FEAT-001,F-002" \\
  --machine "\$(hostname)"
\`\`\`

### 🖥️ 同步矩阵

| 电脑 | 账号 | F-001 | FEAT-001 | F-002 | 最后同步时间 |
|------|------|-------|----------|-------|-------------|
| MacBook Pro 主力机 | acc-mbp-main | ✅ | ✅ | ✅ | 2026-04-18 19:35 |
| iMac 家庭机 | acc-imac-home | ⬜ | ⬜ | ⬜ | — |
| MacBook Air 出差机 | acc-mba-travel | ⬜ | ⬜ | ⬜ | — |
| Ubuntu VPS | acc-server-node | ⬜ | ⬜ | ⬜ | — |
| Remote Dev | acc-collab-dev | ⬜ | ⬜ | ⬜ | — |

---

_此文件由 sync-checker.js 于 ${new Date().toISOString().substring(0, 16)} 生成_
`;
    
    fs.writeFileSync(changelogPath, template);
    console.log(`✅ 已生成初始 CHANGELOG → ${changelogPath}`);
    console.log('   包含 Task Fleet Bridge 的 3 个修复条目');
    return;
  }
  
  // 非初始化模式：追加新条目
  if (fs.existsSync(changelogPath)) {
    console.log(`📝 CHANGELOG 已存在: ${changelogPath}`);
    console.log('   运行 node sync-checker.js changelog --init 可重新生成');
    return;
  }
  
  console.log('❌ 请先运行 --init 创建初始 CHANGELOG');
}

/**
 * mark-synced — 标记指定修复已在本机应用
 */
function cmdMarkSynced(rawArgs) {
  // 支持格式: --fix-ids="F-001,F-002" 或 --fix-ids "F-001,F-002"
  const fmatch = rawArgs.match(/--fix-ids(?:=|\s+)["']?([^"\s'"]+)/);
  const mmatch = rawArgs.match(/--machine(?:=|\s+)["']?([^"\s'"]+)/);

  const fixIdsArg = fmatch ? fmatch[1] : null;
  const machineArg = mmatch ? mmatch[1] : null;
  
  if (!fixIdsArg) {
    console.error('❌ 需要 --fix-ids 参数');
    console.error('用法: node sync-checker.js mark-synced --fix-ids "F-001,F-002" --machine "mbp-pro"');
    process.exit(1);
  }
  
  const fixIds = fixIdsArg.split(',').map(id => id.trim());
  const status = readSyncStatus(true);
  const now = new Date().toISOString();
  
  let newCount = 0;
  fixIds.forEach(fixId => {
    const existingIdx = (status.syncedFixes || []).findIndex(f => f.fixId === fixId);
    if (existingIdx >= 0) {
      // 更新已有记录
      status.syncedFixes[existingIdx].appliedAt = now;
      status.syncedFixes[existingIdx].updatedAt = now;
    } else {
      // 新增
      if (!status.syncedFixes) status.syncedFixes = [];
      status.syncedFixes.push({
        fixId,
        appliedAt: now,
        appliedBy: `WorkBuddy-AI-${process.pid}`,
        machineId: machineArg || inferMachineId(),
      });
      newCount++;
    }
  });
  
  if (machineArg && !status.machineId) {
    status.machineId = machineArg;
    status.machineName = getMachineFriendlyName(machineArg);
  }
  
  status.lastSyncTime = now;
  writeSyncStatus(status);
  
  // 同时更新共享同步矩阵
  updateSyncMatrix(status, fixIds);
  
  console.log(`✅ 已标记 ${fixIds.length} 个修复为已同步 (${newCount} 个新增):`);
  fixIds.forEach(id => {
    console.log(`   ✅ ${id} @ ${now.substring(0, 19)}`);
  });
  console.log(`   机器: ${status.machineName || machineArg || inferMachineId()} (${status.machineId || machineArg || inferMachineId()})`);
  console.log(`   状态文件: ${CONFIG.syncStatusFile}`);
}

/**
 * status — 查看所有机器的同步矩阵
 */
function cmdStatus() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  🔄 全局同步状态矩阵                              ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  
  // 读取同步矩阵
  const matrix = readSyncMatrix();
  const changelog = parseChangelog(CONFIG.defaultProjectRoot);
  const allFixIds = changelog.fixes.map(f => f.fixId);
  
  if (allFixIds.length === 0) {
    console.log('⚠️  未找到任何修复条目。请先确保 CHANGELOG.md 存在。');
    return;
  }
  
  // 表头
  const colWidth = Math.max(18, ...allFixIds.map(id => id.length + 4));
  let header = '│ 机器'.padEnd(20);
  allFixIds.forEach(id => { header += `│ ${id.padEnd(colWidth)}`; });
  header += '│ 时间 │';
  console.log(header);
  console.log('─'.repeat(20 + (colWidth + 3) * allFixIds.length + 15));
  
  // 每台机器一行
  const machines = Object.entries(matrix.machines || {});
  if (machines.length === 0) {
    // 只有本机的数据
    const localStatus = readSyncStatus(false);
    if (localStatus) {
      printMatrixRow(localStatus.machineName || '当前机器', localStatus.syncedFixes || [], allFixIds, colWidth, localStatus.lastSyncTime);
    }
  } else {
    machines.forEach(([mid, mdata]) => {
      const syncedIds = (mdata.syncedFixes || []).map(f => f.fixId || f);
      printMatrixRow(
        mdata.name || mid,
        syncedIds,
        allFixIds,
        colWidth,
        mdata.lastSyncTime
      );
    });
  }
  
  console.log('');
  console.log(`总计: ${(matrix.machines ? Object.keys(matrix.machines).length : 0) || 1} 台机器 · ${allFixIds.length} 个修复`);
  console.log(`数据来源: ${CONFIG.syncMatrixFile}`);
  console.log('');
}

function printMatrixRow(machineName, syncedFixIds, allFixIds, colWidth, lastTime) {
  const syncedSet = new Set(syncedFixIds);
  let row = `│ ${(machineName || '—').padEnd(18)} `;
  let syncedCount = 0;
  allFixIds.forEach(id => {
    if (syncedSet.has(id)) {
      row += `│ ✅ `.padEnd(colWidth + 3);
      syncedCount++;
    } else {
      row += `│ ⬜ `.padEnd(colWidth + 3);
    }
  });
  row += `│ ${(lastTime || '—').substring(0, 10).padStart(10)} │`;
  console.log(row);
}

/**
 * init — 初始化 .sync-status.json
 */
function cmdInit() {
  const status = readSyncStatus(true);
  console.log('✅ 同步状态文件已初始化:');
  console.log(`   路径: ${CONFIG.syncStatusFile}`);
  console.log(`   机器ID: ${status.machineId}`);
  console.log(`   名称: ${status.machineName}`);
  console.log(`   主机名: ${status.hostname}`);
  console.log('');
  console.log('💡 下一步: 运行 node sync-checker.js audit 开始审计');
}

/**
 * diff — 对比本地和远程差异
 */
function cmdDiff(projectRoot) {
  console.log('\n🔍 检查本地 vs Git 远程差异...\n');
  
  const gitStatus = checkGitUpdates(projectRoot);
  const changelog = parseChangelog(projectRoot);
  const status = readSyncStatus(false);
  
  // Git 差异
  console.log('📦 Git 状态:');
  if (gitStatus.hasUpdates) {
    console.log(`   ⚠️  本地落后远程!`);
    console.log(`   分支: ${gitStatus.branch}`);
    console.log(`   本地: ${gitStatus.localRev} | 远程: ${gitStatus.remoteRev}`);
    console.log(`   最新提交: ${gitStatus.lastCommit}`);
    console.log('');
    console.log('   执行 git pull 拉取更新:');
    console.log(`   cd ${projectRoot} && git pull origin ${gitStatus.branch}`);
  } else {
    console.log(`   ✅ 本地已是最新 (${gitStatus.branch} @ ${gitStatus.localRev})`);
  }
  console.log('');
  
  // 文件级对比 (简单版)
  console.log('📁 关键文件检查:');
  const keyFiles = [
    'n8n-bridge/task-fleet-bridge.js',
    'n8n-bridge/sync-checker.js',
    'n8n-compass/compass.html',
    'n8n-bridge/SYNC-PROTOCOL.md',
  ];
  
  keyFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const sizeKB = Math.round(stat.size / 1024);
      console.log(`   ✅ ${file} (${sizeKB}KB, ${stat.mtime.toISOString().substring(0, 16)})`);
    } else {
      console.log(`   ❌ ${file} 不存在! 需要拉取代码`);
    }
  });
  console.log('');
}

// ─── 同步矩阵 (跨机器) ─────────────────────────────────

function readSyncMatrix() {
  ensureDir(CONFIG.sharedDir);
  if (fs.existsSync(CONFIG.syncMatrixFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.syncMatrixFile, 'utf8'));
    } catch (e) {
      // ignore
    }
  }
  return { version: '1.0.0', machines: {}, lastUpdated: null };
}

function writeSyncMatrix(matrix) {
  ensureDir(CONFIG.sharedDir);
  matrix.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CONFIG.syncMatrixFile, JSON.stringify(matrix, null, 2));
}

function updateSyncMatrix(localStatus, newFixIds) {
  const matrix = readSyncMatrix();
  const mid = localStatus.machineId || inferMachineId();
  
  if (!matrix.machines[mid]) {
    matrix.machines[mid] = {
      name: localStatus.machineName || getMachineFriendlyName(mid),
      hostname: localStatus.hostname,
      syncedFixes: [],
      lastSyncTime: null,
    };
  }
  
  // 合并已同步的 fix IDs
  const existingIds = new Set(matrix.machines[mid].syncedFixes.map(f => typeof f === 'string' ? f : f.fixId));
  newFixIds.forEach(id => {
    if (!existingIds.has(id)) {
      matrix.machines[mid].syncedFixes.push({ fixId: id, at: new Date().toISOString() });
    }
  });
  matrix.machines[mid].lastSyncTime = new Date().toISOString();
  
  writeSyncMatrix(matrix);
}

// ─── CLI 入口 ──────────────────────────────────────────

function printUsage() {
  console.log(`
🔗 sync-checker.js — 跨设备修复同步检测器

用法:
  node sync-checker.js <命令> [选项]

命令:
  audit          🔍 审计本机同步状态（推荐 AI 入场第一步执行）
  changelog      📝 生成/更新 CHANGELOG.md (--init 初始化)
  mark-synced    ✓  标记修复已应用 (--fix-ids "F-001,F-002" --machine "id")
  status         🖥️  查看所有机器的同步矩阵
  init           🆕 初始化 .sync-status.json
  diff           🔀 对比本地 vs Git 远程差异
  help           ❓ 显示帮助信息

示例:
  node sync-checker.js audit                              # 审计当前机器
  node sync-checker.js changelog --init                   # 创建初始 CHANGELOG
  node sync-checker.js mark-synced --fix-ids "F-001"      # 标记 F-001 已同步
  node sync-checker.js status                             # 查看全量同步矩阵
  node sync-checker.js diff                               # 检查 git 差异

AI 入场协议:
  1. 读 CHANGELOG.md → 了解有哪些修复
  2. 运行 audit → 检查本机状态
  3. 有待同步修复 → 按 audit 输出的命令执行
  4. 完成后 mark-synced → 标记完成
`);
}

// ─── Main ──────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const restArgs = args.slice(1).join(' ');
  
  // 项目根目录: 向上查找包含 .git 的目录
  let projectRoot = CONFIG.defaultProjectRoot;
  if (fs.existsSync(path.join(__dirname, '..', '.git'))) {
    projectRoot = path.resolve(__dirname, '..');
  } else if (fs.existsSync(path.join(__dirname, '..', '..', '.git'))) {
    projectRoot = path.resolve(__dirname, '..', '..');
  }
  
  switch (command) {
    case 'audit':
      cmdAudit(projectRoot);
      break;
    case 'changelog':
      cmdChangelog(projectRoot, restArgs);
      break;
    case 'mark-synced':
      cmdMarkSynced(restArgs);
      break;
    case 'status':
      cmdStatus();
      break;
    case 'init':
      cmdInit();
      break;
    case 'diff':
      cmdDiff(projectRoot);
      break;
    case 'help':
    case '--help':
    case '-h':
      printUsage();
      break;
    default:
      console.error(`❓ 未知命令: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main();
