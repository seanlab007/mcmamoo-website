# API 502 问题诊断与修复

## 问题症状
- `https://api.mcmamoo.com/api/ai/status` 返回 502 Bad Gateway
- SSL 证书有效，连接可以建立，但请求超时（15秒无响应）

## 根本原因分析

### 1. 健康检查配置问题
**问题**: `railway.json` 配置的健康检查路径是 `/`，但这返回的是前端 SPA 页面。

**影响**: Railway 可能在健康检查失败后反复重启服务。

**修复**: 将健康检查路径改为 `/api/ai/status`。

### 2. 启动阻塞风险
**问题**: 服务启动时有端口探测逻辑（`isPortAvailable`），可能增加启动时间。

**影响**: 在 Railway 环境中，这种检测是不必要的（端口通常是可用的），可能增加启动延迟。

**修复**: 在生产环境跳过端口探测。

### 3. 数据库连接超时
**问题**: `/api/ai/status` 端点调用 `getAiNodes()`，如果 Supabase 连接有问题会阻塞。

**影响**: 请求可能因为数据库连接超时而挂起。

**修复**: 为数据库查询添加超时保护。

## 实施的修复

### 修复 1: 改进健康检查端点
- 添加数据库查询超时保护（使用 AbortSignal）
- 简化响应，确保快速返回

### 修复 2: 优化启动流程
- 生产环境跳过端口探测
- 添加启动日志便于诊断

### 修复 3: 更新 Railway 配置
- 将 healthcheckPath 改为 `/api/ai/status`
- 增加启动超时时间

## 部署后验证步骤

1. 检查 Railway 日志确认服务正常启动
2. 测试 `https://api.mcmamoo.com/api/ai/status` 响应
3. 验证 Supabase 环境变量配置正确

## 环境变量检查清单

确保以下环境变量在 Railway 中配置：
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GOOGLE_AI_STUDIO_API_KEY` (用于 Gemma 模型)
- 其他 AI 模型 API Keys

