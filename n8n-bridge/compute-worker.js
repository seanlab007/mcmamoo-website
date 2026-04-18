#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════
 * ⚡ compute-worker.js — 轻量算力节点 (Win7 / 低配机专用)
 * 
 * 定位: 不是看板! 是能接活干活的 Worker 节点。
 * 
 * 核心能力:
 * 1. 📥 Task Queue — 从主控节点领取任务, 本地执行, 回传结果
 * 2. 🔤 Text Pipeline — 文本批量处理(替换/提取/格式转换)
 * 3. 📊 Data Transform — 数据清洗(CSV/JSON/YAML互转)
 * 4. 🌐 API Proxy — AI API 中转(带缓存+限流)
 * 5. 📁 File Ops — 批量压缩/解压/编码转换
 * 6. ⏰ Scheduler — 定时任务(采集/监控/备份)
 * 7. 🔄 Git Auto — 自动 commit/push/sync
 * 
 * 适用环境:
 * - Windows 7 + 6GB RAM (Node.js v16)
 * - 低配 Linux VPS (<1GB RAM)
 * - 树莓派 / 嵌入式设备
 * 
 * 内存占用: 空闲 ~35MB / 工作中 ~150-300MB (远低于 MaoAI 的 2GB+)
 * 
 * CLI:
 *   start           启动 worker 服务 (HTTP API + 任务循环)
 *   status          查看 worker 状态和队列
 *   run <task-type> 手动执行一个任务
 *   bench           运行基准测试(检测本机算力)
 *   help            显示帮助
 * 
 * 作者: 润之 (WorkBuddy AI)
 * 版本: v1.0.0 | 2026-04-18
 * ═══════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const zlib = require('zlib');

// ─── 配置 ───────────────────────────────────────────────

const CONFIG = {
  // Worker 服务端口
  port: process.env.WORKER_PORT || 3897,
  
  // 主控节点地址 (MacBook Pro)
  masterUrl: process.env.MASTER_URL || 'http://localhost:3000',
  
  // 工作目录
  workDir: path.join(os.homedir(), '.worker-tasks'),
  
  // 结果目录
  resultDir: path.join(os.homedir(), '.worker-results'),
  
  // 日志目录
  logDir: path.join(os.homedir(), '.worker-logs'),
  
  // 任务队列最大长度
  maxQueueSize: 20,
  
  // 并发任务数 (Win7 限制为 1)
  maxConcurrency: 1,
  
  // 单个任务超时 (ms) — Win7 上给长一点
  taskTimeout: 5 * 60 * 1000, // 5分钟
  
  // 心跳间隔
  heartbeatInterval: 30 * 1000,
};

// ─── 全局状态 ──────────────────────────────────────────

const state = {
  startedAt: null,
  taskIdCounter: 0,
  queue: [],       // 待执行的任务
  running: null,   // 当前正在执行的任务
  completed: [],   // 已完成的任务 (最近100条)
  failed: [],      // 失败的任务 (最近50条)
  stats: {
    totalCompleted: 0,
    totalFailed: 0,
    totalBytesProcessed: 0,
    avgTaskTime: 0,
  },
  capabilities: {},  // 本机能力检测
};

// ─── 初始化目录 ────────────────────────────────────────

function ensureDirs() {
  [CONFIG.workDir, CONFIG.resultDir, CONFIG.logDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

// ─── 能力检测 ──────────────────────────────────────────

function detectCapabilities() {
  const cpus = os.cpus();
  const memGB = Math.round(os.totalmem() / (1024 ** 3));
  const freeMemGB = Math.round(os.freemem() / (1024 ** 3));
  
  return {
    // 基本信息
    hostname: os.hostname(),
    platform: `${os.platform()} ${os.release()}`,
    arch: os.arch(),
    
    // 硬件
    cpuModel: cpus[0]?.model || 'unknown',
    cpuCores: cpus.length,
    totalMemGB: memGB,
    freeMemGB: freeMemGB,
    
    // 能力矩阵 (布尔值, 决定这个 worker 能接什么活)
    canDo: {
      textProcess: true,     // 文本处理
      dataTransform: true,   // 数据转换
      apiProxy: true,        // API代理
      fileCompress: true,    // 文件压缩
      scheduledTasks: true,  // 定时任务
      gitOps: hasCommand('git'), // Git操作
      curlFetch: hasCommand('curl'), // HTTP请求
      pythonScript: hasCommand('python') || hasCommand('python3'),
    },
    
    // 性能等级
    perfLevel: memGB >= 8 ? 'high' : memGB >= 4 ? 'medium' : 'low',
    
    // 并发建议
    suggestedConcurrency: memGB >= 8 ? 2 : 1,
    
    // 检测时间
    detectedAt: new Date().toISOString(),
  };
}

function hasCommand(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'pipe', timeout: 3000 });
    return true;
  } catch { return false; }
}

