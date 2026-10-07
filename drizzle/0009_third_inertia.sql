CREATE TABLE `career_promotions` (
	`user_id` text NOT NULL,
	`track_id` text NOT NULL,
	`stage_id` text NOT NULL,
	`achieved_at` text NOT NULL,
	`requirements_json` text NOT NULL,
	PRIMARY KEY(`user_id`, `track_id`, `stage_id`)
);
