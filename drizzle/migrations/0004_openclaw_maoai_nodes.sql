-- ⚠️  此文件为 MySQL 方言草稿，【请勿在 Supabase/PostgreSQL 上执行】！
-- Supabase 上实际应用的迁移是：
--   supabase/migrations/20260325234100_openclaw_node_skills.sql  （PostgreSQL DDL）
--
-- OpenClaw × MaoAI 协同架构：AI 节点注册表 & 技能元数据表（MySQL 草稿）
-- Migration: 0004_openclaw_maoai_nodes
-- Date: 2026-03-25

-- AI 本地节点注册表（记录 OpenClaw 实例）
CREATE TABLE IF NOT EXISTS `ai_nodes` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL COMMENT '节点唯一名称，如 OpenClaw-MacBook-Pro',
  `baseUrl` VARCHAR(256) NOT NULL COMMENT '节点本地访问地址，如 http://localhost:18789',
  `type` VARCHAR(64) NOT NULL DEFAULT 'openclaw' COMMENT '节点类型',
  `modelId` VARCHAR(256) DEFAULT NULL COMMENT '当前运行的模型 ID',
  `status` ENUM('online','offline') NOT NULL DEFAULT 'online' COMMENT '节点状态',
  `skillsChecksum` VARCHAR(64) DEFAULT NULL COMMENT '所有技能版本号的哈希，用于心跳校验',
  `token` VARCHAR(128) NOT NULL COMMENT '注册鉴权 token',
  `lastHeartbeatAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后心跳时间',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ai_nodes_status` (`status`),
  INDEX `idx_ai_nodes_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 节点技能元数据表（从 OpenClaw 本地技能清单同步）
CREATE TABLE IF NOT EXISTS `node_skills` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nodeId` INT NOT NULL COMMENT '关联的 ai_nodes.id',
  `skillId` VARCHAR(128) NOT NULL COMMENT '技能唯一标识，如 web_search',
  `name` VARCHAR(256) NOT NULL COMMENT '显示名称，如 网页搜索',
  `version` VARCHAR(32) NOT NULL DEFAULT '1.0.0' COMMENT '语义化版本',
  `description` TEXT DEFAULT NULL COMMENT '自然语言描述（用于 AI 路由决策）',
  `triggers` JSON DEFAULT NULL COMMENT '触发关键词 JSON 数组，如 ["搜索","查找"]',
  `category` VARCHAR(64) NOT NULL DEFAULT 'custom' COMMENT '技能分类',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_node_skill` (`nodeId`, `skillId`),
  INDEX `idx_node_skills_node` (`nodeId`),
  INDEX `idx_node_skills_category` (`category`),
  INDEX `idx_node_skills_active` (`isActive`),
  CONSTRAINT `fk_node_skills_node` FOREIGN KEY (`nodeId`) REFERENCES `ai_nodes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
