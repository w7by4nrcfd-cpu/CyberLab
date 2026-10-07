CREATE TABLE `investigation_evidence` (
	`user_id` text NOT NULL,
	`investigation_id` text NOT NULL,
	`evidence_id` text NOT NULL,
	`reviewed_at` text,
	`collected_at` text,
	`classification` text,
	`note` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`user_id`, `investigation_id`, `evidence_id`)
);
--> statement-breakpoint
CREATE TABLE `investigation_links` (
	`user_id` text NOT NULL,
	`investigation_id` text NOT NULL,
	`from_id` text NOT NULL,
	`relation` text NOT NULL,
	`to_id` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `investigation_id`, `from_id`, `relation`, `to_id`)
);
--> statement-breakpoint
CREATE TABLE `investigation_workspaces` (
	`user_id` text NOT NULL,
	`investigation_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`decision_json` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`closed_at` text,
	PRIMARY KEY(`user_id`, `investigation_id`)
);
