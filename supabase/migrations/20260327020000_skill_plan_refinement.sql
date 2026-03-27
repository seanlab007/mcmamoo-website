-- ─────────────────────────────────────────────────────────────────────────────
-- Skill Plan Refinement: 按平台细化 required_plan
--
-- required_plan 扩展值说明：
--   free       — 所有登录用户
--   content    — content 或以上套餐（pro / flagship）
--   strategic  — strategic / flagship 套餐专属
--   admin      — 仅管理员
--   xiaohongshu — content+，且 contentPlatforms 包含 xiaohongshu（pro/flagship）
--   douyin      — strategic+，仅 flagship（旗舰版）
--   weibo       — content+（pro/flagship）
--   wechat      — strategic+，仅 flagship
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. user_subscriptions 表新增 content_platforms 字段
--    存储用户套餐允许发布的平台列表，例如 '{"xiaohongshu","weibo"}'
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS content_platforms text[] DEFAULT '{}';

-- 2. 根据已有 plan 自动填充 content_platforms 默认值
UPDATE user_subscriptions SET content_platforms = ARRAY['xiaohongshu', 'weibo']
  WHERE plan = 'content' AND (content_platforms IS NULL OR content_platforms = '{}');

UPDATE user_subscriptions SET content_platforms = ARRAY['xiaohongshu', 'douyin', 'weibo', 'wechat']
  WHERE plan = 'strategic' AND (content_platforms IS NULL OR content_platforms = '{}');

-- 3. 扩展 required_plan 的 CHECK 约束（先删旧约束再加新的）
ALTER TABLE node_skills DROP CONSTRAINT IF EXISTS node_skills_required_plan_check;

ALTER TABLE node_skills ADD CONSTRAINT node_skills_required_plan_check
  CHECK (required_plan IN (
    'free', 'content', 'strategic', 'admin',
    'xiaohongshu', 'douyin', 'weibo', 'wechat'
  ));

-- 4. 为 marketing-claw OpenClaw 节点（node id = 4）的各 skill 按平台打标
--    Quill  = 文案生产（通用），content+
--    Ghost  = 内容幽灵（通用），content+
--    Hype   = 小红书种草，xiaohongshu（content+）
--    Mingle = 抖音互动，douyin（strategic+/flagship）
--    Pulse  = 微博舆情/发布，weibo（content+）
--    Scout  = 渠道侦察（通用），content+
--    Oracle = 数据洞察（通用），content+
--    Megaphone = 多平台广播，strategic+
--    Hunter = 商机猎手，strategic+
--    Prospector = 潜客挖掘，strategic+
--    Standup = 日报汇报，content+
--    Judge  = 内容评审，content+
UPDATE node_skills SET required_plan = 'xiaohongshu' WHERE "nodeId" = 4 AND "skillId" = 'hype';
UPDATE node_skills SET required_plan = 'douyin'      WHERE "nodeId" = 4 AND "skillId" = 'mingle';
UPDATE node_skills SET required_plan = 'weibo'       WHERE "nodeId" = 4 AND "skillId" = 'pulse';
UPDATE node_skills SET required_plan = 'strategic'   WHERE "nodeId" = 4 AND "skillId" = 'megaphone';
UPDATE node_skills SET required_plan = 'strategic'   WHERE "nodeId" = 4 AND "skillId" = 'hunter';
UPDATE node_skills SET required_plan = 'strategic'   WHERE "nodeId" = 4 AND "skillId" = 'prospector';
-- content 级：通用生产类
UPDATE node_skills SET required_plan = 'content'
  WHERE "nodeId" = 4 AND "skillId" IN ('quill', 'ghost', 'scout', 'oracle', 'standup', 'judge');

-- 5. 添加注释列（可选，方便后台 UI 展示）
COMMENT ON COLUMN node_skills.required_plan IS
  'Minimum subscription plan to invoke this skill.
   Values: free | content | strategic | admin | xiaohongshu | douyin | weibo | wechat.
   Platform-specific values (xiaohongshu/douyin/weibo/wechat) require content+ AND the
   corresponding platform must be in the user subscription content_platforms list.';

COMMENT ON COLUMN user_subscriptions.content_platforms IS
  'List of platforms the user can publish to: xiaohongshu, douyin, weibo, wechat.
   Empty array means all platforms allowed for the current plan.';