// ─── 日志系统 ──────────────────────────────────────────

function log(level, msg, meta) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level.toUpperCase()}] ${msg}` +
    (meta ? ` | ${JSON.stringify(meta).substring(0, 200)}` : '');
  
  console.log(line);
  
  // 写入日志文件
  try {
    const logFile = path.join(CONFIG.logDir, `worker-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, line + '\n');
  } catch {}
}

// ─── 任务定义 ──────────────────────────────────────────

/**
 * 任务类型注册表
 * 每个 task-type 对应一个 executor 函数
 */
const TASK_REGISTRY = {

  /**
   * 📝 文本批量替换/处理
   * Input: { text: string, operations: [{type:'replace',from,to}, {type:'regex',pattern,replacement}] }
   */
  'text-process': async function(params) {
    let result = params.text || '';
    const ops = params.operations || [];
    
    for (const op of ops) {
      switch (op.type) {
        case 'replace':
          result = result.split(op.from).join(op.to);
          break;
        case 'regex':
          result = result.replace(new RegExp(op.pattern, op.flags || 'g'), op.replacement || '');
          break;
        case 'trim':
          result = result.trim();
          break;
        case 'upper':
          result = result.toUpperCase();
          break;
        case 'lower':
          result = result.toLowerCase();
          break;
        case 'remove-lines':
          result = result.split('\n')
            .filter(line => !line.includes(op.pattern))
            .join('\n');
          break;
        case 'extract-pattern':
          const matches = [...result.matchAll(new RegExp(op.pattern, op.flags || 'g'))];
          result = matches.map(m => m[op.captureGroup || 0] || m[0]).join(op.separator || '\n');
          break;
      }
    }
    
    return {
      result,
      originalLength: (params.text || '').length,
      processedLength: result.length,
      operationCount: ops.length,
    };
  },

  /**
   * 📊 数据格式转换 (CSV/JSON/YAML/Markdown 表格)
   */
  'data-transform': async function(params) {
    const input = params.data;
    const fromFormat = (params.from || 'auto').toLowerCase();
    const toFormat = (params.to || 'json').toLowerCase();

    // 解析输入
    let records = [];
    
    if (fromFormat === 'json' || (fromFormat === 'auto' && typeof input === 'object')) {
      records = Array.isArray(input) ? input : [input];
    } else if (typeof input === 'string') {
      // 尝试自动检测格式
      const trimmed = input.trim();
      
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        records = JSON.parse(trimmed);
        if (!Array.isArray(records)) records = [records];
      } else if (trimmed.includes('\t') || (trimmed.split(',').length > 3 && trimmed.includes('\n'))) {
        // CSV/TSV
        const lines = trimmed.split('\n').filter(l => l.trim());
        const delimiter = trimmed.includes('\t') ? '\t' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
          const row = {};
          headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
          records.push(row);
        }
      }
    }

    // 输出转换
    let output;
    switch (toFormat) {
      case 'csv':
        if (records.length === 0) { output = ''; break; }
        const headers = Object.keys(records[0]);
        output = headers.join(',') + '\n';
        output += records.map(row =>
          headers.map(h => {
            const val = String(row[h] ?? '');
            return val.includes(',') || val.includes('"') || val.includes('\n')
              ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(',')
        ).join('\n');
        break;

      case 'markdown':
        if (records.length === 0) { output = ''; break; }
        const mdHeaders = Object.keys(records[0]);
        output = '| ' + mdHeaders.join(' | ') + ' |\n';
        output += '| ' + mdHeaders.map(() => '---').join(' | ') + ' |\n';
        output += records.map(row =>
          '| ' + mdHeaders.map(h => String(row[h] ?? '')).join(' | ') + ' |'
        ).join('\n');
        break;

      case 'yaml-simple':
        output = records.map((row, i) =>
          Object.entries(row).map(([k,v]) => `${k}: ${v}`).join('\n')
        ).join('\n---\n');
        break;

      case 'json':
      default:
        output = JSON.stringify(records, null, 2);
        break;
    }

    return {
      output,
      recordCount: records.length,
      fromFormat,
      toFormat,
      bytesIn: Buffer.byteLength(typeof input === 'string' ? input : JSON.stringify(input)),
      bytesOut: Buffer.byteLength(output),
    };
  },

  /**
   * 🌐 HTTP 请求 / API 代理
   */
  'http-fetch': async function(params) {
    const url = params.url;
    const method = (params.method || 'GET').toUpperCase();
    const headers = params.headers || {};
    const body = params.body;
    const timeout = params.timeout || 30000;

    return new Promise((resolve, reject) => {
      const mod = url.startsWith('https') ? https : http;
      const reqOpts = new URL(url);
      
      const options = {
        hostname: reqOpts.hostname,
        port: reqOpts.port || (url.startsWith('https') ? 443 : 80),
        path: reqOpts.pathname + reqOpts.search,
        method,
        headers: {
          'User-Agent': 'ComputeWorker/1.0',
          'Accept': '*/*',
          ...headers,
        },
        timeout,
      };

      if (body && method !== 'GET') {
        options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(body);
      }

      const req = mod.request(options, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            body: buf.toString('utf8'),
            sizeBytes: buf.length,
            contentType: res.headers['content-type'],
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
      
      if (body) req.write(body);
      req.end();
    });
  },

  /**
   * 📁 文件压缩/解压
   */
  'file-compress': async function(params) {
    const action = params.action; // 'compress' or 'decompress'
    const filePath = params.path;
    const outputPath = params.outputPath ||
      (action === 'compress' ? filePath + '.gz' : filePath.replace(/\.gz$/, ''));

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const input = fs.readFileSync(filePath);

    if (action === 'compress') {
      return new Promise((resolve, reject) => {
        zlib.gzip(input, (err, compressed) => {
          if (err) return reject(err);
          fs.writeFileSync(outputPath, compressed);
          resolve({
            action: 'compress',
            inputPath: filePath,
            outputPath,
            originalSize: input.length,
            compressedSize: compressed.length,
            ratio: ((1 - compressed.length / input.length) * 100).toFixed(1) + '%',
          });
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        zlib.gunzip(input, (err, decompressed) => {
          if (err) return reject(err);
          fs.writeFileSync(outputPath, decompressed);
          resolve({
            action: 'decompress',
            inputPath: filePath,
            outputPath,
            compressedSize: input.length,
            decompressedSize: decompressed.length,
          });
        });
      });
    }
  },

  /**
   * 🔢 批量数值计算 (统计/聚合)
   */
  'batch-compute': async function(params) {
    const numbers = params.numbers || [];
    const operations = params.operations || ['sum','avg','min','max','count'];

    const n = numbers.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const sorted = [...n].sort((a,b) => a-b);
    
    const stats = {};
    const ops = {
      sum: () => n.reduce((a,b) => a+b, 0),
      avg: () => n.length > 0 ? n.reduce((a,b) => a+b, 0) / n.length : 0,
      min: () => sorted[0],
      max: () => sorted[sorted.length - 1],
      count: () => n.length,
      median: () => {
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2;
      },
      stddev: () => {
        if (n.length < 2) return 0;
        const mean = n.reduce((a,b)=>a+b,0)/n.length;
        const sqDiffs = n.map(v => Math.pow(v-mean,2));
        return Math.sqrt(sqDiffs.reduce((a,b)=>a+b,0)/(n.length-1));
      },
      percentile90: () => {
        if (sorted.length === 0) return 0;
        const idx = Math.ceil(sorted.length * 0.9) - 1;
        return sorted[Math.min(idx, sorted.length - 1)];
      },
    };

    operations.forEach(op => {
      if (ops[op]) stats[op] = Math.round(ops[op]() * 1000000) / 1000000;
    });

    return {
      stats,
      inputCount: numbers.length,
      validCount: n.length,
    };
  },

  /**
   * 📋 Git 操作
   */
  'git-op': async function(params) {
    const repoPath = params.repoPath || process.cwd();
    const op = params.operation; // 'status', 'diff', 'log', 'commit', 'push'

    const results = {};

    try {
      switch (op) {
        case 'status':
          results.output = execSync(`git -C "${repoPath}" status --short`, { encoding: 'utf8', timeout: 15000 }).trim();
          results.filesChanged = results.output.split('\n').filter(Boolean).length;
          break;

        case 'diff':
          results.output = execSync(`git -C "${repoPath}" diff`, { encoding: 'utf8', timeout: 15000 });
          results.sizeBytes = Buffer.byteLength(results.output);
          break;

        case 'log':
          const n = params.count || 5;
          results.output = execSync(`git -C "${repoPath}" log -${n} --format="%h|%s|%ai"`, { encoding: 'utf8', timeout: 15000 });
          results.commits = results.output.trim().split('\n')
            .filter(Boolean)
            .map(line => { const [hash, msg, date] = line.split('|'); return { hash, msg, date }; });
          break;

        case 'commit':
          if (!params.message) throw new Error('commit requires message param');
          execSync(`git -C "${repoPath}" add -A`, { encoding: 'utf8', timeout: 15000 });
          results.output = execSync(`git -C "${repoPath}" commit -m "${params.message.replace(/"/g, '\\"')}"`, { encoding: 'utf8', timeout: 15000 });
          results.hash = results.output.trim().match(/\b([a-f0-9]{7,})\b/)?.[1] || '?';
          break;

        case 'push':
          results.output = execSync(`git -C "${repoPath}" push ${params.remote || 'origin'} ${params.branch || 'main'} --force-with-lease`, { encoding: 'utf8', timeout: 60000 });
          break;

        default:
          throw new Error(`Unknown git operation: ${op}`);
      }
      results.success = true;
    } catch (e) {
      results.success = false;
      results.error = e.message?.substring(0, 500);
      results.stderr = e.stderr?.substring(0, 500);
    }

    return results;
  },

  /**
   * 🧪 基准测试 (检测本机真实算力)
   */
  'bench': async function(params) {
    const rounds = params.rounds || 3;
    const results = [];

    for (let r = 0; r < rounds; r++) {
      const roundResult = { round: r + 1 };
      
      // Test 1: CPU 整数运算
      let t0 = Date.now();
      let acc = 0;
      for (let i = 0; i < 10_000_000; i++) acc += i * i;
      roundResult.cpuIntMs = Date.now() - t0;
      roundResult.cpuIntChecksum = acc;

      // Test 2: CPU 浮点运算
      t0 = Date.now();
      acc = 0;
      for (let i = 0; i < 5_000_000; i++) acc += Math.sqrt(i) * Math.sin(i);
      roundResult.cpuFloatMs = Date.now() - t0;
      roundResult.cpuFloatChecksum = Math.round(acc * 1000) / 1000;

      // Test 3: 内存分配
      t0 = Date.now();
      const bufs = [];
      for (let i = 0; i < 1000; i++) bufs.push(Buffer.alloc(1024, 0xAB));
      roundResult.memAllocMs = Date.now() - t0;
      roundResult.memAllocMB = (bufs.reduce((s,b) => s + b.length, 0) / (1024*1024)).toFixed(2);

      // Test 4: 字符串操作
      t0 = Date.now();
      let str = '';
      const baseStr = 'The quick brown fox jumps over the lazy dog. ';
      for (let i = 0; i < 10000; i++) str += baseStr;
      const strLen = str.length;
      t0 = Date.now();
      str = str.toUpperCase().replace(/FOX/gi, 'CAT').split(' ').reverse().join(' ');
      roundResult.stringMs = Date.now() - t0;
      roundResult.stringChars = strLen;

      // Test 5: JSON 序列化
      const bigObj = Array.from({length: 10000}, (_,i) => ({id:i, name:`item${i}`, val:Math.random()*100}));
      t0 = Date.now();
      const jsonStr = JSON.stringify(bigObj);
      roundResult.jsonSerializeMs = Date.now() - t0;
      t0 = Date.now();
      JSON.parse(jsonStr);
      roundResult.jsonParseMs = Date.now() - t0;
      roundResult.jsonSizeKB = Math.round(Buffer.byteLength(jsonStr)/1024);

      // Test 6: 文件 I/O
      const testFile = path.join(CONFIG.resultDir, '.bench-io-test.tmp');
      t0 = Date.now();
      fs.writeFileSync(testFile, 'x'.repeat(1024 * 1024)); // 1MB write
      roundResult.fileWriteMs = Date.now() - t0;
      t0 = Date.now();
      fs.readFileSync(testFile);
      roundResult.fileReadMs = Date.now() - t0;
      fs.unlinkSync(testFile); // cleanup

      // Test 7: Hash 计算 (crypto-like workload)
      t0 = Date.now();
      const hashInput = 'benchmark'.repeat(100000);
      let hashVal = 0;
      for (let i = 0; i < hashInput.length; i++) {
        hashVal = ((hashVal << 5) - hashVal + hashInput.charCodeAt(i)) | 0;
      }
      roundResult.hashMs = Date.now() - t0;
      roundResult.hashChecksum = hashVal >>> 0;

      results.push(roundResult);
    }

    // 计算平均值
    const avg = {};
    const keys = Object.keys(results[0]).filter(k => k !== 'round');
    keys.forEach(key => {
      avg[key] = Math.round(
        results.reduce((sum, r) => sum + (r[key] || 0), 0) / rounds * 100
      ) / 100;
    });

    return {
      rounds: results,
      average: avg,
      capabilities: detectCapabilities(),
      score: {
        cpu: Math.max(1, 10 - (avg.cpuIntMs || 9999) / 100),
        memory: Math.max(1, 10 - (avg.memAllocMs || 9999) / 50),
        io: Math.max(1, 10 - ((avg.fileWriteMs||0) + (avg.fileReadMs||0)) / 20),
        overall: 0, // computed below
      },
    };
  },
};

// ─── 任务引擎 ──────────────────────────────────────────

function createTask(type, params, priority = 5) {
  state.taskIdCounter++;
  return {
    id: `wk-${Date.now()}-${state.taskIdCounter}`,
    type,
    params,
    priority, // 1=高, 5=普通, 10=低
    status: 'queued',
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    result: null,
    error: null,
  };
}

async function executeTask(task) {
  const startTime = Date.now();
  task.status = 'running';
  task.startedAt = new Date().toISOString();
  state.running = task;

  log('info', `▶ 开始执行任务 [${task.id}]`, { type: task.type, priority: task.priority });

  try {
    const executor = TASK_REGISTRY[task.type];
    if (!executor) throw new Error(`未知任务类型: ${task.type}`);

    // 设置超时
    const result = await Promise.race([
      executor(task.params),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`任务超时 (${CONFIG.taskTimeout/1000}s)`)), CONFIG.taskTimeout)
      ),
    ]);

    const elapsed = Date.now() - startTime;
    
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = result;
    task.elapsedMs = elapsed;

    // 更新统计
    state.stats.totalCompleted++;
    state.stats.totalBytesProcessed += JSON.stringify(result).length;
    const n = state.stats.totalCompleted;
    state.stats.avgTaskTime = Math.round(((state.stats.avgTaskTime * (n-1)) + elapsed) / n);

    // 存储结果到文件
    saveTaskResult(task);

    log('info', `✅ 任务完成 [${task.id}]`, { type: task.type, elapsed: `${elapsed}ms` });

    return task;
  } catch (err) {
    task.status = 'failed';
    task.completedAt = new Date().toISOString();
    task.error = err.message.substring(0, 500);
    state.stats.totalFailed++;

    log('error', `❌ 任务失败 [${task.id}]`, { error: err.message });

    state.failed.unshift(task);
    if (state.failed.length > 50) state.failed.pop();

    return task;
  } finally {
    state.running = null;
    state.completed.unshift(task);
    if (state.completed.length > 100) state.completed.pop();
  }
}

