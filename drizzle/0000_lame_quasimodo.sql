CREATE TABLE `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_unique` ON `admins` (`email`);--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`service_id` text NOT NULL,
	`day` text NOT NULL,
	`start_minute` integer NOT NULL,
	`end_minute` integer NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`notes` text,
	`price_cents` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_appointments_day_status` ON `appointments` (`day`,`status`);--> statement-breakpoint
CREATE INDEX `idx_appointments_client` ON `appointments` (`client_id`);--> statement-breakpoint
CREATE TABLE `blocked_times` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`start_minute` integer NOT NULL,
	`end_minute` integer NOT NULL,
	`reason` text,
	`kind` text DEFAULT 'block' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_blocked_times_day` ON `blocked_times` (`day`);--> statement-breakpoint
CREATE TABLE `business_hours` (
	`weekday` integer PRIMARY KEY NOT NULL,
	`open_minute` integer NOT NULL,
	`close_minute` integer NOT NULL,
	`break_start` integer,
	`break_end` integer,
	`enabled` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clients_phone_unique` ON `clients` (`phone`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price_cents` integer,
	`duration_minutes` integer,
	`image` text,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
