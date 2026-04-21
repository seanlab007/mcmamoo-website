-- ============================================================
-- Supabase 数据库完整 Schema 检查
-- 项目: mcmamoo-website
-- 数据库: fczherphuixpdjuevzsh
-- ============================================================

-- 1. 检查已存在的表
-- 执行: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ============================================================
-- 2. 待创建的表清单
-- ============================================================

-- A. 核心表 (core_tables)
-- - subscriptions: 用户订阅管理
-- - user_limits: 用户限制计数
-- - conversations: 对话记录
-- - messages: 消息内容
-- - skills: 技能配置
-- - api_keys: API 密钥

-- B. 销售自动化 (sales_automation)
-- - sales_leads: 销售线索
-- - sales_activities: 销售活动
-- - sales_quotations: 销售报价

-- C. 华为销售情报 (huawei_sales_intelligence)
-- - decision_makers: 决策人信息
-- - competitor_comparisons: 竞品对比
-- - iron_triangle_reviews: 铁三角评审

-- D. 客服系统 (customer_service)
-- - customer_service_calls: 客服电话
-- - customer_service_chats: 客服聊天
-- - customer_service_agents: 客服代理

-- E. 私密云笔记 (notes)
-- - notes: 笔记内容
-- - notes_audit: 审计日志

-- F. MPO 多智能体 (mpo - 内嵌在 db-migrator)
-- - mpo_executions: MPO 执行记录
-- - mpo_decision_ledger: 决策账本

-- G. 混合云队列 (maoai - 内嵌在 db-migrator)
-- - maoai_devices: 设备注册
-- - maoai_pending_commands: 待执行命令
-- - maoai_telemetry_log: 遥测日志

-- ============================================================
-- 3. 直接执行方式
-- ============================================================
-- 方式 A: 通过 Supabase Dashboard > SQL Editor
-- 方式 B: 通过 db-migrator Edge Function (已部署)
--         POST https://fczherphuixpdjuevzsh.supabase.co/functions/v1/db-migrator
--         Header: x-admin-token: MAOAI_DB_MIGRATOR_ADMIN_TOKEN_2026

-- ============================================================
-- 4. 推荐: 在 Supabase Dashboard 执行以下 SQL 检查
-- ============================================================
SELECT
  '检查表' as action,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables;
