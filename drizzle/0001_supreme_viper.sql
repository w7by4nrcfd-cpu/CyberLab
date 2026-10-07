CREATE TABLE `activity` (
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`started_at` text NOT NULL,
	`last_at` text NOT NULL,
	`seconds` integer DEFAULT 0 NOT NULL,
	`completed_at` text,
	PRIMARY KEY(`user_id`, `lesson_id`)
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`score` integer NOT NULL,
	`total` integer NOT NULL,
	`answers` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_id`)
);
--> statement-breakpoint
CREATE TABLE `daily_time` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`seconds` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `day`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`content` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_id`)
);
--> statement-breakpoint
CREATE TABLE `preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`daily_goal` integer DEFAULT 15 NOT NULL,
	`theme` text DEFAULT 'dark' NOT NULL,
	`updated_at` text NOT NULL
);
