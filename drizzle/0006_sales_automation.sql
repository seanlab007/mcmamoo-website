-- Sales Automation Tables
-- Created for MaoAI Sales feature (Rox-inspired)

-- Sales leads table
CREATE TABLE IF NOT EXISTS `sales_leads` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(128) NOT NULL,
  `company` varchar(256) NOT NULL,
  `title` varchar(128),
  `email` varchar(320) NOT NULL,
  `phone` varchar(64),
  `linkedin` varchar(256),
  `website` varchar(256),
  `status` enum('new','contacted','qualified','proposal','negotiation','closed_won','closed_lost') NOT NULL DEFAULT 'new',
  `source` enum('website','linkedin','referral','cold_outreach','event','other') NOT NULL DEFAULT 'other',
  `score` int DEFAULT 0,
  `notes` text,
  `lastContact` timestamp,
  `nextFollowUp` timestamp,
  `assignedTo` int,
  `aiInsights` json,
  `suggestedActions` json,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Outreach templates
CREATE TABLE IF NOT EXISTS `outreach_templates` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(128) NOT NULL,
  `subject` varchar(256),
  `body` text NOT NULL,
  `type` enum('email','linkedin') NOT NULL DEFAULT 'email',
  `category` varchar(64),
  `aiOptimized` boolean DEFAULT false,
  `createdBy` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Outreach activities
CREATE TABLE IF NOT EXISTS `outreach_activities` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `leadId` int NOT NULL,
  `type` enum('email','linkedin','call','meeting','note') NOT NULL,
  `subject` varchar(256),
  `content` text,
  `status` enum('draft','sent','delivered','opened','replied','bounced') NOT NULL DEFAULT 'draft',
  `sentAt` timestamp,
  `openedAt` timestamp,
  `repliedAt` timestamp,
  `createdBy` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`leadId`) REFERENCES `sales_leads`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Insert default templates
INSERT INTO `outreach_templates` (`name`, `subject`, `body`, `type`, `category`, `aiOptimized`) VALUES
('初次接触邮件', '{{company}}的AI营销转型机会', '您好{{name}}，\n\n我注意到{{company}}在数字营销领域的出色表现。我是MaoAI的销售顾问，专门帮助像您这样的企业利用AI技术提升营销效果。\n\n我们最近帮助一家类似规模的公司实现了：\n• 营销转化率提升40%\n• 客户获取成本降低35%\n• 销售周期缩短50%\n\n我想了解{{company}}目前的营销挑战，看看我们是否能提供帮助。您是否有15分钟时间进行简短交流？\n\n期待您的回复。\n\n此致，\nMaoAI销售团队', 'email', 'cold_outreach', true),

('跟进邮件', '关于{{company}}的AI解决方案 - 下一步', '您好{{name}}，\n\n希望您一切都好。我想跟进我们上周关于{{company}}AI营销转型的讨论。\n\n基于我们的对话，我整理了一些针对性的建议：\n\n{{ai_insights}}\n\n如果您有任何问题或想进一步探讨，请随时联系我。\n\n此致，\nMaoAI销售团队', 'email', 'follow_up', true),

('提案邮件', '{{company}}专属AI解决方案提案', '您好{{name}}，\n\n感谢您抽出时间了解MaoAI。根据我们之前的讨论，我为{{company}}准备了一份定制化的AI营销解决方案提案。\n\n提案亮点：\n• 定制AI销售助手\n• 智能线索评分系统\n• 自动化外联工具\n• 实时销售洞察\n\n请查收附件中的详细提案。我期待与您讨论如何帮助{{company}}实现销售增长。\n\n此致，\nMaoAI销售团队', 'email', 'proposal', true),

('LinkedIn连接请求', '', '您好{{name}}，我是MaoAI的销售顾问。看到您在{{company}}担任{{title}}，想与您建立联系。我们专注于AI驱动的销售自动化，可能对您的工作有所帮助。期待交流！', 'linkedin', 'networking', true);
