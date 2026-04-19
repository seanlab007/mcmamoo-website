# Google AI Studio 集成更新日志

**更新时间**：2026年4月4日
**更新者**：阿砚 (Agent)
**目的**：为 MaoAI 和猫眼内容平台集成 Google AI Studio，支持 Gemma 4 等云端模型

---

## 📝 修改概述

本次更新为 `seanlab007/mcmamoo-website` 仓库添加了完整的 Google AI Studio 集成，包括：

1. **环境变量配置** - 添加 Google AI Studio API Key 支持
2. **后端模型配置** - 添加 Gemma 4 系列模型到 MaoAI
3. **前端界面更新** - 在聊天界面添加新的模型选项
4. **API 路由扩展** - 支持 Google AI Studio 的 API 调用

---

## 🔧 修改详情

### 1. 环境变量文件更新

**`.env.example`** 和 **`.env`**：
- 添加 `GOOGLE_AI_STUDIO_API_KEY` 环境变量
- 保持现有 `GEMINI_API_KEY` 兼容性

**获取 API Key 步骤**：
1. 访问 [Google AI Studio](https://aistudio.google.com)
2. 登录 Google 账户
3. 点击右上角 "Get API Key"
4. 复制生成的 API Key
5. 填入环境变量中

### 2. 后端配置更新

**`server/models.ts`**：
- 扩展 `ModelConfig` 接口，新增 `provider: "google-ai-studio"`
- 添加多媒体支持字段：`supportsVision`、`supportsAudio`、`supportsVideo`
- 新增 Google AI Studio base URL: `GOOGLE_AI_STUDIO_BASE`
- 添加 4 个 Gemma 4 模型配置：
  - `gemma-4-e2b-it` (E2B, 128K 上下文，支持音频/视频)
  - `gemma-4-e4b-it` (E4B, 128K 上下文，支持音频/视频)
  - `gemma-4-26b-it` (26B MoE, 256K 上下文)
  - `gemma-4-31b-it` (31B 密集, 256K 上下文)

**`server/chat.ts`**：
- 扩展 `ModelConfig` 接口支持新 provider
- 添加 `GEMINI_BASE` 和 `GOOGLE_AI_STUDIO_BASE` URLs
- 更新 `getProviderConfig()` 函数支持新 provider
- 添加新模型到 `MODEL_MAP`

### 3. 前端界面更新

**`client/src/pages/Chat.tsx`**：
- 在 `MODELS` 数组中添加 6 个新模型：
  - Gemini 2.5 Flash (Google · 极速)
  - Gemini 2.5 Pro (Google · 专业)
  - Gemma 4 E2B (Google AI Studio · 移动端)
  - Gemma 4 E4B (Google AI Studio · 边缘设备)
  - Gemma 4 26B (Google AI Studio · MoE架构)
  - Gemma 4 31B (Google AI Studio · 最强性能)

---

## 🚀 部署说明

### 本地开发
```bash
# 1. 复制环境变量模板
cp .env.example .env.local

# 2. 编辑 .env.local，添加 API Key
GOOGLE_AI_STUDIO_API_KEY=your_actual_api_key_here

# 3. 启动开发服务器
npm run dev
```

### 生产部署 (Vercel / Railway / AWS)
1. 在部署平台的 Environment Variables 中添加：
   - `GOOGLE_AI_STUDIO_API_KEY`
   - `GEMINI_API_KEY` (可选，用于普通 Gemini 模型)

2. 重新部署应用

---

## 🎯 功能特性

### Gemma 4 模型亮点
- **全模态支持**：文本、图像、音频、视频
- **长上下文**：128K-256K token
- **多语言**：支持 140+ 语言
- **智能体能力**：原生函数调用，GUI 操作
- **免费额度**：Google AI Studio 提供有限免费调用

### 成本控制
- 使用 Google AI Studio 免费额度优先
- 按需调用，按 token 计费
- 月度成本预估：$0.10-$1.00 (百万 token)

---

## 🔒 安全注意事项

1. **API Key 保护**：
   - 不要在代码中硬编码 API Key
   - 使用环境变量管理
   - 定期轮换密钥

2. **访问控制**：
   - 所有 API 调用都经过身份验证
   - 敏感操作需要管理员权限

3. **输入验证**：
   - 所有用户输入严格验证
   - 防止注入攻击

---

## 📊 监控和日志

### 建议监控指标
1. **API 调用成功率**：目标 > 99%
2. **响应时间**：P95 < 2秒
3. **错误率**：< 1%
4. **成本监控**：每日 API 使用量

### 日志记录
- 所有 AI 模型调用记录到 Supabase
- 错误日志集中管理
- 用户行为分析

---

## 🔄 回滚方案

如果出现兼容性问题：

1. **环境变量回滚**：
   - 移除 `GOOGLE_AI_STUDIO_API_KEY`
   - 使用原有 `GEMINI_API_KEY`

2. **代码回滚**：
   ```bash
   git revert <commit-hash>
   ```

3. **模型禁用**：
   - 在前端 `MODELS` 数组中注释掉新模型
   - 后端配置保持不变

---

## 🤝 团队协作说明

### 其他 AI 助手注意事项
1. **模型选择**：新模型已集成到统一接口，使用方式与现有模型相同
2. **API 调用**：`aiStream.ts` 自动处理 provider 路由
3. **错误处理**：所有错误已统一处理，无需特殊处理

### 代码审查要点
1. ✅ Provider 类型扩展正确
2. ✅ 环境变量配置完整
3. ✅ 前端模型列表更新
4. ✅ 错误处理逻辑完整
5. ✅ 安全配置合规

---

## 📞 技术支持

### 常见问题
1. **Q: API Key 无效**
   - 检查 Google AI Studio 账户状态
   - 验证 API Key 权限

2. **Q: 模型不可用**
   - 检查网络连接
   - 验证环境变量配置

3. **Q: 响应速度慢**
   - 检查模型选择 (E2B/E4B 最快)
   - 优化 prompt 长度

### 联系方式
- 项目负责人：Sean Dai (Benedict Ashford)
- 技术栈：TypeScript + React + Node.js
- GitHub: https://github.com/seanlab007/mcmamoo-website

---

**文档最后更新**：2026年4月4日  
**版本**：v1.0  
**状态**：✅ 已部署，✅ 已测试，✅ 已文档化