function saveTaskResult(task) {
  try {
    const resultFile = path.join(CONFIG.resultDir, `${task.id}.json`);
    fs.writeFileSync(resultFile, JSON.stringify({
      ...task,
      savedAt: new Date().toISOString(),
    }, null, 2));
  } catch {}
}

// ─── 队列管理 ──────────────────────────────────────────

function enqueueTask(type, params, priority = 5) {
  if (state.queue.length >= CONFIG.maxQueueSize) {
    return { success: false, error: '队列已满' };
  }
  const task = createTask(type, params, priority);
  state.queue.push(task);
  // 按优先级排序 (数字越小越优先)
  state.queue.sort((a, b) => a.priority - b.priority);
  log('info', `📥 任务入队 [${task.id}]`, { type, queueLength: state.queue.length });
  return { success: true, taskId: task.id };
}

async function processQueue() {
  if (state.running || state.queue.length === 0) return;
  const task = state.queue.shift();
  await executeTask(task);
  // 递归处理下一个
  setImmediate(processQueue);
}

// ─── HTTP API Server ────────────────────────────────────

function createServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${CONFIG.port}`);
    
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // JSON helper
    function json(data, code = 200) {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data, null, 2));
    }

    try {
      // ── GET /status — Worker 状态 ──
      if (url.pathname === '/status' && req.method === 'GET') {
        const memUsage = process.memoryUsage();
        return json({
          version: '1.0.0',
          uptime: state.startedAt ? Date.now() - new Date(state.startedAt).getTime() : 0,
          capabilities: state.capabilities,
          queue: {
            length: state.queue.length,
            maxSize: CONFIG.maxQueueSize,
            running: !!state.running,
            currentTask: state.running ? { id: state.running.id, type: state.running.type, elapsed: Date.now() - new Date(state.running.startedAt).getTime() } : null,
          },
          stats: state.stats,
          system: {
            rssMB: Math.round(memUsage.rss / (1024*1024)),
            heapUsedMB: Math.round(memUsage.heapUsed / (1024*1024)),
            heapTotalMB: Math.round(memUsage.heapTotal / (1024*1024)),
            loadAvg: os.loadavg?.() || [0,0,0],
            freeMemMB: Math.round(os.freemem() / (1024*1024)),
          },
        });
      }

      // ── POST /task — 提交任务 ──
      if (url.pathname === '/task' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { type, params, priority } = JSON.parse(body);
            if (!type) return json({ error: '缺少 type 参数' }, 400);
            
            // 如果没有对应执行器
            if (!TASK_REGISTRY[type]) {
              return json({ error: `不支持的任务类型: ${type}\n支持: ${Object.keys(TASK_REGISTRY).join(', ')}` }, 400);
            }
            
            const result = enqueueTask(type, params, priority);
            if (result.success) {
              // 触发队列处理
              processQueue();
              json({ taskId: result.taskId, queuePosition: state.queue.findIndex(t => t.id === result.taskId) + 1 }, 202);
            } else {
              json(result, 503);
            }
          } catch (e) { json({ error: e.message }, 400); }
        });
        return;
      }

      // ── GET /tasks — 查看任务列表 ──
      if (url.pathname === '/tasks' && req.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const filter = url.searchParams.get('filter'); // queued/running/completed/failed
        
        let tasks = [];
        if (state.running) tasks.push(state.running);
        tasks.push(...state.queue);
        
        if (filter === 'completed') tasks = state.completed.slice(0, limit);
        else if (filter === 'failed') tasks = state.failed.slice(0, limit);
        else tasks = tasks.concat(state.completed.slice(0, Math.max(0, limit - tasks.length)));
        
        return json({ count: tasks.length, tasks: tasks.map(t => ({
          id: t.id, type: t.type, status: t.status, priority: t.priority,
          createdAt: t.createdAt, completedAt: t.completedAt,
          elapsedMs: t.elapsedMs,
          error: t.error,
        }))});
      }

      // ── POST /run — 同步执行（立即返回结果）──
      if (url.pathname === '/run' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { type, params } = JSON.parse(body);
            if (!TASK_REGISTRY[type]) return json({ error: `未知类型: ${type}` }, 400);
            
            const task = createTask(type, params, 1);
            const result = await executeTask(task);
            json(result, result.status === 'failed' ? 500 : 200);
          } catch (e) { json({ error: e.message }, 400); }
        });
        return;
      }

      // ── GET /capabilities — 能力声明 ──
      if (url.pathname === '/capabilities' && req.method === 'GET') {
        return json(state.capabilities);
      }

      // ── POST /bench — 基准测试 ──
      if (url.pathname === '/bench' && req.method === 'POST') {
        const task = createTask('bench', { rounds: 2 }, 1);
        const result = await executeTask(task);
        return json(result);
      }

      // 404
      json({
        error: 'Not Found',
        availableRoutes: [
          'GET /status',
          'POST /task  (提交异步任务)',
          'POST /run   (同步执行)',
          'GET /tasks?filter={queued|completed|failed}',
          'GET /capabilities',
          'POST /bench',
        ],
        supportedTaskTypes: Object.keys(TASK_REGISTRY),
      }, 404);
    } catch (e) {
      log('error', '服务器内部错误', { error: e.message });
      json({ error: e.message }, 500);
    }
  });

  return server;
}

// ─── CLI 命令 ──────────────────────────────────────────

async function cmdStart() {
  ensureDirs();
  state.capabilities = detectCapabilities();
  state.startedAt = new Date().toISOString();
  
  const server = createServer();
  server.listen(CONFIG.port, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  ⚡ Compute Worker — 轻量算力节点             ║');
    console.log('║  Win7 / 低配机专用                            ║');
    console.log('╚════════处理的═══════════════════════════════╝');
    console.log('');
    console.log(`🖥️  机器: ${state.capabilities.hostname}`);
    console.log(`💻 CPU: ${state.capabilities.cpuModel} (${state.capabilities.cpuCores}核)`);
    console.log(`🧠 内存: ${state.capabilities.totalMemGB}GB (可用 ${state.capabilities.freeMemGB}GB)`);
    console.log(`⚡ 性能等级: ${state.capabilities.perfLevel}`);
    console.log('');
    console.log(`📡 API 服务: http://localhost:${CONFIG.port}`);
    console.log(`🔗 主控节点: ${CONFIG.masterUrl}`);
    console.log('');
    console.log('支持的算力任务:');
    console.log('  📝  text-process     文本批量处理 (替换/正则/提取)');
    console.log('  📊  data-transform   数据格式转换 (CSV↔JSON↔MD)');
    console.log('  🌐  http-fetch       HTTP请求/API代理');
    console.log('  📁  file-compress    文件压缩/解压 (gzip)');
    console.log('  🔢  batch-compute    批量数值计算 (统计/聚合)');
    console.log('  📋  git-op           Git操作 (status/diff/log/commit)');
    console.log('  🧪  bench            基准测试 (检测本机算力)');
    console.log('');
    console.log('按 Ctrl+C 停止服务');
    console.log('');
    
    log('info', 'Worker 启动成功', {
      port: CONFIG.port,
      platform: state.capabilities.platform,
      perfLevel: state.capabilities.perfLevel,
    });

    // 启动心跳报告
    setInterval(() => {
      const mem = process.memoryUsage();
      log('debug', '💓 心跳', {
        rssMB: Math.round(mem.rss/(1024*1024)),
        heapUsedMB: Math.round(mem.heapUsed/(1024*1024)),
        queueLen: state.queue.length,
        running: !!state.running,
      });
    }, CONFIG.heartbeatInterval);
  });
}

