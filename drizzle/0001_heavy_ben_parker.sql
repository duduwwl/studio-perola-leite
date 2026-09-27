CREATE TABLE `notification_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text NOT NULL,
	`kind` text NOT NULL,
	`channel` text NOT NULL,
	`scheduled_at` text NOT NULL,
	`status` text DEFAULT 'awaiting_provider' NOT NULL,
	`sent_at` text,
	`error` text,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notification_jobs_schedule_status` ON `notification_jobs` (`status`,`scheduled_at`);