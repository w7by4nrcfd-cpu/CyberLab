CREATE TABLE `campaign_flags` (
	`user_id` text NOT NULL,
	`campaign_id` text NOT NULL,
	`flag_id` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `campaign_id`, `flag_id`)
);