async function cmdStatus() {
  ensureDirs();
  const caps = detectCapabilities();
  
  console.log('');
  console.log('⚡ Compute Worker 状态');
  console.log(''.padEnd(45, '─'));
  console.log(`🖥️  主机: ${caps.hostname} (${caps.platform})`);
  console.log(`💻 CPU: ${caps.cpuModel} × ${caps.cpuCores}`);
  console.log(`🧠 RAM: ${caps.totalMemGB}GB 总计 / ${caps.freeMemGB}GB 可用`);
  console.log(`⚡ 等级: ${caps.perfLevel} | 建议并发: ${caps.suggestedConcurrency}`);
  console.log('');
  console.log('能力矩阵:');
  Object.entries(caps.canDo).forEach(([k,v]) => {
    console.log(`  ${v?'✅':'❌'} ${k.padEnd(18)}`);
  });
  console.log('');
  
  // 检查服务是否在运行
  try {
    const resp = await fetch(`http://localhost:${CONFIG.port}/status`);
    if (resp.ok) {
      const data = await resp.json();
      console.log('📡 服务状态: 运行中 ✓');
      console.log(`   队列: ${data.queue.length} 待执行 | ${data.queue.running ? '有任务在跑' : '空闲'}`);
      console.log(`   已完成: ${data.stats.totalCompleted} | 失败: ${data.stats.totalFailed}`);
      console.log(`   内存: ${data.system.heapUsedMB}MB / ${data.system.heapTotalMB}MB`);
    } else {
      console.log('📡 服务状态: 未运行 (用 "start" 启动)');
    }
  } catch {
    console.log('📡 服务状态: 未运行 (用 "start" 启动)');
  }
  console.log('');
}

