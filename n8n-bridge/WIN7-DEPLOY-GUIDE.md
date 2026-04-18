# 🖥️ Windows 7 戴尔 — 轻量节点部署指南

> **适用场景**: 老旧 Windows 7 电脑 (6G 内存, 3.78G 可用)
> **定位**: 不是跑 MaoAI，而是作为 **任务舰队的一个数据采集节点**
> **核心原则**: 只运行纯 Node.js CLI 工具，不启动任何 Web 服务

---

## ✅ 能做的（推荐）— 真正的算力工作

| 功能 | 内存占用 | 说明 | 算力价值 |
|------|---------|------|---------|
| **`compute-worker.js start`** | ~5MB 空闲 / ~150MB 工作 | **启动算力节点服务** | ⭐⭐⭐ 核心功能 |
| 文本批量处理 (替换/正则/提取) | ~30MB/次 | 批量改代码、清洗数据 | ⭐⭐ |
| 数据格式转换 (CSV↔JSON↔MD) | ~20MB/次 | 报表数据整理 | ⭐⭐ |
| HTTP API 代理转发 | ~40MB | 中转到 OpenAI/Claude (带缓存) | ⭐⭐⭐ |
| 批量数值统计 (sum/avg/stddev) | ~15ms | 数据分析预处理 | ⭐⭐ |
| 文件 gzip 压缩/解压 | ~20MB | 日志归档、文件传输优化 | ⭐ |
| Git 自动操作 (commit/push) | ~40MB | 代码自动提交 | ⭐⭐ |
| 基准测试 (bench) | ~50MB | 检测本机真实性能 | 📊 诊断工具 |

**使用方式**: Mac Pro 把任务分发过来 → 戴尔执行 → 结果回传
**总计同时运行: < 300MB** — 完全在 3.78G 可用内存范围内。

## ❌ 不能做的

| 尝试 | 原因 |
|------|------|
| 运行 MaoAI 后端 (Vite+Express) | 需要 2GB+ 常驻内存 |
| 运行 n8n | 需要 Node 18+, 至少 1GB |
| 运行本地 AI 模型 (Ollama/Python) | 内存完全不够 |
| Docker | Win7 支持极差 |

---

## 📦 第一步：安装 Node.js (Win7 兼容版本)

**⚠️ Windows 7 只能装 Node.js v14 或 v16 LTS**

### 方案 A：nvm-windows (推荐，可切换版本)

1. 下载 **nvm-windows**:
   ```
   https://github.com/coreybutler/nvm-windows/releases
   → 下载 nvm-setup.exe
   ```

2. 安装后打开 CMD（管理员）:
   ```cmd
   nvm install 16.20.2
   nvm use 16.20.2
   node -v    # 应该显示 v16.20.2
   npm -v
   ```

### 方案 B：直接安装 Node.js 16 LTS

- 下载地址: https://nodejs.org/dist/v16.20.2/node-v16.20.2-x64.msi
- 直接双击安装

---

## 📥 第二步：获取项目代码

### 方法 A：Git Clone（推荐）

```cmd
# 先装 Git for Windows:
# https://git-scm.com/download/win (选 portable 版更轻量)

cd C:\workbuddy
git clone https://github.com/seanlab007/mcmamoo-website.git
cd mcmamoo-website
```

### 方法 B：直接下载 ZIP

如果 Git 太重，直接下载：
```
https://github.com/seanlab007/mcmamoo-website/archive/refs/heads/main.zip
```
解压到 `C:\workbuddy\mcmamoo-website`

---

## ⚙️ 第三步：创建 Win7 启动脚本

在项目根目录创建 `win7-start.bat`：

