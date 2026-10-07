CREATE TABLE `mission_progress` (
	`user_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`started_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`completed_at` text,
	`score` integer DEFAULT 0 NOT NULL,
	`stars` integer DEFAULT 0 NOT NULL,
	`hints_used` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`session_json` text DEFAULT '{}' NOT NULL,
	PRIMARY KEY(`user_id`, `mission_id`)
);