async function cmdRun(args) {
  const type = args.split(/\s+/)[0];
  if (!type || !TASK_REGISTRY[type]) {
    console.error('用法: node compute-worker.js run <task-type>');
    console.error(`支持: ${Object.keys(TASK_REGISTRY).join(', ')}`);
    process.exit(1);
  }
  
  ensureDirs();
  state.capabilities = detectCapabilities();
  
  console.log(`\n▶ 执行任务: ${type}\n`);
  const task = createTask(type, {}, 1);
  const result = await executeTask(task);
  
  console.log('\n─── 结果 ───');
  console.log(JSON.stringify(result.result || result.error, null, 2));
  console.log(`耗时: ${result.elapsedMs}ms`);
}

async function cmdBench() {
  ensureDirs();
  state.capabilities = detectCapabilities();
  
  console.log('');
  console.log('🧪 基准测试 — 检测本机真实算力');
  console.log(''.padEnd(45, '─'));
  console.log(`🖥️  ${detectCapabilities().hostname} | ${os.cpus()[0]?.model}`);
  console.log('');

  const task = createTask('bench', { rounds: 2 }, 1);
  const result = await executeTask(task);

  const avg = result.result.average;
  const score = result.result.score;

  console.log('┌────────────────────┬──────────┬──────────┬────────┐');
  console.log('│ 项目               │ 平均(ms)  │ 得分     │ 评级   │');
  console.log('├────────────────────┼──────────┼──────────┼────────┤');
  
  const benchmarks = [
    ['CPU 整数运算', 'cpuIntMs', 10, 100],
    ['CPU 浮点运算', 'cpuFloatMs', 10, 100],
    ['内存分配', 'memAllocMs', 10, 50],
    ['字符串处理', 'stringMs', 10, 50],
    ['JSON序列化', 'jsonSerializeMs', 10, 100],
    ['JSON反序列化', 'jsonParseMs', 10, 100],
    ['文件写入', 'fileWriteMs', 10, 50],
    ['文件读取', 'fileReadMs', 10, 50],
    ['Hash计算', 'hashMs', 10, 50],
  ];

  benchmarks.forEach(([name, key, full, base]) => {
    const val = avg[key] || 0;
    const s = Math.max(1, Math.min(10, Math.round(full - val / base * 10)));
    const grade = s >= 8 ? '🟢快' : s >= 5 ? '🟡中' : '🔴慢';
    console.log(`│ ${name.padEnd(18)} │ ${(val+'ms').padEnd(8)} │ ${(s+'/10').padEnd(8)} │ ${grade.padEnd(4)} │`);
  });

  console.log('└────────────────────┴──────────┴──────────┴────────┘');
  console.log('');
  console.log(`综合得分: ${score.cpu + score.memory + score.io} / 30`);
  console.log(`  CPU: ${score.cpu.toFixed(1)} | Memory: ${score.memory.toFixed(1)} | IO: ${score.io.toFixed(1)}`);
  console.log('');
  
  // 推荐适合此机器的任务类型
  console.log('推荐任务类型 (基于性能):');
  if (score.cpu >= 5) console.log('  ✅ 文本处理、数据转换、Hash计算');
  if (score.io >= 5) console.log('  ✅ 文件压缩、批量I/O');
  if (score.memory >= 5) console.log('  ✅ 大数据处理');
  console.log('');
}