```batch
@echo off
chcp 65001 >nul
title 🖥️ WorkBuddy Light Node - Dell Win7
color 0A

echo.
echo ═══════════════════════════════════════════════
echo   🖥️  WorkBuddy 轻量算力节点 - Windows 7
echo   戴尔电脑 | 算力 Worker (不是看板!)
echo ═══════════════════════════════════════════════
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js! 请先安装 Node.js v14 或 v16
    echo    下载: https://nodejs.org/en/blog/release/v16.20.2/
    pause
    exit /b 1
)

echo [✓] Node.js:
node -v
echo.

:: 进入工作目录
cd /d C:\workbuddy\mcmamoo-website\n8n-bridge

echo ============================================
echo   选择操作:
echo ====================================
echo   [1] ⚡  启动算力节点服务 (HTTP API + 任务队列)
echo   [2] 🔍 审计同步状态 (sync-checker audit)
echo   [3] 🖥️ 查看全局矩阵 (sync-checker status)
echo   [4] 🧪 跑基准测试 (检测本机算力)
echo   [5] 🔄 拉取最新代码 (git pull)
echo   [6] ✓ 标记已同步
echo   [7] 📊 完整检查 (全部执行一遍)
echo   [0] 退出
echo ============================================
set /p choice=请输入选项 (0-7):

if "%choice%"=="1" goto START_WORKER
if "%choice%"=="2" goto AUDIT
if "%choice%"=="3" goto STATUS
if "%choice%"=="4" goto BENCH
if "%choice%"=="5" goto PULL
if "%choice%"=="6" goto MARK
if "%choice%"=="7" goto FULL
if "%choice%"=="0" goto END

echo 无效选项
goto END

:: ────────────── ⚡ 启动算力服务 ──────────────
:START_WORKER
echo.
echo --- ⚡ 启动 Compute Worker 服务 ---
echo.
echo 服务地址: http://localhost:3897
echo Mac Pro 可以通过这个地址分发任务给戴尔
echo 按 Ctrl+C 停止
echo.
node compute-worker.js start
goto END

:BENCH
echo.
echo --- 🧪 基准测试 ---
node compute-worker.js bench
goto END

:AUDIT
echo.
echo --- 🔍 审计本机同步状态 ---
node sync-checker.js audit
goto END

:STATUS
echo.
echo --- 🖥️ 全局同步矩阵 ---
node sync-checker.js status
goto END

:DEMO
echo.
echo --- 🚀 生成演示数据 ---
node task-fleet-bridge.js demo
echo.
echo --- 查看状态 ---
node task-fleet-bridge.js status
goto END

:PULL
echo.
echo --- 🔄 拉取最新代码 ---
cd /d C:\workbuddy\mcmamoo-website
git pull origin main
echo.
echo --- 更新后重新审计 ---
cd n8n-bridge
node sync-checker.js audit
goto END

:MARK
echo.
echo --- ✓ 标记修复已同步 ---
set /p FIXIDS=输入修复ID (如 F-001,F-002):
node sync-checker.js mark-synced --fix-ids="%FIXIDS%"
goto END

:FULL
echo.
echo --- 📊 完整检查流程 ---
echo [1/4] 拉取代码...
cd /d C:\workbuddy\mcmamoo-website
git pull origin main --ff-only
echo.
echo [2/4] 审计同步...
cd n8n-bridge
node sync-checker.js audit
echo.
echo [3/4] 查看全局状态...
node sync-checker.js status
echo.
echo [4/4] 完成!
goto END

:END
echo.
pause
```

---

## 🔄 第四步：日常使用（每次开机后）

1. 双击 `win7-start.bat`
2. 选 `[6]` 执行完整检查（会自动 git pull + audit + status）
3. 如果有待同步的修复，按提示执行
4. 关掉窗口即可（不驻留任何服务）

---

## 💾 内存优化建议

### Win7 系统级优化（释放更多可用内存）

1. **关闭 Aero 效果**:
   - 右键桌面 → 个性化 → Windows 7 Basic（或经典）

2. **关闭不需要的服务**:
   ```
   services.msc → 禁用:
   - Windows Search (索引服务, 吃 200-400MB)
   - Print Spooler (不用打印机的话)
   - Windows Update (手动更新即可)
   ```

3. **增加虚拟内存**:
   ```
   系统 → 高级系统设置 → 性能 → 高级 → 虚拟内存
   → 自定义大小: 初始 4096 MB, 最大 12288 MB
   ```

4. **用 Chrome 替代 Edge/IE** (Chrome 在老机器上反而更快)

---

## 🔗 与其他两台 Mac 的关系

```
MacBook Pro (主力机)                    戴尔 Win7 (轻量节点)
┌──────────────────┐                  ┌──────────────────┐
│ MaoAI 全功能运行  │                  │ sync-checker.js  │
│ task-fleet-bridge │ ←── GitHub ──→   │ task-fleet-bridge│
│ (采集+展示+决策)   │    push/pull     │ (只读采集+审计)   │
│                  │                  │                  │
│ 角色: 大脑 + 展示 │                  │ 角色: 数据源节点  │
└──────────────────┘                  └──────────────────┘

MacBook Air (出差机)
┌──────────────────┐
│ sync-checker.js  │
│ task-fleet-bridge │
│ (移动采集节点)     │
│                  │
│ 角色: 移动哨兵    │
└──────────────────┘
```

**关键点**: 戴尔这台 **不跑服务**，只是偶尔打开 BAT 脚本跑一下命令行工具，跑完就关。不占常驻资源。

---

_最后更新: 2026-04-18_
