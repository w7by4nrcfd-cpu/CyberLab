CREATE TABLE `dynamic_active` (
	`user_id` text NOT NULL,
	`template_id` text NOT NULL,
	`instance_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `template_id`)
);
--> statement-breakpoint
CREATE TABLE `dynamic_incidents` (
	`user_id` text NOT NULL,
	`instance_id` text NOT NULL,
	`template_id` text NOT NULL,
	`variant_number` integer NOT NULL,
	`seed` integer NOT NULL,
	`difficulty` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `instance_id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_dynamic_user_template_variant` ON `dynamic_incidents` (`user_id`,`template_id`,`variant_number`);