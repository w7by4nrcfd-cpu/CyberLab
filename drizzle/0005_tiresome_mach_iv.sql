CREATE TABLE `skill_progress` (
	`user_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `skill_id`)
);
