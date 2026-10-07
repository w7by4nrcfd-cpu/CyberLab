CREATE TABLE `interactive_lab_progress` (
	`user_id` text NOT NULL,
	`lab_id` text NOT NULL,
	`started_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`completed_at` text,
	`best_score` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`hints_used` integer DEFAULT 0 NOT NULL,
	`session_json` text DEFAULT '{}' NOT NULL,
	PRIMARY KEY(`user_id`, `lab_id`)
);