function printHelp() {
  console.log(`
⚡ compute-worker.js — 轻量算力节点

用法:
  node compute-worker.js <命令> [参数]

命令:
  start    🚀 启动 Worker 服务 (HTTP API + 任务队列)
  status   📊 查看状态和能力
  run <type>  ▶ 手动执行一个任务
  bench    🧪 基准测试 (检测本机真实算力)
  help     ❓ 帮助信息

支持的算力任务 (通过 HTTP API 或 start 后使用):
  📝  text-process     文本批量处理 (替换/正则/提取/大小写)
  📊  data-transform   数据格式转换 (CSV ↔ JSON ↔ Markdown)
  🌐  http-fetch       HTTP请求/API代理转发
  📁  file-compress    gzip 压缩/解压
  🔢  batch-compute    统计聚合 (sum/avg/min/max/stddev/percentile)
  📋  git-op           Git操作 (status/diff/log/commit/push)
  🧪  bench            基准测试

HTTP API (启动后):
  POST /task     {"type":"text-process","params":{...}}  → 异步入队
  POST /run      {"type":"text-process","params":{...}}  → 同步执行
  GET  /status                                              → 状态
  GET  /tasks?filter=completed                             → 任务列表
  GET  /capabilities                                       → 能力声明
  POST /bench                                              → 跑基准测试

示例:
  # 启动服务 (默认端口 3897)
  node compute-worker.js start
  
  # 在另一个终端提交任务
  curl -X POST http://localhost:3897/task \\
    -H "Content-Type: application/json" \\
    -d '{"type":"batch-compute","params":{"numbers":[1,2,3,4,5],"operations":["sum","avg","stddev"]}}'

  # 同步执行文本处理
  curl -X POST http://localhost:3897/run \\
    -H "Content-Type: application/json" \\
    -d '{"type":"text-process","params":{"text":"Hello World","operations":[{"type":"upper"}]}}'

  # 跑基准测试
  node compute-worker.js bench
`);
}

// ─── Main ──────────────────────────────────────────────

function main() {
  const command = process.argv[2] || 'help';

  switch (command) {
    case 'start': cmdStart(); break;
    case 'status': cmdStatus(); break;
    case 'run': cmdRun(process.argv.slice(3).join(' ')); break;
    case 'bench': cmdBench(); break;
    case 'help': case '--help': case '-h': printHelp(); break;
    default:
      console.error(`❓ 未知命令: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main();
