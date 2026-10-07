CREATE TABLE `achievement_unlocks` (
	`user_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`tier` integer NOT NULL,
	`earned_at` text NOT NULL,
	`proof_json` text NOT NULL,
	PRIMARY KEY(`user_id`, `achievement_id`, `tier`)
);
