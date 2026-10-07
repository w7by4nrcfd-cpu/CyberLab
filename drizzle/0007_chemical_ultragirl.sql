CREATE TABLE `soc_case_alerts` (
	`user_id` text NOT NULL,
	`case_id` text NOT NULL,
	`alert_id` text NOT NULL,
	`linked_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `case_id`, `alert_id`)
);
--> statement-breakpoint
CREATE TABLE `soc_case_evidence` (
	`user_id` text NOT NULL,
	`case_id` text NOT NULL,
	`alert_id` text NOT NULL,
	`evidence_id` text NOT NULL,
	`collected_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `case_id`, `alert_id`, `evidence_id`)
);
--> statement-breakpoint
CREATE TABLE `soc_cases` (
	`user_id` text NOT NULL,
	`case_id` text NOT NULL,
	`status` text DEFAULT 'Investigating' NOT NULL,
	`severity` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`closed_at` text,
	`final_conclusion` text,
	PRIMARY KEY(`user_id`, `case_id`)
);
--> statement-breakpoint
CREATE TABLE `soc_investigations` (
	`user_id` text NOT NULL,
	`alert_id` text NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`started_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`closed_at` text,
	`score` integer DEFAULT 0 NOT NULL,
	`best_score` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`session_json` text DEFAULT '{}' NOT NULL,
	PRIMARY KEY(`user_id`, `alert_id`)
);
--> statement-breakpoint
CREATE TABLE `soc_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`scope_kind` text NOT NULL,
	`scope_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_soc_notes_scope` ON `soc_notes` (`user_id`,`scope_kind`,`scope_id`);