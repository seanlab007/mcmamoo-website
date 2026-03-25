CREATE TABLE `content_copies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`brand` varchar(255) NOT NULL,
	`platform` varchar(100) NOT NULL,
	`contentType` varchar(100) NOT NULL,
	`style` varchar(100) NOT NULL,
	`keywords` text,
	`title` varchar(500),
	`content` text NOT NULL,
	`tags` text,
	`copyStatus` enum('draft','approved','published') DEFAULT 'draft',
	`scheduledAt` timestamp,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_copies_id` PRIMARY KEY(`id`)
);
