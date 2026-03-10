CREATE TABLE `brief_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brief_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `brief_subscribers_email_unique` UNIQUE(`email`)
);
