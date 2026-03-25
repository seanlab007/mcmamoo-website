CREATE TABLE `mao_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`organization` varchar(256) NOT NULL,
	`consult_type` varchar(128) NOT NULL,
	`description` text,
	`status` enum('pending','reviewing','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mao_applications_id` PRIMARY KEY(`id`)
);
