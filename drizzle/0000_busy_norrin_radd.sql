CREATE TABLE `progress` (
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`kind` text NOT NULL,
	`score` integer NOT NULL,
	`xp` integer NOT NULL,
	`completed_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `item_id`)
);
