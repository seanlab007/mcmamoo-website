CREATE TABLE `ai_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('claude_api','openai_compat','openmanus','openclaw','workbuddy','custom') NOT NULL DEFAULT 'openai_compat',
	`baseUrl` varchar(512) NOT NULL,
	`apiKey` varchar(512) DEFAULT '',
	`modelId` varchar(128) DEFAULT '',
	`isActive` boolean NOT NULL DEFAULT true,
	`isPaid` boolean NOT NULL DEFAULT false,
	`isLocal` boolean NOT NULL DEFAULT false,
	`priority` int NOT NULL DEFAULT 100,
	`lastPingAt` timestamp,
	`lastPingMs` int,
	`isOnline` boolean NOT NULL DEFAULT false,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `node_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nodeId` int NOT NULL,
	`userId` int,
	`conversationId` int,
	`model` varchar(128),
	`promptTokens` int DEFAULT 0,
	`completionTokens` int DEFAULT 0,
	`status` enum('success','error','timeout','failover') NOT NULL DEFAULT 'success',
	`latencyMs` int,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `node_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routing_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`mode` enum('paid','free','auto','manual') NOT NULL DEFAULT 'auto',
	`nodeIds` text NOT NULL DEFAULT (''),
	`failover` boolean NOT NULL DEFAULT true,
	`loadBalance` enum('priority','round_robin','least_latency') NOT NULL DEFAULT 'priority',
	`isDefault` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `routing_rules_id` PRIMARY KEY(`id`)
);
