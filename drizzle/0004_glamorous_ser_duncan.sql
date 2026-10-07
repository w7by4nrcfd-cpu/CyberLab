CREATE TABLE `skill_awards` (
	`user_id` text NOT NULL,
	`source_kind` text NOT NULL,
	`source_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`xp` integer NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `source_kind`, `source_id`, `skill_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_skill_awards_user_skill` ON `skill_awards` (`user_id`,`skill_id`);